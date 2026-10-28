// usage: pnpm seed:demo   adds the demo company to the current database (development only)
import { getDb } from "../lib/db.ts";
import { DEMO, seedDemo } from "../lib/demo.ts";

if (process.env.NODE_ENV === "production") throw new Error("seed:demo is for development only");

if (getDb().prepare("SELECT 1 FROM users WHERE email=?").get(DEMO.admin)) {
  console.log("Demo data already present (" + DEMO.admin + " exists)");
} else {
  seedDemo(getDb());
  console.log(`Demo data created.
  HR admin:   ${DEMO.admin} / ${DEMO.adminPw}
  HR staff:   sofia@tmn.test / ${DEMO.staffPw}
  Employees:  maria@tmn.test, jon@tmn.test, priya@tmn.test ... / ${DEMO.staffPw}`);
}
