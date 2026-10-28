"use client";

import { useActionState } from "react";
import { login } from "@/app/actions";

export default function LoginForm() {
  const [error, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="card w-full max-w-sm space-y-4">
      <h1 className="page-title">Sign in</h1>
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="input" />
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      {error && <p role="alert" className="text-sm text-negative">{error}</p>}
      <button disabled={pending} className="btn w-full">{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
