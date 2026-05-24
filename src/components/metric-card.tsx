import { Card } from "@/components/ui";

export function MetricCard({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <Card>
      <div className="text-sm font-semibold text-[var(--muted)]">{label}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
      <div className="mt-2 text-sm text-[var(--muted)]">{detail}</div>
    </Card>
  );
}
