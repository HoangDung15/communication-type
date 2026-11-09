"use client";

import { useEffect, useState } from "react";

export function ResultPeek({ type, targetId }: { type: string; targetId: string }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    // Chỉ ẩn dải gợi ý khi phần kết quả đã hiện đủ để người dùng nhận ra nó.
    const observer = new IntersectionObserver(([entry]) => setShow(!entry.isIntersecting), {
      rootMargin: "0px 0px -20px 0px",
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetId]);

  if (!show) return null;

  return (
    <button
      type="button"
      onClick={() => document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" })}
      className="fixed inset-x-4 bottom-1 z-30 mx-auto flex w-[calc(100%-2rem)] max-w-[400px] items-center justify-between gap-2 rounded-xl border border-sun-deep bg-sun px-3 py-2 text-left text-xs font-bold text-ink shadow-lg"
      aria-label={`Kéo xuống xem kết quả bài test ${type}`}
    >
      <span>Kết quả {type} · Kéo xuống để khám phá</span>
      <span aria-hidden="true" className="text-lg leading-none">↓</span>
    </button>
  );
}
