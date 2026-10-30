"use client";

import { useEffect } from "react";
import { attributionStore } from "@/lib/client-store";
import { normalizeRef } from "@/lib/ref";

// Ghi nhận mã người quản lý (?ref=) và nguồn truy cập (utm_*) ngay khi người dùng vào web.
// Link mới nhất có ref sẽ ghi đè ref cũ; nếu link mới không có ref thì giữ ref cũ (30 ngày).
export function AttributionCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = normalizeRef(params.get("ref"));
    const utmSource = params.get("utm_source")?.slice(0, 100) || undefined;
    const utmMedium = params.get("utm_medium")?.slice(0, 100) || undefined;
    const utmCampaign = params.get("utm_campaign")?.slice(0, 100) || undefined;
    if (!ref && !utmSource && !utmMedium && !utmCampaign) return;

    const prev = attributionStore.get();
    attributionStore.set({
      ref: ref ?? prev?.ref,
      utmSource: utmSource ?? prev?.utmSource,
      utmMedium: utmMedium ?? prev?.utmMedium,
      utmCampaign: utmCampaign ?? prev?.utmCampaign,
      savedAt: Date.now(),
    });
  }, []);

  return null;
}
