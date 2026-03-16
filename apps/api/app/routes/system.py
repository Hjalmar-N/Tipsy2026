from fastapi import APIRouter

from app.hardware.factory import get_hardware_controller
from app.schemas import HealthRead, SystemStatusRead
from app.services.system_service import SystemService

router = APIRouter(tags=["system"])


@router.get("/health", response_model=HealthRead)
def healthcheck() -> HealthRead:
    return HealthRead(status="ok")


@router.get("/system/status", response_model=SystemStatusRead)
def system_status() -> SystemStatusRead:
    service = SystemService(get_hardware_controller())
    return service.get_status()
