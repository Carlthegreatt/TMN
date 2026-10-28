import Avatar from "@/components/Avatar";
import { clock } from "@/app/actions";
import PageHead from "@/components/PageHead";
import SubmitButton from "@/components/SubmitButton";
import { requireUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { today } from "@/lib/hr";

type Row = { employee_id: number; day: string; name: string; clock_in: string; clock_out: string | null };
const time = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(11, 16) : "-");

export default async function Attendance() {
  const user = await requireUser();
  const hr = user.role === "hr";
  const rows = all<Row>(
    `SELECT a.employee_id,a.day,e.name,a.clock_in,a.clock_out FROM attendance a JOIN employees e ON e.id=a.employee_id
     WHERE ?=1 OR a.employee_id=? ORDER BY a.day DESC, a.clock_in DESC LIMIT 100`,
    hr ? 1 : 0, user.employee_id ?? -1);
  const mine = user.employee_id ? get<{ clock_out: string | null }>("SELECT clock_out FROM attendance WHERE employee_id=? AND day=?", user.employee_id, today()) : undefined;
  const label = !user.employee_id ? null : mine?.clock_out ? "Done for today" : mine ? "Clock out" : "Clock in";
  const inToday = rows.filter((r) => r.day === today() && !r.clock_out).length;
  return (
    <>
      <PageHead title="Attendance" sub={hr ? `${inToday} clocked in right now · times in UTC` : "Times in UTC"}>
        {label && <form action={clock}><SubmitButton disabled={label === "Done for today"}>{label}</SubmitButton></form>}
      </PageHead>
      {rows.length === 0 ? <p className="empty">No attendance records yet.</p> : (
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr><th className="th num !text-left">Date</th><th className="th w-1/3">Employee</th><th className="th num">In</th><th className="th num">Out</th></tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="td">{r.day}</td><td className="td font-medium"><span className="flex items-center gap-2"><Avatar id={r.employee_id} name={r.name} size={24} />{r.name}</span></td>
                  <td className="td num">{time(r.clock_in)}</td><td className="td num">{time(r.clock_out)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
