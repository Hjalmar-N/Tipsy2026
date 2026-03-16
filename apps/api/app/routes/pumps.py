from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.hardware.factory import get_hardware_controller
from app.schemas import (
    PourJobRead,
    PumpBatchActionRequest,
    PumpCalibrationRequest,
    PumpCreate,
    PumpRead,
    PumpRunRequest,
    PumpUpdate,
)
from app.services.pump_service import PumpService

router = APIRouter(prefix="/pumps", tags=["pumps"])


@router.get("", response_model=list[PumpRead])
def list_pumps(db: Session = Depends(get_db)) -> list[PumpRead]:
    return PumpService(db, get_hardware_controller()).list()


@router.post("", response_model=PumpRead, status_code=status.HTTP_201_CREATED)
def create_pump(payload: PumpCreate, db: Session = Depends(get_db)) -> PumpRead:
    service = PumpService(db, get_hardware_controller())
    try:
        return service.create(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put("/{pump_id}", response_model=PumpRead)
def update_pump(pump_id: int, payload: PumpUpdate, db: Session = Depends(get_db)) -> PumpRead:
    service = PumpService(db, get_hardware_controller())
    pump = service.get(pump_id)
    if pump is None:
        raise HTTPException(status_code=404, detail="Pump not found")
    try:
        return service.update(pump, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{pump_id}/calibrate", response_model=PumpRead)
def calibrate_pump(pump_id: int, payload: PumpCalibrationRequest, db: Session = Depends(get_db)) -> PumpRead:
    service = PumpService(db, get_hardware_controller())
    pump = service.get(pump_id)
    if pump is None:
        raise HTTPException(status_code=404, detail="Pump not found")
    try:
        return service.calibrate(pump, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{pump_id}/run", response_model=PourJobRead)
def run_pump(pump_id: int, payload: PumpRunRequest, db: Session = Depends(get_db)) -> PourJobRead:
    service = PumpService(db, get_hardware_controller())
    pump = service.get(pump_id)
    if pump is None:
        raise HTTPException(status_code=404, detail="Pump not found")
    try:
        return service.manual_run(pump, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/prime", response_model=PourJobRead)
def prime_pumps(payload: PumpBatchActionRequest, db: Session = Depends(get_db)) -> PourJobRead:
    service = PumpService(db, get_hardware_controller())
    try:
        return service.prime(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/clean", response_model=PourJobRead)
def clean_pumps(payload: PumpBatchActionRequest, db: Session = Depends(get_db)) -> PourJobRead:
    service = PumpService(db, get_hardware_controller())
    try:
        return service.clean(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/stop", response_model=PourJobRead)
def stop_pumps(db: Session = Depends(get_db)) -> PourJobRead:
    service = PumpService(db, get_hardware_controller())
    try:
        return service.stop()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
