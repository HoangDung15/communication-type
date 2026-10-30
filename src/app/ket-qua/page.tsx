import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { LoadError } from "@/components/LoadError";
import { DimensionBars } from "@/components/result/DimensionBars";
import { RestartButton } from "@/components/result/RestartButton";
import { ResultSections } from "@/components/result/ResultSections";
import { ArrowRight } from "@/components/icons";
import { btnSun } from "@/components/ui";
import { isMbtiType } from "@/lib/mbti";
import { parseResult } from "@/lib/parse-result";
import { getResultContent } from "@/lib/results";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Kết quả của bạn | MBTI · Giao tiếp" };

type Props = { searchParams: Promise<{ mbti?: string; "linh-vuc"?: string }> };

export default async function ResultPage({ searchParams }: Props) {
  const params = await searchParams;
  const type = params.mbti?.toUpperCase();
  const field = params["linh-vuc"];

  if (!isMbtiType(type) || !field) {
    return <LoadError message="Không tìm thấy kết quả. Bạn hãy làm bài test để xem phân tích nhé." />;
  }

  const found = getResultContent(type, field);
  if (!found) {
    return <LoadError message={`Chưa có nội dung cho ${type} trong lĩnh vực "${field}". Bạn thử chọn lĩnh vực khác nhé.`} />;
  }

  const parsed = parseResult(found.content);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader right={<RestartButton />} />

      <main className="mx-auto grid w-full max-w-6xl gap-4 px-4 pb-8 pt-4 lg:grid-cols-[400px_minmax(0,1fr)] lg:items-start lg:gap-8 lg:px-10 lg:pb-16 lg:pt-8">
        <div className="flex flex-col gap-4 lg:sticky lg:top-8">
          <section className="relative overflow-hidden rounded-3xl bg-sun px-5 py-6">
            <div aria-hidden="true" className="absolute -right-16 -top-[70px] size-[200px] rounded-full bg-[#ffda6b]" />
            <div aria-hidden="true" className="absolute -bottom-10 right-8 size-[90px] rounded-full bg-sun-deep" />
            <p className="relative text-sm font-semibold text-[#5c3d00]">Phong cách giao tiếp của bạn</p>
            <h1 className="relative mt-1.5 text-[64px] font-extrabold leading-none tracking-[2px]">{type}</h1>
            {parsed.tagline && <p className="relative mt-3 max-w-[85%] text-[15px] font-semibold leading-snug">{parsed.tagline}</p>}
            <span className="relative mt-4 inline-block rounded-full bg-ink px-3 py-1.5 text-[13px] font-semibold text-white">
              Lĩnh vực: {found.field}
            </span>
          </section>

          <DimensionBars type={type} />

          <div className="hidden lg:block">
            <RegisterCta />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {parsed.notes.map((note) => (
            <p key={note} className="px-1 text-[13px] text-muted">
              {note}
            </p>
          ))}
          <ResultSections sections={parsed.sections} />
          <div className="lg:hidden">
            <RegisterCta />
          </div>
        </div>
      </main>
    </div>
  );
}

function RegisterCta() {
  return (
    <section className="relative flex flex-col gap-3 overflow-hidden rounded-3xl bg-ink px-5 py-6 text-white">
      <div aria-hidden="true" className="absolute -right-12 -top-16 size-40 rounded-full bg-[#4a3a2a]" />
      <h2 className="relative text-[22px] font-extrabold leading-[1.3]">Muốn áp dụng thế mạnh này vào công việc?</h2>
      <p className="relative text-[15px] leading-relaxed text-line">
        Đăng ký để được tư vấn 1-1 cùng {site.orgName} về cách giao tiếp hiệu quả hơn trong lĩnh vực của bạn.
      </p>
      <Link href="/dang-ky" className={`${btnSun} relative mt-1.5`}>
        Đăng ký tư vấn
        <ArrowRight />
      </Link>
    </section>
  );
}
