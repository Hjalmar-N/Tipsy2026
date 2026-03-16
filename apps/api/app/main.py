import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import get_settings
from app.database import Base, engine
from app.hardware.factory import get_hardware_controller, reset_hardware_controller
from app.routes import ingredients_router, logs_router, orders_router, pumps_router, recipes_router, system_router

settings = get_settings()
logger = logging.getLogger(__name__)

if not logging.getLogger().handlers:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    logger.info("event=api_startup hardware_mode=%s environment=%s", settings.normalized_hardware_mode, settings.environment)
    controller = get_hardware_controller()
    try:
        yield
    finally:
        try:
            controller.cleanup()
        except Exception:
            logger.exception("Hardware controller cleanup failed during shutdown")
        reset_hardware_controller()
        logger.info("event=api_shutdown")


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.include_router(system_router)
app.include_router(ingredients_router)
app.include_router(pumps_router)
app.include_router(recipes_router)
app.include_router(orders_router)
app.include_router(logs_router)
