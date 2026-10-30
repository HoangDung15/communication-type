"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePasswordAction } from "@/app/quan-ly/actions";
import { AlertCircle, Check } from "../icons";
import { adminBtnPrimary, adminInput } from "./styles";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="mt-3 flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Mật khẩu hiện tại
        <input name="current" type="password" required autoComplete="current-password" className={adminInput} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Mật khẩu mới (ít nhất 8 ký tự)
        <input name="next" type="password" required minLength={8} autoComplete="new-password" className={adminInput} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Nhập lại mật khẩu mới
        <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className={adminInput} />
      </label>
      {state?.error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-peach-soft px-3.5 py-3 text-sm text-danger">
          <AlertCircle size={18} className="mt-px shrink-0" />
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="flex items-center gap-2 rounded-xl bg-mint-faint px-3.5 py-3 text-sm font-semibold text-mint-dark">
          <Check size={18} />
          Đã đổi mật khẩu
        </p>
      )}
      <button type="submit" disabled={pending} className={`${adminBtnPrimary} self-start`}>
        {pending ? "Đang lưu..." : "Đổi mật khẩu"}
      </button>
    </form>
  );
}
