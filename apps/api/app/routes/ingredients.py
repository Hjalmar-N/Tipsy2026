from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import IngredientCreate, IngredientRead, IngredientUpdate
from app.services.ingredient_service import IngredientService

router = APIRouter(prefix="/ingredients", tags=["ingredients"])


@router.get("", response_model=list[IngredientRead])
def list_ingredients(db: Session = Depends(get_db)) -> list[IngredientRead]:
    return IngredientService(db).list()


@router.post("", response_model=IngredientRead, status_code=status.HTTP_201_CREATED)
def create_ingredient(payload: IngredientCreate, db: Session = Depends(get_db)) -> IngredientRead:
    return IngredientService(db).create(payload)


@router.put("/{ingredient_id}", response_model=IngredientRead)
def update_ingredient(ingredient_id: int, payload: IngredientUpdate, db: Session = Depends(get_db)) -> IngredientRead:
    service = IngredientService(db)
    ingredient = service.get(ingredient_id)
    if ingredient is None:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    return service.update(ingredient, payload)


@router.delete("/{ingredient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ingredient(ingredient_id: int, db: Session = Depends(get_db)) -> Response:
    service = IngredientService(db)
    ingredient = service.get(ingredient_id)
    if ingredient is None:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    service.delete(ingredient)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
