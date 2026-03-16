import { useState } from "react";
import { Button } from "../components/Button";
import { KioskShell } from "../components/KioskShell";
import { StatusPill } from "../components/StatusPill";
import type { MachineReadiness, OrderSize, RecipeAvailability } from "../types";

export function DrinkDetailsScreen({
  recipe,
  readiness,
  onBack,
  onStartOrder,
}: {
  recipe: RecipeAvailability;
  readiness: MachineReadiness;
  onBack: () => void;
  onStartOrder: (size: OrderSize) => void;
}) {
  const [size, setSize] = useState<OrderSize>("single");

  const ingredientsLine = recipe.ingredients.map((item) => `${item.ingredient.name} ${item.amount_ml}ml`).join(" · ");

  return (
    <KioskShell
      title={recipe.name}
      subtitle={recipe.description || "Choose size and pour."}
      status={<StatusPill ready={readiness.ready} label={readiness.label} detail={readiness.detail} />}
    >
      <div className="mt-4 flex flex-1 flex-col gap-5">
        <p className="line-clamp-2 text-base text-white/75">{ingredientsLine}</p>

        <div>
          <p className="mb-2 text-sm uppercase tracking-wider text-white/50">Size</p>
          <div className="grid grid-cols-2 gap-3">
            <SizeButton
              active={size === "single"}
              label="Single"
              onClick={() => setSize("single")}
            />
            <SizeButton
              active={size === "double"}
              label="Double"
              onClick={() => setSize("double")}
            />
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-4">
          <Button
            className="w-full"
            onClick={() => onStartOrder(size)}
            disabled={!readiness.ready}
          >
            Start pour
          </Button>
          <Button variant="secondary" className="w-full" onClick={onBack}>
            Back
          </Button>
        </div>
      </div>
    </KioskShell>
  );
}

function SizeButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[72px] touch-manipulation rounded-2xl px-4 py-4 text-center transition ${
        active ? "bg-lime text-ink" : "bg-white/8 text-white ring-1 ring-white/15 active:bg-white/12"
      }`}
    >
      <span className="text-2xl font-semibold">{label}</span>
    </button>
  );
}
