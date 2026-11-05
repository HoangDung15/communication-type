"use client";

import { useEffect } from "react";
import { parseResult, stripMarkdown, type Section } from "@/lib/parse-result";
import { ZONE_LABELS, type ZoneData, type ZoneKey } from "@/lib/zones-types";
import { ResultSections } from "./ResultSections";

// "Phân tích" là tiêu đề mặc định khi ô không có mục riêng. Thay bằng tên vai trò
// (avatar hoặc dòng đầu ngắn, ví dụ "The Customer Experience Specialist – …").
function withRoleTitle(zone: ZoneData, sections: Section[]): Section[] {
  const avatar = zone.avatar ? stripMarkdown(zone.avatar) : "";
  if (avatar) {
    return sections.map((section, index) =>
      index === 0 && section.title === "Phân tích" ? { ...section, title: avatar } : section,
    );
  }
  const first = sections[0];
  const lead = first?.blocks[0];
  if (!first || first.title !== "Phân tích" || !lead || lead.kind === "group") return sections;
  const text = stripMarkdown(lead.text);
  if (!text || text.length > 120 || /[.!?]$/.test(text)) return sections;
  const blocks = first.blocks.slice(1);
  if (!blocks.length) return sections;
  return [{ ...first, title: text, blocks }, ...sections.slice(1)];
}

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
  const isYellow = zoneKey === "yellow";
  const parsed = isYellow ? null : parseResult(zone.body);
  const sections = parsed ? withRoleTitle(zone, parsed.sections) : null;
  const showAvatar = Boolean(zone.avatar) && sections?.[0]?.title === "Phân tích";
  const heading = isYellow ? "PHÂN TÍCH CHUYÊN SÂU" : stripMarkdown(zone.title) || ZONE_LABELS[zoneKey];

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
      aria-label={heading}
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
            <h2 className="text-lg font-bold leading-snug">{heading}</h2>
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
            {isYellow ? (
              <>
                <p className="text-base leading-relaxed text-body">Bạn đang bỏ lỡ lợi thế giao tiếp nào?</p>
                <p className="text-base leading-relaxed text-body">
                  Đâu là năng lực bạn nên ưu tiên? Làm thế nào để áp dụng vào công việc thực tế?
                </p>
                <button
                  type="button"
                  onClick={onConsult}
                  className="mt-1 inline-flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-brand px-6 text-base font-bold text-white transition-colors hover:bg-brand-dark"
                >
                  <span aria-hidden="true">🔒</span>
                  Mở khóa cùng Advisor trong phiên tư vấn 1-1
                </button>
              </>
            ) : (
              <>
                {showAvatar && zone.avatar && (
                  <p className="rounded-xl bg-cream px-3.5 py-2.5 text-sm font-semibold text-body">
                    Hình ảnh đại diện: {stripMarkdown(zone.avatar)}
                  </p>
                )}
                {sections && <ResultSections sections={sections} />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
