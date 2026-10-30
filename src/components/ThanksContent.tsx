"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader } from "./SiteHeader";
import { ArrowRight, Chat, Check, Mail, Phone } from "./icons";
import { btnPrimary } from "./ui";
import { resultStore, thanksStore, type StoredResult, type ThanksInfo } from "@/lib/client-store";
import { site } from "@/lib/site";

// Các ngôi sao nhỏ trang trí quanh huy hiệu
const SPARKLES = [
  { className: "left-[14%] top-6 size-5 text-sun-deep", delay: "0.15s" },
  { className: "right-[16%] top-2 size-4 text-brand", delay: "0.25s" },
  { className: "left-[22%] top-28 size-3 text-mint", delay: "0.35s" },
  { className: "right-[20%] top-24 size-6 text-sky", delay: "0.3s" },
  { className: "right-[30%] top-36 size-3 text-sun-deep", delay: "0.45s" },
];

function Sparkle4({ className, style }: { className: string; style: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={`absolute motion-safe:animate-pop ${className}`} style={style}>
      <path d="M12 0c.6 5.6 2.4 8.4 12 12-9.6 3.6-11.4 6.4-12 12-.6-5.6-2.4-8.4-12-12C9.6 8.4 11.4 5.6 12 0z" />
    </svg>
  );
}

export function ThanksContent() {
  const [info, setInfo] = useState<ThanksInfo | null>(null);
  const [result, setResult] = useState<StoredResult | null>(null);

  useEffect(() => {
    setInfo(thanksStore.get());
    setResult(resultStore.get());
  }, []);

  // Gọi theo tên (chữ cuối trong họ tên), ví dụ "Nguyễn Văn An" → "An"
  const firstName = info?.name.trim().split(/\s+/).pop();
  const resultHref = result?.field ? `/ket-qua?mbti=${result.type}&linh-vuc=${encodeURIComponent(result.field)}` : null;

  const steps = [
    {
      Icon: Check,
      tone: "bg-mint text-white",
      title: "Đã nhận đăng ký",
      text: "Thông tin và kết quả trắc nghiệm của bạn đã được lưu lại.",
      done: true,
    },
    {
      Icon: Phone,
      tone: "bg-sun-soft text-sun-ink",
      title: "Tư vấn viên liên hệ",
      text: "Qua số điện thoại / Zalo, trong khung giờ bạn đã chọn.",
    },
    {
      Icon: Chat,
      tone: "bg-peach text-peach-ink",
      title: "Buổi tư vấn 1-1",
      text: "Cùng tìm cách phát huy phong cách giao tiếp của bạn trong công việc.",
    },
  ];

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-28 size-[280px] rounded-full bg-sun-light lg:size-[420px]" />
        <div className="absolute -right-10 top-20 size-[120px] rounded-full bg-[#cdefe0] lg:size-48" />
        <div className="absolute -bottom-24 -right-20 hidden size-72 rounded-full bg-[#ffd9c7] md:block" />
      </div>

      <div className="hidden md:block">
        <SiteHeader />
      </div>

      <main className="relative mx-auto flex w-full max-w-[560px] flex-1 flex-col px-5 pb-8 pt-10 md:pt-8">
        {/* Huy hiệu thành công */}
        <div className="relative flex justify-center pt-4">
          {SPARKLES.map((s, i) => (
            <Sparkle4 key={i} className={s.className} style={{ animationDelay: s.delay }} />
          ))}
          <div className="flex size-28 items-center justify-center rounded-full border border-line bg-white motion-safe:animate-pop">
            <div className="flex size-20 items-center justify-center rounded-full bg-mint text-white">
              <Check size={42} />
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center text-center motion-safe:animate-rise" style={{ animationDelay: "0.15s" }}>
          <span className="rounded-full bg-mint-soft px-3 py-1 text-[13px] font-semibold text-mint-dark">Đăng ký thành công</span>
          <h1 className="mt-3 text-[30px] font-extrabold leading-[1.25]">Cảm ơn {firstName || "bạn"}!</h1>
          <p className="mt-2 text-base leading-relaxed text-body">
            Đội ngũ {site.orgName} đã nhận được thông tin và sẽ sớm liên hệ với bạn.
          </p>
        </div>

        {/* Thẻ dạng vé: kết quả đã gửi kèm */}
        {result?.field && (
          <div className="relative mt-7 flex overflow-hidden rounded-3xl border border-line bg-white motion-safe:animate-rise" style={{ animationDelay: "0.25s" }}>
            <div className="flex w-[118px] shrink-0 flex-col items-center justify-center bg-sun px-3 py-5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5c3d00]">Phong cách</span>
              <span className="mt-1 text-[30px] font-extrabold leading-none tracking-[1px]">{result.type}</span>
            </div>
            <div aria-hidden="true" className="relative w-0 border-l-2 border-dashed border-line-strong">
              <span className="absolute -left-[9px] -top-[9px] size-4 rounded-full border border-line bg-cream" />
              <span className="absolute -bottom-[9px] -left-[9px] size-4 rounded-full border border-line bg-cream" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-4 py-4">
              <span className="text-[13px] text-muted">Lĩnh vực</span>
              <span className="text-base font-bold leading-snug">{result.field}</span>
              <span className="mt-1 text-[13px] leading-snug text-muted">Đã gửi kèm hồ sơ để tư vấn viên chuẩn bị trước.</span>
            </div>
          </div>
        )}

        {/* Các bước tiếp theo */}
        <section className="mt-4 rounded-3xl border border-line bg-white px-5 py-5 motion-safe:animate-rise" style={{ animationDelay: "0.35s" }}>
          <h2 className="text-base font-bold">Tiếp theo sẽ là</h2>
          <ol className="mt-4 flex flex-col">
            {steps.map(({ Icon, tone, title, text, done }, i) => (
              <li key={title} className="relative flex gap-3.5 pb-5 last:pb-0">
                {i < steps.length - 1 && (
                  <span aria-hidden="true" className={`absolute left-[17px] top-10 bottom-1 w-0.5 rounded ${done ? "bg-mint" : "bg-track"}`} />
                )}
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${tone}`}>
                  <Icon size={18} />
                </span>
                <div className="flex flex-col gap-0.5 pt-1.5">
                  <span className="text-[15px] font-semibold">{title}</span>
                  <span className="text-sm leading-relaxed text-body">{text}</span>
                </div>
              </li>
            ))}
          </ol>

          {info?.emailSent && (
            <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-sky-soft px-3.5 py-3 text-sm leading-relaxed text-sky-ink">
              <Mail size={18} className="mt-0.5 shrink-0" />
              <span>
                Email xác nhận đã được gửi tới <b className="break-words">{info.email}</b>. Nếu chưa thấy, bạn kiểm tra thêm mục Spam nhé.
              </span>
            </div>
          )}

          {site.thanksNextSteps && (
            <p className="mt-5 rounded-2xl bg-sun-soft px-3.5 py-3 text-sm leading-relaxed text-sun-ink">{site.thanksNextSteps}</p>
          )}
        </section>

        <div className="mt-auto flex flex-col gap-2 pt-8">
          {resultHref && (
            <Link href={resultHref} className={btnPrimary}>
              Xem lại kết quả của tôi
              <ArrowRight />
            </Link>
          )}
          <Link href="/" className="inline-flex h-12 items-center justify-center rounded-2xl text-[15px] font-semibold text-brand-dark hover:bg-peach-soft">
            Về trang chủ
          </Link>
        </div>
      </main>
    </div>
  );
}
