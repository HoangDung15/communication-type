import Link from "next/link";
import { SiteHeader } from "./SiteHeader";
import { AlertCircle } from "./icons";
import { btnPrimary } from "./ui";

export function LoadError({ message }: { message?: string }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-peach text-peach-ink">
          <AlertCircle size={30} />
        </span>
        <h1 className="mt-5 text-2xl font-bold">Có chút trục trặc</h1>
        <p className="mt-2 text-body">{message ?? "Hệ thống đang bận, bạn vui lòng tải lại trang sau ít phút nhé."}</p>
        <Link href="/" className={`${btnPrimary} mt-8 w-full`}>
          Về trang chủ
        </Link>
      </main>
    </div>
  );
}
