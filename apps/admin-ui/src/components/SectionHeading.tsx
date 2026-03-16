export function SectionHeading({
  eyebrow,
  title,
  detail,
}: {
  eyebrow?: string;
  title: string;
  detail?: string;
}) {
  return (
    <div>
      {eyebrow && <div className="text-xs uppercase tracking-[0.28em] text-midnight/45">{eyebrow}</div>}
      <h3 className="mt-1 text-xl font-semibold text-midnight">{title}</h3>
      {detail && <p className="mt-1 text-sm text-midnight/65">{detail}</p>}
    </div>
  );
}
