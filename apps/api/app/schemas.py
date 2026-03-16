from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.models import JobStatus, JobType, OrderSize


class IngredientBase(BaseModel):
    name: str
    description: str | None = None
    is_active: bool = True


class IngredientCreate(IngredientBase):
    pass


class IngredientUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_active: bool | None = None


class IngredientRead(IngredientBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PumpBase(BaseModel):
    name: str
    gpio_pin: int | None = None
    ingredient_id: int | None = None
    enabled: bool = True
    ml_per_second: float = Field(default=1.0, gt=0)


class PumpCreate(PumpBase):
    pass


class PumpUpdate(BaseModel):
    name: str | None = None
    gpio_pin: int | None = None
    ingredient_id: int | None = None
    enabled: bool | None = None
    ml_per_second: float | None = Field(default=None, gt=0)


class PumpRead(PumpBase):
    id: int
    last_calibrated_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PumpCalibrationRequest(BaseModel):
    volume_ml: float = Field(gt=0)
    duration_seconds: float = Field(gt=0)


class PumpRunRequest(BaseModel):
    volume_ml: float = Field(gt=0)


class PumpBatchActionRequest(BaseModel):
    pump_ids: list[int] | None = None
    duration_seconds: float | None = Field(default=None, gt=0)


class RecipeIngredientPayload(BaseModel):
    ingredient_id: int
    amount_ml: float = Field(gt=0)
    step_order: int = 0


class RecipeBase(BaseModel):
    name: str
    description: str | None = None
    is_active: bool = True


class RecipeCreate(RecipeBase):
    ingredients: list[RecipeIngredientPayload]


class RecipeUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_active: bool | None = None
    ingredients: list[RecipeIngredientPayload] | None = None


class RecipeIngredientRead(RecipeIngredientPayload):
    id: int
    ingredient: IngredientRead

    model_config = {"from_attributes": True}


class RecipeRead(RecipeBase):
    id: int
    created_at: datetime
    updated_at: datetime
    ingredients: list[RecipeIngredientRead]

    model_config = {"from_attributes": True}


class AvailableRecipeRead(RecipeRead):
    can_make: bool
    missing_ingredient_ids: list[int]


class PourStepRead(BaseModel):
    id: int
    pump_id: int | None = None
    ingredient_id: int | None = None
    action: str
    step_order: int
    amount_ml: float | None = None
    duration_seconds: float
    status: JobStatus
    started_at: datetime | None = None
    completed_at: datetime | None = None
    notes: str | None = None

    model_config = {"from_attributes": True}


class PourJobRead(BaseModel):
    id: int
    job_type: JobType
    status: JobStatus
    size: OrderSize
    recipe_id: int | None = None
    pump_id: int | None = None
    target_volume_ml: float | None = None
    requested_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None
    cancelled_at: datetime | None = None
    error_message: str | None = None
    steps: list[PourStepRead]

    model_config = {"from_attributes": True}


class OrderCreate(BaseModel):
    recipe_id: int
    size: OrderSize = OrderSize.single


class SystemStatusRead(BaseModel):
    app_name: str
    environment: str
    hardware_mode: str
    db_path: str | None = None
    emergency_stop_engaged: bool
    active_pump_ids: list[int]


class HealthRead(BaseModel):
    status: str
