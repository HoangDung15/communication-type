"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "@/app/quan-ly/actions";
import { CredentialsBox } from "./CredentialsBox";
import { adminBtnSecondary } from "./styles";

export function ResetPasswordButton({ userId }: { userId: number }) {
  const [state, action, pending] = useActionState(resetPasswordAction, null);

  return (
    <>
      <form
        action={action}
        onSubmit={(e) => {
          if (!confirm("Đặt lại mật khẩu? Người quản lý sẽ bị đăng xuất và cần mật khẩu mới để đăng nhập.")) e.preventDefault();
        }}
      >
        <input type="hidden" name="userId" value={userId} />
        <button type="submit" disabled={pending} className={adminBtnSecondary}>
          {pending ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
        </button>
      </form>
      {state && (
        <div className="basis-full">
          <CredentialsBox
            title="Đã đặt lại mật khẩu"
            username={state.username}
            password={state.password}
            loginUrl={`${window.location.origin}/quan-ly/dang-nhap`}
          />
        </div>
      )}
    </>
  );
}
