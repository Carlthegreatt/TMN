// flat grey blocks at the real layout's sizes, so nothing jumps when the data lands
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-6">
      <div className="h-14 w-72 rounded-lg bg-active" />
      <div className="h-28 rounded-lg bg-active" />
      <div className="h-64 rounded-lg bg-raised" />
    </div>
  );
}
