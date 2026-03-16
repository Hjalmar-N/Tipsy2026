import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { TopHeader } from "./components/TopHeader";
import { DashboardPage } from "./pages/DashboardPage";
import { IngredientsPage } from "./pages/IngredientsPage";
import { PumpsPage } from "./pages/PumpsPage";
import { RecipesPage } from "./pages/RecipesPage";
import { CalibrationPage } from "./pages/CalibrationPage";
import { ManualControlPage } from "./pages/ManualControlPage";
import { LogsPage } from "./pages/LogsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { api } from "./lib/api";
import type {
  AdminPage,
  ApiErrorState,
  AppNotice,
  Ingredient,
  PourJob,
  Pump,
  Recipe,
  RecipeAvailability,
  SystemStatus,
} from "./types";

const pageTitles: Record<AdminPage, string> = {
  dashboard: "Dashboard",
  pumps: "Pumps",
  ingredients: "Ingredients",
  recipes: "Recipes",
  calibration: "Calibration",
  manual: "Manual Control",
  logs: "Logs",
  settings: "Settings",
};

export default function App() {
  const [activePage, setActivePage] = useState<AdminPage>("dashboard");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [availableRecipes, setAvailableRecipes] = useState<RecipeAvailability[]>([]);
  const [logs, setLogs] = useState<PourJob[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<ApiErrorState | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<AppNotice | null>(null);

  async function loadAllData() {
    setLoading(true);
    setPageError(null);
    try {
      const [system, ingredientData, pumpData, recipeData, recipeAvailability, recentLogs] = await Promise.all([
        api.getSystemStatus(),
        api.getIngredients(),
        api.getPumps(),
        api.getRecipes(),
        api.getAvailableRecipes(),
        api.getRecentLogs(),
      ]);
      setSystemStatus(system);
      setIngredients(ingredientData);
      setPumps(pumpData);
      setRecipes(recipeData);
      setAvailableRecipes(recipeAvailability);
      setLogs(recentLogs);
    } catch (error) {
      setPageError(toErrorState(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAllData();
  }, []);

  function pushNotice(kind: AppNotice["kind"], message: string) {
    setNotice({ kind, message });
  }

  async function runAction<T>(key: string, action: () => Promise<T>, successMessage: string) {
    setBusyAction(key);
    setNotice(null);
    try {
      const result = await action();
      pushNotice("success", successMessage);
      await loadAllData();
      return result;
    } catch (error) {
      pushNotice("error", toErrorState(error).message);
      throw error;
    } finally {
      setBusyAction(null);
    }
  }

  const recipeAvailabilityMap = useMemo(
    () => new Map(availableRecipes.map((recipe) => [recipe.id, recipe])),
    [availableRecipes],
  );

  return (
    <div className="min-h-screen bg-midnight text-midnight">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        <Sidebar activePage={activePage} onSelect={setActivePage} />
        <div className="flex-1 bg-slatepaper">
          <TopHeader
            title={pageTitles[activePage]}
            notice={notice}
            onDismissNotice={() => setNotice(null)}
            onRefresh={() => void loadAllData()}
            loading={loading}
          />
          <main className="p-4 md:p-6 xl:p-8">
            {activePage === "dashboard" && (
              <DashboardPage
                systemStatus={systemStatus}
                pumps={pumps}
                recipes={recipes}
                availableRecipes={availableRecipes}
                logs={logs}
                loading={loading}
                error={pageError}
                busyAction={busyAction}
                onPrime={(durationSeconds) =>
                  runAction(
                    "prime-all",
                    () => api.primePumps({ duration_seconds: durationSeconds }),
                    "Prime cycle started.",
                  )
                }
                onClean={(durationSeconds) =>
                  runAction(
                    "clean-all",
                    () => api.cleanPumps({ duration_seconds: durationSeconds }),
                    "Clean cycle started.",
                  )
                }
                onStop={() => runAction("emergency-stop", () => api.stopPumps(), "Emergency stop engaged.")}
              />
            )}
            {activePage === "ingredients" && (
              <IngredientsPage
                ingredients={ingredients}
                loading={loading}
                error={pageError}
                busyAction={busyAction}
                onCreate={(payload) =>
                  runAction("create-ingredient", () => api.createIngredient(payload), "Ingredient created.")
                }
                onUpdate={(id, payload) =>
                  runAction(`update-ingredient-${id}`, () => api.updateIngredient(id, payload), "Ingredient updated.")
                }
                onDelete={(id) =>
                  runAction(`delete-ingredient-${id}`, () => api.deleteIngredient(id), "Ingredient deleted.")
                }
              />
            )}
            {activePage === "pumps" && (
              <PumpsPage
                pumps={pumps}
                ingredients={ingredients}
                loading={loading}
                error={pageError}
                busyAction={busyAction}
                onUpdate={(id, payload) =>
                  runAction(`update-pump-${id}`, () => api.updatePump(id, payload), "Pump updated.")
                }
              />
            )}
            {activePage === "recipes" && (
              <RecipesPage
                recipes={recipes}
                ingredients={ingredients}
                loading={loading}
                error={pageError}
                busyAction={busyAction}
                recipeAvailabilityMap={recipeAvailabilityMap}
                onCreate={(payload) => runAction("create-recipe", () => api.createRecipe(payload), "Recipe created.")}
                onUpdate={(id, payload) =>
                  runAction(`update-recipe-${id}`, () => api.updateRecipe(id, payload), "Recipe updated.")
                }
                onDelete={(id) => runAction(`delete-recipe-${id}`, () => api.deleteRecipe(id), "Recipe deleted.")}
              />
            )}
            {activePage === "calibration" && (
              <CalibrationPage
                pumps={pumps}
                ingredients={ingredients}
                loading={loading}
                error={pageError}
                busyAction={busyAction}
                onCalibrate={(id, payload) =>
                  runAction(`calibrate-pump-${id}`, () => api.calibratePump(id, payload), "Pump calibrated.")
                }
              />
            )}
            {activePage === "manual" && (
              <ManualControlPage
                pumps={pumps}
                loading={loading}
                error={pageError}
                busyAction={busyAction}
                onRunPump={(pumpId, volumeMl) =>
                  runAction(`run-pump-${pumpId}`, () => api.runPump(pumpId, { volume_ml: volumeMl }), "Manual run completed.")
                }
                onPrime={(payload) =>
                  runAction("prime-selected", () => api.primePumps(payload), "Prime cycle started.")
                }
                onClean={(payload) =>
                  runAction("clean-selected", () => api.cleanPumps(payload), "Clean cycle started.")
                }
                onStop={() => runAction("manual-stop", () => api.stopPumps(), "Emergency stop engaged.")}
              />
            )}
            {activePage === "logs" && <LogsPage logs={logs} loading={loading} error={pageError} />}
            {activePage === "settings" && <SettingsPage systemStatus={systemStatus} error={pageError} />}
          </main>
        </div>
      </div>
    </div>
  );
}

function toErrorState(error: unknown): ApiErrorState {
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: "Something went wrong while talking to the backend." };
}
