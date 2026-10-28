import Avatar from "@/components/Avatar";
import { decideLeave, requestLeave } from "@/app/actions";
import Badge from "@/components/Badge";
import Field from "@/components/Field";
import PageHead from "@/components/PageHead";
import SubmitButton from "@/components/SubmitButton";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { ANNUAL_LEAVE_DAYS, LEAVE_TYPES, daysBetween, type Leave } from "@/lib/hr";

type Row = Leave & { name: string };

export default async function LeavePage() {
  const user = await requireUser();
  const hr = user.role === "hr";
  const rows = all<Row>(
    `SELECT l.*, e.name FROM leaves l JOIN employees e ON e.id=l.employee_id
     WHERE ?=1 OR l.employee_id=? ORDER BY l.status='pending' DESC, l.start_date DESC`,
    hr ? 1 : 0, user.employee_id ?? -1);
  const year = String(new Date().getFullYear());
  const used = rows
    .filter((l) => l.employee_id === user.employee_id && l.type === "annual" && l.status === "approved" && l.start_date.startsWith(year))
    .reduce((n, l) => n + daysBetween(l.start_date, l.end_date), 0);
  const waiting = rows.filter((l) => l.status === "pending").length;
  return (
    <>
      <PageHead title="Leave" sub={waiting ? `${waiting} ${waiting === 1 ? "request" : "requests"} waiting for a decision` : "No requests are waiting"} />
      {user.employee_id && (
        <section>
          <h2 className="section-title">Request leave</h2>
          <form action={requestLeave} className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <p className="sub sm:col-span-2 lg:col-span-4">Annual leave used this year: {used}/{ANNUAL_LEAVE_DAYS} days</p>
            <Field label="Type"><select name="type" className="input">{LEAVE_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
            <Field label="From"><input name="start_date" type="date" required className="input" /></Field>
            <Field label="To"><input name="end_date" type="date" required className="input" /></Field>
            <Field label="Reason"><input name="reason" className="input" /></Field>
            <div className="sm:col-span-2 lg:col-span-4"><SubmitButton>Request leave</SubmitButton></div>
          </form>
        </section>
      )}
      <section>
        <h2 className="section-title">{hr ? "All requests" : "Your requests"}</h2>
        {rows.length === 0 ? <p className="empty">No leave requests.</p> : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th className="th w-1/4">Employee</th><th className="th">Type</th>
                  <th className="th num">From</th><th className="th num">To</th><th className="th num">Days</th>
                  <th className="th">Status</th><th className="th" />
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => (
                  <tr key={l.id}>
                    <td className="td font-medium"><span className="flex items-center gap-2"><Avatar id={l.employee_id} name={l.name} size={24} />{l.name}</span></td>
                    <td className="td capitalize">{l.type}</td>
                    <td className="td num">{l.start_date}</td>
                    <td className="td num">{l.end_date}</td>
                    <td className="td num">{daysBetween(l.start_date, l.end_date)}</td>
                    <td className="td"><Badge status={l.status} /></td>
                    <td className="td">
                      {hr && l.status === "pending" && l.employee_id !== user.employee_id && (
                        <form action={decideLeave} className="flex justify-end gap-2">
                          <input type="hidden" name="id" value={l.id} />
                          <SubmitButton name="status" value="approved" className="btn-ghost">Approve</SubmitButton>
                          <SubmitButton name="status" value="rejected" className="btn-ghost">Reject</SubmitButton>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
