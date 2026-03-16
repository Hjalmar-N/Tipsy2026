import type { PropsWithChildren } from "react";

/**
 * Circular kiosk frame: physical metallic gold ring, crisp white inner outline,
 * strong orange-gold backlit glow from edges fading to dark center.
 *
 * The decorative layers (ring, outline, glow) are all rounded-full with
 * overflow-hidden so nothing visually escapes the circle.  The innermost
 * content wrapper is a *rectangular* safe area sized to the inscribed
 * rectangle of the inner circle, so children never bleed behind the ring.
 */
export function RoundFrame({ children }: PropsWithChildren) {
  return (
    <div
      className="round-frame-outer flex aspect-square w-full max-w-[704px] flex-col overflow-hidden rounded-full p-[10px]"
      style={{
        background: "linear-gradient(160deg, #e8c878 0%, #d4a040 20%, #b87828 45%, #985220 55%, #c09038 80%, #e0b860 100%)",
        boxShadow: "0 6px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -2px 0 rgba(0,0,0,0.2)",
        minHeight: 0,
      }}
    >
      {/* Crisp white inner outline just inside the gold ring */}
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-full"
        style={{
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.92)",
          minHeight: 0,
        }}
      >
        {/* Orange-gold aura from edges fading to dark center (backlit halo) */}
        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-full"
          style={{
            background: "radial-gradient(circle at 50% 50%, #060504 0%, #0a0706 22%, #140b08 45%, rgba(50,22,10,0.97) 70%, rgba(120,50,18,0.5) 88%, rgba(200,90,35,0.2) 97%, rgba(230,120,45,0.12) 100%)",
            minHeight: 0,
          }}
        >
          {/*
           * Rectangular safe area inscribed inside the inner circle.
           * 71% width ≈ D/√2 keeps content inside the circle at all Y positions.
           * Top/bottom padding keeps the header and controls away from the
           * narrow chord regions at the very top/bottom of the circle.
           */}
          <div className="flex min-h-0 flex-1 flex-col items-center overflow-hidden" style={{ minHeight: 0 }}>
            <div
              className="flex min-h-0 w-[71%] max-w-[480px] flex-1 flex-col pt-6 pb-4"
              style={{ minHeight: 0 }}
            >
              <div className="shrink-0 text-center">
                <span className="font-tipsy text-[1.65rem] font-bold tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                  Tipsy
                </span>
              </div>
              <div className="flex min-h-0 flex-1 flex-col pt-1">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
