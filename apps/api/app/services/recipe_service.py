from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.config import get_settings
from app.models import Ingredient, Pump, Recipe, RecipeIngredient
from app.schemas import AvailableRecipeRead, RecipeCreate, RecipeUpdate


class RecipeService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self) -> list[Recipe]:
        stmt = select(Recipe).options(
            selectinload(Recipe.ingredients).selectinload(RecipeIngredient.ingredient)
        ).order_by(Recipe.name)
        return list(self.db.scalars(stmt))

    def get(self, recipe_id: int) -> Recipe | None:
        stmt = select(Recipe).options(
            selectinload(Recipe.ingredients).selectinload(RecipeIngredient.ingredient)
        ).where(Recipe.id == recipe_id)
        return self.db.scalar(stmt)

    def create(self, payload: RecipeCreate) -> Recipe:
        recipe = Recipe(
            name=payload.name,
            description=payload.description,
            is_active=payload.is_active,
        )
        self.db.add(recipe)
        self.db.flush()
        self._replace_ingredients(recipe, payload.ingredients)
        self.db.commit()
        return self.get(recipe.id)  # type: ignore[return-value]

    def update(self, recipe: Recipe, payload: RecipeUpdate) -> Recipe:
        data = payload.model_dump(exclude_unset=True)
        ingredient_payloads = data.pop("ingredients", None)
        for field, value in data.items():
            setattr(recipe, field, value)
        if ingredient_payloads is not None:
            self._replace_ingredients(recipe, ingredient_payloads)
        self.db.commit()
        return self.get(recipe.id)  # type: ignore[return-value]

    def delete(self, recipe: Recipe) -> None:
        self.db.delete(recipe)
        self.db.commit()

    def available(self) -> list[AvailableRecipeRead]:
        recipes = self.list()
        settings = get_settings()
        pumps = self.db.scalars(
            select(Pump).where(Pump.enabled.is_(True), Pump.ingredient_id.is_not(None))
        )
        mapped_enabled = {
            pump.ingredient_id
            for pump in pumps
            if settings.min_pump_ml_per_second <= pump.ml_per_second <= settings.max_pump_ml_per_second
        }
        available: list[AvailableRecipeRead] = []
        for recipe in recipes:
            ingredient_ids = [item.ingredient_id for item in recipe.ingredients]
            missing = [ingredient_id for ingredient_id in ingredient_ids if ingredient_id not in mapped_enabled]
            available.append(
                AvailableRecipeRead(
                    id=recipe.id,
                    name=recipe.name,
                    description=recipe.description,
                    is_active=recipe.is_active,
                    created_at=recipe.created_at,
                    updated_at=recipe.updated_at,
                    ingredients=recipe.ingredients,
                    can_make=recipe.is_active and not missing,
                    missing_ingredient_ids=missing,
                )
            )
        return available

    def _replace_ingredients(self, recipe: Recipe, ingredient_payloads: list[dict] | list) -> None:
        ingredient_ids = [item["ingredient_id"] if isinstance(item, dict) else item.ingredient_id for item in ingredient_payloads]
        ingredients = list(self.db.scalars(select(Ingredient).where(Ingredient.id.in_(ingredient_ids))))
        if len(ingredients) != len(set(ingredient_ids)):
            raise ValueError("One or more recipe ingredients do not exist")

        recipe.ingredients.clear()
        self.db.flush()
        for item in ingredient_payloads:
            payload = item if isinstance(item, dict) else item.model_dump()
            recipe.ingredients.append(
                RecipeIngredient(
                    ingredient_id=payload["ingredient_id"],
                    amount_ml=payload["amount_ml"],
                    step_order=payload.get("step_order", 0),
                )
            )
