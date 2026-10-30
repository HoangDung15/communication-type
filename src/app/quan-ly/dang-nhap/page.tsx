import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { SunLogo } from "@/components/icons";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Đăng nhập quản lý", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/quan-ly");

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-5 py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-28 size-[300px] rounded-full bg-sun-light" />
        <div className="absolute -bottom-24 -right-16 size-60 rounded-full bg-[#cdefe0]" />
      </div>
      <main className="relative w-full max-w-[400px] rounded-[28px] border border-line bg-white px-6 py-8 sm:px-8">
        <div className="flex items-center gap-2">
          <SunLogo />
          <span className="text-[15px] font-bold">MBTI · Giao tiếp</span>
        </div>
        <h1 className="mt-6 text-2xl font-extrabold">Đăng nhập quản lý</h1>
        <p className="mt-1.5 text-[15px] text-body">Dành cho đội ngũ tư vấn xem và chăm sóc khách đăng ký.</p>
        <LoginForm />
      </main>
    </div>
  );
}
