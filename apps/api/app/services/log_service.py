from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import PourJob


class LogService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def recent_jobs(self, limit: int) -> list[PourJob]:
        stmt = (
            select(PourJob)
            .options(selectinload(PourJob.steps), selectinload(PourJob.recipe))
            .order_by(PourJob.requested_at.desc())
            .limit(limit)
        )
        return list(self.db.scalars(stmt))
