import { extractSpreadsheetId, getValues, quoteSheet } from "./google-sheets";
import { memoCache } from "./memo-cache";
import { normalizeRef } from "./ref";

// Danh sách người quản lý đọc từ tab Config của sheet tổng:
//   A: mã ref | B: tên | C: link sheet | D: đang hoạt động (TRUE/FALSE, để trống = đang hoạt động)
// Sửa tab này là có hiệu lực sau tối đa 1 phút, không cần deploy lại.

export type Manager = { ref: string; name: string; spreadsheetId: string };

const INACTIVE = /^(false|0|no|không|khong|ngưng|tắt)$/i;

const loadManagers = memoCache<Map<string, Manager>>(async () => {
  const sheetId = process.env.MASTER_SHEET_ID!;
  const tab = process.env.MASTER_CONFIG_TAB || "Config";
  const rows = await getValues(sheetId, `${quoteSheet(tab)}!A2:D`);
  const map = new Map<string, Manager>();
  for (const [rawRef, name, link, active] of rows) {
    const ref = normalizeRef(rawRef);
    const spreadsheetId = link ? extractSpreadsheetId(link) : null;
    if (!ref || !spreadsheetId) continue;
    if (active && INACTIVE.test(active.trim())) continue;
    map.set(ref, { ref, name: name?.trim() || ref, spreadsheetId });
  }
  return map;
}, () => 60);

export async function findManager(ref: string | undefined): Promise<Manager | null> {
  const key = normalizeRef(ref);
  if (!key) return null;
  return (await loadManagers()).get(key) ?? null;
}

export async function listManagers(): Promise<Manager[]> {
  return [...(await loadManagers()).values()];
}
