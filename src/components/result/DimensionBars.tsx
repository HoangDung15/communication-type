"use client";

import { useEffect, useState } from "react";
import { DIMENSIONS } from "@/lib/questions";
import { resultStore } from "@/lib/client-store";
import type { Scores } from "@/lib/mbti";

const COLORS: Record<string, string> = {
  EI: "bg-brand",
  SN: "bg-mint",
  TF: "bg-sun-deep",
  JP: "bg-sky",
};

// Số câu nghiêng về mỗi bên. Chỉ hiện khi người xem chính là người vừa làm bài
// (mở link kết quả trên máy khác thì không có điểm, phần này ẩn đi).
export function DimensionBars({ type }: { type: string }) {
  const [scores, setScores] = useState<Scores | null>(null);

  useEffect(() => {
    const r = resultStore.get();
    // Đặt lại cả khi không khớp: chuyển sang kết quả khác thì không giữ điểm của kết quả cũ.
    setScores(r && r.type === type ? r.scores : null);
  }, [type]);

  if (!scores) return null;

  return (
    <section className="flex w-full max-w-[560px] flex-col gap-5 rounded-2xl border border-line bg-white px-5 py-6 sm:px-7">
      <h2 className="text-lg font-extrabold sm:text-xl">4 xu hướng của bạn</h2>
      {DIMENSIONS.map((d) => {
        const left = scores[d.a.letter];
        const right = scores[d.b.letter];
        const total = left + right;
        const leftWins = left > right;
        return (
          <div key={d.id} className="flex flex-col gap-2">
            <div className="flex justify-between gap-3 text-[15px] sm:text-base">
              <span className={leftWins ? "font-bold" : "text-muted"}>
                {d.a.name} ({d.a.letter})
              </span>
              <span className={leftWins ? "text-muted" : "font-bold"}>
                {d.b.name} ({d.b.letter})
              </span>
            </div>
            <div
              className="flex gap-1.5"
              role="img"
              aria-label={`${leftWins ? left : right} trên ${total} câu nghiêng về ${leftWins ? d.a.name : d.b.name}`}
            >
              {Array.from({ length: total }, (_, i) => {
                // Ô bên trái tô theo điểm bên trái, ô bên phải theo điểm bên phải; bên thắng được tô màu.
                const filled = leftWins ? i < left : i >= left;
                return <span key={i} className={`h-3.5 flex-1 rounded-full ${filled ? COLORS[d.id] : "bg-track"}`} />;
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}
