import { Card } from "../components/Card";
import { ErrorState } from "../components/StatusMessage";
import type { SystemStatus } from "../types";

export function SettingsPage({
  systemStatus,
  error,
}: {
  systemStatus: SystemStatus | null;
  error: { message: string } | null;
}) {
  const backendUrl = import.meta.env.VITE_API_BASE_URL || "/api";

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Card title="Connection" subtitle="Simple MVP settings page for environment visibility.">
        {error && <ErrorState message={error.message} />}
        <div className="space-y-4 text-sm">
          <div className="rounded-2xl bg-slatepaper p-4">
            <div className="text-midnight/55">Backend URL</div>
            <div className="mt-1 font-semibold">{backendUrl}</div>
          </div>
          <div className="rounded-2xl bg-slatepaper p-4">
            <div className="text-midnight/55">Machine mode</div>
            <div className="mt-1 font-semibold">{systemStatus?.hardware_mode ?? "Unknown"}</div>
          </div>
          <div className="rounded-2xl bg-slatepaper p-4">
            <div className="text-midnight/55">Database path</div>
            <div className="mt-1 break-all font-semibold">{systemStatus?.db_path ?? "Unknown"}</div>
          </div>
        </div>
      </Card>

      <Card title="Future Settings" subtitle="Deliberately small for the MVP.">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-midnight/10">
          <p className="font-semibold">Planned next steps</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-midnight/70">
            <li>Persistent backend URL editing and environment profiles.</li>
            <li>Operator authentication and role-aware actions.</li>
            <li>Machine-level maintenance settings for rinse cycles and safety locks.</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
