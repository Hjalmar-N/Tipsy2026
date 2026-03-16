import type { PropsWithChildren } from "react";

export function Card({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return <div className={`rounded-2xl bg-white/8 p-5 shadow-xl ring-1 ring-white/10 backdrop-blur ${className}`}>{children}</div>;
}
