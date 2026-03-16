import type { PropsWithChildren, ReactNode } from "react";

interface CardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function Card({ title, subtitle, action, className = "", children }: PropsWithChildren<CardProps>) {
  return (
    <section className={`rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-midnight/10 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="font-display text-2xl">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm text-midnight/65">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
