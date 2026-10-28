import Avatar from "@/components/Avatar";
import Link from "next/link";
import Badge from "@/components/Badge";
import PageHead from "@/components/PageHead";
import { requireHR } from "@/lib/auth";
import { all } from "@/lib/db";
import type { Employee } from "@/lib/hr";

const TABS = ["all", "active", "onboarding", "offboarding", "exited"];

export default async function Employees({ searchParams }: PageProps<"/employees">) {
  await requireHR();
  const { status } = await searchParams;
  const tab = TABS.includes(String(status)) ? String(status) : "all";
  const everyone = all<Employee>("SELECT * FROM employees ORDER BY status='exited', name");
  const list = tab === "all" ? everyone : everyone.filter((e) => e.status === tab);
  const n = (t: string) => (t === "all" ? everyone : everyone.filter((e) => e.status === t)).length;
  return (
    <>
      <PageHead title="Employees" sub={`${everyone.length} on record`}>
        <Link href="/employees/new" className="btn">Add employee</Link>
      </PageHead>
      <div role="tablist" aria-label="Status" className="flex gap-6 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <Link
            key={t}
            href={t === "all" ? "/employees" : `/employees?status=${t}`}
            role="tab"
            aria-selected={t === tab}
            className={`-mb-px whitespace-nowrap border-b-2 pb-2.5 text-sm capitalize ${t === tab ? "border-ink font-medium text-ink" : "border-transparent text-muted hover:text-ink"}`}
          >
            {t} <span className="text-muted">{n(t)}</span>
          </Link>
        ))}
      </div>
      {list.length === 0 ? <p className="empty">No {tab === "all" ? "employees" : `${tab} employees`} yet.</p> : (
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th className="th w-1/2">Name</th>
                <th className="th num hidden sm:table-cell">Hired</th>
                <th className="th num hidden sm:table-cell">Retires</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id}>
                  <td className="td h-14">
                    <div className="flex items-center gap-3"><Avatar id={e.id} name={e.name} size={32} /><div>
                    <Link href={`/employees/${e.id}`} className="font-medium text-accent">{e.name}</Link>
                    <div className="text-[0.8125rem] text-muted sm:text-xs">{e.position} · {e.department}<span className="sm:hidden"> · Hired <span className="whitespace-nowrap">{e.hire_date}</span></span></div>
                    </div></div>
                  </td>
                  <td className="td num hidden sm:table-cell">{e.hire_date}</td>
                  <td className="td num hidden sm:table-cell">{e.retirement_date}</td>
                  <td className="td"><Badge status={e.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
