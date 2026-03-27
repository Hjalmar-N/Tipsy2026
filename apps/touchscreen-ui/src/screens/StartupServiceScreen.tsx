import { RoundFrame } from "../components/RoundFrame";
import type { MachineReadiness } from "../types";

type ServiceAction = "prime" | "clean" | null;
type ServiceMessageTone = "success" | "error" | "info";

export function StartupServiceScreen({
  readiness,
  busyAction,
  feedback,
  onPrime,
  onClean,
  onDrinks,
}: {
  readiness: MachineReadiness;
  busyAction: ServiceAction;
  feedback: { tone: ServiceMessageTone; text: string } | null;
  onPrime: () => void;
  onClean: () => void;
  onDrinks: () => void;
}) {
  const actionsDisabled = busyAction !== null;

  return (
    <RoundFrame>
      <div className="flex flex-1 flex-col items-center justify-between py-1 text-center">
        <div className="space-y-2">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-white/42">
            Startup Service
          </p>
          <h1 className="font-display text-[1.75rem] leading-none text-white">Machine prep</h1>
        </div>

        <div className="w-full rounded-[1.8rem] border border-white/12 bg-white/8 px-4 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-left text-base font-semibold text-white">{readiness.label}</p>
            <span
              className={`rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] ${
                readiness.ready ? "bg-lime/90 text-[#0d2434]" : "bg-amber-400/90 text-[#2c1404]"
              }`}
            >
              {readiness.ready ? "Ready" : "Attention"}
            </span>
          </div>
          <p className="mt-2 text-left text-[0.84rem] leading-relaxed text-white/68">{readiness.detail}</p>
        </div>

        <div className="grid w-full gap-3">
          <ActionButton
            label="Drinks"
            detail="Open the customer menu."
            disabled={actionsDisabled}
            active={false}
            accent="light"
            onClick={onDrinks}
          />
          <ActionButton
            label="Prime"
            detail="Run all pumps for 5 seconds."
            disabled={actionsDisabled}
            active={busyAction === "prime"}
            accent="default"
            onClick={onPrime}
          />
          <ActionButton
            label="Flush"
            detail="Run clean mode for 10 seconds."
            disabled={actionsDisabled}
            active={busyAction === "clean"}
            accent="default"
            onClick={onClean}
          />
        </div>

        <div className="min-h-[48px] w-full">
          {feedback ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-[0.84rem] leading-relaxed ${
                feedback.tone === "success"
                  ? "border-lime/35 bg-lime/12 text-lime"
                  : feedback.tone === "error"
                    ? "border-rose-400/30 bg-rose-500/12 text-rose-100"
                    : "border-white/15 bg-white/8 text-white/75"
              }`}
            >
              {feedback.text}
            </div>
          ) : (
            <p className="px-2 text-xs uppercase tracking-[0.24em] text-white/35">
              Prime or flush first, then tap drinks when ready
            </p>
          )}
        </div>
      </div>
    </RoundFrame>
  );
}

function ActionButton({
  label,
  detail,
  disabled,
  active,
  accent,
  onClick,
}: {
  label: string;
  detail: string;
  disabled: boolean;
  active: boolean;
  accent: "default" | "light";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[72px] touch-manipulation rounded-[1.65rem] border px-5 py-3.5 text-left shadow-[0_18px_40px_rgba(0,0,0,0.24)] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${
        accent === "light"
          ? "border-white/18 bg-white/88 text-[#0d2434]"
          : "border-white/15 bg-white/10 text-white"
      }`}
    >
      <span className="block text-[1.15rem] font-semibold">{active ? `${label}...` : label}</span>
      <span className={`mt-1 block text-[0.84rem] leading-relaxed ${accent === "light" ? "text-[#0d2434]/70" : "text-white/68"}`}>
        {detail}
      </span>
    </button>
  );
}
