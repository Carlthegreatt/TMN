import Avatar from "./Avatar";

export type TimelineRow = { employee_id: number; name: string; type: string; start_date: string; end_date: string; status: string };
const DAYS = 14;
const add = (iso: string, n: number) => new Date(Date.parse(iso) + n * 864e5).toISOString().slice(0, 10);

// kinds read apart by mark: approved leave a pale fill with an edge, sick leave a grey step, pending a dashed outline
const markOf = (r: TimelineRow) =>
  r.status === "pending" ? "border border-dashed border-accent bg-surface"
  : r.type === "sick" ? "bg-active"
  : "border-l-[3px] border-accent bg-accent/15";

export default function LeaveTimeline({ rows, from }: { rows: TimelineRow[]; from: string }) {
  const cols = Array.from({ length: DAYS }, (_, i) => add(from, i));
  const people = [...new Map(rows.map((r) => [r.employee_id, r.name])).entries()];
  const idx = (iso: string) => Math.round((Date.parse(iso) - Date.parse(from)) / 864e5);
  const grid = { gridTemplateColumns: `repeat(${DAYS}, minmax(0, 1fr))` };
  if (people.length === 0) return <p className="empty">No one is away in the next {DAYS} days.</p>;
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[34rem]">
        <div className="flex">
          <div className="w-40 shrink-0" />
          <div className="grid flex-1" style={grid}>
            {cols.map((d, i) => (
              <div key={d} className={`border-b-2 py-1 text-center text-xs ${i === 0 ? "border-accent font-semibold text-ink" : "border-transparent text-muted"}`}>{d.slice(8)}</div>
            ))}
          </div>
        </div>
        {people.map(([id, name]) => (
          <div key={id} className="flex border-t border-rule">
            <div className="flex w-40 shrink-0 items-center gap-2 pr-2 text-sm"><Avatar id={id} name={name} size={24} /><span className="truncate">{name}</span></div>
            <div className="relative grid h-11 flex-1" style={grid}>
              {cols.map((d) => {
                const wd = new Date(d).getUTCDay();
                return <div key={d} className={`border-l border-rule ${wd === 0 || wd === 6 ? "bg-raised" : ""}`} />;
              })}
              {rows.filter((r) => r.employee_id === id).map((r, i) => {
                const s = Math.max(0, idx(r.start_date)), e = Math.min(DAYS - 1, idx(r.end_date));
                return (
                  <div
                    key={i}
                    title={`${r.type}, ${r.start_date} to ${r.end_date}${r.status === "pending" ? " (pending)" : ""}`}
                    className={`absolute inset-y-2 flex items-center overflow-hidden rounded px-2 text-xs capitalize ${markOf(r)}`}
                    style={{ left: `${(s / DAYS) * 100}%`, width: `${((e - s + 1) / DAYS) * 100}%` }}
                  >
                    <span className="truncate">{r.type}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
          <li className="flex items-center gap-2"><span className="h-3 w-5 rounded-sm border-l-[3px] border-accent bg-accent/15" />Approved</li>
          <li className="flex items-center gap-2"><span className="h-3 w-5 rounded-sm bg-active" />Sick</li>
          <li className="flex items-center gap-2"><span className="h-3 w-5 rounded-sm border border-dashed border-accent" />Pending</li>
        </ul>
      </div>
    </div>
  );
}
