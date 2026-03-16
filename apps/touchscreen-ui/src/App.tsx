import { useEffect, useState } from "react";
import { CarouselScreen } from "./screens/CarouselScreen";
import { PouringScreen } from "./screens/PouringScreen";
import { SuccessScreen } from "./screens/SuccessScreen";
import { ErrorScreen } from "./screens/ErrorScreen";
import { api } from "./lib/api";
import { kioskConfig } from "./config";
import type { KioskError, MachineReadiness, OrderSize, RecipeAvailability, ScreenState, SystemStatus } from "./types";

export default function App() {
  const [recipes, setRecipes] = useState<RecipeAvailability[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [screen, setScreen] = useState<ScreenState>({ name: "home" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<KioskError | null>(null);

  async function loadKioskData() {
    try {
      const [status, availableRecipes] = await Promise.all([api.getSystemStatus(), api.getAvailableRecipes()]);
      setSystemStatus(status);
      setRecipes(availableRecipes.filter((recipe) => recipe.can_make));
      setError(null);
    } catch (loadError) {
      setError(toKioskError(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadKioskData();
    const interval = window.setInterval(() => {
      void loadKioskData();
    }, kioskConfig.autoRefreshMs);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (screen.name !== "pouring") {
      return;
    }

    let isCancelled = false;
    const interval = window.setInterval(async () => {
      try {
        const job = await api.getOrder(screen.jobId);
        if (isCancelled) {
          return;
        }
        if (job.status === "completed") {
          setScreen({
            name: "success",
            recipe: screen.recipe,
            size: screen.size,
            job,
          });
          void loadKioskData();
          return;
        }
        if (job.status === "failed" || job.status === "cancelled") {
          setScreen({
            name: "error",
            title: "Drink could not be completed",
            detail: job.error_message || `The job ended with status "${job.status}".`,
          });
          void loadKioskData();
        }
      } catch (pollError) {
        if (!isCancelled) {
          setScreen({
            name: "error",
            title: "Lost contact with the machine",
            detail: toKioskError(pollError).message,
          });
        }
      }
    }, kioskConfig.orderPollMs);

    return () => {
      isCancelled = true;
      window.clearInterval(interval);
    };
  }, [screen]);

  const readiness = getMachineReadiness(systemStatus, recipes);

  async function startOrder(recipe: RecipeAvailability, size: OrderSize) {
    try {
      setError(null);
      const latestRecipes = await api.getAvailableRecipes();
      const latestRecipe = latestRecipes.find((item) => item.id === recipe.id && item.can_make);
      const latestStatus = await api.getSystemStatus();
      setSystemStatus(latestStatus);
      setRecipes(latestRecipes.filter((item) => item.can_make));

      if (!latestRecipe) {
        setScreen({
          name: "error",
          title: "Drink is no longer available",
          detail: "This drink became unavailable before the order could start. Please choose another drink.",
        });
        return;
      }

      if (!getMachineReadiness(latestStatus, [latestRecipe]).ready) {
        setScreen({
          name: "error",
          title: "Machine is not ready",
          detail: "The machine is currently busy or unavailable. Please try again in a moment.",
        });
        return;
      }

      const job = await api.createOrder({ recipe_id: latestRecipe.id, size });
      setScreen({
        name: "pouring",
        recipe: latestRecipe,
        size,
        jobId: job.id,
        startedAt: Date.now(),
        lastJob: job,
      });
    } catch (orderError) {
      setScreen({
        name: "error",
        title: "Could not start your drink",
        detail: toKioskError(orderError).message,
      });
    }
  }

  return (
    <main className="round-display-root min-h-screen text-white">
      <div className="round-display-safe">
        {screen.name === "home" && (
          <CarouselScreen
            title={kioskConfig.titleText}
            loading={loading}
            error={error}
            recipes={recipes}
            readiness={readiness}
            onSelectSize={(recipe, size) => void startOrder(recipe, size)}
            onRetry={() => { setLoading(true); void loadKioskData(); }}
          />
        )}

        {screen.name === "pouring" && (
          <PouringScreen
            recipe={screen.recipe}
            size={screen.size}
            jobId={screen.jobId}
            startedAt={screen.startedAt}
            lastJob={screen.lastJob}
          />
        )}

        {screen.name === "success" && (
          <SuccessScreen
            recipe={screen.recipe}
            size={screen.size}
            timeoutMs={kioskConfig.idleResetMs}
            onDone={() => setScreen({ name: "home" })}
          />
        )}

        {screen.name === "error" && (
          <ErrorScreen
            title={screen.title}
            detail={screen.detail}
            timeoutMs={kioskConfig.idleResetMs}
            onBackHome={() => setScreen({ name: "home" })}
          />
        )}
      </div>
    </main>
  );
}

function getMachineReadiness(status: SystemStatus | null, recipes: RecipeAvailability[]): MachineReadiness {
  const hasMakeableRecipe = recipes.some((recipe) => recipe.can_make);

  if (!status) {
    return {
      ready: false,
      label: "Connecting",
      detail: "Waiting for machine status from the backend.",
    };
  }

  if (status.emergency_stop_engaged) {
    return {
      ready: false,
      label: "Emergency Stop",
      detail: "Operator reset is required before new drinks can be served.",
    };
  }

  if (status.active_pump_ids.length > 0) {
    return {
      ready: false,
      label: "Busy",
      detail: `Pump activity detected on ${status.active_pump_ids.join(", ")}. Please wait for the current task to finish.`,
    };
  }

  if (!hasMakeableRecipe) {
    return {
      ready: false,
      label: "No drinks ready",
      detail: "There are currently no recipes that can be made. Ask an operator to refill ingredients.",
    };
  }

  return {
    ready: true,
    label: "Ready",
    detail: "The machine is standing by for a new order.",
  };
}

function toKioskError(error: unknown): KioskError {
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: "Something went wrong while talking to the drink machine." };
}
