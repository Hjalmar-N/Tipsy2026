import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Variant = "primary" | "secondary";

const variantClasses: Record<Variant, string> = {
  primary: "bg-lime text-ink hover:bg-[#b5f35e]",
  secondary: "bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/15",
};

export function Button({
  children,
  className = "",
  variant = "primary",
  disabled,
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }>) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={`inline-flex min-h-[72px] min-w-[72px] items-center justify-center rounded-3xl px-8 py-5 text-2xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
