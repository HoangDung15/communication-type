"use client";

import { useActionState, useEffect, useState } from "react";
import { updateNoteAction } from "@/app/quan-ly/actions";
import { Check } from "../icons";
import { adminBtnPrimary } from "./styles";

export function NoteForm({ id, note }: { id: number; note: string }) {
  const [state, action, pending] = useActionState(updateNoteAction, null);
  const [value, setValue] = useState(note);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (state?.saved) setDirty(false);
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <textarea
        name="note"
        rows={4}
        maxLength={2000}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setDirty(true);
        }}
        placeholder="VD: Đã gọi lúc 19h, hẹn tư vấn thứ 7 lúc 9h sáng…"
        className="w-full resize-y rounded-xl border-[1.5px] border-line-strong bg-white px-3 py-2.5 text-[15px] leading-relaxed focus:border-sun-deep focus:outline-none"
      />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending || !dirty} className={adminBtnPrimary}>
          {pending ? "Đang lưu..." : "Lưu ghi chú"}
        </button>
        {state?.saved && !dirty && (
          <span className="flex items-center gap-1 text-sm font-semibold text-mint-dark">
            <Check size={16} />
            Đã lưu
          </span>
        )}
      </div>
    </form>
  );
}
