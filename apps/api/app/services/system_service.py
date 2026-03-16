from app.config import get_settings
from app.hardware.base import HardwareController
from app.schemas import SystemStatusRead


class SystemService:
    def __init__(self, hardware: HardwareController) -> None:
        self.hardware = hardware
        self.settings = get_settings()

    def get_status(self) -> SystemStatusRead:
        hardware_status = self.hardware.get_status()
        return SystemStatusRead(
            app_name=self.settings.app_name,
            environment=self.settings.environment,
            hardware_mode=self.settings.normalized_hardware_mode,
            db_path=str(self.settings.sqlite_path) if self.settings.sqlite_path else None,
            emergency_stop_engaged=hardware_status["emergency_stop_engaged"],
            active_pump_ids=hardware_status["active_pump_ids"],
        )
