from __future__ import annotations

from abc import ABC, abstractmethod


class HardwareController(ABC):
    @abstractmethod
    def get_status(self) -> dict:
        raise NotImplementedError

    @abstractmethod
    def run_pump(self, pump_id: int, duration_seconds: float) -> None:
        raise NotImplementedError

    @abstractmethod
    def prime_pumps(self, pump_ids: list[int], duration_seconds: float) -> None:
        raise NotImplementedError

    @abstractmethod
    def clean_pumps(self, pump_ids: list[int], duration_seconds: float) -> None:
        raise NotImplementedError

    @abstractmethod
    def stop_all(self) -> None:
        raise NotImplementedError

    def cleanup(self) -> None:
        """Release any hardware resources held by the controller."""
