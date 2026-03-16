import { useEffect, useMemo, useState } from "react";
import { RoundFrame } from "../components/RoundFrame";
import { LoadingDots } from "../components/LoadingDots";
import { ProgressRing } from "../components/ProgressRing";
import type { OrderSize, PourJob, RecipeAvailability } from "../types";
import { getDrinkImageUrl } from "../drinkImages";

export function PouringScreen({
  recipe,
  size,
  jobId: _jobId,
  startedAt,
  lastJob,
}: {
  recipe: RecipeAvailability;
  size: OrderSize;
  jobId: number;
  startedAt: number;
  lastJob: PourJob;
}) {
  const [elapsed, setElapsed] = useState(0);
  const imageUrl = getDrinkImageUrl(recipe.name);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setElapsed(Date.now() - startedAt);
    }, 250);
    return () => window.clearInterval(interval);
  }, [startedAt]);

  const totalDurationSeconds = useMemo(() => {
    const sum = lastJob.steps.reduce((acc, step) => acc + step.duration_seconds, 0);
    return sum > 0 ? sum : 1;
  }, [lastJob.steps]);

  const progress = Math.min(96, (elapsed / 1000 / totalDurationSeconds) * 100);

  return (
    <RoundFrame>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        {imageUrl && (
          <img
            src={imageUrl}
            alt=""
            className="max-h-[260px] w-auto max-w-[220px] object-contain object-center drop-shadow-[0_10px_34px_rgba(0,0,0,0.6)]"
            draggable={false}
          />
        )}
        <ProgressRing progress={progress} />
        <h2 className="text-center font-display text-2xl text-white">{recipe.name}</h2>
        <p className="text-lg text-white/75">{size === "single" ? "Single" : "Double"}</p>
        <div className="mt-1 flex items-center gap-2">
          <LoadingDots />
          <span className="text-base text-white/80">Pouring…</span>
        </div>
      </div>
    </RoundFrame>
  );
}
