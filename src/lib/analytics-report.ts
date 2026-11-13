import { getPool } from "./db";
import type { CurrentUser } from "./auth";

export type EventName = "page_view" | "quiz_completed" | "registration_opened";
export type Counts = Record<EventName, { people: number; events: number }>;
export type ManagerReport = { id: number | null; name: string; ref: string | null; counts: Counts };

function emptyCounts(): Counts {
  return {
    page_view: { people: 0, events: 0 },
    quiz_completed: { people: 0, events: 0 },
    registration_opened: { people: 0, events: 0 },
  };
}

type CountRow = { eventName: EventName; people: number; events: number };
type ManagerCountRow = CountRow & { managerId: number | null };
type DailyRow = CountRow & { day: string };

const localDate = "(e.occurred_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date";
const managerForEvent = "CASE WHEN e.event_name = 'page_view' THEN e.entry_manager_id ELSE e.attributed_manager_id END";

function readCounts(rows: CountRow[]): Counts {
  const counts = emptyCounts();
  for (const row of rows) counts[row.eventName] = { people: row.people, events: row.events };
  return counts;
}

export function parseReportDate(value: string | string[] | undefined): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null;
}

export function defaultReportDates() {
  const now = Date.now() + 7 * 60 * 60 * 1000;
  return {
    to: new Date(now).toISOString().slice(0, 10),
    from: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  };
}

export async function getAnalyticsReport(user: CurrentUser, from: string, to: string) {
  const managerId = user.role === "manager" ? user.managerId : null;
  const params = [from, to, managerId];
  const where = `e.occurred_at >= ($1::date)::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh'
    AND e.occurred_at < (($2::date + 1)::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh')
    AND ($3::int IS NULL OR (${managerForEvent}) = $3)`;
  const pool = getPool();
  const [totals, byManager, daily, managers] = await Promise.all([
    pool.query<CountRow>(
      `SELECT e.event_name AS "eventName", count(DISTINCT e.visitor_id)::int AS people, count(*)::int AS events
         FROM analytics_events e WHERE ${where} GROUP BY e.event_name`, params,
    ),
    pool.query<ManagerCountRow>(
      `SELECT e.event_name AS "eventName", ${managerForEvent} AS "managerId",
              count(DISTINCT e.visitor_id)::int AS people, count(*)::int AS events
         FROM analytics_events e WHERE ${where}
        GROUP BY e.event_name, ${managerForEvent}`, params,
    ),
    pool.query<DailyRow>(
      `SELECT ${localDate}::text AS day, e.event_name AS "eventName",
              count(DISTINCT e.visitor_id)::int AS people, count(*)::int AS events
         FROM analytics_events e WHERE ${where}
        GROUP BY ${localDate}, e.event_name ORDER BY day DESC`, params,
    ),
    pool.query<{ id: number; name: string; ref: string }>(
      "SELECT id, name, ref FROM managers WHERE ($1::int IS NULL OR id = $1) ORDER BY name",
      [managerId],
    ),
  ]);

  const grouped = new Map<number | null, Counts>();
  for (const row of byManager.rows) {
    if (!grouped.has(row.managerId)) grouped.set(row.managerId, emptyCounts());
    grouped.get(row.managerId)![row.eventName] = { people: row.people, events: row.events };
  }
  const managerReports: ManagerReport[] = managers.rows.map((manager) => ({
    ...manager,
    counts: grouped.get(manager.id) ?? emptyCounts(),
  }));
  if (user.role === "admin") {
    managerReports.push({ id: null, name: "Không qua link KV", ref: null, counts: grouped.get(null) ?? emptyCounts() });
  }

  const days = new Map<string, Counts>();
  for (const row of daily.rows) {
    if (!days.has(row.day)) days.set(row.day, emptyCounts());
    days.get(row.day)![row.eventName] = { people: row.people, events: row.events };
  }
  return { totals: readCounts(totals.rows), managers: managerReports, days: [...days].map(([day, counts]) => ({ day, counts })) };
}
