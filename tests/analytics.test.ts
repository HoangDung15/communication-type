import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { POST } from "../src/app/api/analytics/route";
import { getAnalyticsReport, parseReportDate } from "../src/lib/analytics-report";
import { trackEvent } from "../src/lib/analytics";
import { attributionStore } from "../src/lib/client-store";
import type { CurrentUser } from "../src/lib/auth";

type QueryResult = { rows: unknown[]; rowCount?: number };
const db = globalThis as typeof globalThis & {
  pgPool?: { query: (sql: string, params?: unknown[]) => Promise<QueryResult> };
};

afterEach(() => { delete db.pgPool; });

const validEvent = {
  id: "69a09f6e-ae02-4d3e-a2d3-37a1f7fc87d1",
  eventName: "page_view",
  visitorId: "ba6461db-31aa-4c9b-abce-a91052b93669",
  sessionId: "7e824bca-9989-496d-92c9-0c37bf989fa0",
  path: "/",
  entryRef: "kv-a",
  attributedRef: "kv-a",
};

function request(body: unknown, origin = "http://localhost:3000") {
  return new Request("http://localhost:3000/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin, Host: "localhost:3000", "x-forwarded-for": crypto.randomUUID() },
    body: JSON.stringify(body),
  });
}

test("ghi page view theo link KV hợp lệ và dùng event ID để chống ghi lặp", async () => {
  const stored = new Set<string>();
  let inserted: unknown[] = [];
  let insertSql = "";
  db.pgPool = {
    query: async (sql, params) => {
      if (sql.startsWith("SELECT ref, id")) return { rows: [{ ref: "kv-a", id: 7 }] };
      if (sql.includes("INSERT INTO analytics_events")) {
        insertSql = sql;
        inserted = params ?? [];
        stored.add(String(params?.[0]));
        return { rows: [], rowCount: 1 };
      }
      return { rows: [] };
    },
  };
  assert.equal((await POST(request(validEvent))).status, 200);
  assert.equal((await POST(request(validEvent))).status, 200);
  assert.equal(stored.size, 1);
  assert.deepEqual(inserted.slice(-2), [7, 7]);
  assert.match(insertSql, /ON CONFLICT \(id\) DO NOTHING/);
});

test("từ chối origin khác và event sai trước khi truy vấn DB", async () => {
  db.pgPool = { query: async () => { throw new Error("Không được truy vấn DB"); } };
  assert.equal((await POST(request(validEvent, "https://other.example"))).status, 403);
  assert.equal((await POST(request({ ...validEvent, eventName: "unknown" }))).status, 400);
  assert.equal((await POST(request({ ...validEvent, eventName: "registration_opened" }))).status, 400);
});

test("link trực tiếp tới trang đăng ký được tính cho KV", async () => {
  const inserted: unknown[][] = [];
  db.pgPool = {
    query: async (sql, params) => {
      if (sql.startsWith("SELECT ref, id")) return { rows: [{ ref: "kv-a", id: 7 }] };
      if (sql.includes("INSERT INTO analytics_events")) inserted.push(params ?? []);
      return { rows: [] };
    },
  };
  assert.equal((await POST(request({ ...validEvent, path: "/dang-ky" }))).status, 200);
  assert.equal((await POST(request({
    ...validEvent,
    id: crypto.randomUUID(),
    eventName: "registration_opened",
    path: "/dang-ky",
    surface: "page",
    entryRef: undefined,
  }))).status, 200);
  assert.deepEqual(inserted.map((params) => params.slice(-2)), [[7, 7], [null, 7]]);
});

test("báo cáo của KV chỉ truy vấn theo managerId của tài khoản", async () => {
  const user: CurrentUser = { id: 8, username: "kv", displayName: "KV", role: "manager", managerId: 7 };
  const calls: unknown[][] = [];
  db.pgPool = {
    query: async (sql, params) => {
      calls.push(params ?? []);
      if (sql.startsWith("SELECT id, name, ref")) return { rows: [{ id: 7, name: "KV A", ref: "kv-a" }] };
      if (sql.includes('AS "managerId"')) return { rows: [{ eventName: "quiz_completed", managerId: 7, people: 2, events: 3 }] };
      if (sql.includes("AS day")) return { rows: [] };
      return { rows: [{ eventName: "quiz_completed", people: 2, events: 3 }] };
    },
  };
  const report = await getAnalyticsReport(user, "2026-11-01", "2026-11-07");
  assert.equal(report.managers.length, 1);
  assert.equal(report.managers[0].counts.quiz_completed.people, 2);
  assert(calls.every((params) => params.at(-1) === 7));
  assert.equal(parseReportDate("2026-02-30"), null);
});

test("client ưu tiên ref của link hiện tại rồi giữ KV cho bước test", () => {
  const saved = new Map<string, string>();
  const storage = {
    getItem: (key: string) => saved.get(key) ?? null,
    setItem: (key: string, value: string) => { saved.set(key, value); },
  };
  const oldFetch = globalThis.fetch;
  const oldWindow = globalThis.window;
  const oldLocal = globalThis.localStorage;
  const oldSession = globalThis.sessionStorage;
  const bodies: Record<string, unknown>[] = [];
  Object.assign(globalThis, {
    window: { location: { pathname: "/", search: "?ref=kv-b" } },
    localStorage: storage,
    sessionStorage: storage,
    fetch: (_url: string, init: RequestInit) => {
      bodies.push(JSON.parse(String(init.body)) as Record<string, unknown>);
      return Promise.resolve(new Response(null, { status: 204 }));
    },
  });
  try {
    attributionStore.set({ ref: "kv-a", savedAt: Date.now() });
    trackEvent("page_view");
    assert.equal(bodies[0].entryRef, "kv-b");
    assert.equal(bodies[0].attributedRef, "kv-b");
    attributionStore.set({ ref: "kv-b", savedAt: Date.now() });
    (globalThis.window as unknown as { location: { pathname: string; search: string } }).location.search = "";
    trackEvent("quiz_completed");
    assert.equal(bodies[1].entryRef, undefined);
    assert.equal(bodies[1].attributedRef, "kv-b");
    assert.equal(bodies[0].visitorId, bodies[1].visitorId);
  } finally {
    Object.assign(globalThis, {
      fetch: oldFetch,
      window: oldWindow,
      localStorage: oldLocal,
      sessionStorage: oldSession,
    });
  }
});
