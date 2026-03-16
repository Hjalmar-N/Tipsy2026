import type {
  Ingredient,
  IngredientPayload,
  PourJob,
  Pump,
  PumpBatchPayload,
  PumpCalibrationPayload,
  PumpPayload,
  PumpRunPayload,
  Recipe,
  RecipeAvailability,
  RecipePayload,
  SystemStatus,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function readErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { detail?: string };
    return body.detail || `Request failed with status ${response.status}.`;
  } catch {
    return `Request failed with status ${response.status}.`;
  }
}

export const api = {
  getSystemStatus: () => request<SystemStatus>("/system/status"),
  getIngredients: () => request<Ingredient[]>("/ingredients"),
  createIngredient: (payload: IngredientPayload) =>
    request<Ingredient>("/ingredients", { method: "POST", body: JSON.stringify(payload) }),
  updateIngredient: (id: number, payload: Partial<IngredientPayload>) =>
    request<Ingredient>(`/ingredients/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteIngredient: (id: number) => request<void>(`/ingredients/${id}`, { method: "DELETE" }),

  getPumps: () => request<Pump[]>("/pumps"),
  updatePump: (id: number, payload: PumpPayload) =>
    request<Pump>(`/pumps/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  calibratePump: (id: number, payload: PumpCalibrationPayload) =>
    request<Pump>(`/pumps/${id}/calibrate`, { method: "POST", body: JSON.stringify(payload) }),
  runPump: (id: number, payload: PumpRunPayload) =>
    request<PourJob>(`/pumps/${id}/run`, { method: "POST", body: JSON.stringify(payload) }),
  primePumps: (payload: PumpBatchPayload) =>
    request<PourJob>("/pumps/prime", { method: "POST", body: JSON.stringify(payload) }),
  cleanPumps: (payload: PumpBatchPayload) =>
    request<PourJob>("/pumps/clean", { method: "POST", body: JSON.stringify(payload) }),
  stopPumps: () => request<PourJob>("/pumps/stop", { method: "POST" }),

  getRecipes: () => request<Recipe[]>("/recipes"),
  getAvailableRecipes: () => request<RecipeAvailability[]>("/recipes/available"),
  createRecipe: (payload: RecipePayload) =>
    request<Recipe>("/recipes", { method: "POST", body: JSON.stringify(payload) }),
  updateRecipe: (id: number, payload: Partial<RecipePayload>) =>
    request<Recipe>(`/recipes/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteRecipe: (id: number) => request<void>(`/recipes/${id}`, { method: "DELETE" }),

  getRecentLogs: () => request<PourJob[]>("/logs/recent"),
};
