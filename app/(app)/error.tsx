"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="max-w-lg space-y-3">
      <h1 className="page-title">Something went wrong</h1>
      <p className="sub">
        {process.env.NODE_ENV === "production" ? "The action could not be completed. Check your input and try again." : error.message}
      </p>
      <button onClick={reset} className="btn-ghost">Retry</button>
    </div>
  );
}
