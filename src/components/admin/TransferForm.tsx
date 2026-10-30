"use client";

import { useActionState } from "react";
import { transferAction } from "@/app/quan-ly/actions";
import { AlertCircle } from "../icons";
import { adminBtnPrimary, adminInput } from "./styles";

// Chuyển đơn của BNV cho một quản lý KV. Chuyển rồi thì không đổi lại được nên hỏi xác nhận trước.
export function TransferForm({ id, targets }: { id: number; targets: { id: number; name: string }[] }) {
  const [state, action, pending] = useActionState(transferAction, null);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        const select = e.currentTarget.elements.namedItem("managerId") as HTMLSelectElement;
        const name = select.selectedOptions[0]?.text;
        if (!select.value || !confirm(`Chuyển đơn này cho ${name}? Sau khi chuyển, đơn thuộc về ${name} và không chuyển lại được.`)) {
          e.preventDefault();
        }
      }}
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs font-semibold text-muted">
          Chuyển đơn cho
          <select name="managerId" required defaultValue="" className={adminInput}>
            <option value="" disabled>
              Chọn người quản lý…
            </option>
            {targets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={pending} className={adminBtnPrimary}>
          {pending ? "Đang chuyển..." : "Chuyển đơn"}
        </button>
      </div>
      <p className="text-xs text-muted">Chỉ đơn của BNV mới được chuyển, và chỉ chuyển được một lần.</p>
      {state?.error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-peach-soft px-3.5 py-3 text-sm text-danger">
          <AlertCircle size={18} className="mt-px shrink-0" />
          {state.error}
        </p>
      )}
    </form>
  );
}
