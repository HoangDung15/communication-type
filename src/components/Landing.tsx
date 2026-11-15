"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Blobs } from "./SiteHeader";
import { ArrowRight, Check } from "./icons";
import { btnPrimary, btnSecondary } from "./ui";
import Image from "next/image";
import { SalesLanding } from "./landing/SalesLanding";
import { TYPE_PROFILES, typeImage } from "@/lib/type-profiles";
import { ConsultModal } from "./ConsultModal";
import { FieldIcon } from "./FieldIcon";
import { ZoneJourney, isUnlocked, journeyNextProps } from "./result/ZoneJourney";
import { ConsultationCallout, RegisteredNote } from "./result/ConsultationCallout";
import { useRegistered } from "@/lib/use-registered";
import { ConsultStickyBar } from "./result/ConsultStickyBar";
import { ZoneModal } from "./result/ZoneModal";
import { DIMENSIONS, QUESTIONS, type Choice } from "@/lib/questions";
import { computeResult } from "@/lib/mbti";
import { quizStore, resultStore, type StoredResult } from "@/lib/client-store";
import { trackEvent } from "@/lib/analytics";
import type { ZonesFileEntry } from "@/lib/zones";
import type { ZoneKey } from "@/lib/zones-types";

// Trang chủ: landing cuộn (SalesLanding) → bài test + chọn lĩnh vực → kết quả + tư vấn.

type LandingProps = {
  fieldsByType: Record<string, string[]>;
  zoneEntries: Record<string, Record<string, ZonesFileEntry>>;
  validCodes: string[] | null;
};

const TOTAL = QUESTIONS.length;
const AUTO_ADVANCE_MS = 260;
const STEP = { INTRO: 0, QUIZ: 1, RESULT: 2 } as const;

function randomizeAnswerSides(): Choice[] {
  const first = QUESTIONS.map((): Choice => Math.random() < 0.5 ? "a" : "b");
  for (const dimension of DIMENSIONS) {
    const indices = QUESTIONS.flatMap((q, index) => q.dimension === dimension.id ? [index] : []);
    if (indices.every((index) => first[index] === first[indices[0]])) {
      const index = indices[Math.floor(Math.random() * indices.length)];
      first[index] = first[index] === "a" ? "b" : "a";
    }
  }
  return first;
}

export function Landing({ fieldsByType, zoneEntries, validCodes }: LandingProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [result, setResult] = useState<StoredResult | null>(null);

  // Quiz state (giữ logic Quiz.tsx, thêm bước chọn lĩnh vực)
  const [answers, setAnswers] = useState<(Choice | null)[]>(() => Array(TOTAL).fill(null));
  const [firstChoices, setFirstChoices] = useState<Choice[]>(() => Array(TOTAL).fill("a"));
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [openZone, setOpenZone] = useState<ZoneKey | null>(null);
  const [seenZones, setSeenZones] = useState<Set<ZoneKey>>(new Set());
  const registered = useRegistered();
  const [step, setStep] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quizReadyToCount = useRef(false);
  const quizCompletionTracked = useRef(false);

  const storedType = result?.type;
  const fields = storedType ? (fieldsByType[storedType] ?? []) : [];
  const entry = storedType && result?.field ? zoneEntries[storedType]?.[result.field] : null;
  const complete = entry?.complete;

  useEffect(() => {
    setFirstChoices(randomizeAnswerSides());
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
    trackEvent("registration_opened", "modal");
    setModalOpen(true);
  }, []);

  const goToStep = useCallback((n: number) => {
    setStep(Math.min(Math.max(n, STEP.INTRO), STEP.RESULT));
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
    quizReadyToCount.current = true;
  }, []);

  const confirmField = useCallback(() => {
    if (!result || !selectedField) return;
    const next = { ...result, field: selectedField };
    resultStore.set(next);
    setResult(next);
    setOpenZone(null);
    setSeenZones(new Set());
    if (quizReadyToCount.current && !quizCompletionTracked.current) {
      quizCompletionTracked.current = true;
      trackEvent("quiz_completed");
    }
    goToStep(STEP.RESULT);
  }, [result, selectedField, goToStep]);

  const restartQuiz = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setCurrent(0);
    setAnswers(Array(TOTAL).fill(null));
    quizReadyToCount.current = false;
    quizCompletionTracked.current = false;
    goToStep(STEP.QUIZ);
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
        {step === STEP.INTRO && (
          <SalesLanding onStartTest={() => goToStep(STEP.QUIZ)} onConsult={openConsult} />
        )}

        {step === STEP.QUIZ && (
        <section aria-label="Bài test" className="flex min-h-[calc(100dvh-160px)] flex-1 flex-col justify-center py-8 lg:py-4">
          <div className="mx-auto w-full max-w-[720px] rounded-2xl border border-line bg-white px-5 py-7 md:px-10 md:py-9">
            <button type="button" onClick={() => goToStep(STEP.INTRO)} className="mb-5 text-[15px] font-semibold text-brand-dark hover:underline">
              ← Quay lại
            </button>
            {!testDone ? (
              <QuizBody
                answers={answers}
                firstChoice={firstChoices[current]}
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
              />
            )}
          </div>
        </section>

        )}

        {step === STEP.RESULT && storedType && result?.field && (
          <>
          <section aria-label="Kết quả của bạn" className="pt-8 lg:pt-4">
            <div className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-4">
              <button type="button" onClick={restartQuiz} className="self-start text-[15px] font-semibold text-brand-dark hover:underline">
                ← Làm lại bài test
              </button>
              <TypeCard type={storedType} field={result.field} />
              {complete && entry ? (
                <ZoneJourney zones={entry.zones} seen={seenZones} onSelect={pickZone} />
              ) : (
                <div className="w-full rounded-2xl border border-dashed border-line-strong bg-white px-5 py-6 text-[15px] leading-relaxed text-body">
                  Nội dung cho {storedType} trong lĩnh vực “{result.field}” đang được hoàn thiện. Bạn chọn lĩnh vực
                  khác hoặc đăng ký tư vấn trực tiếp nhé.
                </div>
              )}
              {registered ? <RegisteredNote /> : <ConsultationCallout onConsult={openConsult} />}
            </div>
          </section>
          <ConsultStickyBar show={!registered && Boolean(complete) && isUnlocked(seenZones)} onConsult={openConsult} />
          </>
        )}
      </main>

      <ConsultModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        validCodes={validCodes}
      />
      {openZone && complete && entry?.zones[openZone] && (
        <ZoneModal
          key={openZone}
          zoneKey={openZone}
          zone={entry.zones[openZone]!}
          onClose={() => setOpenZone(null)}
          deep={entry?.deep}
          {...journeyNextProps(openZone, seenZones, pickZone)}
          onConsult={
            registered
              ? undefined
              : () => {
                  setOpenZone(null);
                  openConsult();
                }
          }
        />
      )}
    </div>
  );
}

