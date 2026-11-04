"use client";

import { useState } from "react";
import { ZoneResult } from "./ZoneResult";
import { ConsultModal } from "../ConsultModal";
import { LoadError } from "../LoadError";
import { SiteHeader } from "../SiteHeader";
import { RestartButton } from "./RestartButton";
import { thanksStore } from "@/lib/client-store";
import type { ZonesFileEntry } from "@/lib/zones";

// Wrapper client cho trang /ket-qua: modal tư vấn + overlay cảm ơn.
export function ZoneResultPage({
  type,
  field,
  entry,
  error,
  validCodes = null,
}: {
  type: string;
  field: string;
  entry: ZonesFileEntry | null;
  error: string | null;
  validCodes?: string[] | null;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [thanks, setThanks] = useState(false);

  if (error || !entry) {
    return (
      <div className="flex min-h-dvh flex-col">
        <SiteHeader right={<RestartButton />} />
        <main className="mx-auto w-full max-w-6xl px-4 pb-8 pt-4">
          <LoadError message={error ?? "Không tìm thấy kết quả."} />
        </main>
      </div>
    );
  }

  return (
    <>
      <ZoneResult
        type={type}
        field={field}
        entry={entry}
        onConsult={() => {
          setThanks(false);
          setModalOpen(true);
        }}
      />
      <ConsultModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        validCodes={validCodes}
        onSuccess={(info) => {
          thanksStore.set({ name: info.name, email: "", emailSent: false });
          setThanks(true);
        }}
      />
      {thanks && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Đăng ký thành công"
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setThanks(false);
          }}
        >
          <div aria-hidden="true" className="absolute inset-0 bg-ink/55" />
          <div className="relative w-full max-w-[480px] rounded-t-[24px] bg-white px-5 py-7 text-center shadow-2xl sm:rounded-[24px] sm:px-8">
            <h2 className="text-2xl font-extrabold">Cảm ơn bạn!</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-body">
              Đội ngũ đã nhận được thông tin và sẽ sớm liên hệ với bạn.
            </p>
            <button
              type="button"
              onClick={() => {
                setThanks(false);
                setModalOpen(false);
              }}
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-brand px-5 font-bold text-white hover:bg-brand-dark"
            >
              Xem lại kết quả
            </button>
          </div>
        </div>
      )}
    </>
  );
}
