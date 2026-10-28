const BY_STATUS: Record<string, string> = {
  active: "green", approved: "green", open: "green", hired: "green",
  onboarding: "info", screening: "info", interview: "info",
  offer: "amber", pending: "amber", offboarding: "amber",
  rejected: "red", applied: "neutral", closed: "neutral", exited: "neutral",
};

// the status text is always shown, so colour is never the only signal
export default function Badge({ status }: { status: string }) {
  return <span className={`pill pill-${BY_STATUS[status] ?? "neutral"}`}>{status}</span>;
}
