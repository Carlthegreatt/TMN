import Avatar from "@/components/Avatar";
import Link from "next/link";
import { addCandidate, createJob, setStage, toggleJob } from "@/app/actions";
import Badge from "@/components/Badge";
import Field from "@/components/Field";
import PageHead from "@/components/PageHead";
import SubmitButton from "@/components/SubmitButton";
import { requireHR } from "@/lib/auth";
import { all } from "@/lib/db";
import { STAGES } from "@/lib/hr";

type Job = { id: number; title: string; department: string; description: string | null; status: string };
type Cand = { id: number; job_id: number; name: string; email: string; phone: string | null; notes: string | null; stage: string; job: string };

export default async function Recruitment() {
  await requireHR();
  const jobs = all<Job>("SELECT * FROM jobs ORDER BY status DESC, id DESC");
  const cands = all<Cand>("SELECT c.*, j.title job FROM candidates c JOIN jobs j ON j.id=c.job_id ORDER BY c.id DESC");
  const open = jobs.filter((j) => j.status === "open");
  const inPipeline = cands.filter((c) => c.stage !== "hired" && c.stage !== "rejected").length;
  return (
    <>
      <PageHead title="Recruitment" sub={`${open.length} open ${open.length === 1 ? "job" : "jobs"} · ${inPipeline} in the pipeline`} />

      <div className="kpi-strip" style={{ "--cols": 6 } as React.CSSProperties} aria-label="Candidates by stage">
        {[...STAGES, "hired"].map((s) => (
          <div key={s}>
            <div className="text-sm capitalize text-muted">{s}</div>
            <div className="kpi-value">{cands.filter((c) => c.stage === s).length}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-6">
      <div className={`grid grid-cols-1 gap-6 lg:grid-cols-2 ${cands.length ? "order-last" : ""}`}>
        <section>
          <h2 className="section-title">Job openings</h2>
          <details open={cands.length === 0} className="mb-2">
          <summary className="btn-ghost w-fit list-none [&::-webkit-details-marker]:hidden">Post a job</summary>
          <form action={createJob} className="card mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Title"><input name="title" required className="input" /></Field>
            <Field label="Department"><input name="department" required className="input" /></Field>
            <Field label="Description (optional)" className="sm:col-span-2"><input name="description" className="input" /></Field>
            <div className="sm:col-span-2"><SubmitButton>Post job</SubmitButton></div>
          </form>
          </details>
          {jobs.length === 0 ? <p className="empty mt-4">No jobs posted yet.</p> : (
            <ul className="mt-2">
              {jobs.map((j) => (
                <li key={j.id} className="flex items-center justify-between gap-3 border-t border-rule py-3 first:border-t-0 text-sm">
                  <span><b className="font-medium">{j.title}</b> <span className="text-muted">· {j.department}</span></span>
                  <form action={toggleJob} className="flex items-center gap-3">
                    <input type="hidden" name="id" value={j.id} />
                    <Badge status={j.status} />
                    <button className="btn-ghost">{j.status === "open" ? "Close" : "Reopen"}</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="section-title">Add candidate</h2>
          <details open={cands.length === 0}>
          <summary className="btn-ghost w-fit list-none [&::-webkit-details-marker]:hidden">Add a candidate</summary>
          <form action={addCandidate} className="card mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Job" className="sm:col-span-2">
              <select name="job_id" required className="input">
                {open.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </Field>
            <Field label="Name"><input name="name" required className="input" /></Field>
            <Field label="Email"><input name="email" type="email" required className="input" /></Field>
            <Field label="Phone"><input name="phone" className="input" /></Field>
            <Field label="Notes"><input name="notes" className="input" /></Field>
            <div className="sm:col-span-2"><SubmitButton disabled={open.length === 0}>Add candidate</SubmitButton></div>
          </form>
          </details>
        </section>
      </div>

      <section>
        <h2 className="section-title">Candidates</h2>
        {cands.length === 0 ? <p className="empty">No candidates yet. Post a job, then add the first candidate.</p> : (
          <div className="overflow-x-auto">
            <table>
              <thead><tr><th className="th w-1/3">Name</th><th className="th">Job</th><th className="th">Stage</th><th className="th" /></tr></thead>
              <tbody>
                {cands.map((c) => (
                  <tr key={c.id}>
                    <td className="td h-14">
                      <div className="flex items-center gap-3"><Avatar id={c.id} name={c.name} size={32} /><div>
                      <span className="font-medium">{c.name}</span>
                      <div className="text-[0.8125rem] text-muted sm:text-xs">{c.email}{c.phone && ` · ${c.phone}`}</div></div></div>
                    </td>
                    <td className="td">{c.job}</td>
                    <td className="td">
                      {c.stage === "hired" ? <Badge status="hired" /> : (
                        <form action={setStage} className="flex items-center gap-2">
                          <input type="hidden" name="id" value={c.id} />
                          <select name="stage" defaultValue={c.stage} aria-label={`Stage for ${c.name}`} className="input !h-8 !w-auto text-[0.8125rem]">
                            {STAGES.map((s) => <option key={s}>{s}</option>)}
                          </select>
                          <button className="btn-ghost">Save</button>
                        </form>
                      )}
                    </td>
                    <td className="td text-right">
                      {c.stage === "offer" && <Link href={`/employees/new?candidate=${c.id}`} className="btn !h-8">Hire</Link>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      </div>
    </>
  );
}
