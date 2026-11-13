import { z } from "zod";
import { isAnalyticsRateLimited } from "@/lib/analytics-rate-limit";
import { getPool } from "@/lib/db";
import { normalizeReferralCode } from "@/lib/ref";

const uuid = z.uuid();
const MAX_BODY_BYTES = 2048;
const schema = z.object({
  id: uuid,
  eventName: z.enum(["page_view", "quiz_completed", "registration_opened"]),
  visitorId: uuid,
  sessionId: uuid,
  path: z.enum(["/", "/dang-ky"]),
  surface: z.enum(["modal", "page"]).optional(),
  entryRef: z.string().max(32).optional(),
  attributedRef: z.string().max(32).optional(),
}).strict().superRefine((value, ctx) => {
  if ((value.eventName === "registration_opened") !== Boolean(value.surface)) {
    ctx.addIssue({ code: "custom", message: "surface không hợp lệ" });
  }
  if (value.eventName === "quiz_completed" && value.path !== "/") {
    ctx.addIssue({ code: "custom", message: "path không hợp lệ" });
  }
  if (value.surface === "modal" && value.path !== "/") {
    ctx.addIssue({ code: "custom", message: "path không hợp lệ" });
  }
  if (value.surface === "page" && value.path !== "/dang-ky") {
    ctx.addIssue({ code: "custom", message: "path không hợp lệ" });
  }
  if (value.entryRef && value.eventName !== "page_view") {
    ctx.addIssue({ code: "custom", message: "entryRef không hợp lệ" });
  }
});

async function readSmallBody(request: Request): Promise<string | null> {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin) {
    let originHost: string;
    try { originHost = new URL(origin).host; } catch { return Response.json({ ok: false }, { status: 403 }); }
    if (!host || originHost !== host) return Response.json({ ok: false }, { status: 403 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isAnalyticsRateLimited(ip)) return Response.json({ ok: false }, { status: 429 });

  const text = await readSmallBody(request);
  if (text === null) return Response.json({ ok: false }, { status: 413 });
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return Response.json({ ok: false }, { status: 400 }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return Response.json({ ok: false }, { status: 400 });
  const event = parsed.data;
  const entryRef = event.entryRef ? normalizeReferralCode(event.entryRef) : undefined;
  const attributedRef = event.attributedRef ? normalizeReferralCode(event.attributedRef) : undefined;

  try {
    const { rows } = await getPool().query<{ ref: string; id: number }>(
      "SELECT ref, id FROM managers WHERE active AND ref = ANY($1::text[])",
      [[...new Set([entryRef, attributedRef].filter(Boolean))]],
    );
    const ids = new Map(rows.map((row) => [row.ref, row.id]));
    await getPool().query(
      `INSERT INTO analytics_events
         (id, event_name, visitor_id, session_id, path, surface, entry_manager_id, attributed_manager_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [
        event.id, event.eventName, event.visitorId, event.sessionId, event.path, event.surface ?? null,
        entryRef ? ids.get(entryRef) ?? null : null,
        attributedRef ? ids.get(attributedRef) ?? null : null,
      ],
    );
    if (Math.random() < 0.01) {
      await getPool().query("DELETE FROM analytics_events WHERE occurred_at < now() - interval '90 days'")
        .catch((error) => console.error("[analytics] Dọn event cũ thất bại:", error));
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[analytics] Ghi event thất bại:", error);
    return Response.json({ ok: false }, { status: 503 });
  }
}
