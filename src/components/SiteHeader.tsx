import Link from "next/link";
import { SunLogo } from "./icons";
import { site } from "@/lib/site";

export function SiteHeader({ right }: { right?: React.ReactNode }) {
  return (
    <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-5 lg:px-10 lg:pt-7">
      <Link href="/" className="flex items-center gap-2 rounded-lg text-ink no-underline">
        <SunLogo />
        <span className="text-[15px] font-bold lg:text-lg">{site.name}</span>
      </Link>
      {right ?? <span className="text-[13px] font-medium text-muted lg:text-[15px]">{site.orgName}</span>}
    </header>
  );
}

// Các hình tròn trang trí phía sau nội dung
export function Blobs({ variant = "home" }: { variant?: "home" | "soft" }) {
  if (variant === "soft") {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -bottom-40 -left-36 size-[360px] rounded-full bg-sun-light" />
        <div className="absolute -right-12 top-28 size-44 rounded-full bg-[#cdefe0]" />
      </div>
    );
  }
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -right-28 -top-32 size-80 rounded-full bg-sun-light lg:-right-36 lg:-top-40 lg:size-[620px]" />
      <div className="absolute -right-12 top-40 size-36 rounded-full bg-[#ffd9c7] lg:bottom-[-90px] lg:right-[40%] lg:top-auto lg:size-56" />
      <div className="absolute -left-10 top-80 size-24 rounded-full bg-[#cdefe0] lg:bottom-16 lg:left-auto lg:right-20 lg:top-auto lg:size-36" />
    </div>
  );
}
