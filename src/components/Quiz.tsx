"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Blobs, SiteHeader } from "./SiteHeader";
import { ArrowLeft, ArrowRight } from "./icons";
import { btnPrimary, btnSecondary, iconBtn } from "./ui";
import { DIMENSIONS, QUESTIONS, type Choice } from "@/lib/questions";
import { computeResult } from "@/lib/mbti";
import { quizStore, resultStore } from "@/lib/client-store";

const TOTAL = QUESTIONS.length;
const AUTO_ADVANCE_MS = 260;

export function Quiz() {
  const router = useRouter();
  const [answers, setAnswers] = useState<(Choice | null)[]>(() => Array(TOTAL).fill(null));
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Khôi phục bài đang làm dở
  useEffect(() => {
    const saved = quizStore.get();
    if (saved && saved.answers.length === TOTAL) {
      setAnswers(saved.answers);
      setCurrent(Math.min(Math.max(saved.current, 0), TOTAL - 1));
    }
    setLoaded(true);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (loaded) quizStore.set({ answers, current });
  }, [answers, current, loaded]);

  const finish = useCallback(
    (final: (Choice | null)[]) => {
      const result = computeResult(final);
      if (!result) return;
      resultStore.set({ ...result, answers: final.join("") });
      router.push("/linh-vuc");
    },
    [router],
  );

  const goTo = useCallback((index: number) => {
    if (timer.current) clearTimeout(timer.current);
    setCurrent(Math.min(Math.max(index, 0), TOTAL - 1));
  }, []);

  const choose = useCallback(
    (choice: Choice) => {
      const next = [...answers];
      next[current] = choice;
      setAnswers(next);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        if (current < TOTAL - 1) setCurrent(current + 1);
        else finish(next);
      }, AUTO_ADVANCE_MS);
    },
    [answers, current, finish],
  );

  const goNext = useCallback(() => {
    if (!answers[current]) return;
    if (current < TOTAL - 1) goTo(current + 1);
    else finish(answers);
  }, [answers, current, finish, goTo]);

  // Phím tắt trên desktop: A/B để chọn, mũi tên để chuyển câu
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === "a" || key === "b") choose(key);
      else if (e.key === "ArrowLeft") goTo(current - 1);
      else if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choose, goNext, goTo, current]);

  const q = QUESTIONS[current];
  const dim = DIMENSIONS.find((d) => d.id === q.dimension)!;
  const groupNumber = DIMENSIONS.indexOf(dim) + 1;
  const answeredCount = answers.filter(Boolean).length;
  const percent = Math.round((answeredCount / TOTAL) * 100);
  const selected = answers[current];
  const isLast = current === TOTAL - 1;

  return (
    <div className="relative flex min-h-dvh flex-col">
      <div className="hidden md:block">
        <Blobs variant="soft" />
        <SiteHeader />
      </div>

      <main
        className={`relative mx-auto flex w-full max-w-[720px] flex-1 flex-col px-5 pb-6 pt-4 transition-opacity md:mb-12 md:mt-10 md:flex-none md:rounded-[28px] md:border md:border-line md:bg-white md:px-10 md:py-9 ${loaded ? "opacity-100" : "opacity-0"}`}
      >
        <div className="flex items-center gap-3">
          {current === 0 ? (
            <Link href="/" aria-label="Về trang bìa" className={`${iconBtn} md:hidden`}>
              <ArrowLeft />
            </Link>
          ) : (
            <button type="button" aria-label="Quay lại câu trước" onClick={() => goTo(current - 1)} className={`${iconBtn} md:hidden`}>
              <ArrowLeft />
            </button>
          )}
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex justify-between text-[13px] font-semibold md:text-sm">
              <span>
                Câu {current + 1} / {TOTAL}
              </span>
              <span className="text-muted">{percent}%</span>
            </div>
            <div
              role="progressbar"
              aria-label="Tiến độ làm bài"
              aria-valuemin={0}
              aria-valuemax={TOTAL}
              aria-valuenow={answeredCount}
              className="h-2.5 overflow-hidden rounded-full bg-track"
            >
              <div className="h-full rounded-full bg-sun-deep transition-[width] duration-300" style={{ width: `${percent}%` }} />
            </div>
          </div>
        </div>

        <div aria-hidden="true" className="mt-3.5 flex gap-1.5">
          {DIMENSIONS.map((d) => {
            const idx = QUESTIONS.map((qq, i) => (qq.dimension === d.id ? i : -1)).filter((i) => i >= 0);
            const done = idx.filter((i) => answers[i]).length;
            const color = done === idx.length ? "bg-sun-deep" : done > 0 ? "bg-[#ffd877]" : "bg-track";
            return <span key={d.id} className={`h-1 flex-1 rounded ${color}`} />;
          })}
        </div>

        <span className="mt-7 self-start rounded-full bg-mint-soft px-3 py-1.5 text-[13px] font-semibold text-mint-dark">
          Nhóm {groupNumber} · {dim.quizLabel}
        </span>
        <h1 key={current} className="mt-3.5 text-2xl font-bold leading-[1.35] md:text-[28px]">
          {q.text}
        </h1>

        <div className="mt-6 flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
          {(["a", "b"] as const).map((c) => {
            const active = selected === c;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={active}
                onClick={() => choose(c)}
                className={`flex items-start gap-3.5 rounded-[18px] border-2 px-4 py-[18px] text-left transition-colors md:min-h-[150px] md:flex-col md:rounded-[20px] md:p-5 ${
                  active ? "border-brand bg-peach-soft" : "border-line bg-white hover:border-line-strong hover:bg-cream"
                }`}
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-[10px] font-bold uppercase md:size-9 ${
                    active ? "bg-brand text-white" : "bg-[#fff4d6] text-sun-ink"
                  }`}
                >
                  {c}
                </span>
                <span className={`pt-1 text-base leading-normal md:pt-0 md:text-[17px] ${active ? "font-medium" : ""}`}>{q[c]}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto flex gap-3 pt-8 md:mt-8 md:items-center md:justify-between md:pt-0">
          <button type="button" onClick={() => goTo(current - 1)} disabled={current === 0} className={`${btnSecondary} flex-1 md:h-[52px] md:flex-none md:px-6`}>
            <ArrowLeft size={18} className="hidden md:block" />
            Câu trước
          </button>
          <span className="hidden text-[13px] text-muted lg:inline">Mẹo: nhấn phím A hoặc B để chọn nhanh</span>
          <button type="button" onClick={goNext} disabled={!selected} className={`${btnPrimary} flex-2 text-base md:h-[52px] md:flex-none md:px-7`}>
            {isLast ? "Hoàn thành" : "Câu tiếp theo"}
            <ArrowRight size={18} />
          </button>
        </div>
      </main>
    </div>
  );
}
