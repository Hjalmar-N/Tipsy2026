import { StatusPill } from "./StatusPill";

export function HeaderBar({
  title,
  subtitle,
  ready,
}: {
  title: string;
  subtitle: string;
  ready: boolean;
}) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <p className="text-sm uppercase tracking-[0.4em] text-white/55">Tipsy Kiosk</p>
        <h1 className="mt-3 font-display text-5xl leading-tight text-white md:text-6xl">{title}</h1>
        <p className="mt-4 max-w-3xl text-lg text-white/75 md:text-xl">{subtitle}</p>
      </div>
      <StatusPill ready={ready} />
    </header>
  );
}
