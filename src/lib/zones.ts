import zonesRaw from "@/data/results-zones.json";
import type { MbtiType } from "./mbti";
import { fieldKey } from "./results-types";
import { canonicalFieldKey, type ZonesFile, type ZonesFileEntry, type ZoneKey } from "./zones-types";

// Nội dung 4 zones lấy từ file đồng bộ sẵn (npm run sync-zones).
// Chỉ import file này ở phía server: import trong component "use client" sẽ đẩy cả file JSON xuống trình duyệt.

type ZonesData = {
  syncedAt: string;
  sheetId: string;
  fields: string[];
  byType: Partial<Record<string, Record<string, ZonesFileEntry>>>;
};

const data = zonesRaw as unknown as ZonesData;

export type { ZonesFile, ZonesFileEntry, ZoneKey };

export function getZoneFieldCount(): number {
  return data.fields.length;
}

// Danh sách lĩnh vực có nội dung đầy đủ cho từng MBTI, theo thứ tự chung.
export function getCompleteFieldsByType(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [type, tab] of Object.entries(data.byType)) {
    out[type] = data.fields.filter((f) => tab && tab[f]?.complete);
  }
  return out;
}

export type FieldStatus =
  | { status: "complete" }
  | { status: "incomplete" }
  | { status: "missing" };

function findField(tab: Record<string, ZonesFileEntry>, field: string): string | null {
  const key = fieldKey(field);
  const exact = Object.keys(tab).find((name) => fieldKey(name) === key);
  if (exact) return exact;
  const ckey = canonicalFieldKey(field);
  return Object.keys(tab).find((name) => canonicalFieldKey(name) === ckey) ?? null;
}

export function getFieldStatus(type: MbtiType, field: string): FieldStatus {
  const tab = data.byType[type];
  if (!tab) return { status: "missing" };
  const match = findField(tab, field);
  if (!match) return { status: "missing" };
  return tab[match].complete ? { status: "complete" } : { status: "incomplete" };
}

export function getZoneContent(type: MbtiType, field: string): { field: string; entry: ZonesFileEntry } | null {
  const tab = data.byType[type];
  if (!tab) return null;
  const match = findField(tab, field);
  return match ? { field: match, entry: tab[match] } : null;
}
