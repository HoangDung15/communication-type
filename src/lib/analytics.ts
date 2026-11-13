"use client";

import { attributionStore } from "./client-store";
import { normalizeReferralCode } from "./ref";

export type AnalyticsEvent = "page_view" | "quiz_completed" | "registration_opened";
export type AnalyticsSurface = "modal" | "page";

const VISITOR_KEY = "bettertalk.analytics.visitor.v1";
const SESSION_KEY = "bettertalk.analytics.session.v1";
const VISITOR_TTL = 30 * 24 * 60 * 60 * 1000;
let fallbackVisitor: string | null = null;
let fallbackSession: string | null = null;

function visitorId(): string {
  try {
    const saved = JSON.parse(localStorage.getItem(VISITOR_KEY) ?? "null") as { id?: string; expires?: number } | null;
    if (saved?.id && saved.expires && saved.expires > Date.now()) return saved.id;
    const id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, JSON.stringify({ id, expires: Date.now() + VISITOR_TTL }));
    return id;
  } catch {
    return fallbackVisitor ??= crypto.randomUUID();
  }
}

function sessionId(): string {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) return saved;
    const id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return fallbackSession ??= crypto.randomUUID();
  }
}

export function trackEvent(eventName: AnalyticsEvent, surface?: AnalyticsSurface): void {
  if (typeof window === "undefined") return;
  try {
    const path = window.location.pathname;
    if (path !== "/" && path !== "/dang-ky") return;

    const entryRef = normalizeReferralCode(new URLSearchParams(window.location.search).get("ref") ?? "");
    const attributedRef = entryRef ?? attributionStore.get()?.ref;
    const body = {
      id: crypto.randomUUID(),
      eventName,
      visitorId: visitorId(),
      sessionId: sessionId(),
      path,
      ...(surface ? { surface } : {}),
      ...(eventName === "page_view" && entryRef ? { entryRef } : {}),
      ...(attributedRef ? { attributedRef } : {}),
    };
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Lỗi đo lường không được chặn bài test hoặc mở đơn đăng ký.
  }
}
