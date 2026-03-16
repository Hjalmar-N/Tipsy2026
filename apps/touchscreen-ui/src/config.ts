export const kioskConfig = {
  titleText: import.meta.env.VITE_KIOSK_TITLE?.trim() || "Tipsy Kiosk",
  subtitleText: import.meta.env.VITE_KIOSK_SUBTITLE?.trim() || "Fresh cocktails, one touch away.",
  autoRefreshMs: Number(import.meta.env.VITE_KIOSK_AUTO_REFRESH_MS || "5000"),
  orderPollMs: Number(import.meta.env.VITE_KIOSK_ORDER_POLL_MS || "1200"),
  idleResetMs: Number(import.meta.env.VITE_KIOSK_IDLE_RESET_MS || "15000"),
  attractCycleMs: Number(import.meta.env.VITE_KIOSK_ATTRACT_CYCLE_MS || "3500"),
};
