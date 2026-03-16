import type { AdminPage } from "../types";

const items: { id: AdminPage; label: string; description: string }[] = [
  { id: "dashboard", label: "Dashboard", description: "Status and quick actions" },
  { id: "pumps", label: "Pumps", description: "Mappings and flow rates" },
  { id: "ingredients", label: "Ingredients", description: "Inventory definitions" },
  { id: "recipes", label: "Recipes", description: "Menu and availability" },
  { id: "calibration", label: "Calibration", description: "Measure ml per second" },
  { id: "manual", label: "Manual Control", description: "Prime, clean, run" },
  { id: "logs", label: "Logs", description: "Recent jobs and outcomes" },
  { id: "settings", label: "Settings", description: "Connection overview" },
];

export function Sidebar({
  activePage,
  onSelect,
}: {
  activePage: AdminPage;
  onSelect: (page: AdminPage) => void;
}) {
  return (
    <aside className="border-b border-white/10 bg-midnight px-4 py-5 text-white lg:min-h-screen lg:w-80 lg:border-b-0 lg:border-r">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.35em] text-white/55">Tipsy Ops</p>
        <h1 className="mt-3 font-display text-4xl">Cocktail Machine Admin</h1>
        <p className="mt-3 max-w-xs text-sm text-white/70">
          Production-minded controls for recipes, pumps, calibration, and machine safety.
        </p>
      </div>
      <nav className="grid gap-2">
        {items.map((item) => {
          const active = item.id === activePage;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`rounded-2xl px-4 py-3 text-left transition ${
                active ? "bg-ember text-white shadow-lg" : "bg-white/5 text-white/85 hover:bg-white/10"
              }`}
            >
              <div className="font-semibold">{item.label}</div>
              <div className={`mt-1 text-sm ${active ? "text-white/85" : "text-white/55"}`}>{item.description}</div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
