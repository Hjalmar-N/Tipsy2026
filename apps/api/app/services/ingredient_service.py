from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Ingredient
from app.schemas import IngredientCreate, IngredientUpdate


class IngredientService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self) -> list[Ingredient]:
        return list(self.db.scalars(select(Ingredient).order_by(Ingredient.name)))

    def get(self, ingredient_id: int) -> Ingredient | None:
        return self.db.get(Ingredient, ingredient_id)

    def create(self, payload: IngredientCreate) -> Ingredient:
        ingredient = Ingredient(**payload.model_dump())
        self.db.add(ingredient)
        self.db.commit()
        self.db.refresh(ingredient)
        return ingredient

    def update(self, ingredient: Ingredient, payload: IngredientUpdate) -> Ingredient:
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(ingredient, field, value)
        self.db.commit()
        self.db.refresh(ingredient)
        return ingredient

    def delete(self, ingredient: Ingredient) -> None:
        self.db.delete(ingredient)
        self.db.commit()
