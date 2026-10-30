// Trạng thái chăm sóc khách, khớp với ràng buộc trong db/migrations/002_admin.sql.

export const STATUSES = [
  { id: "new", label: "Chưa liên hệ", badge: "bg-peach text-peach-ink" },
  { id: "contacted", label: "Đã liên hệ", badge: "bg-sun-soft text-sun-ink" },
  { id: "scheduled", label: "Đã hẹn tư vấn", badge: "bg-sky-soft text-sky-ink" },
  { id: "done", label: "Đã tư vấn", badge: "bg-mint-soft text-mint-dark" },
  { id: "unreachable", label: "Không liên lạc được", badge: "bg-track text-muted" },
] as const;

export type StatusId = (typeof STATUSES)[number]["id"];

export function isStatus(value: unknown): value is StatusId {
  return STATUSES.some((s) => s.id === value);
}

export function statusOf(id: string) {
  return STATUSES.find((s) => s.id === id) ?? STATUSES[0];
}
