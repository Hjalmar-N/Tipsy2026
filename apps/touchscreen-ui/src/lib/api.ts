import type { OrderCreatePayload, PourJob, RecipeAvailability, SystemStatus } from "../types";

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
  getAvailableRecipes: () => request<RecipeAvailability[]>("/recipes/available"),
  createOrder: (payload: OrderCreatePayload) =>
    request<PourJob>("/orders", { method: "POST", body: JSON.stringify(payload) }),
  getOrder: (orderId: number) => request<PourJob>(`/orders/${orderId}`),
};
