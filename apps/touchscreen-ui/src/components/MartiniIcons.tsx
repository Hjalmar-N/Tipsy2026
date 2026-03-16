/**
 * White outline martini glass icons for Single / Double. Refined, integrated into circular layout.
 */
export function SingleMartiniIcon({ className = "h-11 w-11" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 44 44"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M10 12l12 20 12-20" />
      <path d="M22 32v8" />
      <path d="M18 40h8" />
    </svg>
  );
}

export function DoubleMartiniIcon({ className = "h-11 w-11" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 44 44"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 12l10 18 10-18" />
      <path d="M16 30v8" />
      <path d="M12 38h8" />
      <path d="M28 12l10 18 10-18" />
      <path d="M38 30v8" />
      <path d="M34 38h8" />
    </svg>
  );
}
