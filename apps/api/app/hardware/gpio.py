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
        # Map pump_id -> (forward_pin, reverse_pin)
        self._initialized_pins: dict[int, tuple[int, int]] = {}
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
        pins = self._prepare_pins([pump_id])
        forward_pin, reverse_pin = pins[pump_id]
        logger.info(
            "Starting pump %s (forward=%s, reverse=%s) for %.2f seconds",
            pump_id,
            forward_pin,
            reverse_pin,
            duration_seconds,
        )
        try:
            # Forward direction for normal pours.
            self._set_pumps_direction([pump_id], forward=True, reverse=False)
            interrupted = self._wait_for_duration(duration_seconds)
            if interrupted:
                raise RuntimeError("Pump run interrupted by stop_all")
        except Exception:
            logger.exception("Pump %s failed during run", pump_id)
            raise
        finally:
            self._set_pumps_direction([pump_id], forward=False, reverse=False)
            logger.info("Pump %s stopped", pump_id)

    def prime_pumps(self, pump_ids: list[int], duration_seconds: float) -> None:
        # Prime in forward direction.
        self._run_batch(pump_ids, duration_seconds, action_name="prime")

    def clean_pumps(self, pump_ids: list[int], duration_seconds: float) -> None:
        # Clean in reverse direction.
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
            # Forward for prime, reverse for clean.
            if action_name == "clean":
                self._set_pumps_direction(pump_ids, forward=False, reverse=True)
            else:
                self._set_pumps_direction(pump_ids, forward=True, reverse=False)
            interrupted = self._wait_for_duration(duration_seconds)
            if interrupted:
                raise RuntimeError(f"{action_name.capitalize()} interrupted by stop_all")
        except Exception:
            logger.exception("%s failed for pumps %s", action_name.capitalize(), pump_ids)
            raise
        finally:
            self._set_pumps_direction(pump_ids, forward=False, reverse=False)
            logger.info("%s finished for pumps %s", action_name.capitalize(), pump_ids)

    def _prepare_pins(self, pump_ids: list[int]) -> dict[int, tuple[int, int]]:
        with self._lock:
            self._stop_event.clear()
            self._emergency_stop_engaged = False
            resolved: dict[int, tuple[int, int]] = {}
            for pump_id in pump_ids:
                pins = self._initialized_pins.get(pump_id)
                if pins is None:
                    forward_pin, reverse_pin = self._resolver.resolve_pins(pump_id)
                    self._adapter.setup_output(forward_pin, active_low=self.settings.gpio_active_low)
                    self._adapter.setup_output(reverse_pin, active_low=self.settings.gpio_active_low)
                    self._initialized_pins[pump_id] = (forward_pin, reverse_pin)
                    logger.info(
                        "Configured pump %s with forward pin %s and reverse pin %s",
                        pump_id,
                        forward_pin,
                        reverse_pin,
                    )
                resolved[pump_id] = self._initialized_pins[pump_id]
            return resolved

    def _set_pumps_direction(self, pump_ids: list[int], *, forward: bool, reverse: bool) -> None:
        with self._lock:
            for pump_id in pump_ids:
                forward_pin, reverse_pin = self._initialized_pins[pump_id]
                # Forward pin
                self._adapter.write_output(
                    forward_pin,
                    active=forward,
                    active_low=self.settings.gpio_active_low,
                )
                # Reverse pin
                self._adapter.write_output(
                    reverse_pin,
                    active=reverse,
                    active_low=self.settings.gpio_active_low,
                )
                if forward or reverse:
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
        for forward_pin, reverse_pin in self._initialized_pins.values():
            try:
                self._adapter.write_output(forward_pin, active=False, active_low=self.settings.gpio_active_low)
                self._adapter.write_output(reverse_pin, active=False, active_low=self.settings.gpio_active_low)
            except Exception:
                logger.exception(
                    "Failed to drive GPIO pins %s/%s inactive during stop/cleanup",
                    forward_pin,
                    reverse_pin,
                )
