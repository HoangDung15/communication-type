import { statusOf } from "@/lib/statuses";

export function StatusBadge({ status }: { status: string }) {
  const s = statusOf(status);
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.badge}`}>{s.label}</span>;
}
