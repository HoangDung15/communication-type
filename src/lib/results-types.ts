import type { MbtiType } from "./mbti";

// Cấu trúc file src/data/results.json (do scripts/sync-results.ts tạo ra).
export type ResultsFile = {
  syncedAt: string;
  sheetId: string;
  // Thứ tự lĩnh vực hiển thị, gộp từ dòng 1 của các tab
  fields: string[];
  // byType[MBTI][lĩnh vực] = nội dung ô. Lĩnh vực không có nội dung thì không có khoá.
  byType: Partial<Record<MbtiType, Record<string, string>>>;
};

// So khớp tên lĩnh vực không phân biệt hoa thường, khoảng trắng thừa, gạch ngắn/dài.
export function fieldKey(name: string): string {
  return name.normalize("NFC").replace(/[–—]/g, "-").replace(/\s+/g, " ").trim().toLowerCase();
}
