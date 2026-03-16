from __future__ import annotations

import logging
import time

from app.hardware.base import HardwareController

logger = logging.getLogger(__name__)


class MockHardwareController(HardwareController):
    def __init__(self) -> None:
        self.active_pumps: set[int] = set()
        self.emergency_stop_engaged = False

    def get_status(self) -> dict:
        return {
            "active_pump_ids": sorted(self.active_pumps),
            "emergency_stop_engaged": self.emergency_stop_engaged,
        }

    def run_pump(self, pump_id: int, duration_seconds: float) -> None:
        logger.info("Mock run_pump pump_id=%s duration=%.2f", pump_id, duration_seconds)
        self.emergency_stop_engaged = False
        self.active_pumps.add(pump_id)
        # Simulate real-time pouring in mock mode so the kiosk can show progress.
        time.sleep(max(0.0, duration_seconds))
        self.active_pumps.discard(pump_id)

    def prime_pumps(self, pump_ids: list[int], duration_seconds: float) -> None:
        logger.info("Mock prime_pumps pump_ids=%s duration=%.2f", pump_ids, duration_seconds)
        self.emergency_stop_engaged = False
        self.active_pumps.update(pump_ids)
        time.sleep(max(0.0, duration_seconds))
        self.active_pumps.difference_update(pump_ids)

    def clean_pumps(self, pump_ids: list[int], duration_seconds: float) -> None:
        logger.info("Mock clean_pumps pump_ids=%s duration=%.2f", pump_ids, duration_seconds)
        self.emergency_stop_engaged = False
        self.active_pumps.update(pump_ids)
        time.sleep(max(0.0, duration_seconds))
        self.active_pumps.difference_update(pump_ids)

    def stop_all(self) -> None:
        logger.warning("Mock stop_all invoked")
        self.active_pumps.clear()
        self.emergency_stop_engaged = True

    def cleanup(self) -> None:
        logger.info("Mock cleanup invoked")
        self.active_pumps.clear()
