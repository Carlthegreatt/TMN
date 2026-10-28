// usage: ADMIN_EMAIL=you@co.com ADMIN_PASSWORD=longpassword pnpm seed
import { hashPassword } from "../lib/password.ts";

// an admin-only database: stop the empty-database demo seeding before lib/db opens it
process.env.DEMO_DATA = "0";
const { get, run } = await import("../lib/db.ts");

const email = process.env.ADMIN_EMAIL;
const pw = process.env.ADMIN_PASSWORD;
if (!email || !pw || pw.length < 8) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (min 8 chars)");
  process.exit(1);
}
if (get("SELECT 1 FROM users WHERE email=?", email)) {
  console.log("Admin already exists");
} else {
  run("INSERT INTO users(email,password,role) VALUES(?,?,'hr')", email, hashPassword(pw));
  console.log("HR admin created:", email);
}
