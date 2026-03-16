import { useEffect, useRef, useState } from "react";
import { RoundFrame } from "../components/RoundFrame";

export function ErrorScreen({
  title,
  detail,
  timeoutMs,
  onBackHome,
}: {
  title: string;
  detail: string;
  timeoutMs: number;
  onBackHome: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(Math.max(1, Math.ceil(timeoutMs / 1000)));
  const onBackHomeRef = useRef(onBackHome);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  onBackHomeRef.current = onBackHome;

  useEffect(() => {
    setSecondsLeft(Math.max(1, Math.ceil(timeoutMs / 1000)));
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((c) => {
        if (c <= 1) {
          onBackHomeRef.current();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timeoutMs]);

  return (
    <RoundFrame>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <h2 className="font-display text-xl text-white">{title}</h2>
        <p className="line-clamp-3 text-sm leading-relaxed text-white/75">{detail}</p>
        <p className="text-xs text-white/50">Home in {secondsLeft}s</p>
        <button
          type="button"
          onClick={onBackHome}
          className="min-h-[64px] touch-manipulation rounded-2xl bg-white/15 px-8 py-4 text-lg font-semibold text-white active:bg-white/25"
        >
          Back to home
        </button>
      </div>
    </RoundFrame>
  );
}
