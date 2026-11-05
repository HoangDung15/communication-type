"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Blobs, SiteHeader } from "./SiteHeader";
import { ArrowRight, Check, Clock, Grid, ListCheck } from "./icons";
import { btnPrimary, btnSecondary, iconBtn } from "./ui";
import { ConsultModal } from "./ConsultModal";
import { FieldIcon } from "./FieldIcon";
import { CirclesDiagram } from "./result/CirclesDiagram";
import { ZoneModal } from "./result/ZoneModal";
import { DIMENSIONS, QUESTIONS, type Choice } from "@/lib/questions";
import { computeResult } from "@/lib/mbti";
import { quizStore, resultStore, thanksStore, type StoredResult } from "@/lib/client-store";
import type { ZonesFileEntry } from "@/lib/zones";
import type { ZoneKey } from "@/lib/zones-types";

// Landing một trang cuộn (FLOW_PLAN §1): intro → bài test → kết quả → tư vấn.

type LandingProps = {
  fieldsByType: Record<string, string[]>;
  fieldCount: number;
  zoneEntries: Record<string, Record<string, ZonesFileEntry>>;
  validCodes: string[] | null;
};

const TOTAL = QUESTIONS.length;
const AUTO_ADVANCE_MS = 260;

export function Landing({ fieldsByType, fieldCount, zoneEntries, validCodes }: LandingProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [thanks, setThanks] = useState(false);
  const [result, setResult] = useState<StoredResult | null>(null);

  // Quiz state (giữ logic Quiz.tsx, thêm bước chọn lĩnh vực)
  const [answers, setAnswers] = useState<(Choice | null)[]>(() => Array(TOTAL).fill(null));
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [openZone, setOpenZone] = useState<ZoneKey | null>(null);
  const [seenZones, setSeenZones] = useState<Set<ZoneKey>>(new Set());
  const [step, setStep] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const storedType = result?.type;
  const fields = storedType ? (fieldsByType[storedType] ?? []) : [];
  const entry = storedType && result?.field ? zoneEntries[storedType]?.[result.field] : null;
  const complete = entry?.complete;

  useEffect(() => {
    const saved = quizStore.get();
    if (saved && saved.answers.length === TOTAL) {
      setAnswers(saved.answers);
      setCurrent(Math.min(Math.max(saved.current, 0), TOTAL - 1));
    }
    const r = resultStore.get();
    if (r?.field) {
      setResult(r);
      setSelectedField(r.field);
    }
    setLoaded(true);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (loaded) quizStore.set({ answers, current });
  }, [answers, current, loaded]);

  const openConsult = useCallback(() => {
    setThanks(false);
    setModalOpen(true);
  }, []);

  const goToStep = useCallback((n: number) => {
    setStep(Math.min(Math.max(n, 0), 3));
    window.scrollTo({ top: 0 });
  }, []);

  const pickZone = useCallback((key: ZoneKey) => {
    setSeenZones((prev) => new Set(prev).add(key));
    setOpenZone(key);
  }, []);

  const finishQuiz = useCallback((final: (Choice | null)[]) => {
    const r = computeResult(final);
    if (!r) return;
    const stored: StoredResult = { ...r, answers: final.join("") };
    resultStore.set(stored);
    setResult(stored);
    setSelectedField(stored.field ?? null);
  }, []);

  const confirmField = useCallback(() => {
    if (!result || !selectedField) return;
    const next = { ...result, field: selectedField };
    resultStore.set(next);
    setResult(next);
    setOpenZone(null);
    setSeenZones(new Set());
    goToStep(3);
  }, [result, selectedField, goToStep]);

  const restartQuiz = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setCurrent(0);
    setAnswers(Array(TOTAL).fill(null));
    goToStep(2);
  }, [goToStep]);

  const choose = useCallback(
    (choice: Choice) => {
      const next = [...answers];
      next[current] = choice;
      setAnswers(next);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        if (current < TOTAL - 1) setCurrent(current + 1);
        else finishQuiz(next);
      }, AUTO_ADVANCE_MS);
    },
    [answers, current, finishQuiz],
  );

  const answeredCount = answers.filter(Boolean).length;
  const percent = Math.round((answeredCount / TOTAL) * 100);
  const selected = answers[current];
  const testDone = answeredCount === TOTAL && storedType;

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <Blobs />

      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-16 lg:px-10">
        {step === 0 && (
        <section aria-labelledby="intro-title" className="flex min-h-[calc(100dvh-160px)] flex-1 flex-col justify-center py-8 lg:py-4">
          <div className="flex flex-1 flex-col justify-center">
            <h1 id="intro-title" className="mt-[18px] text-[34px] font-extrabold leading-[1.18] tracking-[-0.5px] sm:text-[44px] lg:mt-6 lg:text-[56px] lg:leading-[1.12] lg:tracking-[-1px]">
              BETTER <span className="text-brand">TALK</span>, BETTER <span className="text-brand">WORK</span>            
            </h1>
              <p className="mt-3.5 max-w-[540px] text-base leading-relaxed text-body lg:mt-5 lg:text-[19px]">
                <strong>VỀ DỰ ÁN</strong> <br />
                Trong công việc, giao tiếp không chỉ là cách bạn nói chuyện, mà còn quyết định cách bạn kết nối, phối hợp và tạo ra giá trị. <br /><br />
                
                <strong>BETTER TALK, BETTER WORK</strong> giúp bạn khám phá phong cách giao tiếp cá nhân thông qua MBTI, đối chiếu với đặc thù giao tiếp của ngành nghề và nhận diện những năng lực cần phát triển. <br /><br />
                
                Bởi muốn tạo nên kết quả khác biệt, bạn không thể mãi giao tiếp theo cách thông thường. Hãy chủ động, quyết liệt và năng động để tạo nên phong cách giao tiếp mang dấu ấn riêng và vượt trội trong công việc.
              </p>

            <ul className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2 lg:mt-7 lg:justify-start lg:gap-x-6">
              <li className="flex items-center gap-1.5 text-sm font-medium text-body lg:text-[15px]">
                <ListCheck size={18} className="text-brand" />
                {TOTAL} câu hỏi
              </li>
              <li className="flex items-center gap-1.5 text-sm font-medium text-body lg:text-[15px]">
                <Clock size={18} className="text-brand" />
                Khoảng 3 phút
              </li>
              <li className="flex items-center gap-1.5 text-sm font-medium text-body lg:text-[15px]">
                <Grid size={18} className="text-brand" />
                {fieldCount} lĩnh vực
              </li>
            </ul>
            <div className="mt-8 flex flex-col lg:mt-9 lg:flex-row lg:items-center lg:gap-5">
              <button type="button" onClick={() => goToStep(1)} className={`${btnPrimary} w-full lg:h-[60px] lg:w-auto lg:px-8 lg:text-lg`}>
                Bài test
                <ArrowRight />
              </button>
              <button
                type="button"
                onClick={openConsult}
                className="mt-3 text-center text-[15px] font-semibold text-brand-dark hover:underline lg:mt-0"
              >
                Kết nối tư vấn →
              </button>
            </div>
          </div>
        </section>
        )}

        {step === 1 && (
        <section aria-labelledby="explore-title" className="flex min-h-[calc(100dvh-160px)] flex-1 flex-col justify-center py-8 lg:py-4">
          <div className="my-auto flex w-full max-w-[600px] flex-col">
            <h1 id="explore-title" className="text-[32px] font-extrabold leading-[1.15] tracking-[-0.5px] sm:text-[40px] lg:text-[52px] lg:leading-[1.1]">
              KHÁM PHÁ PHONG CÁCH GIAO TIẾP CỦA BẠN
            </h1>
            <ul className="mt-4 flex flex-col gap-2.5 text-base leading-relaxed text-body lg:text-[17px]">
              <li>• <strong>Tôi là ai?</strong> – Xu hướng tính cách và cách tương tác.</li>
              <li>• <strong>Tôi giao tiếp thế nào?</strong> – Phong cách, thế mạnh và rào cản giao tiếp.</li>
              <li>• <strong>Nghề nghiệp cần gì?</strong> – Những tiêu chuẩn giao tiếp đặc thù.</li>
              <li>• <strong>Tôi cần phát triển gì?</strong> – Những năng lực cần cải thiện để làm việc hiệu quả hơn.</li>
            </ul>
            <p className="mt-6 text-base leading-relaxed text-body lg:text-[17px]">
              <strong>TÔI QUYẾT LIỆT TRỞ THÀNH...</strong> <br />
              Một người giao tiếp độc đáo, chủ động và vượt trội. <br />
              Không ngừng phát huy thế mạnh, quyết liệt thay đổi những giới hạn và năng động thích nghi với yêu cầu nghề nghiệp.
            </p>
            <p className="mt-4 text-base font-bold leading-relaxed lg:text-[17px]">
              BETTER TALK. BETTER WORK. BETTER YOU.
            </p>
            <StepNav
              onBack={() => goToStep(0)}
              nextLabel="Bắt đầu bài test"
              onNext={() => goToStep(2)}
            />
          </div>
        </section>
        )}

        {step === 2 && (
        <section aria-label="Bài test" className="pt-8 lg:pt-4">
          <div className="mx-auto w-full max-w-[720px] rounded-[28px] border border-line bg-white px-5 py-7 md:px-10 md:py-9">
            <button type="button" onClick={() => goToStep(1)} className="mb-5 text-[15px] font-semibold text-brand-dark hover:underline">
              ← Quay lại
            </button>
            {!testDone ? (
              <QuizBody
                answers={answers}
                current={current}
                loaded={loaded}
                selected={selected}
                percent={answeredCount === 0 ? 0 : Math.round((answeredCount / TOTAL) * 100)}
                onChoose={choose}
                onPrev={() => {
                  if (timer.current) clearTimeout(timer.current);
                  setCurrent(Math.min(Math.max(current - 1, 0), TOTAL - 1));
                }}
                onNext={() => {
                  if (!selected) return;
                  if (current < TOTAL - 1) setCurrent(current + 1);
                  else finishQuiz(answers);
                }}
              />
            ) : (
              <FieldStep
                type={storedType!}
                fields={fields}
                zoneEntries={zoneEntries[storedType!] ?? {}}
                selected={selectedField}
                onSelect={setSelectedField}
                onConfirm={confirmField}
                onRestart={() => {
                  setCurrent(0);
                  setAnswers(Array(TOTAL).fill(null));
                }}
              />
            )}
          </div>
        </section>

        )}

        {step === 3 && storedType && result?.field && (
          <>
          <section aria-label="Kết quả của bạn" className="pt-8 lg:pt-4">
            <div className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-4">
              <section className="relative w-full overflow-hidden rounded-3xl bg-sun px-5 py-6 text-center">
                <p className="relative text-sm font-semibold text-[#5c3d00]">Phong cách giao tiếp của bạn</p>
                <h2 className="relative mt-1.5 text-[64px] font-extrabold leading-none tracking-[2px]">{storedType}</h2>
                <span className="relative mt-4 inline-block rounded-full bg-ink px-3 py-1.5 text-[13px] font-semibold text-white">
                  Lĩnh vực: {result.field}
                </span>
              </section>
              {complete && entry ? (
                <>
                  <CirclesDiagram seen={seenZones} onSelect={pickZone} />
                  <p className="max-w-[420px] text-center text-sm leading-relaxed text-body">
                    Nhấn vào từng vòng tròn để khám phá kết quả của bạn.
                  </p>
                </>
              ) : (
                <div className="w-full rounded-3xl border border-dashed border-line-strong bg-white px-5 py-6 text-[15px] leading-relaxed text-body">
                  Nội dung cho {storedType} trong lĩnh vực “{result.field}” đang được hoàn thiện. Bạn chọn lĩnh vực
                  khác hoặc đăng ký tư vấn trực tiếp nhé.
                </div>
              )}
            </div>
          </section>

        <div aria-label="Kết nối tư vấn" className="mx-auto w-full max-w-[640px] pt-8">
          <div className="relative flex flex-col gap-3 overflow-hidden rounded-3xl bg-ink px-5 py-6 text-white lg:px-8 lg:py-8">
            <h2 className="relative text-[22px] font-extrabold leading-[1.3] lg:text-2xl">Muốn áp dụng thế mạnh này vào công việc?</h2>
            <ol className="relative mt-2 flex flex-col gap-3 text-[15px] leading-relaxed text-line">
              <li className="flex gap-2.5"><span className="font-bold text-sun">1.</span> Đăng ký tư vấn — để lại thông tin, kèm hoặc không kèm kết quả test.</li>
              <li className="flex gap-2.5"><span className="font-bold text-sun">2.</span> Xác nhận — đội ngũ liên hệ trong khung giờ bạn chọn.</li>
              <li className="flex gap-2.5"><span className="font-bold text-sun">3.</span> Kết nối — buổi tư vấn 1-1 về cách giao tiếp hiệu quả hơn.</li>
            </ol>
            <button type="button" onClick={openConsult} className="relative mt-3 inline-flex h-14 items-center justify-center gap-2.5 self-start rounded-2xl bg-sun px-8 text-[17px] font-bold text-ink transition-colors hover:bg-sun-deep">
              Kết nối tư vấn
              <ArrowRight />
            </button>
          </div>
        </div>
          <div className="mx-auto w-full max-w-[640px] pt-6">
            <button type="button" onClick={restartQuiz} className="text-[15px] font-semibold text-brand-dark hover:underline">
              ← Làm lại bài test
            </button>
          </div>
          </>
        )}
      </main>

      <ConsultModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        validCodes={validCodes}
        onSuccess={(info) => {
          thanksStore.set({ name: info.name, email: "", emailSent: false });
          setThanks(true);
        }}
      />
      {openZone && complete && entry?.zones[openZone] && (
        <ZoneModal
          zoneKey={openZone}
          zone={entry.zones[openZone]!}
          onClose={() => setOpenZone(null)}
          onConsult={() => {
            setOpenZone(null);
            openConsult();
          }}
        />
      )}
      {thanks && (
        <ThanksOverlay
          onClose={() => setThanks(false)}
          onBackToResult={() => {
            setThanks(false);
            setModalOpen(false);
            goToStep(3);
          }}
        />
      )}
    </div>
  );
}

