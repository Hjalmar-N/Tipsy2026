from __future__ import annotations

from sqlalchemy.orm import Session

from app.config import Settings
from app.database import SessionLocal
from app.models import Pump


class PumpPinResolver:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def resolve_pin(self, pump_id: int) -> int:
        if pump_id in self.settings.parsed_pump_pin_map:
            return self.settings.parsed_pump_pin_map[pump_id]

        session: Session = SessionLocal()
        try:
            pump = session.get(Pump, pump_id)
            if pump is None:
                raise RuntimeError(f"Pump {pump_id} does not exist in the database.")
            if pump.gpio_pin is None:
                raise RuntimeError(
                    f"Pump {pump_id} does not have a GPIO pin configured. Set Pump.gpio_pin or PUMP_PIN_MAP."
                )
            return pump.gpio_pin
        finally:
            session.close()
