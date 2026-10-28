import { today } from "@/lib/hr";

const clamp = (n: number) => Math.min(1, Math.max(0, n));
const years = (ms: number) => (ms / 864e5 / 365.25).toFixed(1);

// hire to scheduled retirement, with today on it: the product's own lifecycle as one bar
export default function Runway({ hired, retires }: { hired: string; retires: string }) {
  const [a, b, now] = [Date.parse(hired), Date.parse(retires), Date.parse(today())];
  const pct = Math.round(clamp((now - a) / (b - a)) * 1000) / 10;
  return (
    <div>
      <div className="flex justify-between text-sm"><span>Hired {hired}</span><span>Retires {retires}</span></div>
      <div className="relative my-3 h-2 rounded-full bg-active" role="img" aria-label={`${pct}% of the way from hire to retirement`}>
        <div className="h-2 rounded-full bg-accent" style={{ width: `${pct}%`, minWidth: "0.5rem" }} />
        <span aria-hidden className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-ink" style={{ left: `${pct}%` }} />
      </div>
      <p className="text-xs text-muted">
        Today {today()} · {now < a ? "starts later" : `${years(now - a)} years in service`} · {now >= b ? "Past retirement date" : `${years(b - now)} years to retirement`}
      </p>
    </div>
  );
}
