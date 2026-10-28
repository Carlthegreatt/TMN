import Avatar from "@/components/Avatar";
import Link from "next/link";
import { notFound } from "next/navigation";
import { completeExit, startExit, toggleTask, updateEmployee } from "@/app/actions";
import Badge from "@/components/Badge";
import Field from "@/components/Field";
import Runway from "@/components/Runway";
import SubmitButton from "@/components/SubmitButton";
import { requireUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { EXIT_TYPES, today, type Employee, type Task } from "@/lib/hr";

export default async function EmployeePage({ params }: PageProps<"/employees/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const hr = user.role === "hr";
  if (!hr && String(user.employee_id) !== id) notFound();
  const e = get<Employee>("SELECT * FROM employees WHERE id=?", id);
  if (!e) notFound();
  const tasks = all<Task>("SELECT * FROM tasks WHERE employee_id=? ORDER BY id", id);
  const group = (kind: string) => tasks.filter((t) => t.kind === kind);
  const exitable = hr && (e.status === "active" || e.status === "onboarding");

  const checklist = (title: string, list: Task[]) => {
    if (list.length === 0) return null;
    const done = list.filter((t) => t.done).length;
    return (
      <section className="card">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <span className="text-sm text-muted">{done} of {list.length}</span>
        </div>
        <div className="mb-4 h-1.5 rounded-full bg-active"><div className="h-1.5 rounded-full bg-accent" style={{ width: `${(done / list.length) * 100}%` }} /></div>
        <ul className="space-y-1">
          {list.map((t) => (
            <li key={t.id}>
              <form action={toggleTask} className="flex items-center gap-3 py-1 text-sm">
                <input type="hidden" name="id" value={t.id} />
                <button
                  disabled={!hr}
                  aria-pressed={!!t.done}
                  aria-label={`Mark "${t.title}" ${t.done ? "not done" : "done"}`}
                  className={`flex size-5 shrink-0 items-center justify-center rounded border enabled:cursor-pointer ${
                    t.done ? "border-primary bg-primary text-[var(--on-primary)]" : "border-control bg-surface enabled:hover:border-ink"
                  }`}
                >
                  {t.done && <svg aria-hidden viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 6.5l3 3 5-6" /></svg>}
                </button>
                <span className={t.done ? "text-muted line-through" : ""}>{t.title}</span>
              </form>
            </li>
          ))}
        </ul>
      </section>
    );
  };

  return (
    <>
      {hr && <Link href="/employees" className="sub inline-block hover:text-ink">Employees</Link>}
      <div className="flex items-center gap-4">
        <Avatar id={e.id} name={e.name} size={56} />
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="page-title">{e.name}</h1>
            <Badge status={e.status} />
          </div>
          <p className="sub mt-1">{e.position} · {e.department}{e.exit_type && ` · ${e.exit_type} on ${e.exit_date}`}</p>
        </div>
      </div>

      <section className="card"><Runway hired={e.hire_date} retires={e.retirement_date} /></section>

      <dl className="kpi-strip text-sm">
        {[["Email", e.email], ["Phone", e.phone ?? "-"], ["Birth date", e.birth_date], ["Salary", e.salary.toLocaleString()]].map(([k, v]) => (
          <div key={k}><dt className="text-muted">{k}</dt><dd className="mt-1 break-words text-base">{v}</dd></div>
        ))}
      </dl>

      {hr && e.status !== "exited" && (
        <form action={updateEmployee} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <input type="hidden" name="id" value={e.id} />
          <Field label="Department"><input name="department" defaultValue={e.department} required className="input" /></Field>
          <Field label="Position"><input name="position" defaultValue={e.position} required className="input" /></Field>
          <Field label="Salary"><input name="salary" type="number" min={0} defaultValue={e.salary} className="input" /></Field>
          <Field label="Phone"><input name="phone" defaultValue={e.phone ?? ""} className="input" /></Field>
          <div className="flex items-end"><SubmitButton className="btn-ghost !h-9 w-full">Save changes</SubmitButton></div>
        </form>
      )}

      {checklist("Onboarding", group("onboarding"))}
      {checklist("Offboarding", group("offboarding"))}

      {exitable && (
        <form action={startExit} className="flex flex-wrap items-end gap-4">
          <input type="hidden" name="id" value={e.id} />
          <Field label="Exit type">
            <select name="exit_type" className="input">{EXIT_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
          </Field>
          <Field label="Last working day">
            <input name="exit_date" type="date" required defaultValue={e.retirement_date > today() ? e.retirement_date : today()} className="input" />
          </Field>
          <SubmitButton className="btn-ghost !h-9">Start offboarding</SubmitButton>
        </form>
      )}
      {hr && e.status === "offboarding" && (
        <form action={completeExit}>
          <input type="hidden" name="id" value={e.id} />
          <SubmitButton disabled={group("offboarding").some((t) => !t.done)}>Complete exit (revokes login)</SubmitButton>
        </form>
      )}
    </>
  );
}