function LandingHeader({ onConsult, onTest }: { onConsult: () => void; onTest: () => void }) {
  return (
    <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-5 lg:px-10 lg:pt-7">
      <span className="text-[15px] font-bold lg:text-lg">BETTER TALK, BETTER WORK</span>
      <nav className="flex items-center gap-2" aria-label="Điều hướng chính">
        <button
          type="button"
          onClick={onTest}
          className="inline-flex h-11 items-center rounded-xl px-3 text-sm font-semibold text-brand-dark hover:bg-peach-soft"
        >
          Bài test
        </button>
        <button
          type="button"
          onClick={onConsult}
          className="inline-flex h-11 items-center rounded-xl bg-brand px-4 text-sm font-bold text-white transition-colors hover:bg-brand-dark"
        >
          Kết nối tư vấn
        </button>
      </nav>
    </header>
  );
}

function StepNav({ onBack, nextLabel, onNext }: { onBack?: () => void; nextLabel: string; onNext: () => void }) {
  return (
    <div className="mt-8 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      {onBack ? (
        <button type="button" onClick={onBack} className={`${btnSecondary} w-full md:w-auto md:px-6`}>
          Quay lại
        </button>
      ) : (
        <span className="hidden md:block" />
      )}
      <button type="button" onClick={onNext} className={`${btnPrimary} w-full md:w-auto md:px-7`}>
        {nextLabel}
        <ArrowRight />
      </button>
    </div>
  );
}

