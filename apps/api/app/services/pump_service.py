from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.hardware.base import HardwareController
from app.models import Ingredient, JobStatus, JobType, PourJob, PourStep, Pump
from app.schemas import PumpBatchActionRequest, PumpCalibrationRequest, PumpCreate, PumpRunRequest, PumpUpdate
from app.timeutils import utc_now

logger = logging.getLogger(__name__)


class PumpService:
    def __init__(self, db: Session, hardware: HardwareController) -> None:
        self.db = db
        self.hardware = hardware
        self.settings = get_settings()

    def list(self) -> list[Pump]:
        return list(self.db.scalars(select(Pump).order_by(Pump.id)))

    def get(self, pump_id: int) -> Pump | None:
        return self.db.get(Pump, pump_id)

    def create(self, payload: PumpCreate) -> Pump:
        self._validate_ingredient(payload.ingredient_id)
        self._validate_flow_rate(payload.ml_per_second)
        pump = Pump(**payload.model_dump())
        self.db.add(pump)
        self.db.commit()
        self.db.refresh(pump)
        return pump

    def update(self, pump: Pump, payload: PumpUpdate) -> Pump:
        data = payload.model_dump(exclude_unset=True)
        ingredient_id = data.get("ingredient_id", pump.ingredient_id)
        self._validate_ingredient(ingredient_id)
        if "ml_per_second" in data and data["ml_per_second"] is not None:
            self._validate_flow_rate(data["ml_per_second"])
        for field, value in data.items():
            setattr(pump, field, value)
        self.db.commit()
        self.db.refresh(pump)
        return pump

    def calibrate(self, pump: Pump, payload: PumpCalibrationRequest) -> Pump:
        calibrated_rate = payload.volume_ml / payload.duration_seconds
        self._validate_duration(payload.duration_seconds)
        self._validate_flow_rate(calibrated_rate)
        logger.info(
            "event=pump_calibration_requested pump_id=%s volume_ml=%.2f duration_seconds=%.2f new_ml_per_second=%.4f",
            pump.id,
            payload.volume_ml,
            payload.duration_seconds,
            calibrated_rate,
        )
        pump.ml_per_second = calibrated_rate
        pump.last_calibrated_at = utc_now()

        job = self._create_job(job_type=JobType.calibration, pump=pump, target_volume_ml=payload.volume_ml)
        step = self._create_step(job, pump.id, "calibration", payload.volume_ml, payload.duration_seconds, 0)
        self._execute_job(job, [step], lambda: None)

        self.db.commit()
        self.db.refresh(pump)
        return pump

    def manual_run(self, pump: Pump, payload: PumpRunRequest) -> PourJob:
        self._ensure_pump_ready(pump)
        duration_seconds = payload.volume_ml / pump.ml_per_second
        self._validate_duration(duration_seconds)
        logger.info(
            "event=manual_pump_run_requested pump_id=%s ingredient=%s volume_ml=%.2f duration_seconds=%.2f",
            pump.id,
            pump.ingredient.name if pump.ingredient else "unassigned",
            payload.volume_ml,
            duration_seconds,
        )
        job = self._create_job(job_type=JobType.manual_run, pump=pump, target_volume_ml=payload.volume_ml)
        step = self._create_step(job, pump.id, "manual_run", payload.volume_ml, duration_seconds, 0)
        self._execute_job(job, [step], lambda: self.hardware.run_pump(pump.id, duration_seconds))
        return job

    def prime(self, payload: PumpBatchActionRequest) -> PourJob:
        pumps = self._resolve_batch_pumps(payload.pump_ids)
        duration_seconds = payload.duration_seconds or self.settings.default_prime_duration_seconds
        self._validate_duration(duration_seconds)
        logger.info(
            "event=prime_requested pump_ids=%s duration_seconds=%.2f",
            [pump.id for pump in pumps],
            duration_seconds,
        )
        job = self._create_job(job_type=JobType.prime)
        steps = [
            self._create_step(job, pump.id, "prime", None, duration_seconds, index)
            for index, pump in enumerate(pumps)
        ]
        self._execute_job(job, steps, lambda: self.hardware.prime_pumps([pump.id for pump in pumps], duration_seconds))
        return job

    def clean(self, payload: PumpBatchActionRequest) -> PourJob:
        pumps = self._resolve_batch_pumps(payload.pump_ids)
        duration_seconds = payload.duration_seconds or self.settings.default_clean_duration_seconds
        self._validate_duration(duration_seconds)
        logger.info(
            "event=clean_requested pump_ids=%s duration_seconds=%.2f",
            [pump.id for pump in pumps],
            duration_seconds,
        )
        job = self._create_job(job_type=JobType.clean)
        steps = [
            self._create_step(job, pump.id, "clean", None, duration_seconds, index)
            for index, pump in enumerate(pumps)
        ]
        self._execute_job(job, steps, lambda: self.hardware.clean_pumps([pump.id for pump in pumps], duration_seconds))
        return job

    def stop(self) -> PourJob:
        job = self._create_job(job_type=JobType.stop)
        logger.warning("event=emergency_stop_requested")
        self._execute_job(job, [], self.hardware.stop_all)
        return job

    def _resolve_batch_pumps(self, pump_ids: list[int] | None) -> list[Pump]:
        if pump_ids:
            pumps = [self.get(pump_id) for pump_id in pump_ids]
            valid_pumps = [pump for pump in pumps if pump is not None]
            if len(valid_pumps) != len(pump_ids):
                raise ValueError("One or more pumps do not exist")
            for pump in valid_pumps:
                self._ensure_pump_ready(pump)
            return valid_pumps
        pumps = list(self.db.scalars(select(Pump).where(Pump.enabled.is_(True)).order_by(Pump.id)))
        for pump in pumps:
            self._ensure_pump_ready(pump)
        return pumps

    def _validate_ingredient(self, ingredient_id: int | None) -> None:
        if ingredient_id is None:
            return
        if self.db.get(Ingredient, ingredient_id) is None:
            raise ValueError("Ingredient does not exist")

    def _validate_flow_rate(self, ml_per_second: float) -> None:
        if not self.settings.min_pump_ml_per_second <= ml_per_second <= self.settings.max_pump_ml_per_second:
            raise ValueError(
                "Pump ml_per_second must be between "
                f"{self.settings.min_pump_ml_per_second} and {self.settings.max_pump_ml_per_second}."
            )

    def _validate_duration(self, duration_seconds: float) -> None:
        if duration_seconds <= 0:
            raise ValueError("Duration must be greater than zero.")
        if duration_seconds > self.settings.max_pour_duration_seconds:
            raise ValueError(
                f"Duration {duration_seconds:.2f}s exceeds the configured limit of "
                f"{self.settings.max_pour_duration_seconds:.2f}s."
            )

    def _ensure_pump_ready(self, pump: Pump) -> None:
        if not pump.enabled:
            raise ValueError(f"Pump {pump.id} is disabled.")
        self._validate_flow_rate(pump.ml_per_second)

    def _create_job(self, job_type: JobType, pump: Pump | None = None, target_volume_ml: float | None = None) -> PourJob:
        job = PourJob(
            job_type=job_type,
            pump_id=pump.id if pump else None,
            target_volume_ml=target_volume_ml,
        )
        self.db.add(job)
        self.db.flush()
        return job

    def _create_step(
        self,
        job: PourJob,
        pump_id: int | None,
        action: str,
        amount_ml: float | None,
        duration_seconds: float,
        step_order: int,
    ) -> PourStep:
        step = PourStep(
            job_id=job.id,
            pump_id=pump_id,
            action=action,
            amount_ml=amount_ml,
            duration_seconds=duration_seconds,
            step_order=step_order,
        )
        self.db.add(step)
        self.db.flush()
        return step

    def _execute_job(self, job: PourJob, steps: list[PourStep], hardware_call) -> None:
        try:
            now = utc_now()
            job.status = JobStatus.running
            job.started_at = now
            for step in steps:
                step.status = JobStatus.running
                step.started_at = now
            self.db.flush()

            logger.info(
                "event=pour_job_started job_id=%s job_type=%s pump_id=%s step_count=%s target_volume_ml=%s",
                job.id,
                job.job_type.value,
                job.pump_id,
                len(steps),
                job.target_volume_ml,
            )
            hardware_call()

            finished_at = utc_now()
            job.status = JobStatus.completed
            job.completed_at = finished_at
            for step in steps:
                step.status = JobStatus.completed
                step.completed_at = finished_at
            self.db.commit()
            self.db.refresh(job)
            logger.info(
                "event=pour_job_completed job_id=%s job_type=%s completed_at=%s",
                job.id,
                job.job_type.value,
                finished_at.isoformat(),
            )
        except Exception as exc:
            job.status = JobStatus.failed
            job.error_message = str(exc)
            for step in steps:
                step.status = JobStatus.failed
                step.completed_at = utc_now()
                step.notes = str(exc)
            self.db.commit()
            self.db.refresh(job)
            logger.exception(
                "event=pour_job_failed job_id=%s job_type=%s error=%s",
                job.id,
                job.job_type.value,
                str(exc),
            )
            raise
