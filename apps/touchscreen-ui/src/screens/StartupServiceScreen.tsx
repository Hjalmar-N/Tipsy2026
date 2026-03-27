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
  onContinue,
}: {
  readiness: MachineReadiness;
  busyAction: ServiceAction;
  feedback: { tone: ServiceMessageTone; text: string } | null;
  onPrime: () => void;
  onClean: () => void;
  onContinue: () => void;
}) {
  const actionsDisabled = busyAction !== null;

  return (
    <RoundFrame>
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <div className="space-y-2">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-white/45">
            Service Start
          </p>
          <h1 className="font-display text-[2rem] leading-none text-white">Prepare the machine</h1>
          <p className="mx-auto max-w-[320px] text-sm leading-relaxed text-white/68">
            Prime or flush the lines before opening drink service, then continue into the customer menu.
          </p>
        </div>

        <div className="w-full rounded-[2rem] border border-white/12 bg-white/8 px-5 py-4 shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
          <div className="flex items-center justify-between gap-4">
            <div className="text-left">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-white/45">
                Machine Status
              </p>
              <p className="mt-1 text-lg font-semibold text-white">{readiness.label}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                readiness.ready ? "bg-lime/90 text-[#0d2434]" : "bg-amber-400/90 text-[#2c1404]"
              }`}
            >
              {readiness.ready ? "Ready" : "Attention"}
            </span>
          </div>
          <p className="mt-3 text-left text-sm leading-relaxed text-white/70">{readiness.detail}</p>
        </div>

        <div className="grid w-full gap-3">
          <ActionButton
            label="Prime all pumps"
            detail="Push fresh liquid through every line before service."
            disabled={actionsDisabled}
            active={busyAction === "prime"}
            onClick={onPrime}
          />
          <ActionButton
            label="Flush / Clean all pumps"
            detail="Run the cleaning cycle through every connected pump."
            disabled={actionsDisabled}
            active={busyAction === "clean"}
            onClick={onClean}
          />
          <button
            type="button"
            onClick={onContinue}
            disabled={actionsDisabled}
            className="min-h-[78px] touch-manipulation rounded-[1.75rem] border border-white/15 bg-white/90 px-6 py-4 text-left text-[#0d2434] shadow-[0_18px_40px_rgba(255,255,255,0.12)] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="block text-[1.2rem] font-semibold">Continue to drinks</span>
            <span className="mt-1 block text-sm text-[#0d2434]/70">Open the drink carousel for guests.</span>
          </button>
        </div>

        <div className="min-h-[52px] w-full">
          {feedback ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm leading-relaxed ${
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
              Service tools stay here until you continue to drinks
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
  onClick,
}: {
  label: string;
  detail: string;
  disabled: boolean;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="min-h-[78px] touch-manipulation rounded-[1.75rem] border border-white/15 bg-white/10 px-6 py-4 text-left text-white shadow-[0_18px_40px_rgba(0,0,0,0.24)] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="block text-[1.2rem] font-semibold">{active ? `${label}...` : label}</span>
      <span className="mt-1 block text-sm leading-relaxed text-white/68">{detail}</span>
    </button>
  );
}
