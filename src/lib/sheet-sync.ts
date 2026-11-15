import { exportRegistrations, parseFilters, type RegistrationDetail } from "./admin-data";
import type { CurrentUser } from "./auth";
import { getPool } from "./db";
import { appendRows, addSheet, extractSpreadsheetId, getSheetTitles, getValues, quoteSheet } from "./google-sheets";
import { displayReferralCode } from "./ref";
import type { RegisterPayload } from "./register-schema";
import { answersShort } from "./registration-text";
import { statusOf } from "./statuses";
import { formatDateTime } from "@/components/admin/styles";

// Đổ đơn đăng ký sang Google Sheet. Sheet chỉ là bản sao: trang /quan-ly (Neon) vẫn là nơi chăm sóc khách.
// - Mỗi tài khoản /quan-ly tự kết nối Sheet riêng (users.sheet_id).
// - Đơn mới: thêm 1 dòng vào Sheet của người phụ trách + Sheet của admin.
// - BACKUP_SHEET_ID (cấu hình trên Vercel, không phụ thuộc DB): nhận mọi đơn, kể cả khi Neon lỗi.

export const SHEET_TAB = "Đăng ký";

export const SHEET_HEADER = [
  "Mã đơn", "Thời gian", "Họ và tên", "Năm sinh", "Giới tính", "Công việc / ngành học", "SĐT / Zalo", "Email",
  "Facebook", "Nơi sống", "Khung giờ liên hệ", "Mong muốn được giúp đỡ", "MBTI", "Lĩnh vực", "Điểm từng nhóm",
  "Câu trả lời", "Người phụ trách", "Mã giới thiệu", "Nguồn (utm_source)", "Kênh (utm_medium)",
  "Chiến dịch (utm_campaign)", "Trạng thái lúc ghi",
];

/** Ghi vào cột trạng thái khi Neon lỗi: đơn chỉ có trong Sheet, cần nhập lại vào trang quản lý. */
export const DB_FAILED_STATUS = "⚠ Chưa lưu vào trang quản lý (DB lỗi)";

export type SheetRecord = {
  id: number | null;
  createdAt: Date;
  name: string;
  birthYear: number | string;
  gender: string;
  job: string;
  phone: string;
  email: string;
  facebook: string;
  city: string;
  contactTime: string;
  consultationGoal: string | null;
  mbti: string | null;
  field: string | null;
  scores: string | null;
  answers: string | null;
  managerName: string | null;
  ref: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  statusLabel: string;
};

export function recordFromPayload(
  p: RegisterPayload,
  extra: { id: number | null; managerName: string | null; statusLabel: string; createdAt?: Date },
): SheetRecord {
  return {
    id: extra.id,
    createdAt: extra.createdAt ?? new Date(),
    name: p.name,
    birthYear: p.birthYear,
    gender: p.gender,
    job: p.job,
    phone: p.phone,
    email: p.email,
    facebook: p.facebook,
    city: p.city,
    contactTime: p.contactTime,
    consultationGoal: p.consultationGoal,
    mbti: p.mbti ?? null,
    field: p.field ?? null,
    scores: p.scores ?? null,
    answers: p.answers ?? null,
    managerName: extra.managerName,
    ref: p.referral || null,
    utmSource: p.utmSource ?? null,
    utmMedium: p.utmMedium ?? null,
    utmCampaign: p.utmCampaign ?? null,
    statusLabel: extra.statusLabel,
  };
}

export function recordFromDetail(r: RegistrationDetail): SheetRecord {
  return { ...r, statusLabel: statusOf(r.status).label };
}

export function toSheetRow(r: SheetRecord): string[] {
  return [
    r.id === null ? "" : String(r.id), formatDateTime(r.createdAt), r.name, String(r.birthYear), r.gender, r.job,
    r.phone, r.email, r.facebook, r.city, r.contactTime, r.consultationGoal ?? "", r.mbti ?? "", r.field ?? "",
    r.scores ?? "", answersShort(r.answers) ?? "", r.managerName ?? "", r.ref ? displayReferralCode(r.ref) : "",
    r.utmSource ?? "", r.utmMedium ?? "", r.utmCampaign ?? "", r.statusLabel,
  ];
}

// ---- Ghi vào Sheet ----

const tabRange = (cells: string) => `${quoteSheet(SHEET_TAB)}!${cells}`;

