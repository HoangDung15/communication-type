import Link from "next/link";
import { headers } from "next/headers";
import { CopyButton } from "@/components/admin/CopyButton";
import { CreateManagerForm } from "@/components/admin/CreateManagerForm";
import { ResetPasswordButton } from "@/components/admin/ResetPasswordButton";
import { adminBtnSecondary, adminCard, formatDateTime } from "@/components/admin/styles";
import { listManagers } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { toggleManagerAction } from "../../actions";

async function siteOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export default async function ManagersPage() {
  await requireAdmin();
  const [managers, origin] = await Promise.all([listManagers(), siteOrigin()]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-extrabold">Người quản lý</h1>
        <p className="mt-0.5 text-sm text-muted">
          Mỗi người có một link giới thiệu riêng. Khách đăng ký qua link nào sẽ tự về đúng người đó.
        </p>
      </div>

      <section className={`${adminCard} p-5`}>
        <h2 className="text-base font-bold">Thêm người quản lý</h2>
        <CreateManagerForm origin={origin} />
      </section>

      {managers.length === 0 ? (
        <p className={`${adminCard} px-6 py-10 text-center text-sm text-muted`}>Chưa có người quản lý nào.</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {managers.map((m) => {
            const link = `${origin}/${m.ref}`;
            return (
              <li key={m.id} className={`${adminCard} flex flex-col gap-3 p-4 ${m.active ? "" : "opacity-70"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-base font-bold">{m.name}</p>
                    <p className="text-xs text-muted">
                      Tài khoản: <b className="text-body">{m.username ?? "—"}</b>
                      {" · "}
                      {m.lastLoginAt ? `Đăng nhập lần cuối ${formatDateTime(m.lastLoginAt)}` : "Chưa đăng nhập lần nào"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      m.active ? "bg-mint-soft text-mint-dark" : "bg-track text-muted"
                    }`}
                  >
                    {m.active ? "Đang hoạt động" : "Đã ngưng"}
                  </span>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-cream px-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{link}</span>
                  <CopyButton text={link} />
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <Link href={`/quan-ly?manager=${m.id}`} className="hover:underline">
                    <b>{m.total}</b> đăng ký
                  </Link>
                  <Link href={`/quan-ly?manager=${m.id}&status=new`} className="text-peach-ink hover:underline">
                    <b>{m.newCount}</b> chưa liên hệ
                  </Link>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                  {m.userId && <ResetPasswordButton userId={m.userId} />}
                  <form action={toggleManagerAction}>
                    <input type="hidden" name="managerId" value={m.id} />
                    <input type="hidden" name="active" value={String(!m.active)} />
                    <button type="submit" className={adminBtnSecondary}>
                      {m.active ? "Tạm ngưng" : "Kích hoạt lại"}
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
