"use client";

import { ArrowRight } from "../icons";

const benefits = [
  {
    title: "Phân tích kết quả MBTI của bạn",
    detail: "Cùng Advisor nhìn lại phong cách tư duy, giao tiếp và cách chúng thể hiện trong công việc của bạn.",
  },
  {
    title: "Đối chiếu với tình huống thực tế",
    detail: "Trao đổi về những tình huống bạn đang gặp: trình bày ý tưởng, phản biện, xử lý bất đồng, phối hợp với người khác.",
  },
  {
    title: "Xác định 3 năng lực cần ưu tiên phát triển",
    detail: "Nhận diện điểm mạnh, rào cản và 3 năng lực giao tiếp nên tập trung cải thiện.",
  },
];

// Lời mời tư vấn 1:1 ở đầu trang kết quả.
export function ConsultationCallout({ onConsult }: { onConsult: () => void }) {
  return (
    <section aria-label="Tư vấn 1:1 cùng Advisor" className="w-full max-w-[640px] rounded-2xl border border-line-strong bg-white px-4 py-4 shadow-sm max-[360px]:py-3 sm:px-8 sm:py-8">
      <h2 className="text-base font-extrabold leading-snug max-[360px]:leading-tight sm:text-xl">
        Muốn hiểu kết quả này liên quan thế nào đến công việc của bạn?
      </h2>
      <p className="mt-2 text-[13px] font-semibold text-mint-dark sm:mt-3 sm:text-sm">
        Online 1:1 · 60–90 phút · Miễn phí · Advisor chủ động liên hệ sắp lịch
      </p>
      <p className="mt-3 text-[13px] font-semibold text-body sm:mt-5 sm:text-[15px]">Trong buổi tư vấn, bạn sẽ được:</p>
      <ol className="mt-2 flex flex-col gap-2.5 text-[13px] leading-[1.45] text-body max-[360px]:gap-2 max-[360px]:leading-[1.35] sm:mt-3 sm:gap-4 sm:text-[15px] sm:leading-relaxed">
        {benefits.map(({ title, detail }, index) => (
          <li key={title}>
            <strong className="block text-ink">{index + 1}. {title}</strong>
            <span>{detail}</span>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={onConsult}
        className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-center text-sm font-bold text-white transition-colors hover:bg-brand-dark max-[360px]:mt-3 sm:mt-6 sm:min-h-12 sm:w-auto sm:px-5 sm:py-3 sm:text-base"
      >
        Đăng ký tư vấn 1:1 miễn phí
        <ArrowRight size={18} />
      </button>
      <p className="mt-2 text-xs text-muted sm:text-[13px]">Số lượng suất tư vấn miễn phí có giới hạn.</p>
    </section>
  );
}

// Thay cho lời mời khi máy này đã gửi đăng ký tư vấn.
export function RegisteredNote() {
  return (
    <section aria-label="Đã đăng ký tư vấn" className="flex w-full max-w-[640px] items-start gap-3 rounded-2xl border border-mint/30 bg-mint-faint px-4 py-4 sm:px-6">
      <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-mint text-base font-extrabold text-white">
        ✓
      </span>
      <div>
        <h2 className="text-base font-extrabold leading-snug text-ink">Bạn đã đăng ký tư vấn 1:1</h2>
        <p className="mt-1 text-sm leading-relaxed text-body">
          Advisor sẽ liên hệ qua số điện thoại / Zalo trong khung giờ bạn đã chọn để sắp lịch.
        </p>
      </div>
    </section>
  );
}
