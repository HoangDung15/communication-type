"use client";

import { useEffect } from "react";
import { attributionStore } from "@/lib/client-store";
import { normalizeReferralCode } from "@/lib/ref";

// Ghi nhận mã người quản lý (?ref=, có từ link /36) và nguồn truy cập (utm_*) ngay khi người dùng vào web.
// Link mới nhất có ref sẽ ghi đè ref cũ; nếu link mới không có ref thì giữ ref cũ (30 ngày).
export function AttributionCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // ?ref=36 hoặc ?ref=kv36 đều lưu thành "kv36"
    const ref = normalizeReferralCode(params.get("ref") ?? "");
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
