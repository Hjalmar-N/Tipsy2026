import { Button } from "./Button";
import type { AppNotice } from "../types";

export function TopHeader({
  title,
  notice,
  onDismissNotice,
  onRefresh,
  loading,
}: {
  title: string;
  notice: AppNotice | null;
  onDismissNotice: () => void;
  onRefresh: () => void;
  loading: boolean;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-midnight/10 bg-slatepaper/95 px-4 py-4 backdrop-blur md:px-6 xl:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-midnight/45">Admin Console</p>
          <h2 className="mt-1 font-display text-4xl">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={onRefresh} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh Data"}
          </Button>
        </div>
      </div>
      {notice && (
        <div
          className={`mt-4 flex items-center justify-between rounded-2xl px-4 py-3 text-sm ${
            notice.kind === "success" ? "bg-[#d8f4d5] text-[#1f5b29]" : "bg-[#fde1db] text-[#7a2417]"
          }`}
        >
          <span>{notice.message}</span>
          <button type="button" className="font-semibold" onClick={onDismissNotice}>
            Dismiss
          </button>
        </div>
      )}
    </header>
  );
}
