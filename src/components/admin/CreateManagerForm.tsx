"use client";

import { useActionState, useEffect, useRef } from "react";
import { createManagerAction } from "@/app/quan-ly/actions";
import { AlertCircle } from "../icons";
import { CredentialsBox } from "./CredentialsBox";
import { adminBtnPrimary, adminInput } from "./styles";

export function CreateManagerForm({ origin }: { origin: string }) {
  const [state, action, pending] = useActionState(createManagerAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div className="mt-3 flex flex-col gap-3">
      <form ref={formRef} action={action} className="grid gap-3 md:grid-cols-[1.4fr_1fr_auto] md:items-end">
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          Tên hiển thị
          <input name="name" required placeholder="VD: KV36" className={adminInput} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          Tên đăng nhập
          <input name="username" required placeholder="VD: kv36" autoCapitalize="none" spellCheck={false} className={adminInput} />
        </label>
        <button type="submit" disabled={pending} className={adminBtnPrimary}>
          {pending ? "Đang tạo..." : "Thêm"}
        </button>
      </form>
      <p className="text-xs text-muted">
        Link giới thiệu (8 ký tự) và mật khẩu được tạo tự động. Tên đăng nhập chỉ dùng để vào trang quản lý, không hiện trên link.
      </p>

      {state && !state.ok && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-peach-soft px-3.5 py-3 text-sm text-danger">
          <AlertCircle size={18} className="mt-px shrink-0" />
          {state.error}
        </p>
      )}
      {state?.ok && (
        <CredentialsBox
          title="Đã tạo người quản lý"
          username={state.username}
          password={state.password}
          loginUrl={`${origin}/quan-ly/dang-nhap`}
        />
      )}
    </div>
  );
}
