import { useMemo } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { FieldLabel, SelectInput, TextInput } from "../components/Field";
import { ErrorState, LoadingState } from "../components/StatusMessage";
import { formatDateTime, formatNumber } from "../lib/format";
import type { Ingredient, Pump, PumpPayload } from "../types";

export function PumpsPage({
  pumps,
  ingredients,
  loading,
  error,
  busyAction,
  onUpdate,
}: {
  pumps: Pump[];
  ingredients: Ingredient[];
  loading: boolean;
  error: { message: string } | null;
  busyAction: string | null;
  onUpdate: (id: number, payload: PumpPayload) => Promise<unknown>;
}) {
  const ingredientMap = useMemo(() => new Map(ingredients.map((ingredient) => [ingredient.id, ingredient.name])), [ingredients]);

  if (loading && pumps.length === 0) {
    return <LoadingState label="Loading pumps..." />;
  }

  return (
    <Card title="Pump Configuration" subtitle="Assign ingredients, update flow rates, and manage enabled state.">
      {error && <ErrorState message={error.message} />}
      <div className="space-y-4">
        {pumps.map((pump) => (
          <form
            key={pump.id}
            className="grid gap-4 rounded-[1.5rem] bg-slatepaper p-4 xl:grid-cols-[1.1fr_1fr_1fr_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const ingredientIdValue = formData.get("ingredient_id")?.toString() ?? "";
              const gpioPinValue = formData.get("gpio_pin")?.toString() ?? "";
              void onUpdate(pump.id, {
                name: formData.get("name")?.toString() ?? pump.name,
                gpio_pin: gpioPinValue ? Number(gpioPinValue) : null,
                ingredient_id: ingredientIdValue ? Number(ingredientIdValue) : null,
                enabled: formData.get("enabled") === "on",
                ml_per_second: Number(formData.get("ml_per_second")),
              });
            }}
          >
            <div>
              <FieldLabel label={`Pump ${pump.id}`} hint={`Last calibrated ${formatDateTime(pump.last_calibrated_at)}`} />
              <TextInput name="name" defaultValue={pump.name} />
              <div className="mt-2 text-xs text-midnight/60">
                Assigned ingredient: {pump.ingredient_id ? ingredientMap.get(pump.ingredient_id) : "Unassigned"}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <div>
                <FieldLabel label="Ingredient" />
                <SelectInput name="ingredient_id" defaultValue={pump.ingredient_id?.toString() ?? ""}>
                  <option value="">Unassigned</option>
                  {ingredients.map((ingredient) => (
                    <option key={ingredient.id} value={ingredient.id}>
                      {ingredient.name}
                    </option>
                  ))}
                </SelectInput>
              </div>
              <label className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 text-sm font-semibold">
                <input type="checkbox" name="enabled" defaultChecked={pump.enabled} />
                Pump enabled
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel label="GPIO Pin" />
                <TextInput name="gpio_pin" type="number" defaultValue={pump.gpio_pin ?? ""} />
              </div>
              <div>
                <FieldLabel label="ml / second" hint={`Current: ${formatNumber(pump.ml_per_second)}`} />
                <TextInput name="ml_per_second" type="number" min="0.01" step="0.01" defaultValue={pump.ml_per_second} />
              </div>
            </div>
            <div className="flex items-end justify-end">
              <Button type="submit" disabled={busyAction === `update-pump-${pump.id}`}>
                {busyAction === `update-pump-${pump.id}` ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        ))}
      </div>
    </Card>
  );
}
