from __future__ import annotations


class RPiGPIOAdapter:
    def __init__(self) -> None:
        try:
            import RPi.GPIO as gpio
        except ImportError as exc:
            raise RuntimeError(
                "Raspberry Pi hardware mode requires the 'RPi.GPIO' package. "
                "Install it on the Pi with 'sudo apt install python3-rpi.gpio' or 'pip install RPi.GPIO'."
            ) from exc

        self._gpio = gpio

    def disable_warnings(self) -> None:
        self._gpio.setwarnings(False)

    def set_numbering_mode(self, mode_name: str) -> None:
        normalized = mode_name.upper()
        if normalized == "BCM":
            mode = self._gpio.BCM
        elif normalized == "BOARD":
            mode = self._gpio.BOARD
        else:
            raise RuntimeError(f"Unsupported GPIO numbering mode '{mode_name}'. Use BCM or BOARD.")
        self._gpio.setmode(mode)

    def setup_output(self, pin: int, *, active_low: bool) -> None:
        self._gpio.setup(pin, self._gpio.OUT, initial=self._inactive_value(active_low))

    def write_output(self, pin: int, *, active: bool, active_low: bool) -> None:
        self._gpio.output(pin, self._active_value(active_low) if active else self._inactive_value(active_low))

    def cleanup(self, pins: list[int] | None = None) -> None:
        if pins:
            self._gpio.cleanup(pins)
            return
        self._gpio.cleanup()

    def _active_value(self, active_low: bool) -> int:
        return self._gpio.LOW if active_low else self._gpio.HIGH

    def _inactive_value(self, active_low: bool) -> int:
        return self._gpio.HIGH if active_low else self._gpio.LOW
