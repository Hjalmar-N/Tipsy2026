import { useEffect, useRef, useState } from "react";
import { RoundFrame } from "../components/RoundFrame";
import type { OrderSize, RecipeAvailability } from "../types";
import { getDrinkImageUrl } from "../drinkImages";

export function SuccessScreen({
  recipe,
  size,
  timeoutMs,
  onDone,
}: {
  recipe: RecipeAvailability;
  size: OrderSize;
  timeoutMs: number;
  onDone: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(Math.max(1, Math.ceil(timeoutMs / 1000)));
  const onDoneRef = useRef(onDone);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const imageUrl = getDrinkImageUrl(recipe.name);
  onDoneRef.current = onDone;

  useEffect(() => {
    setSecondsLeft(Math.max(1, Math.ceil(timeoutMs / 1000)));
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((c) => {
        if (c <= 1) {
          onDoneRef.current();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timeoutMs]);

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
        <p className="font-display text-2xl text-lime">{recipe.name}</p>
        <p className="text-lg text-white/80">{size === "single" ? "Single" : "Double"} — done</p>
        <p className="text-sm text-white/55">Home in {secondsLeft}s</p>
        <button
          type="button"
          onClick={onDone}
          className="min-h-[64px] touch-manipulation rounded-2xl bg-lime px-8 py-4 text-xl font-semibold text-[#0d2434] active:bg-lime/90"
        >
          Back to home
        </button>
      </div>
    </RoundFrame>
  );
}
