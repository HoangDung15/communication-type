// Nhãn hiển thị cố định cho 4 vùng kết quả, khớp FLOW_PLAN §4.

export const ZONE_ORDER = ["z1", "z2", "z3", "yellow"] as const;

export type ZoneKey = (typeof ZONE_ORDER)[number];

export const ZONE_LABELS: Record<ZoneKey, string> = {
  z1: "Bạn là ai?",
  z2: "Phong cách giao tiếp của bạn là gì?",
  z3: "Lĩnh vực của bạn cần người như thế nào?",
  yellow: "Tiềm năng giao tiếp của bạn",
};

export type ZoneData = {
  /** Tiêu đề đầy đủ từ sheet (dòng ###). */
  title: string;
  /** Dòng "Hình ảnh đại diện: ..." trong zone, nếu có. */
  avatar: string | null;
  /** Nội dung zone, render bằng parseResult. */
  body: string;
};

/**
 * Khóa chuẩn để gộp tên lĩnh vực viết khác nhau giữa các tab/kicker:
 * "KINH TẾ, TÀI CHÍNH", "KINH TẾ / TÀI CHÍNH" và "Kinh tế - tài chính" là một;
 * "LÃNH ĐẠO / QUẢN LÝ" và "Lãnh đạo" là một.
 */
export function canonicalFieldKey(name: string): string {
  const normalized = name
    .normalize("NFC")
    .replace(/[–—]/g, "-")
    .toLowerCase()
    .replace(/[,/\\|]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = new Set(normalized.split(" ").filter(Boolean));
  if (words.has("lãnh") && words.has("đạo")) return "lãnh đạo";
  if (words.has("kinh") && words.has("tế")) return "kinh tế tài chính";
  return normalized;
}
export type ZonesFileEntry = {
  /** Đủ cả 4 zones non-empty thì true; thiếu thì UI hiện disabled + ghi chú. */
  complete: boolean;
  zones: Partial<Record<ZoneKey, ZoneData>>;
  /** Phần nội dung viết bổ sung trong repo, không có nguyên văn trong sheet nguồn. */
  supplementedZones?: ZoneKey[];
};

/** Cấu trúc file src/data/results-zones.json (do scripts/sync-zones.ts tạo ra). */
export type ZonesFile = {
  syncedAt: string;
  sheetId: string;
  /** Thứ tự lĩnh vực hiển thị, gộp từ dòng 1 của các tab. */
  fields: string[];
  /** Chỉ những cặp có ô trong sheet mới có khóa; ô thiếu zone → complete: false. */
  byType: Partial<Record<string, Record<string, ZonesFileEntry>>>;
};
