from __future__ import annotations

from sqlalchemy.orm import Session

from app.config import Settings
from app.database import SessionLocal
from app.models import Pump


class PumpPinResolver:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def resolve_pins(self, pump_id: int) -> tuple[int, int]:
        """
        Resolve forward and reverse GPIO pins for a pump.

        Priority:
        1. TIPSY_PUMP_PIN_MAP / PUMP_PIN_MAP (env), via Settings.parsed_pump_pin_map
           - "1=17"   => (17, 17)
           - "1=17/4" => (17, 4)
        2. Pump.gpio_forward_pin / Pump.gpio_reverse_pin in the database
        3. Legacy Pump.gpio_pin (single-pin), treated as (pin, pin)
        """
        if pump_id in self.settings.parsed_pump_pin_map:
            return self.settings.parsed_pump_pin_map[pump_id]

        session: Session = SessionLocal()
        try:
            pump = session.get(Pump, pump_id)
            if pump is None:
                raise RuntimeError(f"Pump {pump_id} does not exist in the database.")
            if pump.gpio_forward_pin is not None and pump.gpio_reverse_pin is not None:
                return pump.gpio_forward_pin, pump.gpio_reverse_pin
            if pump.gpio_pin is not None:
                # Legacy single-pin configuration: use the same pin for forward and reverse.
                return pump.gpio_pin, pump.gpio_pin
            raise RuntimeError(
                f"Pump {pump_id} does not have GPIO pins configured. "
                "Set Pump.gpio_forward_pin/gpio_reverse_pin or PUMP_PIN_MAP."
            )
        finally:
            session.close()
