import { addSheet, appendRows, getSheetTitles, getValues, quoteSheet } from "./google-sheets";
import type { Manager } from "./managers";
import type { RegisterPayload } from "./register-schema";

export const REGISTRATION_HEADERS = [
  "Thời gian",
  "Họ và tên",
  "Năm sinh",
  "Giới tính",
  "Công việc / ngành học",
  "SĐT / Zalo",
  "Email",
  "Facebook",
  "Nơi sống",
  "Khung giờ liên hệ",
  "MBTI",
  "Lĩnh vực",
  "Điểm từng nhóm",
  "Mã ref",
  "Người phụ trách",
  "Nguồn (utm_source)",
  "Kênh (utm_medium)",
  "Chiến dịch (utm_campaign)",
];

const LAST_COL = String.fromCharCode("A".charCodeAt(0) + REGISTRATION_HEADERS.length - 1);

export function buildRow(p: RegisterPayload, manager: Manager | null): string[] {
  const time = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour12: false });
  return [
    time,
    p.name,
    p.birthYear,
    p.gender,
    p.job,
    p.phone,
    p.email,
    p.facebook,
    p.city,
    p.contactTime,
    p.mbti,
    p.field,
    p.scores ?? "",
    p.ref ?? "",
    manager?.name ?? "",
    p.utmSource ?? "",
    p.utmMedium ?? "",
    p.utmCampaign ?? "",
  ];
}

// Ghi nhớ các sheet đã kiểm tra tiêu đề trong vòng đời của server để không gọi lại mỗi lần.
const prepared = new Set<string>();

// tab = null nghĩa là tab đầu tiên của file (dùng cho sheet riêng của từng quản lý).
async function prepare(spreadsheetId: string, tab: string | null): Promise<string> {
  const prefix = tab ? `${quoteSheet(tab)}!` : "";
  const key = `${spreadsheetId}|${tab ?? ""}`;
  if (prepared.has(key)) return prefix;

  if (tab) {
    const titles = await getSheetTitles(spreadsheetId);
    if (!titles.includes(tab)) await addSheet(spreadsheetId, tab);
  }
  const header = await getValues(spreadsheetId, `${prefix}A1:${LAST_COL}1`);
  if (header.length === 0 || header[0].every((c) => !c)) {
    await appendRows(spreadsheetId, `${prefix}A1`, [REGISTRATION_HEADERS]);
  }
  prepared.add(key);
  return prefix;
}

export async function appendRegistration(spreadsheetId: string, tab: string | null, row: string[]): Promise<void> {
  const prefix = await prepare(spreadsheetId, tab);
  await appendRows(spreadsheetId, `${prefix}A1`, [row]);
}
