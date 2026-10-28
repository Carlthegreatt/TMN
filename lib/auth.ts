import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { get } from "./db";

export type User = { id: number; email: string; role: "hr" | "employee"; employee_id: number | null };

export const COOKIE = "sid";
export const SESSION_MS = 7 * 864e5;

export async function getUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  return get<User>(
    "SELECT u.id,u.email,u.role,u.employee_id FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>?",
    token, Date.now(),
  ) ?? null;
}

export async function requireUser() {
  const u = await getUser();
  if (!u) redirect("/login");
  return u;
}

export async function requireHR() {
  const u = await requireUser();
  if (u.role !== "hr") redirect("/");
  return u;
}
