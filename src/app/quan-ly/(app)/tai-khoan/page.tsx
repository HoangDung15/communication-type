import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";
import { SheetConnect } from "@/components/admin/SheetConnect";
import { adminCard, formatDateTime } from "@/components/admin/styles";
import { requireUser } from "@/lib/auth";
import { isGoogleConfigured, serviceAccountEmail, sheetUrl } from "@/lib/google-sheets";
import { getUserSheet } from "@/lib/sheet-sync";

export default async function AccountPage() {
  const user = await requireUser();
  const sheet = await getUserSheet(user.id);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-extrabold">Tài khoản</h1>
        <p className="mt-0.5 text-sm text-muted">
          {user.displayName} · tên đăng nhập <b className="text-body">{user.username}</b>
        </p>
      </div>
      <section id="google-sheet" className={`${adminCard} scroll-mt-20 p-5`}>
        <h2 className="text-base font-bold">Kết nối Google Sheet</h2>
        <SheetConnect
          configured={isGoogleConfigured()}
          serviceEmail={serviceAccountEmail()}
          isAdmin={user.role === "admin"}
          sheet={sheet ? { url: sheetUrl(sheet.sheetId), connectedAt: formatDateTime(sheet.connectedAt) } : null}
        />
      </section>
      <section className={`${adminCard} p-5`}>
        <h2 className="text-base font-bold">Đổi mật khẩu</h2>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
