export type OrderSize = "single" | "double";

export interface Ingredient {
  id: number;
  name: string;
  description?: string | null;
  is_active: boolean;
}

export interface Pump {
  id: number;
  name: string;
  gpio_pin?: number | null;
  ingredient_id?: number | null;
  enabled: boolean;
  ml_per_second: number;
}

export interface RecipeIngredient {
  ingredient_id: number;
  amount_ml: number;
  step_order: number;
}

export interface Recipe {
  id: number;
  name: string;
  description?: string | null;
  is_active: boolean;
  ingredients: RecipeIngredient[];
}
