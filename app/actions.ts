"use server";

import { randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { COOKIE, SESSION_MS, getUser, requireHR, requireUser } from "@/lib/auth";
import { get, run, tx } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  EXIT_TYPES, LEAVE_TYPES, OFFBOARDING, ONBOARDING, RETIREMENT_EXTRA, STAGES,
  retirementDate, today, type Employee,
} from "@/lib/hr";

const s = (fd: FormData, k: string) => {
  const v = String(fd.get(k) ?? "").trim();
  if (!v) throw new Error(`${k} is required`);
  return v;
};
const opt = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim() || null;
const oneOf = (v: string, list: string[]) => {
  if (!list.includes(v)) throw new Error(`invalid value: ${v}`);
  return v;
};
const date = (fd: FormData, k: string) => {
  const v = s(fd, k);
  if (Number.isNaN(Date.parse(v))) throw new Error(`${k} is not a date`);
  return v;
};
const refresh = () => revalidatePath("/", "layout");

// ---- auth ----
export async function login(_: string | null, fd: FormData) {
  const u = get<{ id: number; password: string }>(
    "SELECT id,password FROM users WHERE email=?", String(fd.get("email") ?? "").trim().toLowerCase(),
  );
  if (!u || !verifyPassword(String(fd.get("password") ?? ""), u.password)) return "Wrong email or password";
  const token = randomBytes(32).toString("hex");
  run("INSERT INTO sessions VALUES(?,?,?)", token, u.id, Date.now() + SESSION_MS);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: SESSION_MS / 1000,
    secure: (await headers()).get("x-forwarded-proto") === "https", // a Secure cookie on plain http would silently break login
  });
  redirect("/");
}

export async function logout() {
  const jar = await cookies();
  const t = jar.get(COOKIE)?.value;
  if (t) run("DELETE FROM sessions WHERE token=?", t);
  jar.delete(COOKIE);
  redirect("/login");
}

// ---- recruitment ----
export async function createJob(fd: FormData) {
  await requireHR();
  run("INSERT INTO jobs(title,department,description) VALUES(?,?,?)", s(fd, "title"), s(fd, "department"), opt(fd, "description"));
  refresh();
}

export async function toggleJob(fd: FormData) {
  await requireHR();
  run("UPDATE jobs SET status=CASE status WHEN 'open' THEN 'closed' ELSE 'open' END WHERE id=?", s(fd, "id"));
  refresh();
}

export async function addCandidate(fd: FormData) {
  await requireHR();
  run("INSERT INTO candidates(job_id,name,email,phone,notes) VALUES(?,?,?,?,?)",
    s(fd, "job_id"), s(fd, "name"), s(fd, "email"), opt(fd, "phone"), opt(fd, "notes"));
  refresh();
}

export async function setStage(fd: FormData) {
  await requireHR();
  // 'hired' is only reachable through createEmployee
  run("UPDATE candidates SET stage=? WHERE id=? AND stage!='hired'", oneOf(s(fd, "stage"), STAGES), s(fd, "id"));
  refresh();
}

// ---- hiring / onboarding ----
export type FormState = { error: string; values: Record<string, string> } | null;

// returns the error (and what was typed) instead of throwing, so the form can show it inline
export async function createEmployee(_: FormState, fd: FormData): Promise<FormState> {
  await requireHR();
  const values = Object.fromEntries([...fd].filter(([k, v]) => typeof v === "string" && k !== "password")) as Record<string, string>;
  let id: number;
  try {
    const email = s(fd, "email").toLowerCase();
    const password = s(fd, "password");
    if (password.length < 8) throw new Error("Password must be at least 8 characters.");
    const role = oneOf(s(fd, "role"), ["employee", "hr"]);
    const birth = date(fd, "birth_date");
    const candidate = opt(fd, "candidate_id");
    id = tx(() => {
      const { lastInsertRowid } = run(
        `INSERT INTO employees(name,email,phone,department,position,salary,birth_date,hire_date,retirement_date)
         VALUES(?,?,?,?,?,?,?,?,?)`,
        s(fd, "name"), email, opt(fd, "phone"), s(fd, "department"), s(fd, "position"),
        Math.max(0, Number(fd.get("salary")) || 0), birth, date(fd, "hire_date"), retirementDate(birth),
      );
      run("INSERT INTO users(email,password,role,employee_id) VALUES(?,?,?,?)", email, hashPassword(password), role, lastInsertRowid as number);
      for (const t of ONBOARDING) run("INSERT INTO tasks(employee_id,kind,title) VALUES(?,'onboarding',?)", lastInsertRowid as number, t);
      if (candidate) run("UPDATE candidates SET stage='hired' WHERE id=?", candidate);
      return Number(lastInsertRowid);
    });
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    return { error: m.includes("UNIQUE") ? "That email is already used by another employee or login." : m || "Could not create the employee.", values };
  }
  refresh();
  redirect(`/employees/${id}`);
}

