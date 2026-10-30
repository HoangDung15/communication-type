import raw from "@/data/results.json";
import type { MbtiType } from "./mbti";
import { fieldKey, type ResultsFile } from "./results-types";

// Nội dung kết quả lấy từ file JSON đồng bộ sẵn (npm run sync-results).
// Chỉ import file này ở phía server: import trong component "use client" sẽ đẩy cả file JSON xuống trình duyệt.

const data = raw as ResultsFile;

export function getFieldCount(): number {
  return data.fields.length;
}

// Danh sách lĩnh vực có nội dung cho từng MBTI, theo thứ tự chung.
export function getFieldsByType(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [type, tab] of Object.entries(data.byType)) {
    out[type] = data.fields.filter((f) => tab && f in tab);
  }
  return out;
}

export function getResultContent(type: MbtiType, field: string): { field: string; content: string } | null {
  const tab = data.byType[type];
  if (!tab) return null;
  const key = fieldKey(field);
  const match = Object.keys(tab).find((name) => fieldKey(name) === key);
  return match ? { field: match, content: tab[match] } : null;
}
