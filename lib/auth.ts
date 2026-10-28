import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { get } from "./db";
import { verify } from "./session";

export type User = { id: number; email: string; role: "hr" | "employee"; employee_id: number | null };

export const COOKIE = "sid";
export const SESSION_MS = 7 * 864e5;

export async function getUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const id = verify(token);
  if (id === null) return null;
  // looked up on every request, so deleting a user (an exited employee) revokes their login at once
  return get<User>("SELECT id,email,role,employee_id FROM users WHERE id=?", id) ?? null;
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
