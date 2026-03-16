from __future__ import annotations

from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, Enum as SqlEnum, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.timeutils import utc_now


class OrderSize(str, Enum):
    single = "single"
    double = "double"


class JobType(str, Enum):
    order = "order"
    manual_run = "manual_run"
    calibration = "calibration"
    prime = "prime"
    clean = "clean"
    stop = "stop"


class JobStatus(str, Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    cancelled = "cancelled"
    failed = "failed"


class Ingredient(Base):
    __tablename__ = "ingredients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    pumps: Mapped[list["Pump"]] = relationship("Pump", back_populates="ingredient")
    recipe_ingredients: Mapped[list["RecipeIngredient"]] = relationship("RecipeIngredient", back_populates="ingredient")


class Pump(Base):
    __tablename__ = "pumps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    gpio_pin: Mapped[int | None] = mapped_column(Integer)
    ingredient_id: Mapped[int | None] = mapped_column(ForeignKey("ingredients.id"))
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    ml_per_second: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    last_calibrated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    ingredient: Mapped[Ingredient | None] = relationship("Ingredient", back_populates="pumps")
    pour_steps: Mapped[list["PourStep"]] = relationship("PourStep", back_populates="pump")


class Recipe(Base):
    __tablename__ = "recipes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    ingredients: Mapped[list["RecipeIngredient"]] = relationship(
        "RecipeIngredient",
        back_populates="recipe",
        cascade="all, delete-orphan",
        order_by="RecipeIngredient.step_order",
    )
    jobs: Mapped[list["PourJob"]] = relationship("PourJob", back_populates="recipe")


class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"
    __table_args__ = (UniqueConstraint("recipe_id", "ingredient_id", name="uq_recipe_ingredient"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    recipe_id: Mapped[int] = mapped_column(ForeignKey("recipes.id"), nullable=False)
    ingredient_id: Mapped[int] = mapped_column(ForeignKey("ingredients.id"), nullable=False)
    amount_ml: Mapped[float] = mapped_column(Float, nullable=False)
    step_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    recipe: Mapped[Recipe] = relationship("Recipe", back_populates="ingredients")
    ingredient: Mapped[Ingredient] = relationship("Ingredient", back_populates="recipe_ingredients")


class PourJob(Base):
    __tablename__ = "pour_jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    job_type: Mapped[JobType] = mapped_column(SqlEnum(JobType), nullable=False)
    status: Mapped[JobStatus] = mapped_column(SqlEnum(JobStatus), default=JobStatus.pending, nullable=False)
    size: Mapped[OrderSize] = mapped_column(SqlEnum(OrderSize), default=OrderSize.single, nullable=False)
    recipe_id: Mapped[int | None] = mapped_column(ForeignKey("recipes.id"))
    pump_id: Mapped[int | None] = mapped_column(ForeignKey("pumps.id"))
    target_volume_ml: Mapped[float | None] = mapped_column(Float)
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    error_message: Mapped[str | None] = mapped_column(Text)

    recipe: Mapped[Recipe | None] = relationship("Recipe", back_populates="jobs")
    steps: Mapped[list["PourStep"]] = relationship(
        "PourStep",
        back_populates="job",
        cascade="all, delete-orphan",
        order_by="PourStep.step_order",
    )


class PourStep(Base):
    __tablename__ = "pour_steps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("pour_jobs.id"), nullable=False)
    pump_id: Mapped[int | None] = mapped_column(ForeignKey("pumps.id"))
    ingredient_id: Mapped[int | None] = mapped_column(ForeignKey("ingredients.id"))
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    step_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    amount_ml: Mapped[float | None] = mapped_column(Float)
    duration_seconds: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[JobStatus] = mapped_column(SqlEnum(JobStatus), default=JobStatus.pending, nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    notes: Mapped[str | None] = mapped_column(Text)

    job: Mapped[PourJob] = relationship("PourJob", back_populates="steps")
    pump: Mapped[Pump | None] = relationship("Pump", back_populates="pour_steps")
