import type { ReactNode } from "react";

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" | "danger" }) {
  const toneClass =
    tone === "good"
      ? "bg-[#d8f4d5] text-[#1f5b29]"
      : tone === "warn"
        ? "bg-[#fff0c7] text-[#7b5c00]"
        : tone === "danger"
          ? "bg-[#fde1db] text-[#7a2417]"
          : "bg-midnight/8 text-midnight/75";
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}>{children}</span>;
}
