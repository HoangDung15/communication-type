"use client";

import { useActionState } from "react";
import { deleteRegistrationAction } from "@/app/quan-ly/actions";

export function DeleteRegistrationForm({ id, name }: { id: number; name: string }) {
  const [state, action, pending] = useActionState(deleteRegistrationAction, null);

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(`Xóa vĩnh viễn đơn của ${name}? Thao tác này không thể hoàn tác.`)) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center justify-center rounded-xl border border-red-600 px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
      >
        {pending ? "Đang xóa..." : "Xóa đơn"}
      </button>
      {state?.error && <p role="alert" className="mt-2 text-sm text-red-700">{state.error}</p>}
    </form>
  );
}