/** Tạo tab "Đăng ký" + dòng tiêu đề nếu chưa có. Đồng thời là phép thử quyền ghi khi kết nối. */
export async function ensureSheetTab(spreadsheetId: string): Promise<void> {
  const titles = await getSheetTitles(spreadsheetId);
  if (!titles.includes(SHEET_TAB)) await addSheet(spreadsheetId, SHEET_TAB);
  const first = await getValues(spreadsheetId, tabRange("A1:A1"));
  if (!first.length) await appendRows(spreadsheetId, tabRange("A1"), [SHEET_HEADER]);
}

async function appendRecord(spreadsheetId: string, row: string[]): Promise<void> {
  await ensureSheetTab(spreadsheetId);
  await appendRows(spreadsheetId, tabRange("A1"), [row]);
}

export function backupSheetId(): string | null {
  const raw = process.env.BACKUP_SHEET_ID;
  return raw ? extractSpreadsheetId(raw) : null; // nhận cả link lẫn ID
}

/** Ghi vào Sheet dự phòng. Trả về true nếu ghi được (dùng khi Neon lỗi để vẫn nhận đơn). */
export async function appendToBackup(record: SheetRecord): Promise<boolean> {
  const id = backupSheetId();
  if (!id) return false;
  try {
    await appendRecord(id, toSheetRow(record));
    return true;
  } catch (err) {
    console.error("[sheet] Ghi Sheet dự phòng thất bại:", err);
    return false;
  }
}

/** Sheet đã kết nối của người phụ trách và của admin (đang hoạt động). Lỗi DB (vd. chưa chạy migration) → bỏ qua. */
async function recipientSheets(managerId: number | null): Promise<string[]> {
  try {
    const { rows } = await getPool().query<{ sheetId: string }>(
      `SELECT DISTINCT sheet_id AS "sheetId" FROM users
        WHERE active AND sheet_id IS NOT NULL AND (role = 'admin' OR manager_id = $1::int)`,
      [managerId],
    );
    return rows.map((r) => r.sheetId);
  } catch (err) {
    console.error("[sheet] Không đọc được danh sách Sheet:", err);
    return [];
  }
}

/** Đơn đã lưu vào Neon: thêm 1 dòng vào Sheet dự phòng + Sheet của người phụ trách và admin. Không bao giờ ném lỗi. */
export async function mirrorRegistration(record: SheetRecord, managerId: number | null): Promise<void> {
  const backup = backupSheetId();
  const targets = new Set(await recipientSheets(managerId));
  if (backup) targets.add(backup);
  const row = toSheetRow(record);
  const results = await Promise.allSettled([...targets].map((id) => appendRecord(id, row)));
  results.forEach((r, i) => {
    if (r.status === "rejected") console.error(`[sheet] Ghi Sheet ${[...targets][i]} thất bại:`, r.reason);
  });
}

// ---- Kết nối của từng tài khoản ----

export type UserSheet = { sheetId: string; connectedAt: Date };

export async function getUserSheet(userId: number): Promise<UserSheet | null> {
  try {
    const { rows } = await getPool().query<{ sheetId: string | null; connectedAt: Date | null }>(
      `SELECT sheet_id AS "sheetId", sheet_connected_at AS "connectedAt" FROM users WHERE id = $1`,
      [userId],
    );
    const r = rows[0];
    return r?.sheetId && r.connectedAt ? { sheetId: r.sheetId, connectedAt: r.connectedAt } : null;
  } catch (err) {
    // Chưa chạy migration 009 thì coi như chưa kết nối, không làm hỏng trang
    console.error("[sheet] Không đọc được Sheet của tài khoản:", err);
    return null;
  }
}

export async function setUserSheet(userId: number, sheetId: string | null): Promise<void> {
  await getPool().query(
    `UPDATE users SET sheet_id = $2, sheet_connected_at = CASE WHEN $2::text IS NULL THEN NULL ELSE now() END WHERE id = $1`,
    [userId, sheetId],
  );
}

/** Thêm vào Sheet những đơn (trong phạm vi tài khoản được xem) chưa có, dựa theo cột "Mã đơn". Trả về số dòng đã thêm. */
export async function syncUserSheet(user: CurrentUser, spreadsheetId: string): Promise<number> {
  await ensureSheetTab(spreadsheetId);
  const existing = new Set((await getValues(spreadsheetId, tabRange("A2:A"))).map((r) => r[0]).filter(Boolean));
  const rows = (await exportRegistrations(user, parseFilters({})))
    .filter((r) => !existing.has(String(r.id)))
    .reverse() // cũ trước, mới sau
    .map((r) => toSheetRow(recordFromDetail(r)));
  for (let i = 0; i < rows.length; i += 500) {
    await appendRows(spreadsheetId, tabRange("A1"), rows.slice(i, i + 500));
  }
  return rows.length;
}
