"use client";

import { forwardRef } from "react";
import { parseResult } from "@/lib/parse-result";
import { ZONE_LABELS, ZONE_ORDER, type ZoneKey } from "@/lib/zones-types";
import type { ZonesFileEntry } from "@/lib/zones";
import { ResultSections } from "./ResultSections";

// Các thẻ nội dung 4 vùng theo thứ tự 1 → 2 → 3 → vàng (FLOW_PLAN §5).
// Nội dung body của mỗi zone render bằng parseResult như format cũ.

const ZONE_NUMBERS: Record<ZoneKey, string> = {
  z1: "1",
  z2: "2",
  z3: "3",
  yellow: "✦",
};

export const ZoneCards = forwardRef<HTMLElement, { entry: ZonesFileEntry; onCta: () => void }>(function ZoneCards(
  { entry, onCta },
  ref,
) {
  return (
    <div ref={ref as React.Ref<HTMLDivElement>} className="flex scroll-mt-24 flex-col gap-4">
      {ZONE_ORDER.map((key) => {
        const z = entry.zones[key];
        if (!z) return null;
        const parsed = parseResult(z.body);
        return (
          <section
            key={key}
            id={`zone-${key}`}
            aria-label={ZONE_LABELS[key]}
            className={`flex scroll-mt-24 flex-col gap-3.5 rounded-[20px] border-2 px-4 py-5 lg:px-6 lg:py-6 ${
              key === "yellow" ? "border-sun-deep bg-[#fff8e1]" : "border-line bg-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] text-base font-extrabold ${
                  key === "yellow" ? "bg-sun text-sun-ink" : "bg-ink text-white"
                }`}
              >
                {ZONE_NUMBERS[key]}
              </span>
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold uppercase tracking-wide text-muted">{ZONE_LABELS[key]}</span>
                <h2 className="text-lg font-bold leading-snug">{z.title || ZONE_LABELS[key]}</h2>
              </div>
            </div>
            {z.avatar && (
              <p className="rounded-xl bg-cream px-3.5 py-2.5 text-sm font-semibold text-body">
                Hình ảnh đại diện: {z.avatar}
              </p>
            )}
            <ResultSections sections={parsed.sections} />
            {key === "yellow" && (
              <button
                type="button"
                onClick={onCta}
                className="mt-1 inline-flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-brand px-6 text-base font-bold text-white transition-colors hover:bg-brand-dark"
              >
                Kết nối nhận tư vấn tại đây
              </button>
            )}
          </section>
        );
      })}
    </div>
  );
});
