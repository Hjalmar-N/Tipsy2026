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
  const [diagMsg, setDiagMsg] = useState<string | null>(null);

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
        if (!recipe) {
          console.log(`[Tipsy Kiosk] ${size} blocked: no recipe selected.`);
          return;
        }
        console.log(`[Tipsy Kiosk] ${size} proceeding: calling onSelectSize for recipe id=${recipe.id}`);
        onSelectSize(recipe, size);
      },
    [onSelectSize, readiness.ready, recipe],
  );

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

  function diagTap(size: OrderSize) {
    const ts = new Date().toLocaleTimeString();
    const msg = `${size} tap @ ${ts} | ready=${readiness.ready}`;
    console.log(`[DIAG] ${msg}`);
    setDiagMsg(msg);
    if (readiness.ready && recipe) {
      console.log(`[DIAG] calling onSelectSize(${recipe.id}, ${size})`);
      onSelectSize(recipe, size);
    }
  }

  return (
    <RoundFrame>
      <div className="flex flex-1 flex-col">
        {/* Swipe area with drink image — unchanged */}
        <div
          className="relative flex shrink-0 flex-col items-center justify-center"
          style={{ minWidth: 0, height: 180 }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onPointerLeave={handlePointerCancel}
        >
          {imageUrl && !imageErrored ? (
            <img
              src={imageUrl}
              alt=""
              className="max-h-[160px] w-auto max-w-[160px] object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
              draggable={false}
              onError={() => setImageErrored(true)}
            />
          ) : (
            <div className="flex h-[120px] w-[120px] items-center justify-center text-5xl font-semibold text-white/40" aria-hidden>
              {recipe.name.slice(0, 1)}
            </div>
          )}
        </div>

        <h2 className="shrink-0 text-center text-base font-medium text-white">{recipe.name}</h2>

        {/* Diagnostic feedback */}
        {diagMsg && (
          <p className="mt-1 shrink-0 text-center text-xs text-lime-400">{diagMsg}</p>
        )}

        {/* DIAGNOSTIC: two large centered tap zones */}
        <div className="mt-2 flex flex-1 flex-row items-stretch justify-center gap-3 px-2">
          <div
            role="button"
            style={{ touchAction: "manipulation", WebkitUserSelect: "none", userSelect: "none" }}
            className="flex flex-1 cursor-none items-center justify-center rounded-2xl border-4 border-green-400 bg-green-400/20 text-xl font-bold text-green-300 active:bg-green-400/50"
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); diagTap("single"); }}
            onTouchStart={(e) => { e.stopPropagation(); }}
          >
            SINGLE
          </div>
          <div
            role="button"
            style={{ touchAction: "manipulation", WebkitUserSelect: "none", userSelect: "none" }}
            className="flex flex-1 cursor-none items-center justify-center rounded-2xl border-4 border-amber-400 bg-amber-400/20 text-xl font-bold text-amber-300 active:bg-amber-400/50"
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); diagTap("double"); }}
            onTouchStart={(e) => { e.stopPropagation(); }}
          >
            DOUBLE
          </div>
        </div>

        {count > 1 && (
          <div className="mt-2 flex shrink-0 justify-center gap-1.5">
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
      </div>
    </RoundFrame>
  );
}
