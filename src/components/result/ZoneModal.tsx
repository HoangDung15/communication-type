"use client";

import { useEffect } from "react";
import { parseResult, stripMarkdown } from "@/lib/parse-result";
import { ZONE_LABELS, type ZoneData, type ZoneKey } from "@/lib/zones-types";
import { ResultSections } from "./ResultSections";

// Modal nội dung một vùng kết quả (FLOW_PLAN §5): nhấn vòng nào mở đúng vùng đó,
// không dàn sẵn tất cả lên trang. Vùng vàng có CTA tư vấn.
export function ZoneModal({
  zoneKey,
  zone,
  onClose,
  onConsult,
}: {
  zoneKey: ZoneKey;
  zone: ZoneData;
  onClose: () => void;
  onConsult: () => void;
}) {
  const parsed = parseResult(zone.body);
  const isYellow = zoneKey === "yellow";

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ZONE_LABELS[zoneKey]}
      className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-ink/70" />
      <div className="relative flex max-h-[88dvh] w-full max-w-[640px] flex-col overflow-hidden rounded-t-[24px] bg-white shadow-2xl sm:rounded-[24px]">
        <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-5 sm:px-7 sm:pt-6">
          <div className="flex items-center gap-2.5">
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] text-base font-extrabold ${
                isYellow ? "bg-sun text-sun-ink" : "bg-ink text-white"
              }`}
            >
              {isYellow ? "✦" : zoneKey === "z1" ? "1" : zoneKey === "z2" ? "2" : "3"}
            </span>
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold uppercase tracking-wide text-muted">
                {ZONE_LABELS[zoneKey]}
              </span>
              <h2 className="text-lg font-bold leading-snug">{stripMarkdown(zone.title) || ZONE_LABELS[zoneKey]}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line-strong bg-white text-xl font-bold text-body transition-colors hover:bg-cream"
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 sm:px-7 sm:pb-7">
          <div className="flex flex-col gap-3.5">
            {zone.avatar && (
              <p className="rounded-xl bg-cream px-3.5 py-2.5 text-sm font-semibold text-body">
                Hình ảnh đại diện: {stripMarkdown(zone.avatar)}
              </p>
            )}
            <ResultSections sections={parsed.sections} />
            {isYellow && (
              <button
                type="button"
                onClick={onConsult}
                className="mt-1 inline-flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-brand px-6 text-base font-bold text-white transition-colors hover:bg-brand-dark"
              >
                Kết nối nhận tư vấn tại đây
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