// Thẻ nhân vật: ảnh chibi (nếu có) + mã + biệt danh + 3 nhãn + lĩnh vực.
function TypeCard({ type, field }: { type: string; field: string }) {
  const profile = TYPE_PROFILES[type];
  const img = typeImage(type);
  return (
    <section id="result-summary" className="relative w-full scroll-mt-4 overflow-hidden rounded-2xl bg-sun px-5 py-6 text-center">
      {img && (
        <div className="mx-auto size-[168px] overflow-hidden rounded-full bg-sun-soft sm:size-[200px]">
          <Image src={img} alt={`Nhân vật ${type}`} width={400} height={400} priority className="size-full object-cover" />
        </div>
      )}
      <p className={`text-sm font-semibold text-[#5c3d00] ${img ? "mt-3" : ""}`}>Phong cách giao tiếp của bạn</p>
      <h2 className="mt-1 text-[56px] font-extrabold leading-none tracking-[2px] sm:text-[64px]">{type}</h2>
      {profile && (
        <>
          <p className="mt-1.5 text-lg font-extrabold">{profile.nickname}</p>
          <ul className="mt-3 flex flex-wrap justify-center gap-1.5">
            {profile.tags.map((t) => (
              <li key={t} className="rounded-full bg-white/85 px-3 py-1 text-[13px] font-semibold text-ink">{t}</li>
            ))}
          </ul>
        </>
      )}
      <span className="mt-4 inline-block rounded-full bg-ink px-3 py-1.5 text-[13px] font-semibold text-white">Lĩnh vực: {field}</span>
    </section>
  );
}

// Lời mời tư vấn rút gọn ngay dưới thẻ; khối đầy đủ nằm dưới sơ đồ.
function QuizBody({
  answers, firstChoice, current, loaded, selected, percent, onChoose, onPrev, onNext,
}: {
  answers: (Choice | null)[];
  firstChoice: Choice;
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
      <span className="mt-7 inline-block rounded-full bg-mint-soft px-3 py-1.5 text-[13px] font-semibold text-mint-dark">
        Nhóm {groupNumber} · {dim.quizLabel}
      </span>
      <h2 key={current} className="mt-3.5 text-2xl font-bold leading-[1.35] md:text-[28px]">{q.text}</h2>
      <div className="mt-6 flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
        {([firstChoice, firstChoice === "a" ? "b" : "a"] as Choice[]).map((c, index) => {
          const active = selected === c;
          return (
            <button
              key={c}
              type="button"
              aria-pressed={active}
              onClick={() => onChoose(c)}
              className={`flex items-start gap-3.5 rounded-xl border-2 px-4 py-[18px] text-left transition-colors md:min-h-[150px] md:flex-col md:rounded-xl md:p-5 ${
                active ? "border-brand bg-peach-soft" : "border-line bg-white hover:border-line-strong hover:bg-cream"
              }`}
            >
              <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg font-bold uppercase md:size-9 ${active ? "bg-brand text-white" : "bg-[#fff4d6] text-sun-ink"}`}>{index === 0 ? "a" : "b"}</span>
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
  type, fields, zoneEntries, selected, onSelect, onConfirm,
}: {
  type: string;
  fields: string[];
  zoneEntries: Record<string, ZonesFileEntry>;
  selected: string | null;
  onSelect: (f: string) => void;
  onConfirm: () => void;
}) {
  return (
    <div id="chon-linh-vuc" className="scroll-mt-20">
      <div className="flex items-center gap-3">
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
              className={`relative flex min-h-[118px] flex-col gap-3.5 rounded-xl border-2 p-4 text-left transition-colors ${
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
