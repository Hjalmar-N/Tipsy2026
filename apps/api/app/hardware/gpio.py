from __future__ import annotations

import logging
import threading
import time

from app.config import get_settings
from app.hardware.base import HardwareController
from app.hardware.pins import PumpPinResolver
from app.hardware.rpi_gpio_adapter import RPiGPIOAdapter

logger = logging.getLogger(__name__)


class RaspberryPiHardwareController(HardwareController):
    def __init__(self) -> None:
        self.settings = get_settings()
        self._adapter = RPiGPIOAdapter()
        self._resolver = PumpPinResolver(self.settings)
        self._lock = threading.RLock()
        self._stop_event = threading.Event()
        self._active_pumps: set[int] = set()
        self._initialized_pins: dict[int, int] = {}
        self._emergency_stop_engaged = False

        try:
            self._adapter.disable_warnings()
            self._adapter.set_numbering_mode(self.settings.gpio_numbering_mode)
        except Exception as exc:
            raise RuntimeError(
                "Failed to initialize Raspberry Pi GPIO. Make sure this app is running on a Raspberry Pi "
                "with GPIO access and the selected numbering mode is valid."
            ) from exc

        logger.info(
            "Initialized RaspberryPiHardwareController with numbering mode=%s active_low=%s",
            self.settings.gpio_numbering_mode,
            self.settings.gpio_active_low,
        )

    def get_status(self) -> dict:
        with self._lock:
            return {
                "active_pump_ids": sorted(self._active_pumps),
                "emergency_stop_engaged": self._emergency_stop_engaged,
            }

    def run_pump(self, pump_id: int, duration_seconds: float) -> None:
        pin = self._prepare_pins([pump_id])[pump_id]
        logger.info("Starting pump %s on GPIO pin %s for %.2f seconds", pump_id, pin, duration_seconds)
        try:
            self._set_pumps_active([pump_id], True)
            interrupted = self._wait_for_duration(duration_seconds)
            if interrupted:
                raise RuntimeError("Pump run interrupted by stop_all")
        except Exception:
            logger.exception("Pump %s failed during run", pump_id)
            raise
        finally:
            self._set_pumps_active([pump_id], False)
            logger.info("Pump %s stopped", pump_id)

    def prime_pumps(self, pump_ids: list[int], duration_seconds: float) -> None:
        self._run_batch(pump_ids, duration_seconds, action_name="prime")

    def clean_pumps(self, pump_ids: list[int], duration_seconds: float) -> None:
        self._run_batch(pump_ids, duration_seconds, action_name="clean")

    def stop_all(self) -> None:
        with self._lock:
            logger.warning("Emergency stop requested for pumps: %s", sorted(self._active_pumps))
            self._emergency_stop_engaged = True
            self._stop_event.set()
            self._deactivate_all_known_pins()
            self._active_pumps.clear()

    def cleanup(self) -> None:
        with self._lock:
            logger.info("Cleaning up Raspberry Pi GPIO controller")
            self.stop_all()
            if self.settings.gpio_cleanup_on_shutdown:
                pins = list(self._initialized_pins.values())
                if pins:
                    self._adapter.cleanup(pins)
            self._initialized_pins.clear()

    def _run_batch(self, pump_ids: list[int], duration_seconds: float, *, action_name: str) -> None:
        if not pump_ids:
            logger.info("Skipping %s because no pumps were requested", action_name)
            return
        pins = self._prepare_pins(pump_ids)
        logger.info(
            "Starting %s for pumps=%s pins=%s duration=%.2f",
            action_name,
            pump_ids,
            [pins[pump_id] for pump_id in pump_ids],
            duration_seconds,
        )
        try:
            self._set_pumps_active(pump_ids, True)
            interrupted = self._wait_for_duration(duration_seconds)
            if interrupted:
                raise RuntimeError(f"{action_name.capitalize()} interrupted by stop_all")
        except Exception:
            logger.exception("%s failed for pumps %s", action_name.capitalize(), pump_ids)
            raise
        finally:
            self._set_pumps_active(pump_ids, False)
            logger.info("%s finished for pumps %s", action_name.capitalize(), pump_ids)

    def _prepare_pins(self, pump_ids: list[int]) -> dict[int, int]:
        with self._lock:
            self._stop_event.clear()
            self._emergency_stop_engaged = False
            resolved: dict[int, int] = {}
            for pump_id in pump_ids:
                pin = self._initialized_pins.get(pump_id)
                if pin is None:
                    pin = self._resolver.resolve_pin(pump_id)
                    self._adapter.setup_output(pin, active_low=self.settings.gpio_active_low)
                    self._initialized_pins[pump_id] = pin
                    logger.info("Configured pump %s on GPIO pin %s", pump_id, pin)
                resolved[pump_id] = pin
            return resolved

    def _set_pumps_active(self, pump_ids: list[int], active: bool) -> None:
        with self._lock:
            for pump_id in pump_ids:
                pin = self._initialized_pins[pump_id]
                self._adapter.write_output(pin, active=active, active_low=self.settings.gpio_active_low)
                if active:
                    self._active_pumps.add(pump_id)
                else:
                    self._active_pumps.discard(pump_id)

    def _wait_for_duration(self, duration_seconds: float) -> bool:
        deadline = time.monotonic() + duration_seconds
        while time.monotonic() < deadline:
            if self._stop_event.wait(timeout=self.settings.gpio_poll_interval_seconds):
                return True
        return self._stop_event.is_set()

    def _deactivate_all_known_pins(self) -> None:
        for pin in self._initialized_pins.values():
            try:
                self._adapter.write_output(pin, active=False, active_low=self.settings.gpio_active_low)
            except Exception:
                logger.exception("Failed to drive GPIO pin %s inactive during stop/cleanup", pin)
