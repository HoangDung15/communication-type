// Đồng bộ nội dung kết quả từ Google Sheet về src/data/results.json
//   npm run sync-results
//
// Sheet phải để chế độ "Bất kỳ ai có đường liên kết đều có thể xem". Không cần Service Account.
// Mỗi tab là một MBTI; dòng 1 = tên lĩnh vực, dòng "Kết quả phong cách giao tiếp" = nội dung.
// Các dòng khác (ví dụ "Key vấn đề trong giao tiếp", "Phần CTA...") không được lấy.
// Có lỗi nghiêm trọng thì không ghi đè file đang dùng.

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { MBTI_TYPES } from "../src/lib/mbti";
import { parseResult } from "../src/lib/parse-result";
import { fieldKey, type ResultsFile } from "../src/lib/results-types";

const DEFAULT_SHEET_ID = "1kMLWs40b1lM3WC64m1AEMlMU-246XqmCUPe4aMXMZt8";
const OUTPUT = join(process.cwd(), "src", "data", "results.json");

// Cột bị bỏ qua khi đồng bộ (bản nháp đang viết lại). Ví dụ: "Công nghệ thông tin (Updated)".
const IGNORED_COLUMN = /\(updated\)/i;
const CONTENT_ROW_LABEL = /^kết quả/i;

const errors: string[] = [];
const warnings: string[] = [];

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (c !== "\r") cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

async function fetchTab(sheetId: string, tab: string): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(tab)}`;
  const res = await fetch(url);
  const type = res.headers.get("content-type") ?? "";
  if (!res.ok || !type.includes("text/csv")) {
    throw new Error(`Không tải được tab ${tab} (HTTP ${res.status}). Sheet đã để chế độ ai có link cũng xem được chưa?`);
  }
  return parseCsv(await res.text());
}

async function main() {
  const sheetId = process.env.RESULTS_SHEET_ID || DEFAULT_SHEET_ID;
  console.log(`Đang tải sheet ${sheetId} ...`);

  const fields: string[] = [];
  const byType: ResultsFile["byType"] = {};

  for (const type of MBTI_TYPES) {
    let rows: string[][];
    try {
      rows = await fetchTab(sheetId, type);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
      continue;
    }

    // gviz trả về tab đầu tiên nếu không tìm thấy tên tab, nên kiểm tra lại nội dung có đúng MBTI.
    const header = rows[0] ?? [];
    const content = rows.find((r, i) => i > 0 && CONTENT_ROW_LABEL.test(r[0]?.trim() ?? "")) ?? rows[1] ?? [];
    const tab: Record<string, string> = {};

    for (let col = 1; col < header.length; col++) {
      const name = header[col].replace(/\s+/g, " ").trim();
      const text = (content[col] ?? "").trim();
      if (!name || IGNORED_COLUMN.test(name)) continue;
      if (!text) {
        warnings.push(`${type} × ${name}: ô trống, lĩnh vực này sẽ ẩn với ${type}`);
        continue;
      }
      if (!text.toUpperCase().startsWith(type)) {
        errors.push(`${type} × ${name}: nội dung không bắt đầu bằng "${type}" (có thể sai tab hoặc tab không tồn tại)`);
        continue;
      }

      // Gộp tên lĩnh vực viết hơi khác nhau giữa các tab về một tên thống nhất
      const existing = fields.find((f) => fieldKey(f) === fieldKey(name));
      const field = existing ?? name;
      if (!existing) fields.push(field);
      else if (existing !== name) warnings.push(`${type}: "${name}" được gộp với "${existing}"`);

      const sections = parseResult(text).sections.length;
      const occurrences = text.split("\n").filter((l) => l.trim().toUpperCase().startsWith(`${type} –`)).length;
      if (occurrences > 1 || sections > 14) {
        warnings.push(`${type} × ${field}: có vẻ bị dán lặp nội dung (${sections} mục)`);
      }
      tab[field] = text;
    }

    if (!Object.keys(tab).length) errors.push(`${type}: không có lĩnh vực nào có nội dung`);
    byType[type] = tab;
    console.log(`  ✓ ${type}: ${Object.keys(tab).length} lĩnh vực`);
  }

  for (const w of warnings) console.log(`  ! ${w}`);
  if (errors.length) {
    for (const e of errors) console.log(`  ✗ ${e}`);
    console.log(`\nCó ${errors.length} lỗi, KHÔNG ghi đè ${OUTPUT}.`);
    process.exit(1);
  }

  const data: ResultsFile = { syncedAt: new Date().toISOString(), sheetId, fields, byType };
  const json = JSON.stringify(data, null, 1) + "\n";
  writeFileSync(OUTPUT, json);
  console.log(`\nĐã ghi ${OUTPUT} (${Math.round(Buffer.byteLength(json) / 1024)} KB), ${fields.length} lĩnh vực.`);
}

main();
