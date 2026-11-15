"use client";

import { useState } from "react";
import { ZoneResult } from "./ZoneResult";
import { ConsultModal } from "../ConsultModal";
import { LoadError } from "../LoadError";
import { SiteHeader } from "../SiteHeader";
import { RestartButton } from "./RestartButton";
import type { ZonesFileEntry } from "@/lib/zones";

// Wrapper client cho trang /ket-qua: modal tư vấn (gửi xong chuyển sang /cam-on).
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
        onConsult={() => setModalOpen(true)}
      />
      <ConsultModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        validCodes={validCodes}
      />
    </>
  );
}
