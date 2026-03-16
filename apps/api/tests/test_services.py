from __future__ import annotations

from datetime import timedelta

import pytest

from app.models import Ingredient, JobStatus, JobType, OrderSize, PourJob, PourStep, Pump, Recipe, RecipeIngredient
from app.schemas import OrderCreate, PumpRunRequest
from app.services.log_service import LogService
from app.services.order_service import OrderService
from app.services.pump_service import PumpService
from app.services.recipe_service import RecipeService
from app.services.system_service import SystemService
from app.timeutils import utc_now


class RecordingHardware:
    def __init__(self) -> None:
        self.calls: list[tuple[int, float]] = []
        self.stop_called = False
        self.status = {"active_pump_ids": [], "emergency_stop_engaged": False}

    def get_status(self) -> dict:
        return self.status

    def run_pump(self, pump_id: int, duration_seconds: float) -> None:
        self.calls.append((pump_id, duration_seconds))

    def prime_pumps(self, pump_ids: list[int], duration_seconds: float) -> None:
        self.calls.extend((pump_id, duration_seconds) for pump_id in pump_ids)

    def clean_pumps(self, pump_ids: list[int], duration_seconds: float) -> None:
        self.calls.extend((pump_id, duration_seconds) for pump_id in pump_ids)

    def stop_all(self) -> None:
        self.stop_called = True
        self.status = {"active_pump_ids": [], "emergency_stop_engaged": True}

    def cleanup(self) -> None:
        pass


class FailingHardware(RecordingHardware):
    def run_pump(self, pump_id: int, duration_seconds: float) -> None:
        raise RuntimeError(f"Pump {pump_id} jammed")


@pytest.fixture
def demo_data(db_session):
    vodka = Ingredient(name="Vodka", description="Neutral spirit", is_active=True)
    orange = Ingredient(name="Orange Juice", description="Citrus mixer", is_active=True)
    cranberry = Ingredient(name="Cranberry Juice", description="Tart mixer", is_active=True)
    lime = Ingredient(name="Lime Juice", description="Fresh citrus", is_active=True)
    db_session.add_all([vodka, orange, cranberry, lime])
    db_session.flush()

    pumps = [
        Pump(name="Pump 1", gpio_pin=17, ingredient_id=vodka.id, enabled=True, ml_per_second=10.0),
        Pump(name="Pump 2", gpio_pin=27, ingredient_id=orange.id, enabled=True, ml_per_second=20.0),
        Pump(name="Pump 3", gpio_pin=22, ingredient_id=cranberry.id, enabled=False, ml_per_second=15.0),
    ]
    db_session.add_all(pumps)
    db_session.flush()

    recipe = Recipe(name="Screwdriver", description="Vodka and orange", is_active=True)
    db_session.add(recipe)
    db_session.flush()
    db_session.add_all(
        [
            RecipeIngredient(recipe_id=recipe.id, ingredient_id=vodka.id, amount_ml=50, step_order=0),
            RecipeIngredient(recipe_id=recipe.id, ingredient_id=orange.id, amount_ml=150, step_order=1),
        ]
    )

    unavailable_recipe = Recipe(name="Sea Breeze", description="Unavailable because cranberry pump is disabled", is_active=True)
    db_session.add(unavailable_recipe)
    db_session.flush()
    db_session.add_all(
        [
            RecipeIngredient(recipe_id=unavailable_recipe.id, ingredient_id=vodka.id, amount_ml=50, step_order=0),
            RecipeIngredient(recipe_id=unavailable_recipe.id, ingredient_id=cranberry.id, amount_ml=120, step_order=1),
        ]
    )
    db_session.commit()

    return {
        "ingredients": {"vodka": vodka, "orange": orange, "cranberry": cranberry, "lime": lime},
        "pumps": pumps,
        "recipe": recipe,
        "unavailable_recipe": unavailable_recipe,
    }


def test_recipe_availability_logic_marks_missing_enabled_pumps(db_session, demo_data):
    available = RecipeService(db_session).available()
    availability_map = {recipe.name: recipe for recipe in available}
    assert availability_map["Screwdriver"].can_make is True
    assert availability_map["Sea Breeze"].can_make is False
    assert demo_data["ingredients"]["cranberry"].id in availability_map["Sea Breeze"].missing_ingredient_ids


