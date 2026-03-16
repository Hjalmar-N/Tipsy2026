import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-midnight text-white hover:bg-[#0e2030]",
  secondary: "bg-white text-midnight ring-1 ring-midnight/15 hover:bg-slatepaper",
  danger: "bg-ember text-white hover:bg-[#c74826]",
  ghost: "bg-transparent text-midnight hover:bg-white/60",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  disabled,
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
