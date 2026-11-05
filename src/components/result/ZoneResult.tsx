"use client";

import { useState } from "react";
import { CirclesDiagram } from "./CirclesDiagram";
import { ZoneModal } from "./ZoneModal";
import { RestartButton } from "./RestartButton";
import { SiteHeader } from "../SiteHeader";
import { DimensionBars } from "./DimensionBars";
import { LoadError } from "../LoadError";
import type { ZonesFileEntry } from "@/lib/zones";
import type { ZoneKey } from "@/lib/zones-types";

// Trang kết quả deep link (/ket-qua?mbti=&linh-vuc=): sơ đồ spotlight + modal từng vùng.
export function ZoneResult({
  type,
  field,
  entry,
  onConsult,
  consultSlot,
}: {
  type: string;
  field: string;
  entry: ZonesFileEntry;
  onConsult: () => void;
  consultSlot?: React.ReactNode;
}) {
  const [openZone, setOpenZone] = useState<ZoneKey | null>(null);
  const [seen, setSeen] = useState<Set<ZoneKey>>(new Set());

  function pickZone(key: ZoneKey) {
    setSeen((prev) => new Set(prev).add(key));
    setOpenZone(key);
  }

  if (!entry.complete) {
    return (
      <div className="flex min-h-dvh flex-col">
        <SiteHeader right={<RestartButton />} />
        <main className="mx-auto w-full max-w-6xl px-4 pb-8 pt-4">
          <LoadError
            message={`Nội dung cho ${type} trong lĩnh vực "${field}" đang được hoàn thiện. Bạn chọn lĩnh vực khác hoặc đăng ký tư vấn trực tiếp nhé.`}
          />
        </main>
      </div>
    );
  }

  const zone = openZone ? entry.zones[openZone] : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader right={<RestartButton />} />
      <main className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 pb-8 pt-4 lg:gap-8 lg:px-10 lg:pb-16 lg:pt-8">
        <section className="relative w-full max-w-[560px] overflow-hidden rounded-3xl bg-sun px-5 py-6 text-center">
          <p className="relative text-sm font-semibold text-[#5c3d00]">Phong cách giao tiếp của bạn</p>
          <h1 className="relative mt-1.5 text-[64px] font-extrabold leading-none tracking-[2px]">{type}</h1>
          <span className="relative mt-4 inline-block rounded-full bg-ink px-3 py-1.5 text-[13px] font-semibold text-white">
            Lĩnh vực: {field}
          </span>
        </section>
        <DimensionBars type={type} />
        <CirclesDiagram seen={seen} onSelect={pickZone} />
        {consultSlot}
      </main>
      {openZone && zone && (
        <ZoneModal
          zoneKey={openZone}
          zone={zone}
          onClose={() => setOpenZone(null)}
          onConsult={() => {
            setOpenZone(null);
            onConsult();
          }}
        />
      )}
    </div>
  );
}
