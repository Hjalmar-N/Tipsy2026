import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="mb-1">
      <label className="text-sm font-semibold text-midnight">{label}</label>
      {hint && <p className="mt-0.5 text-xs text-midnight/60">{hint}</p>}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-midnight/15 bg-white px-3 py-2 text-sm outline-none transition focus:border-midnight ${props.className ?? ""}`}
    />
  );
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl border border-midnight/15 bg-white px-3 py-2 text-sm outline-none transition focus:border-midnight ${props.className ?? ""}`}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl border border-midnight/15 bg-white px-3 py-2 text-sm outline-none transition focus:border-midnight ${props.className ?? ""}`}
    />
  );
}
