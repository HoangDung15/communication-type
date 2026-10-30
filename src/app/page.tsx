import Link from "next/link";
import { Blobs, SiteHeader } from "@/components/SiteHeader";
import { ArrowRight, Clock, Grid, ListCheck } from "@/components/icons";
import { btnPrimary } from "@/components/ui";
import { DIMENSIONS, QUESTIONS } from "@/lib/questions";
import { getFieldCount } from "@/lib/results";
import { site } from "@/lib/site";

// 4 ô "?" tượng trưng cho 4 chữ cái MBTI sắp được khám phá
const TILES = [
  { color: "bg-brand", rotate: "-rotate-6", delay: "0s" },
  { color: "bg-mint", rotate: "rotate-3", delay: "0.6s" },
  { color: "bg-sun-deep", rotate: "-rotate-2", delay: "1.2s" },
  { color: "bg-sky", rotate: "rotate-6", delay: "1.8s" },
];

export default function HomePage() {
  const facts = [
    { Icon: ListCheck, text: `${QUESTIONS.length} câu hỏi` },
    { Icon: Clock, text: "Khoảng 3 phút" },
    { Icon: Grid, text: `${getFieldCount()} lĩnh vực` },
  ];

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <Blobs />
      <SiteHeader />

      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-6 pt-12 lg:flex-row lg:items-center lg:gap-16 lg:px-10 lg:pb-16 lg:pt-0">
        <div className="flex flex-1 flex-col">
          <span className="self-start rounded-full border border-line bg-white px-3 py-1.5 text-[13px] font-semibold text-mint-dark lg:px-3.5 lg:py-2 lg:text-sm">
            Trắc nghiệm MBTI miễn phí
          </span>
          <h1 className="mt-[18px] text-[34px] font-extrabold leading-[1.18] tracking-[-0.5px] sm:text-[44px] lg:mt-6 lg:text-[56px] lg:leading-[1.12] lg:tracking-[-1px]">
            Bạn giao tiếp theo <span className="text-brand">phong cách</span> nào?
          </h1>
          <p className="mt-3.5 max-w-[540px] text-base leading-relaxed text-body lg:mt-5 lg:text-[19px]">{site.description}</p>

          {/* Ô đố vui: chỉ hiện khi không có thẻ minh hoạ bên phải */}
          <div className="mt-7 rounded-3xl border border-line bg-white/80 px-5 pb-5 pt-4 backdrop-blur-sm lg:max-w-[540px] xl:hidden">
            <p className="text-center text-[13px] font-semibold text-muted">Phong cách của bạn là…</p>
            <div className="mt-3 flex justify-center gap-3 sm:gap-4">
              {TILES.map((t, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div
                    className={`flex size-14 items-center justify-center rounded-2xl text-[28px] font-extrabold text-white shadow-[0_6px_0_rgba(43,33,24,0.12)] sm:size-16 ${t.color} ${t.rotate} motion-safe:animate-float`}
                    style={{ animationDelay: t.delay }}
                    aria-hidden="true"
                  >
                    ?
                  </div>
                  <span className="text-xs font-semibold text-muted">
                    {DIMENSIONS[i].a.letter} · {DIMENSIONS[i].b.letter}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <ul className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2 lg:mt-7 lg:justify-start lg:gap-x-6">
            {facts.map(({ Icon, text }) => (
              <li key={text} className="flex items-center gap-1.5 text-sm font-medium text-body lg:text-[15px]">
                <Icon size={18} className="text-brand" />
                {text}
              </li>
            ))}
          </ul>

          <div className="mt-auto flex flex-col pt-8 lg:mt-9 lg:flex-row lg:items-center lg:gap-5 lg:pt-0">
            <Link href="/quiz" className={`${btnPrimary} w-full lg:h-[60px] lg:w-auto lg:px-8 lg:text-lg`}>
              Bắt đầu làm bài
              <ArrowRight />
            </Link>
            <p className="mt-3 text-center text-[13px] text-muted lg:mt-0 lg:whitespace-nowrap lg:text-[15px]">Không cần đăng nhập · Xem kết quả ngay</p>
          </div>
        </div>

        <PreviewCard />
      </main>
    </div>
  );
}

// Thẻ minh hoạ kết quả, chỉ hiện trên màn hình rộng
function PreviewCard() {
  return (
    <div aria-hidden="true" className="relative hidden h-[460px] w-[420px] shrink-0 xl:block">
      <div className="absolute left-10 top-10 h-[380px] w-[340px] rotate-[5deg] rounded-[28px] border border-line bg-white" />
      <div className="absolute left-[30px] top-[30px] flex w-[340px] flex-col gap-3.5 rounded-[28px] border border-line bg-white p-5">
        <div className="rounded-[20px] bg-sun p-5">
          <p className="text-[13px] font-semibold text-[#5c3d00]">Phong cách giao tiếp của bạn</p>
          <p className="mt-1 text-[52px] font-extrabold leading-none tracking-[2px]">ENFP</p>
          <span className="mt-3 inline-block rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">Lĩnh vực: Sáng tạo</span>
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-2.5 w-[92%] rounded bg-track" />
          <div className="h-2.5 w-[78%] rounded bg-track" />
          <div className="h-2.5 w-[85%] rounded bg-track" />
        </div>
        <div className="flex flex-col gap-2 rounded-2xl bg-mint-faint p-3">
          <div className="h-2 w-[60%] rounded bg-[#bfe6d3]" />
          <div className="h-2 w-[80%] rounded bg-[#bfe6d3]" />
        </div>
      </div>
    </div>
  );
}
