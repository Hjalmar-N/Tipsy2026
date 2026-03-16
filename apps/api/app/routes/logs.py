from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.schemas import PourJobRead
from app.services.log_service import LogService

router = APIRouter(prefix="/logs", tags=["logs"])


@router.get("/recent", response_model=list[PourJobRead])
def recent_logs(
    limit: int = Query(default=get_settings().log_limit_default, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[PourJobRead]:
    return LogService(db).recent_jobs(limit)
