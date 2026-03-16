import { useCallback, useEffect, useState } from "react";
import { RoundFrame } from "../components/RoundFrame";
import { SingleMartiniIcon, DoubleMartiniIcon } from "../components/MartiniIcons";
import type { KioskError, MachineReadiness, OrderSize, RecipeAvailability } from "../types";
import { getDrinkImageUrl } from "../drinkImages";

const SWIPE_THRESHOLD_PX = 50;

export function CarouselScreen({
  loading,
  error,
  recipes,
  readiness,
  onSelectSize,
  onRetry,
}: {
  title: string;
  loading: boolean;
  error: KioskError | null;
  recipes: RecipeAvailability[];
  readiness: MachineReadiness;
  onSelectSize: (recipe: RecipeAvailability, size: OrderSize) => void;
  onRetry: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [pointerStartX, setPointerStartX] = useState<number | null>(null);
  const [imageErrored, setImageErrored] = useState(false);

  const count = recipes.length;
  const currentIndex = count === 0 ? 0 : ((index % count) + count) % count;
  const recipe = recipes[currentIndex] ?? null;

  useEffect(() => {
    // Reset hero image error state whenever the visible recipe changes.
    setImageErrored(false);
  }, [recipe?.name]);

  const goPrev = useCallback(() => {
    if (count <= 1) return;
    setIndex((i) => i - 1);
  }, [count]);

  const goNext = useCallback(() => {
    if (count <= 1) return;
    setIndex((i) => i + 1);
  }, [count]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    setPointerStartX(e.clientX);
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const startX = pointerStartX;
      setPointerStartX(null);
      if (startX == null || count <= 1) return;
      const delta = startX - e.clientX;
      if (delta > SWIPE_THRESHOLD_PX) goNext();
      else if (delta < -SWIPE_THRESHOLD_PX) goPrev();
    },
    [pointerStartX, count, goNext, goPrev],
  );

  const handlePointerCancel = useCallback(() => {
    setPointerStartX(null);
  }, []);

  if (error) {
    return (
      <RoundFrame>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-xl text-white/90">Machine not ready</p>
          <p className="max-w-[260px] text-sm leading-snug text-white/65">{error.message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="min-h-[56px] touch-manipulation rounded-2xl bg-white/15 px-6 py-3 text-base font-semibold text-white active:bg-white/25"
          >
            Back to home
          </button>
        </div>
      </RoundFrame>
    );
  }

  if (loading && recipes.length === 0) {
    return (
      <RoundFrame>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-xl text-white/85">Waking up…</p>
        </div>
      </RoundFrame>
    );
  }

  if (!loading && recipes.length === 0) {
    return (
      <RoundFrame>
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <p className="text-xl text-white/90">No drinks ready</p>
          <p className="text-sm text-white/60">Ask an operator or tap to retry.</p>
          <button
            type="button"
            onClick={onRetry}
            className="min-h-[56px] touch-manipulation rounded-2xl bg-white/15 px-6 py-3 text-base font-semibold text-white active:bg-white/25"
          >
            Retry
          </button>
        </div>
      </RoundFrame>
    );
  }

  if (!recipe) return null;

  const imageUrl = getDrinkImageUrl(recipe.name);

  function handleSizePointerDown(size: OrderSize, e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!readiness.ready || !recipe) return;
    onSelectSize(recipe, size);
  }

  return (
    <RoundFrame>
      <div className="flex flex-1 flex-col">
        {/* Swipe surface: central drink image */}
        <div
          className="relative flex flex-1 flex-col items-center justify-center"
          style={{ minWidth: 0 }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onPointerLeave={handlePointerCancel}
        >
          {imageUrl && !imageErrored ? (
            <img
              src={imageUrl}
              alt=""
              className="h-auto max-h-full w-auto max-w-full object-contain object-center drop-shadow-[0_12px_40px_rgba(0,0,0,0.65)]"
              draggable={false}
              onError={() => setImageErrored(true)}
            />
          ) : (
            <div className="flex h-[200px] w-[200px] items-center justify-center text-7xl font-semibold text-white/40" aria-hidden>
              {recipe.name.slice(0, 1)}
            </div>
          )}
        </div>

        {/* Drink name */}
        <h2 className="shrink-0 text-center font-body text-base font-medium tracking-tight text-white">
          {recipe.name}
        </h2>

        {count > 1 && (
          <div className="mt-1 flex shrink-0 justify-center gap-1.5">
            {Array.from({ length: count }, (_, i) => (
              <span
                key={i}
                role="button"
                onClick={() => setIndex(i)}
                className={`h-1.5 w-1.5 rounded-full transition ${
                  i === currentIndex ? "bg-white/90 scale-125" : "bg-white/30"
                }`}
              />
            ))}
          </div>
        )}

        {/* Size controls: centered below drink, constrained to safe width */}
        <div className="mx-auto mt-2 flex w-full max-w-[272px] shrink-0 flex-row items-center justify-center gap-3">
          <div
            role="button"
            aria-label="Single"
            style={{ touchAction: "manipulation" }}
            className={`flex h-[64px] w-[120px] touch-manipulation flex-col items-center justify-center gap-1 rounded-2xl border border-white/20 bg-white/10 transition active:bg-white/25 ${
              readiness.ready ? "" : "opacity-40"
            }`}
            onPointerDown={(e) => handleSizePointerDown("single", e)}
          >
            <SingleMartiniIcon className="h-7 w-7 shrink-0 text-white/90" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/80">Single</span>
          </div>
          <div
            role="button"
            aria-label="Double"
            style={{ touchAction: "manipulation" }}
            className={`flex h-[64px] w-[120px] touch-manipulation flex-col items-center justify-center gap-1 rounded-2xl border border-white/20 bg-white/10 transition active:bg-white/25 ${
              readiness.ready ? "" : "opacity-40"
            }`}
            onPointerDown={(e) => handleSizePointerDown("double", e)}
          >
            <DoubleMartiniIcon className="h-7 w-7 shrink-0 text-white/90" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/80">Double</span>
          </div>
        </div>
      </div>
    </RoundFrame>
  );
}
