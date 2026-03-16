import type { PropsWithChildren, ReactNode } from "react";

export function KioskShell({
  title,
  subtitle,
  status,
  footer,
  children,
}: PropsWithChildren<{
  title: string;
  subtitle: string;
  status: ReactNode;
  footer?: ReactNode;
}>) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="shrink-0 rounded-2xl border border-white/10 bg-white/6 p-4 shadow-xl backdrop-blur">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="min-w-0 flex-1 font-display text-2xl leading-tight text-white">{title}</h1>
            <div className="shrink-0">{status}</div>
          </div>
          {subtitle && <p className="line-clamp-2 text-base text-white/72">{subtitle}</p>}
        </div>
      </header>
      <section className="flex min-h-0 flex-1 flex-col overflow-auto">{children}</section>
      {footer && <footer className="mt-3 shrink-0 text-center text-sm text-white/50">{footer}</footer>}
    </div>
  );
}
