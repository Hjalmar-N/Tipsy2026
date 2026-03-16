import pytest

from app.config import get_settings
from app.hardware.factory import get_hardware_controller, reset_hardware_controller
from app.hardware import gpio as gpio_module
from app.hardware.mock import MockHardwareController


@pytest.fixture(autouse=True)
def reset_hardware_state():
    get_settings.cache_clear()
    reset_hardware_controller()
    yield
    get_settings.cache_clear()
    reset_hardware_controller()


def test_mock_mode_selected_by_default(monkeypatch):
    monkeypatch.delenv("HARDWARE_MODE", raising=False)
    controller = get_hardware_controller()
    assert isinstance(controller, MockHardwareController)


def test_raspberrypi_mode_fails_clearly_without_gpio(monkeypatch):
    monkeypatch.setenv("HARDWARE_MODE", "raspberrypi")
    monkeypatch.setattr(
        gpio_module,
        "RPiGPIOAdapter",
        lambda: (_ for _ in ()).throw(RuntimeError("RPi.GPIO package is not available")),
    )
    with pytest.raises(RuntimeError, match="RPi.GPIO"):
        get_hardware_controller()


def test_pump_pin_map_parsing_from_env(monkeypatch):
    monkeypatch.setenv("PUMP_PIN_MAP", "1=17,2:27")
    settings = get_settings()
    assert settings.parsed_pump_pin_map == {1: 17, 2: 27}
