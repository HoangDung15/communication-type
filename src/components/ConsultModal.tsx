"use client";

import { useEffect, useState } from "react";
import { RegisterForm } from "./RegisterForm";
import { resultStore, type StoredResult } from "@/lib/client-store";

/**
 * Modal đăng ký tư vấn 1-1 (FLOW_PLAN §2).
 * - Mở được từ mọi điểm trên landing; người chưa làm test vẫn gửi đơn được.
 * - Nếu có kết quả trong resultStore, hiện tóm tắt MBTI × lĩnh vực đi kèm đơn.
 * - Thành công: RegisterForm chuyển sang trang /cam-on (các bước tiếp theo).
 */
export function ConsultModal({
  open,
  onClose,
  validCodes,
}: {
  open: boolean;
  onClose: () => void;
  validCodes: string[] | null;
}) {
  useEffect(() => {
    if (!open) return;
    const y = window.scrollY;
    const path = window.location.pathname;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      // Về đúng vị trí vừa xem (bỏ qua khi đã chuyển trang, ví dụ sang /cam-on)
      requestAnimationFrame(() => {
        if (window.location.pathname === path) window.scrollTo(0, y);
      });
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
      <div className="relative flex max-h-[92dvh] w-full max-w-[680px] flex-col overflow-hidden rounded-t-2xl bg-cream shadow-2xl sm:rounded-2xl">
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
          <ConsultBody validCodes={validCodes} />
        </div>
      </div>
    </div>
  );
}

// Màn hình lưu ý hiển thị trước form đăng ký: xác nhận mới hiện form.
function ConsultBody({
  validCodes,
}: {
  validCodes: string[] | null;
}) {
  const [agreed, setAgreed] = useState(false);
  if (!agreed) {
    return (
      <>
        <NoticeBody />
        <button
          type="button"
          onClick={() => {
            setAgreed(true);
          }}
          className="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-brand px-5 text-[17px] font-bold text-white transition-colors hover:bg-brand-dark"
        >
          Tôi đã hiểu, tiếp tục đăng ký
        </button>
      </>
    );
  }
  return <ModalForm validCodes={validCodes} />;
}

// Nội dung lưu ý hiển thị trước form đăng ký.
function NoticeBody() {
  return (
    <section aria-label="Lưu ý trước khi đăng ký" className="mb-5 rounded-xl border border-line bg-white px-4 py-5 sm:px-6">
      <h3 className="text-center text-base font-extrabold leading-snug sm:text-lg">
        ĐĂNG KÝ PHIÊN TƯ VẤN 1:1 – BETTER TALK, BETTER WORK
      </h3>
      <p className="mt-2 text-center text-sm font-semibold leading-relaxed text-body">
        Dự án phi lợi nhuận, phiên tư vấn không mất phí
      </p>
      <ul className="mt-4 flex flex-col gap-1.5 rounded-[10px] bg-peach-soft px-4 py-3 text-[14px] leading-relaxed text-ink">
        <li><strong>Hình thức:</strong> Tư vấn online 1:1, 60–90 phút.</li>
        <li><strong>Sắp lịch:</strong> Advisor chủ động liên hệ và thống nhất lịch với bạn.</li>
        <li><strong>Đối tượng:</strong> Người đi làm từ 22 tuổi trở lên.</li>
        <li><strong>Số lượng:</strong> Suất tư vấn miễn phí có giới hạn.</li>
      </ul>
      <h4 className="mt-4 text-[15px] font-extrabold">Trước khi đăng ký, bạn lưu ý:</h4>
      <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-relaxed text-body">
        <li>Sẵn sàng dành thời gian nhìn lại và cải thiện cách mình giao tiếp.</li>
        <li>Cởi mở chia sẻ tình huống thực tế trong công việc.</li>
        <li>Thông tin của bạn được bảo mật, không chia sẻ cho bên thứ ba khi chưa có sự đồng ý.</li>
      </ul>
    </section>
  );
}

function ModalForm({
  validCodes,
}: {
  validCodes: string[] | null;
}) {
  // Đọc một lần khi modal mở; form tự quản lý phần còn lại.
  const initial: StoredResult | null = typeof window !== "undefined" ? resultStore.get() : null;
  return (
    <RegisterForm
      validCodes={validCodes}
      initialResult={initial?.field ? initial : null}
      requireResult={false}
      backLabel={null}
     
    />
  );
}
