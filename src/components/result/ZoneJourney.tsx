"use client";

import { stripMarkdown } from "@/lib/parse-result";
import { ZONE_LABELS, type ZoneData, type ZoneKey } from "@/lib/zones-types";

// Kết quả dạng hành trình 4 chặng (thay sơ đồ 3 vòng tròn): đọc lần lượt 1 → 2 → 3,
// chặng "Tiềm năng" chỉ mở khi đã xem đủ 3 chặng đầu. Nhấn chặng nào mở ZoneModal của chặng đó.

const STEPS = ["z1", "z2", "z3"] as const;

/** Props nút "xem tiếp" cho ZoneModal: trỏ tới chặng nên xem sau `current`, hoặc không có nút. */
export function journeyNextProps(current: ZoneKey, seen: Set<ZoneKey>, onSelect: (key: ZoneKey) => void) {
  const next = nextZone(current, seen);
  return next ? { onNext: () => onSelect(next), nextLabel: nextZoneLabel(next) } : {};
}

// Chặng kế tiếp, hoặc chặng đầu tiên chưa xem nếu "Tiềm năng" còn khóa.
function nextZone(current: ZoneKey, seen: Set<ZoneKey>): ZoneKey | null {
  if (current === "yellow") return null;
  if (isUnlocked(seen)) {
    const after = STEPS.slice(STEPS.indexOf(current) + 1).find((k) => !seen.has(k));
    return after ?? "yellow";
  }
  return STEPS.find((k) => !seen.has(k)) ?? null;
}

function nextZoneLabel(key: ZoneKey): string {
  return key === "yellow" ? "Mở chặng cuối" : `Xem chặng ${STEPS.indexOf(key) + 1}`;
}

/** Đã xem đủ 3 chặng đầu (chặng "Tiềm năng" mở khóa). */
export function isUnlocked(seen: Set<ZoneKey>) {
  return STEPS.every((k) => seen.has(k));
}

// Dòng đầu của nội dung, bỏ markdown, để làm đoạn xem trước 2 dòng.
function teaser(zone: ZoneData | undefined): string {
  if (!zone) return "";
  for (const line of zone.body.split("\n")) {
    const text = stripMarkdown(line);
    if (text) return text;
  }
  return "";
}

export function ZoneJourney({
  zones,
  seen,
  onSelect,
}: {
  zones: Partial<Record<ZoneKey, ZoneData>>;
  seen: Set<ZoneKey>;
  onSelect: (key: ZoneKey) => void;
}) {
  const seenCount = STEPS.filter((k) => seen.has(k)).length;
  const unlocked = seenCount === STEPS.length;
  const current = STEPS.find((k) => !seen.has(k)) ?? (seen.has("yellow") ? null : "yellow");

  return (
    <section aria-labelledby="journey-title" className="w-full">
      <div className="flex items-end justify-between gap-3">
        <h2 id="journey-title" className="text-lg font-extrabold leading-snug sm:text-xl">
          Khám phá kết quả qua 4 chặng
        </h2>
        <p className="shrink-0 text-[13px] font-bold text-muted" aria-live="polite">
          Đã xem {seenCount}/3
        </p>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-track" aria-hidden="true">
        <div className="h-full rounded-full bg-mint transition-[width] duration-500" style={{ width: `${(seenCount / 3) * 100}%` }} />
      </div>

      <ol className="relative mt-5 flex flex-col gap-3 pl-10">
        {/* Đường nối dọc giữa các chặng */}
        <span aria-hidden="true" className="absolute bottom-8 left-[15px] top-6 border-l-2 border-dashed border-line-strong" />

        {STEPS.map((key, i) => {
          const done = seen.has(key);
          const active = current === key;
          return (
            <li key={key} className="relative">
              <span
                aria-hidden="true"
                className={`absolute -left-10 top-4 flex size-8 items-center justify-center rounded-full text-sm font-extrabold ${
                  done ? "bg-mint text-white" : active ? "bg-brand text-white" : "border-2 border-line-strong bg-white text-muted"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <button
                type="button"
                onClick={() => onSelect(key)}
                className={`flex w-full flex-col rounded-xl bg-white px-4 py-3.5 text-left transition-colors hover:bg-cream ${
                  active ? "border-2 border-brand shadow-sm" : "border border-line-strong"
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wide text-muted">
                  Chặng {i + 1}
                  {done ? " · Đã xem" : active ? " · Xem tiếp" : ""}
                </span>
                <span className="mt-0.5 text-base font-extrabold leading-snug text-ink">{ZONE_LABELS[key]}</span>
                <span className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-body">{teaser(zones[key])}</span>
                <span className="mt-2 text-sm font-bold text-brand-dark">Xem chi tiết →</span>
              </button>
            </li>
          );
        })}

        <li className="relative">
          <span
            aria-hidden="true"
            className={`absolute -left-10 top-4 flex size-8 items-center justify-center rounded-full text-sm font-extrabold ${
              unlocked ? "bg-sun text-sun-ink motion-safe:animate-[journey-pop_0.45s_ease-out]" : "bg-sun-soft text-sun-ink"
            }`}
          >
            {unlocked ? "✦" : "🔒"}
          </span>
          <button
            type="button"
            disabled={!unlocked}
            onClick={() => onSelect("yellow")}
            className={`flex w-full flex-col rounded-xl px-4 py-3.5 text-left transition-colors ${
              unlocked
                ? "border-2 border-sun-deep bg-sun-soft hover:bg-sun-light"
                : "cursor-not-allowed border border-dashed border-sun-deep bg-sun-soft/60"
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wide text-sun-ink">
              {unlocked ? "Đã mở khóa" : "Chặng cuối"}
            </span>
            <span className="mt-0.5 text-base font-extrabold leading-snug text-ink">{ZONE_LABELS.yellow}</span>
            <span className="mt-1.5 text-sm leading-relaxed text-body">
              {unlocked
                ? "Bạn đang bỏ lỡ lợi thế giao tiếp nào? Xem điểm giao của 3 chặng trên."
                : `Xem đủ 3 chặng trên để mở khóa (còn ${3 - seenCount}).`}
            </span>
            {unlocked && <span className="mt-2 text-sm font-bold text-brand-dark">Mở chặng cuối →</span>}
          </button>
        </li>
      </ol>
      <style>{`@keyframes journey-pop { 0% { transform: scale(0.4); } 70% { transform: scale(1.15); } 100% { transform: scale(1); } }`}</style>
    </section>
  );
}
