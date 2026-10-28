// usage: pnpm seed:demo   (demo data only; refuses to run in production)
import { get, run } from "../lib/db.ts";
import { hashPassword } from "../lib/password.ts";
import { OFFBOARDING, ONBOARDING, retirementDate } from "../lib/hr.ts";

if (process.env.NODE_ENV === "production") throw new Error("seed:demo is for development only");

const ADMIN = "admin@tmn.test", ADMIN_PW = "admin12345", STAFF_PW = "demo12345";
if (get("SELECT 1 FROM users WHERE email=?", ADMIN)) {
  console.log("Demo data already present (" + ADMIN + " exists)");
  process.exit(0);
}

const day = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const num = (r: { lastInsertRowid: number | bigint }) => Number(r.lastInsertRowid);

run("INSERT INTO users(email,password,role) VALUES(?,?,'hr')", ADMIN, hashPassword(ADMIN_PW));

// name, email, department, position, salary, birth, hire, status, role
const people: [string, string, string, string, number, string, string, string, string][] = [
  ["Maria Santos", "maria@tmn.test", "Finance", "Accountant", 52000, "1961-12-02", "2019-03-04", "active", "employee"],
  ["Jon Reyes", "jon@tmn.test", "Operations", "Warehouse lead", 44000, "1962-03-18", "2015-06-01", "active", "employee"],
  ["Priya Nair", "priya@tmn.test", "Engineering", "Developer", 78000, "1991-07-09", "2022-01-10", "active", "employee"],
  ["Daniel Okafor", "daniel@tmn.test", "Engineering", "Engineering manager", 96000, "1984-04-21", "2018-08-13", "active", "employee"],
  ["Sofia Marino", "sofia@tmn.test", "People", "HR generalist", 58000, "1989-10-05", "2020-09-01", "active", "hr"],
  ["Chen Wei", "chen@tmn.test", "Finance", "Payroll analyst", 54000, "1993-01-30", "2023-05-15", "active", "employee"],
  ["Amara Diallo", "amara@tmn.test", "Operations", "Logistics coordinator", 41000, "1996-06-12", "2024-02-05", "active", "employee"],
  ["Luis Ortega", "luis@tmn.test", "Engineering", "QA engineer", 61000, "1994-11-23", day(-8), "onboarding", "employee"],
  ["Hana Kim", "hana@tmn.test", "People", "Recruiter", 47000, "1998-02-14", day(-2), "onboarding", "employee"],
  ["Tomas Berg", "tomas@tmn.test", "Operations", "Driver", 36000, "1975-09-30", "2012-02-13", "offboarding", "employee"],
];
const ids: Record<string, number> = {};
for (const [name, email, dept, pos, salary, birth, hire, status, role] of people) {
  const id = num(run(
    `INSERT INTO employees(name,email,department,position,salary,birth_date,hire_date,retirement_date,status,exit_type,exit_date)
     VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
    name, email, dept, pos, salary, birth, hire, retirementDate(birth), status,
    status === "offboarding" ? "resignation" : null, status === "offboarding" ? day(14) : null));
  ids[name] = id;
  run("INSERT INTO users(email,password,role,employee_id) VALUES(?,?,?,?)", email, hashPassword(STAFF_PW), role, id);
  // onboarding progress: the new hires are partway, everyone else finished
  const done = name === "Luis Ortega" ? 3 : name === "Hana Kim" ? 1 : ONBOARDING.length;
  ONBOARDING.forEach((t, i) => run("INSERT INTO tasks(employee_id,kind,title,done) VALUES(?,'onboarding',?,?)", id, t, i < done ? 1 : 0));
  if (status === "offboarding") OFFBOARDING.forEach((t, i) => run("INSERT INTO tasks(employee_id,kind,title,done) VALUES(?,'offboarding',?,?)", id, t, i < 2 ? 1 : 0));
}

const jobs = [["Senior Developer", "Engineering", "open"], ["Customer Support Lead", "Operations", "open"], ["Finance Intern", "Finance", "closed"]];
const jobId = jobs.map(([t, d, s]) => num(run("INSERT INTO jobs(title,department,description,status) VALUES(?,?,?,?)", t, d, "Demo posting", s)));
const cands: [number, string, string, string][] = [
  [0, "Ana Cruz", "ana.cruz@mail.test", "interview"], [0, "Marcus Bell", "marcus.bell@mail.test", "screening"],
  [0, "Elena Petrova", "elena.petrova@mail.test", "offer"], [1, "Raj Patel", "raj.patel@mail.test", "applied"],
  [1, "Kim Alvarez", "kim.alvarez@mail.test", "rejected"], [2, "Nora Ito", "nora.ito@mail.test", "rejected"],
];
for (const [j, n, e, stage] of cands) run("INSERT INTO candidates(job_id,name,email,stage) VALUES(?,?,?,?)", jobId[j], n, e, stage);

const leave = (who: string, type: string, a: number, b: number, status: string, reason: string | null = null) =>
  run("INSERT INTO leaves(employee_id,type,start_date,end_date,reason,status) VALUES(?,?,?,?,?,?)", ids[who], type, day(a), day(b), reason, status);
leave("Priya Nair", "annual", 3, 6, "approved", "Long weekend");
leave("Jon Reyes", "sick", -1, 1, "approved");
leave("Sofia Marino", "annual", -30, -26, "approved");
leave("Maria Santos", "annual", 10, 14, "pending", "Family trip");
leave("Chen Wei", "annual", 7, 8, "pending");
leave("Daniel Okafor", "parental", 20, 40, "pending");

// last five weekdays of attendance for active staff; today only clocked in
for (const [name, id] of Object.entries(ids)) {
  if (!people.find((p) => p[0] === name && p[7] === "active")) continue;
  for (let back = 0, shown = 0; shown < 5; back++) {
    const d = new Date(Date.now() - back * 864e5);
    if ([0, 6].includes(d.getUTCDay())) continue;
    const iso = d.toISOString().slice(0, 10);
    const inMin = 530 + ((id * 7 + back * 3) % 35);
    const at = (m: number) => `${iso}T${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:00.000Z`;
    run("INSERT OR IGNORE INTO attendance(employee_id,day,clock_in,clock_out) VALUES(?,?,?,?)", id, iso, at(inMin), back === 0 ? null : at(inMin + 480 + (id % 20)));
    shown++;
  }
}

console.log(`Demo data created.
  HR admin:   ${ADMIN} / ${ADMIN_PW}
  HR staff:   sofia@tmn.test / ${STAFF_PW}
  Employees:  maria@tmn.test, jon@tmn.test, priya@tmn.test ... / ${STAFF_PW}`);
