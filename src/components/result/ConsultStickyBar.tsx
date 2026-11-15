"use client";

import { ArrowRight } from "../icons";
import { btnPrimary } from "../ui";

// Nút đăng ký cố định dưới đáy (điện thoại), chỉ hiện khi người dùng đã xem xong 3 chặng kết quả.
// Khi hiện, chèn khoảng trống cuối trang để nút không che nội dung cuối.
export function ConsultStickyBar({ show, onConsult }: { show: boolean; onConsult: () => void }) {
  if (!show) return null;
  return (
    <>
      <div aria-hidden="true" className="h-20 lg:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cream/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur motion-safe:animate-[sticky-up_0.25s_ease-out] lg:hidden">
        <button type="button" onClick={onConsult} className={`${btnPrimary} w-full`}>
          Đăng ký tư vấn 1:1
          <ArrowRight />
        </button>
      </div>
      <style>{`@keyframes sticky-up { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </>
  );
}
