import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";

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

// one connection per process; globalThis survives dev hot reloads
const g = globalThis as unknown as { hrdb?: DatabaseSync };
function open() {
  mkdirSync("data", { recursive: true });
  const d = new DatabaseSync("data/hr.db");
  d.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;");
  d.exec(SCHEMA);
  return d;
}
const db = (g.hrdb ??= open());

type P = (string | number | null)[];
export const all = <T>(sql: string, ...p: P) => db.prepare(sql).all(...p) as T[];
export const get = <T>(sql: string, ...p: P) => db.prepare(sql).get(...p) as T | undefined;
export const run = (sql: string, ...p: P) => db.prepare(sql).run(...p);

export function tx<T>(fn: () => T): T {
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
