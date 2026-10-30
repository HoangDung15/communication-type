import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";
import { adminCard } from "@/components/admin/styles";
import { requireUser } from "@/lib/auth";

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <div>
        <h1 className="text-2xl font-extrabold">Tài khoản</h1>
        <p className="mt-0.5 text-sm text-muted">
          {user.displayName} · tên đăng nhập <b className="text-body">{user.username}</b>
        </p>
      </div>
      <section className={`${adminCard} p-5`}>
        <h2 className="text-base font-bold">Đổi mật khẩu</h2>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
