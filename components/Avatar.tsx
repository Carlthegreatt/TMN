// pale identity tints, never violet or indigo; neighbours by id land on different hues
const HUES = [190, 40, 140, 350, 215, 90];

export default function Avatar({ name, id, size = 32 }: { name: string; id: number; size?: number }) {
  const h = HUES[id % HUES.length];
  const initials = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full align-middle font-semibold"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38), background: `hsl(${h} 45% var(--av-bg))`, color: `hsl(${h} 60% var(--av-fg))` }}
    >
      {initials}
    </span>
  );
}
