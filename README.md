# TMN HR

Employee management from hiring to retirement. Next.js (App Router) + SQLite (`node:sqlite`, no extra deps).

```
pnpm install
ADMIN_EMAIL=you@co.com ADMIN_PASSWORD=longpassword pnpm seed   # first HR login
pnpm dev
```

Demo company (admin `admin@tmn.test` / `admin12345`, staff `demo12345`): `pnpm seed:demo` (development only).

Data lives in one SQLite file, `data/hr.db` (gitignored). Needs Node 22.13+.

## Deploying (MVP)

- **Empty database = demo company.** The first request to an empty database creates the demo accounts above, so a fresh deploy has logins. Set `DEMO_DATA=0` to turn that off (then run `pnpm seed` for a single admin).
- **Serverless hosts (Vercel):** the file goes in `/tmp/hr.db`. That disk is per instance and is wiped on cold starts, so data resets and can differ between instances. Fine for a demo, not for real records.
- **Anywhere with a persistent disk** (a VPS, Render or Fly with a volume, Docker): set `DB_PATH=/path/on/the/disk/hr.db` and it persists.
- The demo passwords are public. Replace them before real use.
- **Set `SESSION_SECRET`** (any long random string) in the host's environment. Sign-in is a signed cookie, so it works across serverless instances; without the variable a public default secret is used and anyone could forge a session.

Lifecycle: job posting → candidate pipeline → hire (creates employee, login, onboarding checklist) → active (attendance, leave) → offboarding (resignation / termination / retirement checklist) → exit (login revoked). Retirement date is birth date + 65 (`lib/hr.ts`).
