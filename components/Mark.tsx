// hire, the working years, retirement: the product's own lifecycle drawn as its mark
export default function Mark({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`size-6 text-accent ${className}`} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="5" cy="12" r="3" fill="currentColor" />
      <path d="M8 12h8" />
      <circle cx="19" cy="12" r="3" />
    </svg>
  );
}