export async function updateEmployee(fd: FormData) {
  await requireHR();
  run("UPDATE employees SET department=?,position=?,salary=?,phone=? WHERE id=?",
    s(fd, "department"), s(fd, "position"), Math.max(0, Number(fd.get("salary")) || 0), opt(fd, "phone"), s(fd, "id"));
  refresh();
}

export async function toggleTask(fd: FormData) {
  await requireHR();
  const t = get<{ employee_id: number }>("SELECT employee_id FROM tasks WHERE id=?", s(fd, "id"));
  if (!t) return;
  tx(() => {
    run("UPDATE tasks SET done=1-done WHERE id=?", s(fd, "id"));
    // finishing every onboarding task activates the employee
    run(`UPDATE employees SET status='active' WHERE id=? AND status='onboarding'
         AND NOT EXISTS(SELECT 1 FROM tasks WHERE employee_id=? AND kind='onboarding' AND done=0)`, t.employee_id, t.employee_id);
  });
  refresh();
}

// ---- offboarding / retirement ----
export async function startExit(fd: FormData) {
  await requireHR();
  const id = s(fd, "id");
  const type = oneOf(s(fd, "exit_type"), EXIT_TYPES);
  const e = get<Employee>("SELECT * FROM employees WHERE id=?", id);
  if (!e || e.status === "offboarding" || e.status === "exited") return;
  tx(() => {
    run("UPDATE employees SET status='offboarding',exit_type=?,exit_date=? WHERE id=?", type, date(fd, "exit_date"), id);
    const titles = type === "retirement" ? [...OFFBOARDING, RETIREMENT_EXTRA] : OFFBOARDING;
    for (const t of titles) run("INSERT INTO tasks(employee_id,kind,title) VALUES(?,'offboarding',?)", id, t);
  });
  refresh();
}

export async function completeExit(fd: FormData) {
  await requireHR();
  const id = s(fd, "id");
  const open = get("SELECT 1 FROM tasks WHERE employee_id=? AND kind='offboarding' AND done=0", id);
  if (open) throw new Error("finish all offboarding tasks first");
  tx(() => {
    run("UPDATE employees SET status='exited' WHERE id=? AND status='offboarding'", id);
    run("DELETE FROM users WHERE employee_id=?", id); // revokes login; sessions cascade
  });
  refresh();
}

// ---- leave ----
export async function requestLeave(fd: FormData) {
  const u = await requireUser();
  if (!u.employee_id) throw new Error("no employee profile");
  const start = date(fd, "start_date"), end = date(fd, "end_date");
  if (end < start) throw new Error("end date is before start date");
  run("INSERT INTO leaves(employee_id,type,start_date,end_date,reason) VALUES(?,?,?,?,?)",
    u.employee_id, oneOf(s(fd, "type"), LEAVE_TYPES), start, end, opt(fd, "reason"));
  refresh();
}

export async function decideLeave(fd: FormData) {
  const u = await requireHR();
  const status = oneOf(s(fd, "status"), ["approved", "rejected"]);
  // no self-approval
  run("UPDATE leaves SET status=? WHERE id=? AND status='pending' AND employee_id IS NOT ?", status, s(fd, "id"), u.employee_id);
  refresh();
}

// ---- attendance ----
export async function clock() {
  const u = await getUser();
  if (!u?.employee_id) return;
  const day = today(), now = new Date().toISOString();
  const row = get<{ clock_out: string | null }>("SELECT clock_out FROM attendance WHERE employee_id=? AND day=?", u.employee_id, day);
  if (!row) run("INSERT INTO attendance(employee_id,day,clock_in) VALUES(?,?,?)", u.employee_id, day, now);
  else if (!row.clock_out) run("UPDATE attendance SET clock_out=? WHERE employee_id=? AND day=?", now, u.employee_id, day);
  refresh();
}

