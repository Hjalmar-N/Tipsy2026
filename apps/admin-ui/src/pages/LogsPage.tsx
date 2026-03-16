import { Badge } from "../components/Badge";
import { Card } from "../components/Card";
import { ErrorState, LoadingState } from "../components/StatusMessage";
import { formatDateTime, formatNumber } from "../lib/format";
import type { PourJob } from "../types";

export function LogsPage({
  logs,
  loading,
  error,
}: {
  logs: PourJob[];
  loading: boolean;
  error: { message: string } | null;
}) {
  if (loading && logs.length === 0) {
    return <LoadingState label="Loading recent logs..." />;
  }

  const lastSuccess = logs.find((job) => job.status === "completed");
  const failureCount = logs.filter((job) => job.status === "failed").length;
  const cancelledCount = logs.filter((job) => job.status === "cancelled").length;

  return (
    <Card title="Recent Backend Logs" subtitle="Operational log stream from GET /logs/recent.">
      {error && <ErrorState message={error.message} />}
      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-slatepaper p-4">
          <div className="text-sm text-midnight/55">Last Success</div>
          <div className="mt-1 font-semibold">{lastSuccess ? formatDateTime(lastSuccess.completed_at || lastSuccess.requested_at) : "No completed jobs"}</div>
        </div>
        <div className="rounded-2xl bg-slatepaper p-4">
          <div className="text-sm text-midnight/55">Failures in Window</div>
          <div className="mt-1 text-3xl font-semibold">{failureCount}</div>
        </div>
        <div className="rounded-2xl bg-slatepaper p-4">
          <div className="text-sm text-midnight/55">Cancelled in Window</div>
          <div className="mt-1 text-3xl font-semibold">{cancelledCount}</div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-midnight/55">
            <tr>
              <th className="pb-3">Job</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Requested</th>
              <th className="pb-3">Completed</th>
              <th className="pb-3">Volume</th>
              <th className="pb-3">Steps</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((job) => (
              <tr key={job.id} className="border-t border-midnight/10 align-top">
                <td className="py-3">
                  <div className="font-semibold">#{job.id}</div>
                  <div className="text-midnight/60">{job.job_type}</div>
                </td>
                <td className="py-3">
                  <Badge
                    tone={
                      job.status === "completed"
                        ? "good"
                        : job.status === "failed" || job.status === "cancelled"
                          ? "danger"
                          : "warn"
                    }
                  >
                    {job.status}
                  </Badge>
                </td>
                <td className="py-3 text-midnight/70">{formatDateTime(job.requested_at)}</td>
                <td className="py-3 text-midnight/70">{formatDateTime(job.completed_at || job.cancelled_at)}</td>
                <td className="py-3 text-midnight/70">{job.target_volume_ml ? `${formatNumber(job.target_volume_ml)} ml` : "n/a"}</td>
                <td className="py-3 text-midnight/70">
                  {job.steps.map((step) => `${step.action} (${formatNumber(step.duration_seconds)}s)`).join(", ") || "No steps"}
                  {job.error_message && <div className="mt-2 text-xs text-[#7a2417]">{job.error_message}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
