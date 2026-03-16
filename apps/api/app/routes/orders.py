from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.hardware.factory import get_hardware_controller
from app.schemas import OrderCreate, PourJobRead
from app.services.order_service import OrderService

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=list[PourJobRead])
def list_orders(db: Session = Depends(get_db)) -> list[PourJobRead]:
    return OrderService(db, get_hardware_controller()).list()


@router.post("", response_model=PourJobRead, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)) -> PourJobRead:
    try:
        return OrderService(db, get_hardware_controller()).create(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/{order_id}", response_model=PourJobRead)
def get_order(order_id: int, db: Session = Depends(get_db)) -> PourJobRead:
    order = OrderService(db, get_hardware_controller()).get(order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("/{order_id}/cancel", response_model=PourJobRead)
def cancel_order(order_id: int, db: Session = Depends(get_db)) -> PourJobRead:
    service = OrderService(db, get_hardware_controller())
    order = service.get(order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    try:
        return service.cancel(order)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
