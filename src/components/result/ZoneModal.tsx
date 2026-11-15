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

const DEFAULT_DEEP = [
  "Bạn đang bỏ lỡ lợi thế giao tiếp nào?",
  "Đâu là năng lực bạn nên ưu tiên? Làm thế nào để áp dụng vào công việc thực tế?",
];

// Bố cục ô PHÂN TÍCH CHUYÊN SÂU: câu hỏi mở đầu (nổi bật) → các câu hỏi gợi mở (dạng danh sách)
// → đoạn "Mở khóa cùng Advisor…" (nhấn phần lợi ích, ví dụ "3 năng lực").
function DeepContent({ paragraphs }: { paragraphs: string[] }) {
  const [hook, ...rest] = paragraphs;
  const closingIndex = rest.findIndex((p) => /^mở khóa/i.test(p));
  const closing = closingIndex >= 0 ? rest[closingIndex] : null;
  const questions = rest
    .filter((_, i) => i !== closingIndex)
    .flatMap((p) => p.match(/[^?]+\?|[^?]+$/g) ?? [p])
    .map((q) => q.trim())
    .filter(Boolean);

  return (
    <>
      {hook && (
        <p className="rounded-xl border-l-4 border-sun-deep bg-sun-soft px-4 py-3.5 text-[17px] font-bold leading-snug text-ink sm:text-lg">
          {hook}
        </p>
      )}
      {questions.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {questions.map((q, i) => (
            <li key={i} className="flex items-start gap-3 text-base leading-relaxed text-ink">
              <span
                aria-hidden="true"
                className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-sun text-sm font-extrabold text-sun-ink"
              >
                ?
              </span>
              <span className="font-medium">{q}</span>
            </li>
          ))}
        </ul>
      )}
      {closing && (
        <p className="border-t border-line pt-3.5 text-[15px] leading-relaxed text-body">
          <Emphasize text={closing} />
        </p>
      )}
    </>
  );
}

// Nhấn "Mở khóa cùng Advisor" và cụm "3 năng lực…" trong đoạn kết.
function Emphasize({ text }: { text: string }) {
  const parts = text.split(/(Mở khóa cùng Advisor|\d+\s+năng lực)/i);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <b key={i} className={/năng lực/i.test(part) ? "whitespace-nowrap rounded bg-sun-soft px-1 text-ink" : "text-brand-dark"}>
            {part}
          </b>
        ) : (
          part
        ),
      )}
    </>
  );
}

// Modal nội dung một vùng kết quả (FLOW_PLAN §5): nhấn vòng nào mở đúng vùng đó,
// không dàn sẵn tất cả lên trang. Vùng vàng có CTA tư vấn.
export function ZoneModal({
  zoneKey,
  zone,
  onClose,
  onConsult,
  onNext,
  nextLabel,
  deep,
}: {
  zoneKey: ZoneKey;
  zone: ZoneData;
  onClose: () => void;
  /** Không truyền khi người dùng đã đăng ký: chặng cuối hiện ghi chú thay cho nút đăng ký. */
  onConsult?: () => void;
  /** Mở chặng nên xem tiếp (hành trình kết quả); không truyền thì không hiện nút. */
  onNext?: () => void;
  nextLabel?: string;
  /** Nội dung ô PHÂN TÍCH CHUYÊN SÂU của cặp MBTI × lĩnh vực (chỉ dùng cho vùng vàng). */
  deep?: string;
}) {
  const isYellow = zoneKey === "yellow";
  const parsed = isYellow ? null : parseResult(zone.body);
  const sections = parsed ? withRoleTitle(zone, parsed.sections) : null;
  const showAvatar = Boolean(zone.avatar) && sections?.[0]?.title === "Phân tích";
  const heading = isYellow ? "PHÂN TÍCH CHUYÊN SÂU" : stripMarkdown(zone.title) || ZONE_LABELS[zoneKey];
  // Vùng vàng: lời mời riêng theo MBTI × lĩnh vực (ô PHÂN TÍCH CHUYÊN SÂU trong sheet), thiếu thì dùng câu chung.
  const deepParagraphs = (deep?.trim() ? deep.split(/\n\s*\n/) : DEFAULT_DEEP).map((p) => stripMarkdown(p.trim())).filter(Boolean);

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
      <div className="relative flex max-h-[88dvh] w-full max-w-[640px] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-5 sm:px-7 sm:pt-6">
          <div className="flex items-center gap-2.5">
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-base font-extrabold ${
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
                <DeepContent paragraphs={deepParagraphs} />
                {onConsult ? (
                  <button
                    type="button"
                    onClick={onConsult}
                    className="mt-1 inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-base font-bold leading-snug text-white transition-colors hover:bg-brand-dark"
                  >
                    <span aria-hidden="true">🔒</span>
                    Mở khóa cùng Advisor trong phiên tư vấn 1-1
                  </button>
                ) : (
                  <p className="mt-1 rounded-xl bg-mint-soft px-4 py-3 text-[15px] font-semibold leading-relaxed text-mint-dark">
                    Bạn đã đăng ký tư vấn. Advisor sẽ cùng bạn mở khóa phần này trong buổi tư vấn 1:1.
                  </p>
                )}
              </>
            ) : (
              <>
                {showAvatar && zone.avatar && (
                  <p className="rounded-[10px] bg-cream px-3.5 py-2.5 text-sm font-semibold text-body">
                    Hình ảnh đại diện: {stripMarkdown(zone.avatar)}
                  </p>
                )}
                {sections && <ResultSections sections={sections} />}
                {onNext && (
                  <button
                    type="button"
                    onClick={onNext}
                    className="mt-2 inline-flex h-[52px] items-center justify-center gap-2 rounded-xl bg-ink px-6 text-base font-bold text-white transition-colors hover:bg-black"
                  >
                    {nextLabel ?? "Xem chặng tiếp"} →
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
