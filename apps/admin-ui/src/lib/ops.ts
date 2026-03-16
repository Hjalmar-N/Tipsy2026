import type { PourJob } from "../types";

export function getLastSuccessfulOrder(logs: PourJob[]) {
  return logs.find((job) => job.job_type === "order" && job.status === "completed") ?? null;
}

export function getRecentFailures(logs: PourJob[]) {
  return logs.filter((job) => job.status === "failed" || job.status === "cancelled");
}
