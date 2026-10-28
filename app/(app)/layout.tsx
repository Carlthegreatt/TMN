import { logout } from "@/app/actions";
import Mark from "@/components/Mark";
import MobileNav from "@/components/MobileNav";
import Nav from "@/components/Nav";
import ThemeToggle from "@/components/ThemeToggle";
import { requireUser } from "@/lib/auth";

const Brand = () => (
  <span className="flex items-center gap-2 text-[0.9375rem] font-semibold text-ink"><Mark />TMN HR</span>
);

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const links = [
    ["/", "Overview", "overview"],
    ...(user.role === "hr"
      ? [["/recruitment", "Recruitment", "recruitment"], ["/employees", "Employees", "employees"]]
      : [[`/employees/${user.employee_id}`, "My profile", "profile"]]),
    ["/leave", "Leave", "leave"],
    ["/attendance", "Attendance", "attendance"],
  ];
  const account = (
    <>
      <p className="truncate text-xs text-muted" title={user.email}>{user.email}</p>
      <div className="flex items-center gap-2"><form action={logout}><button className="btn-ghost">Sign out</button></form><ThemeToggle /></div>
    </>
  );
  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 hidden h-screen w-[15rem] shrink-0 flex-col gap-6 p-4 md:flex">
        <div>
          <Brand />
          <p className="mt-1 pl-8 text-xs text-muted">{user.role === "hr" ? "HR workspace" : "Employee"}</p>
        </div>
        <Nav links={links} />
        <div className="mt-auto space-y-2">{account}</div>
      </aside>
      <div className="min-w-0 flex-1 md:py-2 md:pr-2">
        <header className="flex h-12 items-center justify-between px-4 md:hidden">
          <Brand />
          <MobileNav links={links}>{account}</MobileNav>
        </header>
        <div className="min-h-[calc(100vh-3rem)] bg-surface md:min-h-[calc(100vh-1rem)] md:rounded-2xl md:border md:border-line">
          <main className="mx-auto w-full max-w-[88rem] space-y-6 px-4 py-6 md:p-6 xl:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
