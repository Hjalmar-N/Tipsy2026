from collections.abc import Sequence

from sqlalchemy import text

from app.database import Base, SessionLocal, engine
from app.models import Ingredient, Pump, Recipe, RecipeIngredient


# 8 ingredients for 8-pump machine. Names used consistently (e.g. Tonic Water, Cranberry Juice).
INGREDIENTS: Sequence[dict] = (
    {"name": "Vodka", "description": "Neutral spirit for versatile cocktails"},
    {"name": "Gin", "description": "Botanical spirit with crisp juniper notes"},
    {"name": "Whiskey", "description": "Spirit for highballs and mixed drinks"},
    {"name": "Tequila", "description": "Blanco tequila with peppery finish"},
    {"name": "Ginger Beer", "description": "Spiced carbonated mixer"},
    {"name": "Tonic Water", "description": "Carbonated quinine mixer"},
    {"name": "Cola", "description": "Sweet carbonated mixer"},
    {"name": "Cranberry Juice", "description": "Tart red juice"},
)

PUMPS: Sequence[dict] = (
    # Default flow rate chosen to feel similar to the original ONE_OZ_COEFFICIENT
    # (~8 seconds per 1 oz ≈ 3.7 ml/s).
    {"name": "Pump 1", "gpio_pin": 17, "ingredient": "Vodka", "enabled": True, "ml_per_second": 3.7},
    {"name": "Pump 2", "gpio_pin": 27, "ingredient": "Gin", "enabled": True, "ml_per_second": 3.7},
    {"name": "Pump 3", "gpio_pin": 22, "ingredient": "Whiskey", "enabled": True, "ml_per_second": 3.7},
    {"name": "Pump 4", "gpio_pin": 5, "ingredient": "Tequila", "enabled": True, "ml_per_second": 3.7},
    {"name": "Pump 5", "gpio_pin": 6, "ingredient": "Ginger Beer", "enabled": True, "ml_per_second": 3.7},
    {"name": "Pump 6", "gpio_pin": 13, "ingredient": "Tonic Water", "enabled": True, "ml_per_second": 3.7},
    {"name": "Pump 7", "gpio_pin": 19, "ingredient": "Cola", "enabled": True, "ml_per_second": 3.7},
    {"name": "Pump 8", "gpio_pin": 26, "ingredient": "Cranberry Juice", "enabled": True, "ml_per_second": 3.7},
)

# 11 recipes. Only use the 8 ingredients above. One clean display name per recipe.
RECIPES: Sequence[dict] = (
    {
        "name": "Moscow Mule",
        "description": "Vodka and ginger beer",
        "ingredients": [("Vodka", 50), ("Ginger Beer", 150)],
    },
    {
        "name": "Gin & Tonic",
        "description": "Gin and tonic water",
        "ingredients": [("Gin", 50), ("Tonic Water", 150)],
    },
    {
        "name": "Whiskey & Cola",
        "description": "Whiskey and cola",
        "ingredients": [("Whiskey", 50), ("Cola", 150)],
    },
    {
        "name": "Vodka Cranberry",
        "description": "Vodka with cranberry juice",
        "ingredients": [("Vodka", 50), ("Cranberry Juice", 150)],
    },
    {
        "name": "Whiskey Ginger",
        "description": "Whiskey and ginger beer",
        "ingredients": [("Whiskey", 50), ("Ginger Beer", 150)],
    },
    {
        "name": "Tequila Tonic",
        "description": "Tequila and tonic water",
        "ingredients": [("Tequila", 50), ("Tonic Water", 150)],
    },
    {
        "name": "Mexican Mule",
        "description": "Tequila and ginger beer",
        "ingredients": [("Tequila", 50), ("Ginger Beer", 150)],
    },
    {
        "name": "Cape Codder",
        "description": "Vodka, cranberry, and ginger beer",
        "ingredients": [("Vodka", 45), ("Cranberry Juice", 100), ("Ginger Beer", 55)],
    },
    {
        "name": "Gin & Juice",
        "description": "Gin and cranberry juice",
        "ingredients": [("Gin", 50), ("Cranberry Juice", 150)],
    },
    {
        "name": "Dirty Whiskey",
        "description": "Whiskey, cola, and ginger beer",
        "ingredients": [("Whiskey", 50), ("Cola", 80), ("Ginger Beer", 70)],
    },
    {
        "name": "Long Beach Style",
        "description": "Vodka, gin, and cranberry juice",
        "ingredients": [("Vodka", 30), ("Gin", 30), ("Cranberry Juice", 140)],
    },
)


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        # Replace any existing demo data so the 8-pump recipe set is the only one present.
        # Delete in FK order: jobs/steps reference recipes and pumps; recipe_ingredients reference both.
        for table in ("pour_steps", "pour_jobs", "recipe_ingredients", "recipes", "pumps", "ingredients"):
            session.execute(text(f"DELETE FROM {table}"))
        session.commit()

        ingredients_by_name: dict[str, Ingredient] = {}
        for ingredient_data in INGREDIENTS:
            ingredient = Ingredient(**ingredient_data)
            session.add(ingredient)
            session.flush()
            ingredients_by_name[ingredient.name] = ingredient

        for pump_data in PUMPS:
            session.add(
                Pump(
                    name=pump_data["name"],
                    gpio_pin=pump_data["gpio_pin"],
                    ingredient_id=ingredients_by_name[pump_data["ingredient"]].id,
                    enabled=pump_data["enabled"],
                    ml_per_second=pump_data["ml_per_second"],
                )
            )

        session.flush()

        for recipe_data in RECIPES:
            recipe = Recipe(name=recipe_data["name"], description=recipe_data["description"])
            session.add(recipe)
            session.flush()

            for step_order, (ingredient_name, amount_ml) in enumerate(recipe_data["ingredients"]):
                session.add(
                    RecipeIngredient(
                        recipe_id=recipe.id,
                        ingredient_id=ingredients_by_name[ingredient_name].id,
                        amount_ml=amount_ml,
                        step_order=step_order,
                    )
                )

        session.commit()
    finally:
        session.close()


if __name__ == "__main__":
    seed()
