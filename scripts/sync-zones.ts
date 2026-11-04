// Đồng bộ nội dung 4 zones từ sheet đích về src/data/results-zones.json
//   npm run sync-zones            ← đọc sheet live qua gviz (cần share link)
//   npm run sync-zones:local      ← đọc file mbti.xlsx trong thư mục gốc (không cần mạng)
//
// Sheet/file: mỗi tab là một MBTI; dòng 1 = tên lĩnh vực, dòng 2 = nội dung (4 zones).
// Cột trống, cột "(Updated)" và cột "Kế toán - Tài chính - Ngân hàng" bị bỏ qua.
// Ô thiếu zone (chưa viết xong) vẫn được ghi với complete: false để UI hiện
// disabled kèm ghi chú.
// Có lỗi nghiêm trọng thì không ghi đè file đang dùng.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { inflateRawSync } from "node:zlib";
import { MBTI_TYPES } from "../src/lib/mbti";
import { diagnoseZones, type Zone, type ZoneKey } from "../src/lib/parse-zones";
import { canonicalFieldKey } from "../src/lib/zones-types";
import type { ZoneData, ZonesFile, ZonesFileEntry } from "../src/lib/zones-types";

const DEFAULT_SHEET_ID = "1eVQCucvuvRZYANLboJFzhECbImY1mL7pyEruU35t0ck";
const OUTPUT = join(process.cwd(), "src", "data", "results-zones.json");
const COMPLETIONS = join(process.cwd(), "src", "data", "zones-completions.json");

// Cột bị bỏ qua khi đồng bộ: bản nháp đang viết lại, và cột Kế toán
// (theo yêu cầu: không dùng lĩnh vực "Kế toán - Tài chính - Ngân hàng").
const IGNORED_COLUMN = /\(updated\)|kế toán/i;

const errors: string[] = [];
const warnings: string[] = [];

type Completion = { sourceTail: string; z3Continuation: string; yellow: ZoneData };
const completions = JSON.parse(readFileSync(COMPLETIONS, "utf8")) as Record<string, Record<string, Completion>>;

