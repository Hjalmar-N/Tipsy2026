import { useMemo, useState } from "react";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { FieldLabel, SelectInput, TextInput } from "../components/Field";
import { ErrorState, LoadingState } from "../components/StatusMessage";
import { formatNumber } from "../lib/format";
import type { Pump, PumpBatchPayload } from "../types";

export function ManualControlPage({
  pumps,
  loading,
  error,
  busyAction,
  onRunPump,
  onPrime,
  onClean,
  onStop,
}: {
  pumps: Pump[];
  loading: boolean;
  error: { message: string } | null;
  busyAction: string | null;
  onRunPump: (pumpId: number, volumeMl: number) => Promise<unknown>;
  onPrime: (payload: PumpBatchPayload) => Promise<unknown>;
  onClean: (payload: PumpBatchPayload) => Promise<unknown>;
  onStop: () => Promise<unknown>;
}) {
  const [selectedPumpId, setSelectedPumpId] = useState("");
  const [manualDuration, setManualDuration] = useState("2");
  const [servicePumpId, setServicePumpId] = useState("");
  const [serviceDuration, setServiceDuration] = useState("3");

  const selectedPump = useMemo(() => pumps.find((pump) => pump.id === Number(selectedPumpId)) ?? null, [pumps, selectedPumpId]);
  const selectedServicePumpId = servicePumpId ? Number(servicePumpId) : undefined;
  const volumeMl = selectedPump && Number(manualDuration) > 0 ? selectedPump.ml_per_second * Number(manualDuration) : 0;

  if (loading && pumps.length === 0) {
    return <LoadingState label="Loading manual controls..." />;
  }

  return (
    <div className="space-y-6">
      {error && <ErrorState message={error.message} />}
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card title="Manual Pump Run" subtitle="The backend expects volume_ml, so this form converts your chosen duration using the pump's current ml/sec.">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!selectedPump || volumeMl <= 0) {
                return;
              }
              void onRunPump(selectedPump.id, volumeMl);
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
            <div>
              <FieldLabel label="Desired duration (seconds)" />
              <TextInput type="number" min="0.1" step="0.1" value={manualDuration} onChange={(event) => setManualDuration(event.target.value)} />
            </div>
            <div className="rounded-2xl bg-slatepaper p-4 text-sm text-midnight/75">
              {selectedPump ? (
                <>
                  <div>Current flow rate: {formatNumber(selectedPump.ml_per_second)} ml/sec</div>
                  <div className="mt-2 font-semibold">Calculated run volume: {formatNumber(volumeMl)} ml</div>
                </>
              ) : (
                "Choose a pump to calculate manual run volume."
              )}
            </div>
            <Button type="submit" disabled={!selectedPump || volumeMl <= 0 || busyAction === `run-pump-${selectedPump?.id ?? ""}`}>
              {busyAction === `run-pump-${selectedPump?.id ?? ""}` ? "Running..." : "Run Pump"}
            </Button>
          </form>
        </Card>

        <Card title="Service Actions" subtitle="Prime or clean a single selected pump, or leave selection blank and use the dashboard to affect all enabled pumps.">
          <div className="space-y-4">
            <div>
              <FieldLabel label="Pump selection" hint="Optional for service operations." />
              <SelectInput value={servicePumpId} onChange={(event) => setServicePumpId(event.target.value)}>
                <option value="">Choose a single pump</option>
                {pumps.map((pump) => (
                  <option key={pump.id} value={pump.id}>
                    Pump {pump.id}: {pump.name}
                  </option>
                ))}
              </SelectInput>
            </div>
            <div>
              <FieldLabel label="Duration (seconds)" />
              <TextInput type="number" min="0.1" step="0.1" value={serviceDuration} onChange={(event) => setServiceDuration(event.target.value)} />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() =>
                  void onPrime({
                    duration_seconds: Number(serviceDuration),
                    pump_ids: selectedServicePumpId ? [selectedServicePumpId] : undefined,
                  })
                }
                disabled={busyAction === "prime-selected"}
              >
                {busyAction === "prime-selected" ? "Starting..." : "Prime Selected"}
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  void onClean({
                    duration_seconds: Number(serviceDuration),
                    pump_ids: selectedServicePumpId ? [selectedServicePumpId] : undefined,
                  })
                }
                disabled={busyAction === "clean-selected"}
              >
                {busyAction === "clean-selected" ? "Starting..." : "Clean Selected"}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Emergency Stop" subtitle="This is a dangerous-action control and should be used to halt the machine immediately.">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm text-midnight/65">The backend will trigger `POST /pumps/stop` and record a stop job in the logs.</div>
            <div className="mt-3">
              <Badge tone="danger">Dangerous Action</Badge>
            </div>
          </div>
          <Button variant="danger" className="min-w-56 py-4 text-base" onClick={() => void onStop()} disabled={busyAction === "manual-stop"}>
            {busyAction === "manual-stop" ? "Stopping..." : "Emergency Stop"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
