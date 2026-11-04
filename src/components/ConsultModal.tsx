"use client";

import { useEffect, useState } from "react";
import { RegisterForm } from "./RegisterForm";
import { resultStore, type StoredResult } from "@/lib/client-store";

/**
 * Modal đăng ký tư vấn 1-1 (FLOW_PLAN §2).
 * - Mở được từ mọi điểm trên landing; người chưa làm test vẫn gửi đơn được.
 * - Nếu có kết quả trong resultStore, hiện tóm tắt MBTI × lĩnh vực đi kèm đơn.
 * - Thành công: hiện xác nhận trong modal + nút quay lại; đóng modal về đúng vị trí cuộn.
 */
export function ConsultModal({
  open,
  onClose,
  onSuccess,
  validCodes,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (info: { name: string }) => void;
  validCodes: string[] | null;
}) {
  useEffect(() => {
    if (!open) return;
    const y = window.scrollY;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      // Về đúng vị trí vừa xem
      requestAnimationFrame(() => window.scrollTo(0, y));
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Đăng ký tư vấn 1-1"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-ink/55" />
      <div className="relative flex max-h-[92dvh] w-full max-w-[680px] flex-col overflow-hidden rounded-t-[24px] bg-cream shadow-2xl sm:rounded-[24px]">
        <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-5 sm:px-8 sm:pt-6">
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line-strong bg-white text-xl font-bold text-body transition-colors hover:bg-white/70"
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 sm:px-8 sm:pb-8">
          <ConsultBody validCodes={validCodes} onSuccess={onSuccess} />
        </div>
      </div>
    </div>
  );
}

// Màn hình lưu ý hiển thị trước form đăng ký: xác nhận mới hiện form.
function ConsultBody({
  validCodes,
  onSuccess,
}: {
  validCodes: string[] | null;
  onSuccess: (info: { name: string }) => void;
}) {
  const [agreed, setAgreed] = useState(false);
  if (!agreed) {
    return (
      <>
        <NoticeBody />
        <button
          type="button"
          onClick={() => setAgreed(true)}
          className="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-brand px-5 text-[17px] font-bold text-white transition-colors hover:bg-brand-dark"
        >
          Tôi đã hiểu, tiếp tục đăng ký
        </button>
      </>
    );
  }
  return <ModalForm validCodes={validCodes} onSuccess={onSuccess} />;
}

// Nội dung lưu ý hiển thị trước form đăng ký.
function NoticeBody() {
  return (
    <section aria-label="Lưu ý trước khi đăng ký" className="mb-6 rounded-2xl border border-line bg-white px-4 py-5 sm:px-6">
      <h3 className="text-center text-base font-extrabold leading-snug sm:text-lg">
        ĐĂNG KÝ PHIÊN TƯ VẤN 1:1 – BETTER TALK, BETTER WORK
      </h3>
      <p className="mt-3 text-[15px] leading-relaxed text-body">
        Cảm ơn bạn đã quan tâm đến <strong>BETTER TALK, BETTER WORK</strong>!
      </p>
      <p className="mt-2.5 text-[15px] leading-relaxed text-body">
        Chúng tôi tin rằng hiểu phong cách giao tiếp chỉ là điểm khởi đầu. Điều quan trọng hơn là bạn nhận ra điều gì
        đang cản trở mình, biết cách phát huy thế mạnh và chủ động phát triển những năng lực cần thiết để làm việc hiệu
        quả hơn.
      </p>
      <p className="mt-2.5 text-[15px] leading-relaxed text-body">
        Phiên tư vấn 1:1 là cơ hội để bạn cùng Advisor nhìn lại kết quả bài test, đối chiếu với những tình huống thực tế
        trong công việc và xác định hướng phát triển phù hợp.
      </p>
      <h4 className="mt-4 text-[15px] font-extrabold">TRƯỚC KHI ĐĂNG KÝ, BẠN HÃY LƯU Ý:</h4>
      <ol className="mt-2.5 flex list-decimal flex-col gap-2.5 pl-5 text-[15px] leading-relaxed text-body">
        <li>
          <strong>Sự nghiêm túc:</strong> Chỉ đăng ký khi bạn thực sự mong muốn hiểu bản thân và sẵn sàng dành thời
          gian để nhìn nhận, cải thiện phong cách giao tiếp của mình. Đây không phải hoạt động trải nghiệm cho vui hay
          đơn thuần để biết nhóm MBTI.
        </li>
        <li>
          <strong>Sự chủ động:</strong> Hãy sẵn sàng chia sẻ những khó khăn, tình huống giao tiếp thực tế và cởi mở tiếp
          nhận góc nhìn mới.
        </li>
        <li>
          <strong>Bảo mật thông tin:</strong> Những thông tin cá nhân và nội dung trao đổi trong phiên tư vấn được tôn
          trọng và bảo mật, không chia sẻ cho bên thứ ba khi chưa có sự đồng ý của bạn.
        </li>
      </ol>
      <p className="mt-3 text-[15px] font-semibold leading-relaxed">
        BETTER TALK, BETTER WORK – Hiểu mình để giao tiếp tốt hơn, chủ động để phát triển vượt trội hơn.
      </p>
      <p className="mt-2 text-[15px] leading-relaxed text-body">
        Trân trọng,
        <br />
        BETTER TALK, BETTER WORK Team
      </p>
    </section>
  );
}

function ModalForm({
  validCodes,
  onSuccess,
}: {
  validCodes: string[] | null;
  onSuccess: (info: { name: string }) => void;
}) {
  // Đọc một lần khi modal mở; form tự quản lý phần còn lại.
  const initial: StoredResult | null = typeof window !== "undefined" ? resultStore.get() : null;
  return (
    <RegisterForm
      validCodes={validCodes}
      initialResult={initial?.field ? initial : null}
      requireResult={false}
      backLabel={null}
      onSuccess={onSuccess}
    />
  );
}
