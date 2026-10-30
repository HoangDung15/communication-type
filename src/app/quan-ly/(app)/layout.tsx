import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { SunLogo } from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { logoutAction } from "../actions";

export const metadata: Metadata = { title: "Quản lý đăng ký", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 lg:px-6">
          <Link href="/quan-ly" className="flex items-center gap-2">
            <SunLogo size={24} />
            <span className="text-[15px] font-bold">Quản lý</span>
          </Link>
          <AdminNav isAdmin={user.role === "admin"} />
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="hidden text-muted sm:inline">
              {user.displayName}
              {user.role === "admin" && <span className="ml-1.5 rounded-md bg-ink px-1.5 py-0.5 text-[11px] font-semibold text-white">Admin</span>}
            </span>
            <form action={logoutAction}>
              <button type="submit" className="h-9 rounded-lg px-2.5 font-semibold text-brand-dark hover:bg-peach-soft">
                Đăng xuất
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-5 lg:px-6">{children}</div>
    </div>
  );
}
