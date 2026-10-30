"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/quan-ly/actions";
import { AlertCircle } from "../icons";
import { btnPrimary } from "../ui";
import { adminInput } from "./styles";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="username" className="text-sm font-semibold">
          Tên đăng nhập
        </label>
        <input
          id="username"
          name="username"
          required
          defaultValue={state?.username}
          key={state?.username}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          className={adminInput}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-semibold">
          Mật khẩu
        </label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className={adminInput} />
      </div>
      {state?.error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-peach-soft px-3.5 py-3 text-sm text-danger">
          <AlertCircle size={18} className="mt-px shrink-0" />
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={`${btnPrimary} mt-1`}>
        {pending ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
    </form>
  );
}
