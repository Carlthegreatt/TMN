import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { seedDemo } from "./demo.ts";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS employees(
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, phone TEXT,
  department TEXT NOT NULL, position TEXT NOT NULL, salary INTEGER NOT NULL DEFAULT 0,
  birth_date TEXT NOT NULL, hire_date TEXT NOT NULL, retirement_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'onboarding', exit_type TEXT, exit_date TEXT);
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('hr','employee')),
  employee_id INTEGER REFERENCES employees(id));
CREATE TABLE IF NOT EXISTS sessions(
  token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS jobs(
  id INTEGER PRIMARY KEY, title TEXT NOT NULL, department TEXT NOT NULL,
  description TEXT, status TEXT NOT NULL DEFAULT 'open');
CREATE TABLE IF NOT EXISTS candidates(
  id INTEGER PRIMARY KEY, job_id INTEGER NOT NULL REFERENCES jobs(id),
  name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, notes TEXT,
  stage TEXT NOT NULL DEFAULT 'applied');
CREATE TABLE IF NOT EXISTS tasks(
  id INTEGER PRIMARY KEY, employee_id INTEGER NOT NULL REFERENCES employees(id),
  kind TEXT NOT NULL, title TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS leaves(
  id INTEGER PRIMARY KEY, employee_id INTEGER NOT NULL REFERENCES employees(id),
  type TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT NOT NULL, reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending');
CREATE TABLE IF NOT EXISTS attendance(
  id INTEGER PRIMARY KEY, employee_id INTEGER NOT NULL REFERENCES employees(id),
  day TEXT NOT NULL, clock_in TEXT NOT NULL, clock_out TEXT, UNIQUE(employee_id, day));
`;

// MVP storage: one SQLite file. Serverless hosts only allow writes in /tmp, so use it there;
// set DB_PATH to point at a persistent disk anywhere else.
const PATH = process.env.DB_PATH ?? (process.env.VERCEL ? "/tmp/hr.db" : "data/hr.db");

// one connection per process; globalThis survives dev hot reloads
const g = globalThis as unknown as { hrdb?: DatabaseSync };
function open() {
  mkdirSync(dirname(PATH), { recursive: true });
  const d = new DatabaseSync(PATH);
  d.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;");
  d.exec(SCHEMA);
  // an empty database gets the demo company so a fresh deploy has logins; DEMO_DATA=0 turns this off
  if (process.env.DEMO_DATA !== "0" && !d.prepare("SELECT 1 FROM users").get()) {
    try { seedDemo(d); } catch (e) { if (!String(e).includes("UNIQUE")) throw e; } // another process seeded first
  }
  return d;
}
// opened on first query, never at import: `next build` imports every page and must not touch the file
export const getDb = () => (g.hrdb ??= open());

type P = (string | number | null)[];
export const all = <T>(sql: string, ...p: P) => getDb().prepare(sql).all(...p) as T[];
export const get = <T>(sql: string, ...p: P) => getDb().prepare(sql).get(...p) as T | undefined;
export const run = (sql: string, ...p: P) => getDb().prepare(sql).run(...p);

export function tx<T>(fn: () => T): T {
  const db = getDb();
  db.exec("BEGIN");
  try {
    const r = fn();
    db.exec("COMMIT");
    return r;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