def test_order_creation_scales_double_and_calculates_durations(db_session, demo_data):
    hardware = RecordingHardware()
    service = OrderService(db_session, hardware)

    order = service.create(OrderCreate(recipe_id=demo_data["recipe"].id, size=OrderSize.double))

    assert order.status == JobStatus.completed
    assert order.target_volume_ml == 400
    assert [step.amount_ml for step in order.steps] == [100, 300]
    assert [round(step.duration_seconds, 2) for step in order.steps] == [10.0, 15.0]
    assert hardware.calls == [(demo_data["pumps"][0].id, 10.0), (demo_data["pumps"][1].id, 15.0)]


def test_order_creation_fails_when_pump_mapping_missing(db_session, demo_data):
    hardware = RecordingHardware()
    service = OrderService(db_session, hardware)

    with pytest.raises(ValueError, match="missing enabled pumps"):
        service.create(OrderCreate(recipe_id=demo_data["unavailable_recipe"].id, size=OrderSize.single))


def test_manual_run_marks_job_failed_when_hardware_fails(db_session, demo_data):
    hardware = FailingHardware()
    service = PumpService(db_session, hardware)

    with pytest.raises(RuntimeError, match="jammed"):
        service.manual_run(demo_data["pumps"][0], PumpRunRequest(volume_ml=50))

    latest_job = db_session.query(PourJob).order_by(PourJob.id.desc()).first()
    assert latest_job is not None
    assert latest_job.status == JobStatus.failed
    assert latest_job.steps[0].status == JobStatus.failed
    assert "jammed" in (latest_job.error_message or "")


def test_manual_run_rejects_impossible_duration(db_session, demo_data):
    hardware = RecordingHardware()
    service = PumpService(db_session, hardware)

    with pytest.raises(ValueError, match="exceeds the configured limit"):
        service.manual_run(demo_data["pumps"][0], PumpRunRequest(volume_ml=1000))


def test_cancel_marks_running_job_cancelled_and_stops_hardware(db_session, demo_data):
    hardware = RecordingHardware()
    job = PourJob(
        job_type=JobType.order,
        status=JobStatus.running,
        recipe_id=demo_data["recipe"].id,
        size=OrderSize.single,
        requested_at=utc_now(),
        started_at=utc_now(),
    )
    db_session.add(job)
    db_session.flush()
    step = PourStep(
        job_id=job.id,
        pump_id=demo_data["pumps"][0].id,
        ingredient_id=demo_data["ingredients"]["vodka"].id,
        action="pour",
        step_order=0,
        amount_ml=50,
        duration_seconds=5,
        status=JobStatus.running,
        started_at=utc_now(),
    )
    db_session.add(step)
    db_session.commit()

    cancelled = OrderService(db_session, hardware).cancel(job)

    assert hardware.stop_called is True
    assert cancelled.status == JobStatus.cancelled
    assert cancelled.steps[0].status == JobStatus.cancelled
    assert cancelled.error_message == "Cancelled by operator"


def test_system_status_reflects_hardware_state():
    hardware = RecordingHardware()
    hardware.status = {"active_pump_ids": [1, 3], "emergency_stop_engaged": True}

    status = SystemService(hardware).get_status()

    assert status.emergency_stop_engaged is True
    assert status.active_pump_ids == [1, 3]
    assert status.hardware_mode == "mock"


def test_recent_logs_are_sorted_with_steps(db_session, demo_data):
    older = PourJob(job_type=JobType.stop, status=JobStatus.completed, requested_at=utc_now() - timedelta(minutes=1))
    newer = PourJob(job_type=JobType.order, status=JobStatus.completed, recipe_id=demo_data["recipe"].id, requested_at=utc_now())
    db_session.add_all([older, newer])
    db_session.flush()
    db_session.add(
        PourStep(
            job_id=newer.id,
            pump_id=demo_data["pumps"][0].id,
            ingredient_id=demo_data["ingredients"]["vodka"].id,
            action="pour",
            step_order=0,
            amount_ml=50,
            duration_seconds=5,
            status=JobStatus.completed,
        )
    )
    db_session.commit()

    logs = LogService(db_session).recent_jobs(limit=10)

    assert logs[0].id == newer.id
    assert logs[0].steps[0].action == "pour"
