import { useState } from "react";
import { DrinkCard } from "../components/DrinkCard";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { KioskShell } from "../components/KioskShell";
import { StatusPill } from "../components/StatusPill";
import type { KioskError, MachineReadiness, RecipeAvailability, SystemStatus } from "../types";

const DRINKS_PER_PAGE = 2;

export function HomeScreen({
  title,
  subtitle,
  loading,
  error,
  recipes,
  systemStatus,
  readiness,
  featuredRecipeId,
  attractLine,
  onSelectDrink,
  onRetry,
}: {
  title: string;
  subtitle: string;
  loading: boolean;
  error: KioskError | null;
  recipes: RecipeAvailability[];
  systemStatus: SystemStatus | null;
  readiness: MachineReadiness;
  featuredRecipeId: number | null;
  attractLine: string;
  onSelectDrink: (recipeId: number) => void;
  onRetry: () => void;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(recipes.length / DRINKS_PER_PAGE));
  const currentPage = totalPages === 0 ? 0 : page % totalPages;
  const pageRecipes = recipes.slice(currentPage * DRINKS_PER_PAGE, currentPage * DRINKS_PER_PAGE + DRINKS_PER_PAGE);
  const hasMultiplePages = recipes.length > DRINKS_PER_PAGE;

  return (
    <KioskShell
      title={title}
      subtitle={attractLine}
      status={<StatusPill ready={readiness.ready} label={readiness.label} detail={readiness.detail} />}
      footer={recipes.length > 0 ? `${recipes.length} drinks · Tap to choose` : undefined}
    >
      {error && (
        <Card className="mt-4 bg-[#522017]/90">
          <div className="text-lg font-semibold text-white">Unable to load drinks</div>
          <p className="mt-2 text-base text-white/80">{error.message}</p>
          <Button variant="secondary" className="mt-4 w-full" onClick={onRetry}>
            Retry
          </Button>
        </Card>
      )}

      {loading && recipes.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="text-center">
            <div className="text-2xl font-semibold text-white">Loading...</div>
            <p className="mt-2 text-base text-white/65">Checking recipe availability.</p>
          </div>
        </div>
      ) : recipes.length > 0 ? (
        <div className="mt-4 flex flex-1 flex-col gap-4">
          <div className="flex flex-col gap-4">
            {pageRecipes.map((recipe) => (
              <DrinkCard
                key={recipe.id}
                recipe={recipe}
                featured={recipe.id === featuredRecipeId}
                onSelect={() => onSelectDrink(recipe.id)}
              />
            ))}
          </div>
          {hasMultiplePages && (
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setPage((p) => (p - 1 + totalPages) % totalPages)}
              >
                Previous
              </Button>
              <Button className="flex-1" onClick={() => setPage((p) => (p + 1) % totalPages)}>
                More drinks
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center py-6">
          <Card className="w-full border border-white/10 text-center">
            <h2 className="font-display text-2xl text-white">No drinks ready</h2>
            <p className="mt-3 text-lg leading-relaxed text-white/72">
              Machine is waiting for ingredients. Ask an operator or tap below to refresh.
            </p>
            <Button variant="secondary" className="mt-6 w-full" onClick={onRetry}>
              Refresh
            </Button>
          </Card>
        </div>
      )}
    </KioskShell>
  );
}
