from functools import lru_cache
from pathlib import Path

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = Field(
        default="Tipsy API",
        validation_alias=AliasChoices("APP_NAME", "TIPSY_APP_NAME"),
    )
    environment: str = Field(
        default="development",
        validation_alias=AliasChoices("ENVIRONMENT", "TIPSY_ENVIRONMENT"),
    )
    database_url: str = Field(
        default="sqlite:///./tipsy.db",
        validation_alias=AliasChoices("DATABASE_URL", "TIPSY_DATABASE_URL"),
    )
    hardware_mode: str = Field(
        default="mock",
        validation_alias=AliasChoices("HARDWARE_MODE", "TIPSY_HARDWARE_MODE"),
    )
    gpio_numbering_mode: str = Field(
        default="BCM",
        validation_alias=AliasChoices("GPIO_NUMBERING_MODE", "TIPSY_GPIO_NUMBERING_MODE"),
    )
    pump_pin_map: str = Field(
        default="",
        validation_alias=AliasChoices("PUMP_PIN_MAP", "TIPSY_PUMP_PIN_MAP"),
    )
    gpio_active_low: bool = Field(
        default=False,
        validation_alias=AliasChoices("GPIO_ACTIVE_LOW", "TIPSY_GPIO_ACTIVE_LOW"),
    )
    gpio_cleanup_on_shutdown: bool = Field(
        default=True,
        validation_alias=AliasChoices("GPIO_CLEANUP_ON_SHUTDOWN", "TIPSY_GPIO_CLEANUP_ON_SHUTDOWN"),
    )
    gpio_poll_interval_seconds: float = Field(
        default=0.05,
        validation_alias=AliasChoices("GPIO_POLL_INTERVAL_SECONDS", "TIPSY_GPIO_POLL_INTERVAL_SECONDS"),
    )
    min_pump_ml_per_second: float = Field(
        default=0.1,
        validation_alias=AliasChoices("MIN_PUMP_ML_PER_SECOND", "TIPSY_MIN_PUMP_ML_PER_SECOND"),
    )
    max_pump_ml_per_second: float = Field(
        default=120.0,
        validation_alias=AliasChoices("MAX_PUMP_ML_PER_SECOND", "TIPSY_MAX_PUMP_ML_PER_SECOND"),
    )
    max_pour_duration_seconds: float = Field(
        # Allow realistic long pours (e.g. double long drinks) while still guarding against runaway jobs.
        default=120.0,
        validation_alias=AliasChoices("MAX_POUR_DURATION_SECONDS", "TIPSY_MAX_POUR_DURATION_SECONDS"),
    )
    default_prime_duration_seconds: float = 2.0
    default_clean_duration_seconds: float = 5.0
    log_limit_default: int = 20

    model_config = SettingsConfigDict(
        env_prefix="TIPSY_",
        env_file=".env",
        extra="ignore",
    )

    @property
    def sqlite_path(self) -> Path | None:
        prefix = "sqlite:///"
        if self.database_url.startswith(prefix):
            return Path(self.database_url.removeprefix(prefix))
        return None

    @property
    def normalized_hardware_mode(self) -> str:
        if self.hardware_mode == "gpio":
            return "raspberrypi"
        return self.hardware_mode.lower()

    @property
    def parsed_pump_pin_map(self) -> dict[int, tuple[int, int]]:
        """
        Parse TIPSY_PUMP_PIN_MAP / PUMP_PIN_MAP into a mapping of pump_id -> (forward_pin, reverse_pin).

        Accepted formats per entry:
        - "1=17"        -> forward=17, reverse=17
        - "1=17/4"      -> forward=17, reverse=4
        - "1:17"        -> forward=17, reverse=17  (backwards-compatible key/value separator)
        """
        mappings: dict[int, tuple[int, int]] = {}
        raw_entries = [item.strip() for item in self.pump_pin_map.replace(";", ",").split(",") if item.strip()]
        for entry in raw_entries:
            if "=" in entry:
                key, value = entry.split("=", maxsplit=1)
            elif ":" in entry:
                key, value = entry.split(":", maxsplit=1)
            else:
                raise ValueError(
                    f"Invalid pump pin map entry '{entry}'. Expected format 'pump_id=pin' or 'pump_id=forward/reverse'."
                )
            key_int = int(key.strip())
            value_str = value.strip()
            if "/" in value_str:
                forward_str, reverse_str = value_str.split("/", maxsplit=1)
                mappings[key_int] = (int(forward_str.strip()), int(reverse_str.strip()))
            else:
                pin = int(value_str)
                mappings[key_int] = (pin, pin)
        return mappings


@lru_cache
def get_settings() -> Settings:
    return Settings()
