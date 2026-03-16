from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.models import Ingredient, Pump
from app.services.recipe_service import RecipeService


@dataclass
class RecommendationContext:
    installed_ingredient_ids: list[int]
    available_recipe_ids: list[int]


class RecommendationService:
    """Extension point for future recipe intelligence and suggestion features.

    This module is intentionally isolated from order execution and hardware control.
    It can be used later for:
    - recipe suggestions for the touchscreen
    - ingredient substitution hints
    - "what can I make right now?" helpers
    - optional admin-side recipe generation workflows
    """

    def __init__(self, db: Session) -> None:
        self.db = db
        self.recipe_service = RecipeService(db)

    def build_context(self) -> RecommendationContext:
        pumps = self.db.query(Pump).filter(Pump.enabled.is_(True), Pump.ingredient_id.is_not(None)).all()
        installed_ingredient_ids = sorted({pump.ingredient_id for pump in pumps if pump.ingredient_id is not None})
        available_recipe_ids = sorted([recipe.id for recipe in self.recipe_service.available() if recipe.can_make])
        return RecommendationContext(
            installed_ingredient_ids=installed_ingredient_ids,
            available_recipe_ids=available_recipe_ids,
        )

    def list_available_recipe_names(self) -> list[str]:
        return [recipe.name for recipe in self.recipe_service.available() if recipe.can_make]

    def list_installed_ingredient_names(self) -> list[str]:
        ingredients = (
            self.db.query(Ingredient)
            .join(Pump, Pump.ingredient_id == Ingredient.id)
            .filter(Pump.enabled.is_(True))
            .order_by(Ingredient.name)
            .all()
        )
        return [ingredient.name for ingredient in ingredients]

    def suggestion_placeholder(self) -> dict:
        context = self.build_context()
        return {
            "status": "not_implemented",
            "available_recipe_ids": context.available_recipe_ids,
            "installed_ingredient_ids": context.installed_ingredient_ids,
        }
