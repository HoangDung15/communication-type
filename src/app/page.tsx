import type { Metadata } from "next";
import { connection } from "next/server";
import rawZones from "@/data/results-zones.json";
import { Landing } from "@/components/Landing";
import { getPool } from "@/lib/db";
import { getCompleteFieldsByType, getZoneFieldCount, type ZonesFileEntry } from "@/lib/zones";

export const metadata: Metadata = { title: "BETTER TALK, BETTER WORK" };

type ZonesJson = { byType: Record<string, Record<string, ZonesFileEntry>> };

export default async function HomePage() {
  await connection();
  let validCodes: string[] | null = null;
  try {
    const { rows } = await getPool().query<{ ref: string }>("SELECT ref FROM managers WHERE active");
    validCodes = rows.map((r) => r.ref);
  } catch (err) {
    console.error("[home] Không đọc được danh sách mã giới thiệu:", err);
  }

  // Entries đầy đủ (kể cả incomplete) để FieldStep hiện ô disabled + ghi chú.
  const zoneEntries = (rawZones as ZonesJson).byType;

  return <Landing fieldsByType={getCompleteFieldsByType()} fieldCount={getZoneFieldCount()} zoneEntries={zoneEntries} validCodes={validCodes} />;
}
