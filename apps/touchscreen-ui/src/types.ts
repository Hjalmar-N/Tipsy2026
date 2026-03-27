export type OrderSize = "single" | "double";

export interface Ingredient {
  id: number;
  name: string;
  description?: string | null;
  is_active: boolean;
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

export interface RecipeAvailability {
  id: number;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  ingredients: RecipeIngredient[];
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
  size: OrderSize;
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

export interface PumpBatchRunPayload {
  duration_seconds?: number;
}

export interface KioskError {
  message: string;
}

export interface MachineReadiness {
  ready: boolean;
  label: string;
  detail: string;
}

export type ScreenState =
  | { name: "startup-service" }
  | { name: "home" }
  | { name: "pouring"; recipe: RecipeAvailability; size: OrderSize; jobId: number; startedAt: number; lastJob: PourJob }
  | { name: "success"; recipe: RecipeAvailability; size: OrderSize; job: PourJob }
  | { name: "error"; title: string; detail: string };

export interface OrderCreatePayload {
  recipe_id: number;
  size: OrderSize;
}
