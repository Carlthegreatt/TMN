// wrapping label: visible text, and clicking it focuses the control
export default function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
