"use client";

import { useRouter } from "next/navigation";
import { resetAll } from "@/lib/client-store";
import { Refresh } from "../icons";

export function RestartButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        resetAll();
        router.push("/quiz");
      }}
      className="inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-brand-dark hover:bg-peach-soft"
    >
      <Refresh size={16} />
      Làm lại
    </button>
  );
}
