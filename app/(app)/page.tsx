import Avatar from "@/components/Avatar";
import Link from "next/link";
import { decideLeave } from "@/app/actions";
import Badge from "@/components/Badge";
import LeaveTimeline, { type TimelineRow } from "@/components/LeaveTimeline";
import PageHead from "@/components/PageHead";
import SubmitButton from "@/components/SubmitButton";
import { requireUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { ANNUAL_LEAVE_DAYS, daysBetween, today, type Employee, type Leave } from "@/lib/hr";

const count = (sql: string, ...p: (string | number)[]) => get<{ n: number }>(sql, ...p)!.n;
const plural = (n: number, one: string, many = one + "s") => `${n} ${n === 1 ? one : many}`;

function Kpi({ label, value, note }: { label: string; value: React.ReactNode; note: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm text-muted">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="mt-1 text-xs text-muted">{note}</div>
    </div>
  );
}

const ViewAll = ({ href }: { href: string }) => (
  <Link href={href} className="btn-ghost mt-4 w-full">View all</Link>
);

export default async function Overview() {
  const user = await requireUser();
  if (user.role !== "hr") return <MyOverview employeeId={user.employee_id} />;

  const by = (s: string) => count("SELECT COUNT(*) n FROM employees WHERE status=?", s);
  const [active, onboarding, offboarding] = [by("active"), by("onboarding"), by("offboarding")];
  const openJobs = count("SELECT COUNT(*) n FROM jobs WHERE status='open'");
  const pipeline = count("SELECT COUNT(*) n FROM candidates WHERE stage NOT IN ('hired','rejected')");
  const pending = all<Leave & { name: string }>(
    "SELECT l.*, e.name FROM leaves l JOIN employees e ON e.id=l.employee_id WHERE l.status='pending' ORDER BY l.start_date");
  const joining = all<Employee & { done: number; total: number }>(
    `SELECT e.*, SUM(t.done) done, COUNT(t.id) total FROM employees e JOIN tasks t ON t.employee_id=e.id AND t.kind='onboarding'
     WHERE e.status='onboarding' GROUP BY e.id ORDER BY e.hire_date`);
  const from = today();
  const to = new Date(Date.parse(from) + 13 * 864e5).toISOString().slice(0, 10);
  const away = all<TimelineRow>(
    `SELECT l.employee_id, e.name, l.type, l.start_date, l.end_date, l.status FROM leaves l JOIN employees e ON e.id=l.employee_id
     WHERE l.status IN ('approved','pending') AND l.end_date>=? AND l.start_date<=? ORDER BY e.name, l.start_date`, from, to);
  const depts = all<{ department: string; n: number }>(
    "SELECT department, COUNT(*) n FROM employees WHERE status!='exited' GROUP BY department ORDER BY n DESC, department");
  const retiring = all<Employee & { days: number }>(
    `SELECT *, CAST(julianday(retirement_date) - julianday('now') AS INTEGER) days FROM employees
     WHERE status='active' AND retirement_date<=date('now','+1 year') ORDER BY retirement_date`);

  const finding = pending.length
    ? `${plural(pending.length, "leave request")} waiting for a decision.`
    : joining.length ? `${plural(joining.length, "new hire")} still onboarding.` : "Nothing is waiting for you.";

  return (
    <>
      <PageHead title="Overview" sub={`${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · ${finding}`}>
        <Link href="/employees/new" className="btn">Add employee</Link>
      </PageHead>

      <div className="kpi-strip">
        <Kpi label="Active employees" value={active} note={`${onboarding} onboarding · ${offboarding} offboarding`} />
        <Kpi label="Open jobs" value={openJobs} note={`${plural(pipeline, "candidate")} in the pipeline`} />
        <Kpi label="Leave to decide" value={pending.length} note={pending.length ? <>earliest starts <span className="whitespace-nowrap">{pending[0].start_date}</span></> : "none pending"} />
        <Kpi label="Retiring in 12 months" value={retiring.length} note={retiring.length ? <>next on <span className="whitespace-nowrap">{retiring[0].retirement_date}</span></> : "no one"} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="min-w-0 space-y-6">
          <section>
            <h2 className="section-title">Waiting for a decision</h2>
            {pending.length === 0 ? <p className="empty">No leave requests are pending.</p> : (
              <>
                <ul>
                  {pending.slice(0, 5).map((l) => (
                    <li key={l.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-rule py-3 first:border-t-0 text-sm">
                      <span>
                        <Avatar id={l.employee_id} name={l.name} size={24} /> <b className="font-medium">{l.name}</b>{" "}
                        <span className="text-muted">· {l.type}, <span className="whitespace-nowrap">{l.start_date}</span> to <span className="whitespace-nowrap">{l.end_date}</span> · <span className="whitespace-nowrap">{plural(daysBetween(l.start_date, l.end_date), "day")}</span></span>
                      </span>
                      {l.employee_id !== user.employee_id && (
                        <form action={decideLeave} className="flex gap-2">
                          <input type="hidden" name="id" value={l.id} />
                          <SubmitButton name="status" value="approved" className="btn-ghost">Approve</SubmitButton>
                          <SubmitButton name="status" value="rejected" className="btn-ghost">Reject</SubmitButton>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
                <ViewAll href="/leave" />
              </>
            )}
          </section>
          <section>
            <h2 className="section-title">Out of office, next 14 days</h2>
            <div className="card"><LeaveTimeline rows={away} from={from} /></div>
          </section>
          <section>
            <h2 className="section-title">Onboarding in progress</h2>
            {joining.length === 0 ? <p className="empty">No one is onboarding.</p> : (
              <ul>
                {joining.slice(0, 5).map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 border-t border-rule py-3 first:border-t-0 text-sm">
                    <span className="flex items-center gap-2"><Avatar id={e.id} name={e.name} size={24} /><span><Link href={`/employees/${e.id}`} className="font-medium text-accent">{e.name}</Link> <span className="text-muted">· {e.position}, starts <span className="whitespace-nowrap">{e.hire_date}</span></span></span></span>
                    <span className="flex items-center gap-3 whitespace-nowrap text-muted"><span className="hidden h-1.5 w-24 rounded-full bg-active sm:block"><span className="block h-1.5 rounded-full bg-accent" style={{ width: `${(e.done / e.total) * 100}%` }} /></span>{e.done} of {e.total} tasks</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
        <div className="space-y-6">
        <section>
          <h2 className="section-title">Headcount by department</h2>
          <div className="card space-y-3">
            {depts.length === 0 ? <p className="sub">No employees yet.</p> : depts.map((d) => (
              <div key={d.department}>
                <div className="flex justify-between text-sm"><span>{d.department}</span><span>{d.n}</span></div>
                <div className="mt-1 h-2 rounded-full bg-active"><div className="h-2 rounded-full bg-accent" style={{ width: `${(d.n / depts[0].n) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="section-title">Retiring within 12 months</h2>
          {retiring.length === 0 ? <p className="empty">No one is due to retire in the next 12 months.</p> : (
            <>
              <ul>
                {retiring.slice(0, 5).map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 border-t border-rule py-3 first:border-t-0 text-sm">
                    <span className="flex items-center gap-3"><Avatar id={e.id} name={e.name} size={32} /><span><Link href={`/employees/${e.id}`} className="font-medium text-accent">{e.name}</Link><br /><span className="text-xs text-muted">{e.position}</span></span></span>
                    <span className="text-right">{e.retirement_date}<br /><span className="text-xs text-muted">{e.days < 0 ? `${-e.days} days overdue` : `in ${plural(e.days, "day")}`}</span></span>
                  </li>
                ))}
              </ul>
              <ViewAll href="/employees" />
            </>
          )}
        </section>
        </div>
      </div>
    </>
  );
}

function MyOverview({ employeeId }: { employeeId: number | null }) {
  const me = get<Employee>("SELECT * FROM employees WHERE id=?", employeeId);
  if (!me) return <PageHead title="Overview" sub="No employee profile is linked to this account." />;
  const year = String(new Date().getFullYear());
  const used = all<Leave>("SELECT * FROM leaves WHERE employee_id=? AND type='annual' AND status='approved' AND start_date LIKE ?", me.id, `${year}%`)
    .reduce((n, l) => n + daysBetween(l.start_date, l.end_date), 0);
  const pending = count("SELECT COUNT(*) n FROM leaves WHERE employee_id=? AND status='pending'", me.id);
  const row = get<{ clock_in: string; clock_out: string | null }>("SELECT clock_in, clock_out FROM attendance WHERE employee_id=? AND day=?", me.id, today());
  const open = count("SELECT COUNT(*) n FROM tasks WHERE employee_id=? AND done=0", me.id);
  return (
    <>
      <PageHead title="Overview" sub={`${me.position} · ${me.department}`}>
        <Badge status={me.status} />
      </PageHead>
      <div className="kpi-strip" style={{ "--cols": 3 } as React.CSSProperties}>
        <Kpi label="Annual leave used" value={<>{used}<span className="text-sm text-muted"> /{ANNUAL_LEAVE_DAYS} days</span></>} note={`${plural(pending, "request")} pending`} />
        <Kpi label="Today" value={row ? (row.clock_out ? "Done" : "In") : "-"} note={row ? `clocked in ${row.clock_in.slice(11, 16)} UTC` : "not clocked in"} />
        <Kpi label="Open tasks" value={open} note={open ? "see your profile" : "all done"} />
      </div>
    </>
  );
}
