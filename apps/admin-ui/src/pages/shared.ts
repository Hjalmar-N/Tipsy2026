import type { ApiErrorState, Ingredient, Pump, Recipe, RecipeAvailability, PourJob, SystemStatus } from "../types";

export interface BasePageProps {
  ingredients: Ingredient[];
  pumps: Pump[];
  recipes: Recipe[];
  availableRecipes: RecipeAvailability[];
  logs: PourJob[];
  systemStatus: SystemStatus | null;
  loading: boolean;
  busyAction: string | null;
  error: ApiErrorState | null;
}
