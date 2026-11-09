"use client";

import { ArrowRight } from "../icons";

const benefits = [
  {
    title: "Phân tích phong cách giao tiếp",
    detail: "Cùng nhìn lại kết quả MBTI, những xu hướng giao tiếp nổi bật và cách chúng thể hiện trong công việc của bạn",
  },
  {
    title: "Đối chiếu với tình huống nghề nghiệp",
    detail: "Trao đổi về những khó khăn giao tiếp thực tế bạn đang gặp phải trong quá trình làm việc, phối hợp hoặc phát triển sự nghiệp.",
  },
  {
    title: "Xác định 3 năng lực cần ưu tiên phát triển",
    detail: "Làm rõ 3 năng lực giao tiếp phù hợp để bạn tập trung cải thiện",
  },
];

export function ConsultationCallout({ onConsult }: { onConsult: () => void }) {
  return (
    <section aria-label="Tư vấn giao tiếp và nghề nghiệp" className="w-full max-w-[640px] rounded-3xl border border-line-strong bg-white px-4 py-4 shadow-sm max-[360px]:py-3 sm:px-8 sm:py-8">
      <ConsultationContent />
      <button
        type="button"
        onClick={onConsult}
        className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-2 text-center text-sm font-bold text-white transition-colors hover:bg-brand-dark max-[360px]:mt-3 sm:mt-6 sm:min-h-12 sm:w-auto sm:px-5 sm:py-3 sm:text-base"
      >
        Đăng ký tư vấn 1:1 miễn phí
        <ArrowRight size={18} />
      </button>
    </section>
  );
}

export function ConsultationContent({ plain = false }: { plain?: boolean }) {
  const Heading = plain ? "h1" : "h2";
  return (
    <>
      <Heading id={plain ? "consultation-intro-title" : undefined} className={plain
        ? "text-[26px] font-extrabold leading-[1.25] sm:text-[32px]"
        : "text-base font-extrabold leading-snug max-[360px]:leading-tight sm:text-xl"}>
        Xem kết quả và đăng ký tư vấn 1:1 nếu muốn được phân tích sâu hơn.
      </Heading>
      <p className={plain
        ? "mt-6 text-base font-semibold text-body"
        : "mt-3 text-[13px] font-semibold text-body sm:mt-5 sm:text-[15px]"}>
        Trong buổi tư vấn bạn sẽ được
      </p>
      <ol className={plain
        ? "mt-4 flex flex-col gap-5 text-[15px] leading-relaxed text-body sm:text-base"
        : "mt-2 flex flex-col gap-2.5 text-[13px] leading-[1.45] text-body max-[360px]:gap-2 max-[360px]:leading-[1.35] sm:mt-3 sm:gap-4 sm:text-[15px] sm:leading-relaxed"}>
        {benefits.map(({ title, detail }, index) => (
          <li key={title}>
            <strong className="block text-ink">{index + 1}. {title}</strong>
            <span>{detail}</span>
          </li>
        ))}
      </ol>
    </>
  );
}
