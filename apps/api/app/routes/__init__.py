from app.routes.ingredients import router as ingredients_router
from app.routes.logs import router as logs_router
from app.routes.orders import router as orders_router
from app.routes.pumps import router as pumps_router
from app.routes.recipes import router as recipes_router
from app.routes.system import router as system_router

__all__ = [
    "ingredients_router",
    "logs_router",
    "orders_router",
    "pumps_router",
    "recipes_router",
    "system_router",
]
