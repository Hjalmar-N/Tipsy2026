import { useState } from "react";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ErrorState, LoadingState } from "../components/StatusMessage";
import { StatCard } from "../components/StatCard";
import { formatDateTime } from "../lib/format";
import { getLastSuccessfulOrder, getRecentFailures } from "../lib/ops";
import type { ApiErrorState, PourJob, Pump, Recipe, RecipeAvailability, SystemStatus } from "../types";

export function DashboardPage({
  systemStatus,
  pumps,
  recipes,
  availableRecipes,
  logs,
  loading,
  error,
  busyAction,
  onPrime,
  onClean,
  onStop,
}: {
  systemStatus: SystemStatus | null;
  pumps: Pump[];
  recipes: Recipe[];
  availableRecipes: RecipeAvailability[];
  logs: PourJob[];
  loading: boolean;
  error: ApiErrorState | null;
  busyAction: string | null;
  onPrime: (durationSeconds: number) => Promise<unknown>;
  onClean: (durationSeconds: number) => Promise<unknown>;
  onStop: () => Promise<unknown>;
}) {
  const [primeDuration, setPrimeDuration] = useState("2");
  const [cleanDuration, setCleanDuration] = useState("5");

  const primeDurationNum = Number(primeDuration);
  const cleanDurationNum = Number(cleanDuration);
  const isPrimeDurationValid = Number.isFinite(primeDurationNum) && primeDurationNum > 0;
  const isCleanDurationValid = Number.isFinite(cleanDurationNum) && cleanDurationNum > 0;

  const totalPumps = pumps.length;
  const mappedPumps = pumps.filter((pump) => pump.ingredient_id).length;
  const availableCount = availableRecipes.filter((recipe) => recipe.can_make).length;
  const readyState = systemStatus
    ? systemStatus.emergency_stop_engaged
      ? "Stopped"
      : systemStatus.active_pump_ids.length > 0
        ? "Busy"
        : "Ready"
    : "Unknown";
  const lastSuccessfulPour = getLastSuccessfulOrder(logs);
  const recentFailures = getRecentFailures(logs).slice(0, 3);
  const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]));

  if (loading && !systemStatus) {
    return <LoadingState label="Loading dashboard..." />;
  }

  if (error && !systemStatus) {
    return <ErrorState message={error.message} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Machine Mode" value={systemStatus?.hardware_mode ?? "Unknown"} detail="Hardware controller mode from the backend." />
        <StatCard title="Machine State" value={readyState} detail="Operational readiness for the next pour." />
        <StatCard title="Total Pumps" value={`${totalPumps}`} detail="All configured pump records in SQLite." />
        <StatCard title="Mapped Pumps" value={`${mappedPumps}/${totalPumps}`} detail="Pumps currently assigned to an ingredient." />
        <StatCard title="Available Recipes" value={`${availableCount}`} detail="Recipes ready to pour based on current enabled mappings." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card title="Machine Status Panel" subtitle="Live operating state for an on-shift operator.">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl bg-slatepaper p-4">
              <div className="text-sm text-midnight/55">Environment</div>
              <div className="mt-1 text-lg font-semibold">{systemStatus?.environment ?? "Unknown"}</div>
            </div>
            <div className="rounded-2xl bg-slatepaper p-4">
              <div className="text-sm text-midnight/55">Machine Ready</div>
              <div className="mt-1">
                <Badge tone={readyState === "Ready" ? "good" : readyState === "Stopped" ? "danger" : "warn"}>{readyState}</Badge>
              </div>
            </div>
            <div className="rounded-2xl bg-slatepaper p-4">
              <div className="text-sm text-midnight/55">Emergency Stop</div>
              <div className="mt-1">
                <Badge tone={systemStatus?.emergency_stop_engaged ? "danger" : "good"}>
                  {systemStatus?.emergency_stop_engaged ? "Engaged" : "Clear"}
                </Badge>
              </div>
            </div>
            <div className="rounded-2xl bg-slatepaper p-4 md:col-span-2 xl:col-span-3">
              <div className="text-sm text-midnight/55">Active Pumps</div>
              <div className="mt-1 text-lg font-semibold">
                {systemStatus?.active_pump_ids.length ? systemStatus.active_pump_ids.join(", ") : "No active pumps"}
              </div>
            </div>
            <div className="rounded-2xl bg-slatepaper p-4 md:col-span-2 xl:col-span-2">
              <div className="text-sm text-midnight/55">Last Successful Pour</div>
              <div className="mt-1 text-lg font-semibold">
                {lastSuccessfulPour ? recipeById.get(lastSuccessfulPour.recipe_id ?? -1)?.name ?? `Recipe ${lastSuccessfulPour.recipe_id}` : "No completed pours yet"}
              </div>
              <div className="mt-1 text-sm text-midnight/60">
                {lastSuccessfulPour ? formatDateTime(lastSuccessfulPour.completed_at || lastSuccessfulPour.requested_at) : "Run a drink to populate this."}
              </div>
            </div>
            <div className="rounded-2xl bg-slatepaper p-4">
              <div className="text-sm text-midnight/55">Recent Failures</div>
              <div className="mt-1 text-3xl font-semibold">{recentFailures.length}</div>
              <div className="mt-1 text-sm text-midnight/60">Failed or cancelled jobs in the current recent log window.</div>
            </div>
          </div>
        </Card>

        <Card title="Quick Actions" subtitle="Use maintenance actions carefully. Emergency stop is intentionally distinct.">
          <div className="space-y-4">
            <div className="rounded-2xl border border-midnight/10 bg-slatepaper p-4">
              <label className="text-sm font-semibold">Prime all enabled pumps</label>
              <div className="mt-1 text-xs text-midnight/60">Short cycle to pull liquid through lines after setup or refill.</div>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  value={primeDuration}
                  onChange={(event) => setPrimeDuration(event.target.value)}
                  type="number"
                  min="0.1"
                  step="0.1"
                  className="w-full rounded-xl border border-midnight/15 px-3 py-2"
                />
                <Button
                  onClick={() => isPrimeDurationValid && void onPrime(primeDurationNum)}
                  disabled={busyAction === "prime-all" || !isPrimeDurationValid}
                >
                  {busyAction === "prime-all" ? "Starting..." : "Prime"}
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-midnight/10 bg-slatepaper p-4">
              <label className="text-sm font-semibold">Clean all enabled pumps</label>
              <div className="mt-1 text-xs text-midnight/60">Longer maintenance cycle for flushing after service or testing.</div>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  value={cleanDuration}
                  onChange={(event) => setCleanDuration(event.target.value)}
                  type="number"
                  min="0.1"
                  step="0.1"
                  className="w-full rounded-xl border border-midnight/15 px-3 py-2"
                />
                <Button
                  onClick={() => isCleanDurationValid && void onClean(cleanDurationNum)}
                  disabled={busyAction === "clean-all" || !isCleanDurationValid}
                >
                  {busyAction === "clean-all" ? "Starting..." : "Clean"}
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-[#d95d39]/35 bg-[#fff2ee] p-4">
              <div className="text-sm font-semibold text-[#7a2417]">Emergency Stop</div>
              <div className="mt-1 text-xs text-[#7a2417]/75">Immediately halts active hardware actions and flags the machine as stopped.</div>
              <Button variant="danger" className="mt-4 w-full py-3 text-base" onClick={() => void onStop()} disabled={busyAction === "emergency-stop"}>
                {busyAction === "emergency-stop" ? "Stopping..." : "Emergency Stop"}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card title="Recipe Availability" subtitle="Current availability from the backend rules engine.">
          <div className="space-y-3">
            {availableRecipes.slice(0, 6).map((recipe) => (
              <div key={recipe.id} className="flex items-start justify-between rounded-2xl bg-slatepaper p-4">
                <div>
                  <div className="font-semibold">{recipe.name}</div>
                  <div className="mt-1 text-sm text-midnight/60">
                    {recipe.ingredients.map((item) => `${item.ingredient.name} ${item.amount_ml}ml`).join(" • ")}
                  </div>
                </div>
                <Badge tone={recipe.can_make ? "good" : "warn"}>{recipe.can_make ? "Available" : "Unavailable"}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Operations Feed" subtitle="Recent jobs, last success, and fast failure visibility.">
          <div className="space-y-3">
            {logs.slice(0, 6).map((job) => (
              <div key={job.id} className="rounded-2xl bg-slatepaper p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold">
                    #{job.id} {job.job_type}
                  </div>
                  <Badge
                    tone={
                      job.status === "completed"
                        ? "good"
                        : job.status === "failed" || job.status === "cancelled"
                          ? "danger"
                          : "warn"
                    }
                  >
                    {job.status}
                  </Badge>
                </div>
                <div className="mt-2 text-sm text-midnight/60">{formatDateTime(job.requested_at)}</div>
                {job.error_message && <div className="mt-2 text-sm text-[#7a2417]">{job.error_message}</div>}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {!!recentFailures.length && (
        <Card title="Recent Failure Watchlist" subtitle="Use this to quickly see what needs attention.">
          <div className="grid gap-4 md:grid-cols-3">
            {recentFailures.map((job) => (
              <div key={job.id} className="rounded-2xl border border-[#d95d39]/25 bg-[#fff2ee] p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-[#7a2417]">#{job.id}</div>
                  <Badge tone="danger">{job.status}</Badge>
                </div>
                <div className="mt-2 text-sm text-[#7a2417]/85">{job.error_message || "No detail provided."}</div>
                <div className="mt-2 text-xs text-[#7a2417]/70">{formatDateTime(job.requested_at)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
