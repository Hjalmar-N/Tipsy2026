import { useMemo, useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { FieldLabel, SelectInput, TextInput } from "../components/Field";
import { SectionHeading } from "../components/SectionHeading";
import { ErrorState, LoadingState } from "../components/StatusMessage";
import { formatDateTime, formatNumber } from "../lib/format";
import type { Ingredient, Pump, PumpCalibrationPayload } from "../types";

export function CalibrationPage({
  pumps,
  ingredients,
  loading,
  error,
  busyAction,
  onCalibrate,
}: {
  pumps: Pump[];
  ingredients: Ingredient[];
  loading: boolean;
  error: { message: string } | null;
  busyAction: string | null;
  onCalibrate: (id: number, payload: PumpCalibrationPayload) => Promise<unknown>;
}) {
  const [selectedPumpId, setSelectedPumpId] = useState("");
  const [volumeMl, setVolumeMl] = useState("50");
  const [durationSeconds, setDurationSeconds] = useState("5");
  const [localError, setLocalError] = useState<string | null>(null);

  const selectedPump = useMemo(() => pumps.find((pump) => pump.id === Number(selectedPumpId)) ?? null, [pumps, selectedPumpId]);
  const ingredientName = ingredients.find((ingredient) => ingredient.id === selectedPump?.ingredient_id)?.name ?? "No ingredient assigned";

  if (loading && pumps.length === 0) {
    return <LoadingState label="Loading calibration tools..." />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card title="Calibrate Pump" subtitle="Backend formula: duration_seconds = amount_ml / ml_per_second">
        {(error || localError) && <ErrorState message={localError ?? error?.message ?? ""} />}
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!selectedPump) {
              setLocalError("Choose a pump before submitting calibration.");
              return;
            }
            if (Number(volumeMl) <= 0 || Number(durationSeconds) <= 0) {
              setLocalError("Calibration values must be greater than zero.");
              return;
            }
            setLocalError(null);
            void onCalibrate(selectedPump.id, {
              volume_ml: Number(volumeMl),
              duration_seconds: Number(durationSeconds),
            });
          }}
        >
          <div>
            <FieldLabel label="Pump" />
            <SelectInput value={selectedPumpId} onChange={(event) => setSelectedPumpId(event.target.value)}>
              <option value="">Select a pump</option>
              {pumps.map((pump) => (
                <option key={pump.id} value={pump.id}>
                  Pump {pump.id}: {pump.name}
                </option>
              ))}
            </SelectInput>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel label="Measured volume (ml)" hint="The amount the pump actually dispensed." />
              <TextInput type="number" min="0.1" step="0.1" value={volumeMl} onChange={(event) => setVolumeMl(event.target.value)} />
            </div>
            <div>
              <FieldLabel label="Measured duration (seconds)" hint="How long the test run lasted." />
              <TextInput type="number" min="0.1" step="0.1" value={durationSeconds} onChange={(event) => setDurationSeconds(event.target.value)} />
            </div>
          </div>
          <div className="rounded-2xl bg-slatepaper p-4 text-sm text-midnight/75">
            New flow rate preview:{" "}
            <span className="font-semibold">
              {Number(volumeMl) > 0 && Number(durationSeconds) > 0
                ? `${formatNumber(Number(volumeMl) / Number(durationSeconds))} ml/sec`
                : "Enter both values"}
            </span>
          </div>
          <Button type="submit" disabled={!selectedPump || busyAction === `calibrate-pump-${selectedPump?.id ?? ""}`}>
            {busyAction === `calibrate-pump-${selectedPump?.id ?? ""}` ? "Saving..." : "Submit Calibration"}
          </Button>
        </form>
      </Card>

      <Card title="Calibration Notes" subtitle="Use measured output to improve recipe timing accuracy.">
        {selectedPump ? (
          <div className="space-y-4">
            <SectionHeading
              eyebrow="Operator Guide"
              title="Simple calibration flow"
              detail="Run a measured test, enter the actual dispensed amount and the duration, then save. The backend stores ml/sec per pump."
            />
            <div className="rounded-2xl bg-slatepaper p-4">
              <div className="text-sm text-midnight/55">Selected pump</div>
              <div className="mt-1 text-lg font-semibold">
                Pump {selectedPump.id}: {selectedPump.name}
              </div>
              <div className="mt-2 text-sm text-midnight/65">Ingredient: {ingredientName}</div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slatepaper p-4">
                <div className="text-sm text-midnight/55">Current ml/sec</div>
                <div className="mt-1 text-xl font-semibold">{formatNumber(selectedPump.ml_per_second)}</div>
              </div>
              <div className="rounded-2xl bg-slatepaper p-4">
                <div className="text-sm text-midnight/55">Last calibrated</div>
                <div className="mt-1 text-xl font-semibold">{formatDateTime(selectedPump.last_calibrated_at)}</div>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-midnight/10">
              <p className="font-semibold">How this works</p>
              <p className="mt-2 text-sm text-midnight/70">
                The backend stores calibration per pump. If a pump dispenses 50 ml in 5 seconds, its flow rate becomes 10 ml/sec.
                Future order durations use that value directly.
              </p>
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-midnight/70">
                <li>Prime the line if needed.</li>
                <li>Run a measured test into a marked container.</li>
                <li>Enter the real dispensed volume and elapsed time.</li>
                <li>Save and confirm the updated ml/sec value.</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-slatepaper p-6 text-sm text-midnight/65">
            Select a pump to view its current calibration details and submit a new measured flow rate.
          </div>
        )}
      </Card>
    </div>
  );
}