// ---- Đọc file .xlsx local (không cần thư viện ngoài, chỉ dùng node:zlib) ----
// Trả về { tên tab: các dòng (mỗi dòng là mảng ô theo đúng vị trí cột) }.

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function colLettersToIndex(letters: string): number {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

type ZipEntry = { offset: number; method: number; size: number };

function parseZip(buf: Buffer): Map<string, ZipEntry> {
  // Tìm End Of Central Directory (signature 0x06054b50).
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("File không phải định dạng zip/xlsx hợp lệ.");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = new Map<string, ZipEntry>();
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("Central directory của xlsx bị lỗi.");
    const method = buf.readUInt16LE(p + 10);
    const size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const offset = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    out.set(name, { offset, method, size });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

function readZipFile(buf: Buffer, entries: Map<string, ZipEntry>, name: string): string {
  const e = entries.get(name);
  if (!e) throw new Error(`Không tìm thấy ${name} trong file xlsx.`);
  if (buf.readUInt32LE(e.offset) !== 0x04034b50) throw new Error("Local header của xlsx bị lỗi.");
  const nameLen = buf.readUInt16LE(e.offset + 26);
  const extraLen = buf.readUInt16LE(e.offset + 28);
  const start = e.offset + 30 + nameLen + extraLen;
  const raw = buf.subarray(start, start + e.size);
  const inflated = e.method === 8 ? inflateRawSync(raw) : raw;
  return inflated.toString("utf8");
}

function readXlsxTabs(path: string): Record<string, string[][]> {
  const buf = readFileSync(path);
  const entries = parseZip(buf);

  // Thứ tự tab trong workbook + ánh xạ rId -> file sheet qua .rels
  const workbook = readZipFile(buf, entries, "xl/workbook.xml");
  const rels = readZipFile(buf, entries, "xl/_rels/workbook.xml.rels");
  const targetById = new Map<string, string>();
  for (const m of rels.matchAll(/<Relationship\b[^>]*\bId="([^"]+)"[^>]*\bTarget="([^"]+)"/g)) {
    targetById.set(m[1], m[2]);
  }
  const tabs: { name: string; file: string }[] = [];
  for (const m of workbook.matchAll(/<sheet\b[^>]*\bname="([^"]+)"[^>]*\br:id="([^"]+)"[^>]*\/>/g)) {
    // thuộc tính có thể đảo thứ tự name/r:id nên thử cả hai chiều
    const tag = m[0];
    const name = /name="([^"]+)"/.exec(tag)?.[1] ?? "";
    const rid = /r:id="([^"]+)"/.exec(tag)?.[1] ?? "";
    const target = targetById.get(rid) ?? "";
    if (name && target) tabs.push({ name, file: `xl/${target.replace(/^\//, "")}` });
  }
  if (!tabs.length) throw new Error("Không đọc được danh sách tab trong file xlsx.");

  // Shared strings
  let shared: string[] = [];
  try {
    const sst = readZipFile(buf, entries, "xl/sharedStrings.xml");
    for (const m of sst.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
      const texts = [...m[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((t) => decodeXmlEntities(t[1]));
      shared.push(texts.join(""));
    }
  } catch {
    shared = [];
  }

  const out: Record<string, string[][]> = {};
  for (const { name, file } of tabs) {
    const xml = readZipFile(buf, entries, file);
    const grid = new Map<number, Map<number, string>>();
    for (const rm of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
      const rowTag = rm[0];
      const rowNum = parseInt(/r="(\d+)"/.exec(rowTag)?.[1] ?? "0", 10);
      if (!rowNum) continue;
      const cols = grid.get(rowNum) ?? new Map<number, string>();
      // Bỏ qua ô XML tự đóng (`<c r="A2"/>`) mà không nuốt ô kế tiếp.
      for (const cm of rm[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const cAttrs = cm[1];
        const ref = /r="([A-Z]+)\d+"/.exec(cAttrs)?.[1] ?? "";
        if (!ref) continue;
        const t = /t="([a-z]+)"/.exec(cAttrs)?.[1] ?? "";
        const inner = cm[2] ?? "";
        let val = "";
        if (t === "s") {
          const idx = parseInt(/<v>(-?\d+)<\/v>/.exec(inner)?.[1] ?? "-1", 10);
          val = idx >= 0 && idx < shared.length ? shared[idx] : "";
        } else if (t === "inlineStr") {
          val = decodeXmlEntities([...inner.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join(""));
        } else {
          val = decodeXmlEntities(/<v>([\s\S]*?)<\/v>/.exec(inner)?.[1] ?? "");
        }
        cols.set(colLettersToIndex(ref), val);
      }
      grid.set(rowNum, cols);
    }
    const maxRow = Math.max(0, ...grid.keys());
    const rows: string[][] = [];
    for (let r = 1; r <= maxRow; r++) {
      const cols = grid.get(r);
      if (!cols) {
        rows.push([]);
        continue;
      }
      const maxCol = Math.max(...cols.keys());
      const arr: string[] = [];
      for (let c = 0; c <= maxCol; c++) arr.push(cols.get(c) ?? "");
      rows.push(arr);
    }
    out[name] = rows;
  }
  return out;
}

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

function toEntry(text: string): ZonesFileEntry & { diag?: string } {
  const d = diagnoseZones(text);
  const zones: ZonesFileEntry["zones"] = {};
  for (const [key, z] of Object.entries(d.partialZones) as [ZoneKey, Zone][]) {
    zones[key] = { title: z.title, avatar: z.avatar, body: z.body };
  }
  const missing = (["z1", "z2", "z3", "yellow"] as const).filter((k) => !d[k]);
  return { complete: missing.length === 0, zones, ...(missing.length ? { diag: `thiếu ${missing.join(", ")}` } : {}) };
}

function applyCompletion(type: string, field: string, entry: ZonesFileEntry): void {
  // Khi sheet được hoàn thiện, nội dung nguồn luôn thắng bản viết bổ sung.
  if (entry.complete) return;
  const completion = completions[type]?.[field];
  if (!completion) return;
  const z3 = entry.zones.z3;
  if (!z3 || entry.zones.yellow || !z3.body.endsWith(completion.sourceTail)) {
    errors.push(`${type} × ${field}: nguồn đã thay đổi, cần duyệt lại phần viết bổ sung`);
    return;
  }
  z3.body += completion.z3Continuation;
  entry.zones.yellow = completion.yellow;
  entry.complete = (["z1", "z2", "z3", "yellow"] as const).every((key) => !!entry.zones[key]?.body.trim());
  if (!entry.complete) errors.push(`${type} × ${field}: phần viết bổ sung chưa đủ 4 vùng`);
  else {
    entry.supplementedZones = ["z3", "yellow"];
    warnings.push(`${type} × ${field}: đã viết tiếp z3 và bổ sung yellow từ src/data/zones-completions.json`);
  }
}

async function main() {
  const localPath = process.argv[2] === "--local" ? process.argv[3] || join(process.cwd(), "mbti.xlsx") : null;
  const sheetId = process.env.RESULTS_SHEET_ID || DEFAULT_SHEET_ID;
  console.log(localPath ? `Đang đọc file local ${localPath} ...` : `Đang tải sheet ${sheetId} ...`);

  const fields: string[] = [];
  const byType: ZonesFile["byType"] = {};

  let localTabs: Record<string, string[][]> | null = null;
  if (localPath) {
    try {
      localTabs = readXlsxTabs(localPath);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  for (const type of MBTI_TYPES) {
    let rows: string[][];
    try {
      rows = localTabs ? (localTabs[type] ?? []) : await fetchTab(sheetId, type);
      if (localTabs && !localTabs[type]) {
        errors.push(`${type}: không có tab "${type}" trong file local`);
        continue;
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
      continue;
    }

    // Dòng tiêu đề và nội dung cùng cột. Chỉ ENTJ có ô A1 "Lĩnh vực";
    // các tab khác bắt đầu bằng "Lãnh đạo" ở A1. Không bỏ cột đầu mặc định.
    const rawHeader = (rows[0] ?? []).map((h) => h.replace(/\s+/g, " ").trim());
    const rawContent = rows[1] ?? [];
    const tab: Record<string, ZonesFileEntry> = {};
    for (let column = 0; column < rawHeader.length; column++) {
      const name = rawHeader[column];
      if (!name || name.toLowerCase() === "lĩnh vực" || IGNORED_COLUMN.test(name)) continue;
      const text = (rawContent[column] ?? "").trim();
      if (!text) {
        warnings.push(`${type} × ${name}: ô trống`);
        continue;
      }
      const firstLine = text.split("\n").find((line) => line.trim()) ?? "";
      const kicker = firstLine.match(/^#\s+([A-Z]{4})\s*[–—-]\s*NGÀNH\s+(.+)$/i);
      if (kicker && kicker[1].toUpperCase() !== type) {
        errors.push(`${type} × ${name}: kicker ghi ${kicker[1]}`);
        continue;
      }
      if (!kicker) warnings.push(`${type} × ${name}: không có kicker MBTI; dùng vị trí cột trong sheet`);

      // Gộp tên lĩnh vực viết hơi khác nhau giữa các tab về một tên thống nhất
      // (kicker như "KINH TẾ, TÀI CHÍNH" hay "LÃNH ĐẠO / QUẢN LÝ" gộp vào tên chuẩn).
      const existing = fields.find((f) => canonicalFieldKey(f) === canonicalFieldKey(name));
      const field = existing ?? name;
      if (!existing) fields.push(field);
      else if (existing !== name) warnings.push(`${type}: "${name}" được gộp với "${existing}"`);

      const entry = toEntry(text);
      applyCompletion(type, field, entry);
      if (!entry.complete) warnings.push(`${type} × ${field}: ${entry.diag ?? "thiếu zone"}, sẽ hiện disabled kèm ghi chú`);
      const { diag: _diag, ...clean } = entry;
      tab[field] = clean;
    }

    if (!Object.keys(tab).length) errors.push(`${type}: không có lĩnh vực nào có nội dung`);
    byType[type] = tab;
    const done = Object.values(tab).filter((e) => e.complete).length;
    console.log(`  ✓ ${type}: ${Object.keys(tab).length} lĩnh vực (${done} đầy đủ)`);
  }

  for (const w of warnings) console.log(`  ! ${w}`);
  if (errors.length) {
    for (const e of errors) console.log(`  ✗ ${e}`);
    console.log(`\nCó ${errors.length} lỗi, KHÔNG ghi đè ${OUTPUT}.`);
    process.exit(1);
  }

  const data: ZonesFile = { syncedAt: new Date().toISOString(), sheetId, fields, byType };
  const json = JSON.stringify(data, null, 1) + "\n";
  writeFileSync(OUTPUT, json);
  console.log(`\nĐã ghi ${OUTPUT} (${Math.round(Buffer.byteLength(json) / 1024)} KB), ${fields.length} lĩnh vực.`);
}

main();
