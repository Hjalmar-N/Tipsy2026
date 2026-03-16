export function StatusPill({
  ready,
  label,
  detail,
}: {
  ready: boolean;
  label?: string;
  detail?: string;
}) {
  return (
    <div className={`rounded-xl px-4 py-3 shadow-lg ${ready ? "bg-[#d0ff9e] text-[#18310d]" : "bg-[#ffddd6] text-[#6d2316]"}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-80">{label ?? (ready ? "Ready" : "Busy")}</div>
      {detail && <div className="mt-0.5 max-w-[140px] truncate text-xs opacity-90">{detail}</div>}
    </div>
  );
}
