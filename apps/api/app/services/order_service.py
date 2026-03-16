from __future__ import annotations

import logging
import threading
from typing import List, Tuple

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.config import get_settings
from app.database import SessionLocal
from app.hardware.base import HardwareController
from app.hardware.factory import get_hardware_controller
from app.models import JobStatus, JobType, OrderSize, PourJob, PourStep, Pump, Recipe, RecipeIngredient
from app.schemas import OrderCreate
from app.timeutils import utc_now

logger = logging.getLogger(__name__)


class OrderService:
    def __init__(self, db: Session, hardware: HardwareController) -> None:
        self.db = db
        self.hardware = hardware
        self.settings = get_settings()

    def list(self) -> list[PourJob]:
        stmt = (
            select(PourJob)
            .options(selectinload(PourJob.steps))
            .where(PourJob.job_type == JobType.order)
            .order_by(PourJob.requested_at.desc())
        )
        return list(self.db.scalars(stmt))

    def get(self, job_id: int) -> PourJob | None:
        stmt = (
            select(PourJob)
            .options(selectinload(PourJob.steps))
            .where(PourJob.id == job_id, PourJob.job_type == JobType.order)
        )
        return self.db.scalar(stmt)

    def create(self, payload: OrderCreate) -> PourJob:
        recipe = self._load_recipe(payload.recipe_id)
        factor = 2.0 if payload.size == OrderSize.double else 1.0
        pump_map = self._pump_map_for_recipe(recipe)
        logger.info(
            "event=order_create_requested recipe_id=%s recipe_name=%s size=%s",
            recipe.id,
            recipe.name,
            payload.size.value,
        )

        job = PourJob(
            job_type=JobType.order,
            status=JobStatus.pending,
            recipe_id=recipe.id,
            size=payload.size,
            target_volume_ml=sum(item.amount_ml for item in recipe.ingredients) * factor,
        )
        self.db.add(job)
        self.db.flush()

        # Build steps for this order.
        steps: list[tuple[PourStep, int, float]] = []
        for index, item in enumerate(recipe.ingredients):
            pump = pump_map[item.ingredient_id]
            amount_ml = item.amount_ml * factor
            duration_seconds = amount_ml / pump.ml_per_second
            self._validate_step_duration(duration_seconds, pump.id, recipe.name)
            step = PourStep(
                job_id=job.id,
                pump_id=pump.id,
                ingredient_id=item.ingredient_id,
                action="pour",
                step_order=index,
                amount_ml=amount_ml,
                duration_seconds=duration_seconds,
            )
            self.db.add(step)
            steps.append((step, pump.id, duration_seconds))
        # Flush to ensure step IDs are assigned before we snapshot payload for the worker.
        self.db.flush()

        # Persist job and steps before starting background execution so they are visible
        # to other sessions (e.g. GET /orders/{id} and the background worker itself).
        self.db.commit()

        # Build minimal metadata needed for background execution (step_id, pump_id, duration_seconds).
        steps_payload: List[Tuple[int, int, float]] = [
            (step.id, pump_id, duration_seconds) for (step, pump_id, duration_seconds) in steps
        ]

        # Start hardware execution in a background thread so the request can return quickly.
        _start_order_execution_in_background(job.id, steps_payload)

        # Return the freshly created job (still pending) including its steps and durations.
        return self.get(job.id)  # type: ignore[return-value]

    def cancel(self, job: PourJob) -> PourJob:
        if job.status not in {JobStatus.pending, JobStatus.running}:
            raise ValueError("Only pending or running jobs can be cancelled")
        logger.warning("event=order_cancel_requested order_id=%s current_status=%s", job.id, job.status.value)
        self.hardware.stop_all()
        now = utc_now()
        job.status = JobStatus.cancelled
        job.cancelled_at = now
        job.error_message = "Cancelled by operator"
        for step in job.steps:
            if step.status in {JobStatus.pending, JobStatus.running}:
                step.status = JobStatus.cancelled
                step.completed_at = now
                step.notes = "Cancelled by operator"
        self.db.commit()
        return self.get(job.id)  # type: ignore[return-value]

    def _load_recipe(self, recipe_id: int) -> Recipe:
        stmt = select(Recipe).options(
            selectinload(Recipe.ingredients).selectinload(RecipeIngredient.ingredient)
        ).where(Recipe.id == recipe_id)
        recipe = self.db.scalar(stmt)
        if recipe is None:
            raise ValueError("Recipe not found")
        if not recipe.is_active:
            raise ValueError("Recipe is inactive")
        return recipe

    def _pump_map_for_recipe(self, recipe: Recipe) -> dict[int, Pump]:
        ingredient_ids = [item.ingredient_id for item in recipe.ingredients]
        stmt = select(Pump).where(Pump.enabled.is_(True), Pump.ingredient_id.in_(ingredient_ids))
        pumps = list(self.db.scalars(stmt))
        mapping = {pump.ingredient_id: pump for pump in pumps if pump.ingredient_id is not None}
        missing = [ingredient_id for ingredient_id in ingredient_ids if ingredient_id not in mapping]
        if missing:
            raise ValueError(f"Recipe cannot be made; missing enabled pumps for ingredients: {missing}")
        for pump in mapping.values():
            if pump.ml_per_second <= 0:
                raise ValueError(f"Pump {pump.id} has invalid ml_per_second value {pump.ml_per_second}.")
        return mapping

    def _validate_step_duration(self, duration_seconds: float, pump_id: int, recipe_name: str) -> None:
        if duration_seconds <= 0:
            raise ValueError(f"Calculated duration for pump {pump_id} in recipe '{recipe_name}' must be greater than zero.")
        if duration_seconds > self.settings.max_pour_duration_seconds:
            raise ValueError(
                f"Calculated duration {duration_seconds:.2f}s for pump {pump_id} in recipe '{recipe_name}' "
                f"exceeds the configured limit of {self.settings.max_pour_duration_seconds:.2f}s."
            )

    def _execute(self, job: PourJob, steps: list[tuple[PourStep, int, float]]) -> None:
        try:
            start_time = utc_now()
            job.status = JobStatus.running
            job.started_at = start_time
            for step, _, _ in steps:
                step.status = JobStatus.running
            self.db.flush()
            logger.info(
                "event=order_started order_id=%s recipe_id=%s size=%s step_count=%s target_volume_ml=%s",
                job.id,
                job.recipe_id,
                job.size.value,
                len(steps),
                job.target_volume_ml,
            )

            for step, pump_id, duration_seconds in steps:
                logger.info(
                    "event=pour_step_started order_id=%s step_id=%s pump_id=%s duration_seconds=%.2f amount_ml=%s",
                    job.id,
                    step.id,
                    pump_id,
                    duration_seconds,
                    step.amount_ml,
                )
                step.started_at = utc_now()
                self.hardware.run_pump(pump_id, duration_seconds)
                step.status = JobStatus.completed
                step.completed_at = utc_now()
                logger.info(
                    "event=pour_step_completed order_id=%s step_id=%s pump_id=%s completed_at=%s",
                    job.id,
                    step.id,
                    pump_id,
                    step.completed_at.isoformat() if step.completed_at else None,
                )

            job.status = JobStatus.completed
            job.completed_at = utc_now()
            self.db.commit()
            logger.info(
                "event=order_completed order_id=%s completed_at=%s",
                job.id,
                job.completed_at.isoformat() if job.completed_at else None,
            )
        except Exception as exc:
            job.status = JobStatus.failed
            job.error_message = str(exc)
            for step, _, _ in steps:
                if step.status != JobStatus.completed:
                    step.status = JobStatus.failed
                    step.completed_at = utc_now()
                    step.notes = str(exc)
            self.db.commit()
            logger.exception(
                "event=order_failed order_id=%s recipe_id=%s size=%s error=%s",
                job.id,
                job.recipe_id,
                job.size.value,
                str(exc),
            )
            raise


def _start_order_execution_in_background(job_id: int, steps_payload: List[Tuple[int, int, float]]) -> None:
    """
    Launch order execution in a background thread so POST /orders can return quickly.

    steps_payload contains (step_id, pump_id, duration_seconds) tuples. The worker opens its own
    database session, reloads the job and steps, and then delegates to OrderService._execute.
    """

    def worker() -> None:
        db = SessionLocal()
        try:
            service = OrderService(db, get_hardware_controller())
            job = service.get(job_id)
            if job is None:
                logger.warning("Background order worker could not find job_id=%s", job_id)
                return

            # Re-associate steps with the new session using the stored IDs.
            step_map = {step.id: step for step in job.steps}
            steps: list[tuple[PourStep, int, float]] = []
            for step_id, pump_id, duration_seconds in steps_payload:
                step = step_map.get(step_id)
                if step is not None:
                    steps.append((step, pump_id, duration_seconds))

            if not steps:
                logger.warning("Background order worker found no steps for job_id=%s", job_id)
                return

            service._execute(job, steps)
        finally:
            db.close()

    thread = threading.Thread(target=worker, name=f"order-worker-{job_id}", daemon=True)
    thread.start()
