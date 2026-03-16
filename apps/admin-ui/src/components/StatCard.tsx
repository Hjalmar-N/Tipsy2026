import { Card } from "./Card";

export function StatCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="h-full">
      <div className="text-sm uppercase tracking-[0.2em] text-midnight/45">{title}</div>
      <div className="mt-3 font-display text-5xl">{value}</div>
      <p className="mt-3 text-sm text-midnight/65">{detail}</p>
    </Card>
  );
}
