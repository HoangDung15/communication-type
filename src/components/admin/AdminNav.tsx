"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = [
    { href: "/quan-ly", label: "Đăng ký", active: pathname === "/quan-ly" || pathname.startsWith("/quan-ly/dang-ky") },
    ...(isAdmin ? [{ href: "/quan-ly/nguoi-quan-ly", label: "Người quản lý", active: pathname.startsWith("/quan-ly/nguoi-quan-ly") }] : []),
    { href: "/quan-ly/tai-khoan", label: "Tài khoản", active: pathname.startsWith("/quan-ly/tai-khoan") },
  ];

  return (
    <nav aria-label="Menu quản lý" className="order-last flex w-full gap-1 sm:order-none sm:w-auto">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          aria-current={it.active ? "page" : undefined}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
            it.active ? "bg-ink text-white" : "text-body hover:bg-white"
          }`}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
