"use client";

import { useFormStatus } from "react-dom";

// disables itself while the action runs, so a slow click can't double-submit (e.g. hire twice)
export default function SubmitButton({ className = "btn", children, ...rest }: React.ComponentProps<"button">) {
  const { pending } = useFormStatus();
  return (
    <button {...rest} disabled={pending || rest.disabled} className={className} aria-busy={pending}>
      {pending ? "Saving…" : children}
    </button>
  );
}
