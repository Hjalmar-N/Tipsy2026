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

  const handleSizeTap = useCallback(
    (size: OrderSize) =>
      (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        console.log(`[Tipsy Kiosk] ${size} tapped. readiness.ready=${readiness.ready}`);
        if (!readiness.ready) {
          console.log(`[Tipsy Kiosk] ${size} blocked: machine not ready.`);
          return;
        }
        console.log(`[Tipsy Kiosk] ${size} proceeding: calling onSelectSize for recipe id=${recipe.id}`);
        onSelectSize(recipe, size);
      },
    [onSelectSize, readiness.ready, recipe],
  );

  return (
      <RoundFrame>
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-row items-center justify-center gap-1">
          {/* Single: left, white outline martini + label */}
          <button
            type="button"
            onPointerDown={handleSizeTap("single")}
            className={`flex min-h-[100px] min-w-[80px] flex-1 max-w-[110px] touch-manipulation flex-col items-center justify-center gap-1.5 text-white/95 transition active:opacity-90 ${
              readiness.ready ? "" : "opacity-40"
            }`}
            aria-label="Single"
          >
            <SingleMartiniIcon className="h-11 w-11 shrink-0" />
            <span className="text-xs font-medium uppercase tracking-widest">single</span>
          </button>

          {/* Central drink: main gesture surface for horizontal swipes */}
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
                className="max-h-[420px] w-auto max-w-[360px] object-contain object-center drop-shadow-[0_12px_40px_rgba(0,0,0,0.65)]"
                draggable={false}
                onError={() => setImageErrored(true)}
              />
            ) : (
              <div
                className="flex h-[220px] w-[180px] items-center justify-center text-6xl font-semibold text-white/40"
                aria-hidden
              >
                {recipe.name.slice(0, 1)}
              </div>
            )}
          </div>

          {/* Double: right, two martini glasses + label */}
          <button
            type="button"
            onPointerDown={handleSizeTap("double")}
            className={`flex min-h-[100px] min-w-[80px] flex-1 max-w-[110px] touch-manipulation flex-col items-center justify-center gap-1.5 text-white/95 transition active:opacity-90 ${
              readiness.ready ? "" : "opacity-40"
            }`}
            aria-label="Double"
          >
            <DoubleMartiniIcon className="h-11 w-11 shrink-0" />
            <span className="text-xs font-medium uppercase tracking-widest">Double</span>
          </button>
        </div>

        {/* Drink name: one clean name per recipe */}
        <h2 className="mt-3 shrink-0 text-center font-body text-lg font-medium tracking-tight text-white">
          {recipe.name}
        </h2>

        {count > 1 && (
          <div className="mt-2.5 flex justify-center gap-1.5">
            {Array.from({ length: count }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Drink ${i + 1} of ${count}`}
                className={`h-1.5 w-1.5 touch-manipulation rounded-full transition ${
                  i === currentIndex ? "bg-white/90 scale-125" : "bg-white/3"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </RoundFrame>
  );
}