function QuizBody({
  answers, current, loaded, selected, percent, onChoose, onPrev, onNext,
}: {
  answers: (Choice | null)[];
  current: number;
  loaded: boolean;
  selected: Choice | null;
  percent: number;
  onChoose: (c: Choice) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const q = QUESTIONS[current];
  const dim = DIMENSIONS.find((d) => d.id === q.dimension)!;
  const groupNumber = DIMENSIONS.indexOf(dim) + 1;
  const isLast = current === TOTAL - 1;
  return (
    <div className={`transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`}>
      <div className="flex items-center gap-3">
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex justify-between text-[13px] font-semibold md:text-sm">
            <span>Câu {current + 1} / {TOTAL}</span>
            <span className="text-muted">{percent}%</span>
          </div>
          <div role="progressbar" aria-label="Tiến độ làm bài" aria-valuemin={0} aria-valuemax={TOTAL} aria-valuenow={answers.filter(Boolean).length} className="h-2.5 overflow-hidden rounded-full bg-track">
            <div className="h-full rounded-full bg-sun-deep transition-[width] duration-300" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>
      <span className="mt-7 self-start rounded-full bg-mint-soft px-3 py-1.5 text-[13px] font-semibold text-mint-dark">
        Nhóm {groupNumber} · {dim.quizLabel}
      </span>
      <h2 key={current} className="mt-3.5 text-2xl font-bold leading-[1.35] md:text-[28px]">{q.text}</h2>
      <div className="mt-6 flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
        {(["a", "b"] as const).map((c) => {
          const active = selected === c;
          return (
            <button
              key={c}
              type="button"
              aria-pressed={active}
              onClick={() => onChoose(c)}
              className={`flex items-start gap-3.5 rounded-[18px] border-2 px-4 py-[18px] text-left transition-colors md:min-h-[150px] md:flex-col md:rounded-[20px] md:p-5 ${
                active ? "border-brand bg-peach-soft" : "border-line bg-white hover:border-line-strong hover:bg-cream"
              }`}
            >
              <span className={`flex size-8 shrink-0 items-center justify-center rounded-[10px] font-bold uppercase md:size-9 ${active ? "bg-brand text-white" : "bg-[#fff4d6] text-sun-ink"}`}>{c}</span>
              <span className={`pt-1 text-base leading-normal md:pt-0 md:text-[17px] ${active ? "font-medium" : ""}`}>{q[c]}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-auto flex gap-3 pt-8 md:mt-8 md:items-center md:justify-between md:pt-0">
        <button type="button" onClick={onPrev} disabled={current === 0} className={`${btnSecondary} flex-1 md:flex-none md:px-6`}>Câu trước</button>
        <button type="button" onClick={onNext} disabled={!selected} className={`${btnPrimary} flex-2 text-base md:flex-none md:px-7`}>
          {isLast ? "Hoàn thành" : "Câu tiếp theo"}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

function FieldStep({
  type, fields, zoneEntries, selected, onSelect, onConfirm, onRestart,
}: {
  type: string;
  fields: string[];
  zoneEntries: Record<string, ZonesFileEntry>;
  selected: string | null;
  onSelect: (f: string) => void;
  onConfirm: () => void;
  onRestart: () => void;
}) {
  return (
    <div id="chon-linh-vuc" className="scroll-mt-20">
      <div className="flex items-center gap-3">
        <button type="button" aria-label="Quay lại câu hỏi" onClick={onRestart} className={iconBtn}>←</button>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex justify-between text-[13px] font-semibold md:text-sm">
            <span>Bước cuối</span>
            <span className="text-mint-dark">Đã xong {TOTAL}/{TOTAL} câu</span>
          </div>
          <div aria-hidden="true" className="h-2.5 rounded-full bg-sun-deep" />
        </div>
      </div>
      <h2 className="mt-7 text-[26px] font-extrabold leading-[1.3] md:text-[30px]">Bạn đang làm trong lĩnh vực nào?</h2>
      <p className="mt-2.5 text-[15px] leading-relaxed text-body md:text-base">
        Kết quả sẽ được phân tích riêng cho môi trường giao tiếp của lĩnh vực này. Kiểu {type} của bạn có {fields.length} lĩnh vực.
      </p>
      <div role="radiogroup" aria-label="Lĩnh vực" className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        {fields.map((field, i) => {
          const active = selected === field;
          const complete = zoneEntries[field]?.complete;
          return (
            <button
              key={field}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={!complete}
              title={!complete ? "Nội dung đang hoàn thiện" : undefined}
              onClick={() => onSelect(field)}
              className={`relative flex min-h-[118px] flex-col gap-3.5 rounded-[18px] border-2 p-4 text-left transition-colors ${
                active ? "border-brand bg-peach-soft" : "border-line bg-white hover:border-line-strong hover:bg-cream"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <FieldIcon name={field} index={i} active={active} />
              <span className="text-[15px] font-bold leading-snug">{field}</span>
              {!complete && <span className="text-xs font-semibold text-muted">Đang hoàn thiện</span>}
              {active && complete && (
                <span aria-hidden="true" className="absolute right-3 top-3 flex size-[22px] items-center justify-center rounded-full bg-brand text-white">
                  <Check size={14} strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-auto pt-8 md:mt-8 md:flex md:justify-end md:pt-0">
        <button type="button" onClick={onConfirm} disabled={!selected} className={`${btnPrimary} w-full md:w-auto`}>
          Xem kết quả của tôi
          <ArrowRight />
        </button>
      </div>
    </div>
  );
}

function ThanksOverlay({ onClose, onBackToResult }: { onClose: () => void; onBackToResult: () => void }) {
  const hasResult = Boolean(resultStore.get()?.field);
  return (
    <div role="dialog" aria-modal="true" aria-label="Đăng ký thành công" className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div aria-hidden="true" className="absolute inset-0 bg-ink/55" />
      <div className="relative w-full max-w-[480px] rounded-t-[24px] bg-white px-5 py-7 text-center shadow-2xl sm:rounded-[24px] sm:px-8">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-mint text-white">
          <Check size={40} />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold">Cảm ơn bạn!</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-body">
          Đội ngũ đã nhận được thông tin và sẽ sớm liên hệ với bạn.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          {hasResult && (
            <button type="button" onClick={onBackToResult} className={btnPrimary}>
              Xem lại kết quả của tôi
              <ArrowRight />
            </button>
          )}
          <button type="button" onClick={onClose} className="inline-flex h-12 items-center justify-center rounded-2xl text-[15px] font-semibold text-brand-dark hover:bg-peach-soft">
            {hasResult ? "Ở lại trang này" : "Đóng"}
          </button>
        </div>
      </div>
    </div>
  );
}
