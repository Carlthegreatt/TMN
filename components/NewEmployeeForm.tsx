"use client";

import { useActionState } from "react";
import { createEmployee } from "@/app/actions";
import Field from "./Field";
import SubmitButton from "./SubmitButton";

type Defaults = Record<string, string>;

export default function NewEmployeeForm({ defaults, today }: { defaults: Defaults; today: string }) {
  const [state, action] = useActionState(createEmployee, null);
  const f = (label: string, name: string, extra: React.ComponentProps<"input"> = {}) => (
    <Field label={label}>
      <input name={name} required={name !== "phone"} className="input" defaultValue={state?.values[name] ?? defaults[name] ?? ""} {...extra} />
    </Field>
  );
  return (
    <form action={action} className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
      {defaults.candidate_id && <input type="hidden" name="candidate_id" value={defaults.candidate_id} />}
      {state && <p role="alert" className="alert-error rounded-lg px-3 py-2 text-sm sm:col-span-2">{state.error}</p>}
      {f("Full name", "name")}
      {f("Work email (login)", "email", { type: "email" })}
      {f("Phone", "phone")}
      {f("Department", "department")}
      {f("Position", "position")}
      {f("Annual salary", "salary", { type: "number", min: 0 })}
      {f("Birth date", "birth_date", { type: "date" })}
      {f("Start date", "hire_date", { type: "date", defaultValue: state?.values.hire_date ?? today })}
      <Field label="Role">
        <select name="role" className="input" defaultValue={state?.values.role ?? "employee"}><option value="employee">Employee</option><option value="hr">HR</option></select>
      </Field>
      {f("Initial password (min 8)", "password", { type: "password", minLength: 8, autoComplete: "new-password" })}
      <div className="sm:col-span-2"><SubmitButton>Create employee and start onboarding</SubmitButton></div>
    </form>
  );
}
