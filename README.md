# TMN HR

Employee management from hiring to retirement. Next.js (App Router) + SQLite (`node:sqlite`, no extra deps).

```
pnpm install
ADMIN_EMAIL=you@co.com ADMIN_PASSWORD=longpassword pnpm seed   # first HR login
pnpm dev
```

Demo company (admin `admin@tmn.test` / `admin12345`, staff `demo12345`): `pnpm seed:demo` (development only).

Data lives in `data/hr.db` (gitignored). Needs Node 24+.

Lifecycle: job posting → candidate pipeline → hire (creates employee, login, onboarding checklist) → active (attendance, leave) → offboarding (resignation / termination / retirement checklist) → exit (login revoked). Retirement date is birth date + 65 (`lib/hr.ts`).
