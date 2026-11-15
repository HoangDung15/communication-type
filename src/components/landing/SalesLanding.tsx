"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Check, ChevronDown } from "../icons";
import { btnPrimary, btnSecondary } from "../ui";
import { audience, faq, finalCta, hero, session, situations, testCta } from "./content";

// Landing cuộn (màn đầu trang chủ), bản rút gọn ~5–6 màn điện thoại.
// Chỉ trình bày; điều hướng do Landing.tsx truyền vào.

type Props = { onStartTest: () => void; onConsult: () => void };

export function SalesLanding({ onStartTest, onConsult }: Props) {
  const heroCta = useRef<HTMLDivElement>(null);
  const finalSection = useRef<HTMLElement>(null);
  const showSticky = useStickyCta(heroCta, finalSection);

  return (
    <>
      <div className="flex flex-col gap-14 pb-24 pt-8 lg:gap-20 lg:py-12">
        {/* 1. Hero */}
        <section aria-labelledby="hero-title" className="grid gap-7 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-12">
          <div>
            <h1 id="hero-title" className="text-[34px] font-extrabold leading-[1.18] tracking-[-0.5px] sm:text-[44px] lg:text-[56px] lg:leading-[1.12] lg:tracking-[-1px]">
              BETTER <span className="text-brand">TALK</span>, BETTER <span className="text-brand">WORK</span>
            </h1>
            <p className="mt-3 text-sm font-bold tracking-wide text-brand-dark sm:text-base">{hero.tagline}</p>
            <p className="mt-4 text-lg font-semibold leading-snug text-ink lg:text-[21px]">{hero.question}</p>
            <div ref={heroCta} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button type="button" onClick={onStartTest} className={`${btnPrimary} w-full sm:w-auto sm:px-8`}>
                {testCta}
                <ArrowRight />
              </button>
              <button type="button" onClick={onConsult} className={`${btnSecondary} w-full sm:w-auto sm:px-6`}>
                {session.cta}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <Illustration src="/landing/hero.webp" alt="Hai người trò chuyện qua buổi tư vấn online" priority />
            <div className="rounded-2xl border border-line bg-white p-5 shadow-sm lg:p-8">
              <h2 className="text-sm font-extrabold tracking-wide sm:text-base">{hero.benefitsTitle}</h2>
              <ul className="mt-3.5 flex flex-col gap-3">
                {hero.benefits.map((b) => (
                  <CheckItem key={b}>{b}</CheckItem>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 2. Tình huống */}
        <section aria-labelledby="situations-title" className="mx-auto w-full max-w-[760px]">
          <SectionTitle id="situations-title">{situations.title}</SectionTitle>
          <Illustration src="/landing/tinh-huong.webp" alt="Một người lúng túng khi trình bày trong cuộc họp" className="mx-auto mt-6 max-w-[480px]" />
          <ul className="mt-6 flex flex-col gap-2.5">
            {situations.items.map((s, i) => (
              <li key={s} className="flex items-center gap-3.5 rounded-xl border border-line bg-white px-4 py-3.5">
                <span className="text-lg font-extrabold leading-none text-sun-deep">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[15px] font-semibold leading-snug text-ink sm:text-base">{s}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-center text-[15px] leading-relaxed text-body sm:text-base">{situations.closing}</p>
        </section>

        {/* 3. Buổi tư vấn 1:1 (gộp 3 giá trị) */}
        <section aria-labelledby="session-title" className="rounded-2xl border border-line-strong bg-white px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          <SectionTitle id="session-title">{session.title}</SectionTitle>
          <p className="mx-auto mt-3 max-w-[680px] text-center text-[15px] leading-relaxed text-body sm:text-base">{session.lead}</p>
          <Illustration src="/landing/tu-van.webp" alt="Advisor và người tham gia cùng xem sơ đồ kết quả qua video call" className="mx-auto mt-6 max-w-[480px]" />
          <ol className="mt-6 grid gap-3 lg:grid-cols-3">
            {session.steps.map((s, i) => (
              <li key={s.label} className="rounded-xl bg-sun-soft p-4 lg:p-5">
                <p className="text-[17px] font-extrabold uppercase">
                  <span className="text-sun-ink">{i + 1}.</span> {s.label}
                </p>
                <p className="mt-1.5 text-[15px] leading-relaxed text-body">{s.detail}</p>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-col items-center gap-2.5">
            <button type="button" onClick={onConsult} className={`${btnPrimary} w-full sm:w-auto sm:px-8`}>
              {session.cta}
              <ArrowRight />
            </button>
            <p className="text-sm text-muted">{session.note}</p>
          </div>
        </section>

        {/* 4. Dành cho ai */}
        <section aria-labelledby="audience-title" className="mx-auto w-full max-w-[760px]">
          <SectionTitle id="audience-title">{audience.title}</SectionTitle>
          <p className="mt-3 text-center text-[15px] font-semibold leading-relaxed text-ink sm:text-base">{audience.lead}</p>
          <ul className="mt-5 flex flex-col gap-3 rounded-xl border border-line bg-white p-5">
            {audience.items.map((a) => (
              <CheckItem key={a}>{a}</CheckItem>
            ))}
          </ul>
        </section>

        {/* 5. FAQ */}
        <section aria-labelledby="faq-title" className="mx-auto w-full max-w-[760px]">
          <SectionTitle id="faq-title">{faq.title}</SectionTitle>
          <div className="mt-6 flex flex-col gap-2.5">
            {faq.items.map((f) => (
              <details key={f.q} className="group rounded-xl border border-line bg-white px-4 py-3.5 open:border-line-strong sm:px-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-[15px] font-bold leading-snug sm:text-base [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown size={20} className="mt-0.5 shrink-0 text-brand transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-2.5 text-[15px] leading-relaxed text-body">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* 6. CTA cuối */}
        <section ref={finalSection} aria-labelledby="final-title" className="rounded-2xl bg-sun px-5 py-9 text-center sm:px-10 lg:py-12">
          <h2 id="final-title" className="text-[26px] font-extrabold leading-[1.2] sm:text-[32px]">{finalCta.title}</h2>
          <p className="mx-auto mt-3 max-w-[560px] text-[15px] leading-relaxed text-[#5c3d00] sm:text-base">{finalCta.body}</p>
          <p className="mt-4 text-xs font-bold tracking-wide text-[#5c3d00] sm:text-sm">{finalCta.meta}</p>
          <button type="button" onClick={onStartTest} className={`${btnPrimary} mt-5 w-full sm:w-auto sm:px-8`}>
            {testCta}
            <ArrowRight />
          </button>
        </section>
      </div>

      {/* Nút cố định trên điện thoại: hiện khi đã kéo qua nút ở hero và chưa tới CTA cuối. */}
      <div
        aria-hidden={!showSticky}
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur transition-transform duration-200 lg:hidden ${
          showSticky ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
      >
        <button type="button" tabIndex={showSticky ? 0 : -1} onClick={onStartTest} className={`${btnPrimary} w-full`}>
          {testCta}
          <ArrowRight />
        </button>
      </div>
    </>
  );
}

// Hiện nút cố định khi nút ở hero đã cuộn khuất và khối CTA cuối chưa vào màn hình.
function useStickyCta(heroCta: React.RefObject<HTMLElement | null>, finalSection: React.RefObject<HTMLElement | null>) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const a = heroCta.current;
    const b = finalSection.current;
    if (!a || !b) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const heroGone = a.getBoundingClientRect().bottom < 0;
      const finalInView = b.getBoundingClientRect().top < window.innerHeight;
      setShow(heroGone && !finalInView);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [heroCta, finalSection]);
  return show;
}

// Ảnh minh hoạ chibi 4:3 (1024×765), bo góc để nền kem của ảnh không lộ cạnh.
function Illustration({ src, alt, className = "", priority = false }: { src: string; alt: string; className?: string; priority?: boolean }) {
  return (
    <div className={`w-full overflow-hidden rounded-2xl ${className}`}>
      <Image src={src} alt={alt} width={1024} height={765} priority={priority} sizes="(min-width: 1024px) 480px, 100vw" className="h-auto w-full" />
    </div>
  );
}

function SectionTitle({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="mx-auto max-w-[760px] text-center text-[22px] font-extrabold leading-[1.25] tracking-[-0.3px] sm:text-[28px] lg:text-[34px]">
      {children}
    </h2>
  );
}

function CheckItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-[15px] leading-relaxed text-body sm:text-base">
      <span aria-hidden="true" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-mint text-white">
        <Check size={14} strokeWidth={3} />
      </span>
      <span>{children}</span>
    </li>
  );
}
