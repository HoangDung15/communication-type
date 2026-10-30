"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Blobs, SiteHeader } from "./SiteHeader";
import { FieldIcon } from "./FieldIcon";
import { ArrowLeft, ArrowRight, Check } from "./icons";
import { btnPrimary, iconBtn } from "./ui";
import { resultStore, type StoredResult } from "@/lib/client-store";

// Mỗi MBTI chỉ hiện những lĩnh vực đã có nội dung trong sheet.
export function FieldPicker({ fieldsByType }: { fieldsByType: Record<string, string[]> }) {
  const router = useRouter();
  const [result, setResult] = useState<StoredResult | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const fields = result ? (fieldsByType[result.type] ?? []) : [];

  useEffect(() => {
    const r = resultStore.get();
    if (!r) {
      router.replace("/quiz");
      return;
    }
    setResult(r);
    if (r.field && fieldsByType[r.type]?.includes(r.field)) setSelected(r.field);
  }, [fieldsByType, router]);

  function submit() {
    if (!result || !selected) return;
    resultStore.set({ ...result, field: selected });
    router.push(`/ket-qua?mbti=${result.type}&linh-vuc=${encodeURIComponent(selected)}`);
  }

  return (
    <div className="relative flex min-h-dvh flex-col">
      <div className="hidden md:block">
        <Blobs variant="soft" />
        <SiteHeader />
      </div>

      <main
        className={`relative mx-auto flex w-full max-w-[720px] flex-1 flex-col px-5 pb-6 pt-4 transition-opacity md:mb-12 md:mt-10 md:flex-none md:rounded-[28px] md:border md:border-line md:bg-white md:px-10 md:py-9 ${result ? "opacity-100" : "opacity-0"}`}
      >
        <div className="flex items-center gap-3">
          <Link href="/quiz" aria-label="Quay lại bài test" className={iconBtn}>
            <ArrowLeft />
          </Link>
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex justify-between text-[13px] font-semibold md:text-sm">
              <span>Bước cuối</span>
              <span className="text-mint-dark">Đã xong 12/12 câu</span>
            </div>
            <div aria-hidden="true" className="h-2.5 rounded-full bg-sun-deep" />
          </div>
        </div>

        <h1 className="mt-7 text-[26px] font-extrabold leading-[1.3] md:text-[30px]">Bạn đang làm trong lĩnh vực nào?</h1>
        <p className="mt-2.5 text-[15px] leading-relaxed text-body md:text-base">
          Kết quả sẽ được phân tích riêng cho môi trường giao tiếp của lĩnh vực này.
        </p>

        <div role="radiogroup" aria-label="Lĩnh vực" className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
          {fields.map((field, i) => {
            const active = selected === field;
            return (
              <button
                key={field}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelected(field)}
                className={`relative flex min-h-[118px] flex-col gap-3.5 rounded-[18px] border-2 p-4 text-left transition-colors ${
                  active ? "border-brand bg-peach-soft" : "border-line bg-white hover:border-line-strong hover:bg-cream"
                }`}
              >
                <FieldIcon name={field} index={i} active={active} />
                <span className="text-[15px] font-bold leading-snug">{field}</span>
                {active && (
                  <span aria-hidden="true" className="absolute right-3 top-3 flex size-[22px] items-center justify-center rounded-full bg-brand text-white">
                    <Check size={14} strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-8 md:mt-8 md:flex md:justify-end md:pt-0">
          <button type="button" onClick={submit} disabled={!selected} className={`${btnPrimary} w-full md:w-auto`}>
            Xem kết quả của tôi
            <ArrowRight />
          </button>
        </div>
      </main>
    </div>
  );
}
