from functools import lru_cache

from app.config import get_settings
from app.hardware.base import HardwareController
from app.hardware.gpio import RaspberryPiHardwareController
from app.hardware.mock import MockHardwareController


@lru_cache
def get_hardware_controller() -> HardwareController:
    settings = get_settings()
    if settings.normalized_hardware_mode == "raspberrypi":
        return RaspberryPiHardwareController()
    if settings.normalized_hardware_mode == "mock":
        return MockHardwareController()
    raise RuntimeError(
        f"Unsupported hardware mode '{settings.hardware_mode}'. Supported values: mock, raspberrypi."
    )


def reset_hardware_controller() -> None:
    get_hardware_controller.cache_clear()
