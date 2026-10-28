// title row: a noun, one line about the data, and the one action on the right
export default function PageHead({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="page-title">{title}</h1>
        {sub && <p className="sub mt-1">{sub}</p>}
      </div>
      {children}
    </div>
  );
}
