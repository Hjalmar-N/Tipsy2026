export type AdminPage =
  | "dashboard"
  | "pumps"
  | "ingredients"
  | "recipes"
  | "calibration"
  | "manual"
  | "logs"
  | "settings";

export interface ApiErrorState {
  message: string;
}

export interface AppNotice {
  kind: "success" | "error";
  message: string;
}

export interface Ingredient {
  id: number;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Pump {
  id: number;
  name: string;
  gpio_pin?: number | null;
  ingredient_id?: number | null;
  enabled: boolean;
  ml_per_second: number;
  last_calibrated_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredient {
  id: number;
  ingredient_id: number;
  amount_ml: number;
  step_order: number;
  ingredient: Ingredient;
}

export interface Recipe {
  id: number;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  ingredients: RecipeIngredient[];
}

export interface RecipeAvailability extends Recipe {
  can_make: boolean;
  missing_ingredient_ids: number[];
}

export interface PourStep {
  id: number;
  pump_id?: number | null;
  ingredient_id?: number | null;
  action: string;
  step_order: number;
  amount_ml?: number | null;
  duration_seconds: number;
  status: string;
  started_at?: string | null;
  completed_at?: string | null;
  notes?: string | null;
}

export interface PourJob {
  id: number;
  job_type: string;
  status: string;
  size: "single" | "double";
  recipe_id?: number | null;
  pump_id?: number | null;
  target_volume_ml?: number | null;
  requested_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  error_message?: string | null;
  steps: PourStep[];
}

export interface SystemStatus {
  app_name: string;
  environment: string;
  hardware_mode: string;
  db_path?: string | null;
  emergency_stop_engaged: boolean;
  active_pump_ids: number[];
}

export interface IngredientPayload {
  name: string;
  description?: string | null;
  is_active: boolean;
}

export interface PumpPayload {
  name?: string;
  gpio_pin?: number | null;
  ingredient_id?: number | null;
  enabled?: boolean;
  ml_per_second?: number;
}

export interface RecipeIngredientPayload {
  ingredient_id: number;
  amount_ml: number;
  step_order: number;
}

export interface RecipePayload {
  name: string;
  description?: string | null;
  is_active: boolean;
  ingredients: RecipeIngredientPayload[];
}

export interface PumpCalibrationPayload {
  volume_ml: number;
  duration_seconds: number;
}

export interface PumpRunPayload {
  volume_ml: number;
}

export interface PumpBatchPayload {
  pump_ids?: number[];
  duration_seconds?: number;
}
