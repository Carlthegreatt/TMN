import NewEmployeeForm from "@/components/NewEmployeeForm";
import PageHead from "@/components/PageHead";
import { requireHR } from "@/lib/auth";
import { get } from "@/lib/db";
import { today } from "@/lib/hr";

export default async function NewEmployee({ searchParams }: PageProps<"/employees/new">) {
  await requireHR();
  const { candidate } = await searchParams;
  const c = typeof candidate === "string"
    ? get<{ id: number; name: string; email: string; phone: string | null; title: string; department: string }>(
        "SELECT c.id,c.name,c.email,c.phone,j.title,j.department FROM candidates c JOIN jobs j ON j.id=c.job_id WHERE c.id=? AND c.stage='offer'", candidate)
    : undefined;
  const defaults: Record<string, string> = c
    ? { candidate_id: String(c.id), name: c.name, email: c.email, phone: c.phone ?? "", department: c.department, position: c.title }
    : {};
  return (
    <>
      <PageHead title={c ? `Hire ${c.name}` : "Add employee"} sub="Creates their login and the onboarding checklist." />
      <NewEmployeeForm defaults={defaults} today={today()} />
    </>
  );
}
