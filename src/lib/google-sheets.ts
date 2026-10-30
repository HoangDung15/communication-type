import { JWT } from "google-auth-library";

// Lớp mỏng gọi Google Sheets API v4 bằng Service Account. Chỉ chạy phía server.

const API = "https://sheets.googleapis.com/v4/spreadsheets";

let client: JWT | null = null;

export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY);
}

function getClient(): JWT {
  if (!client) {
    client = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      // Biến môi trường thường lưu xuống dòng dưới dạng "\n"
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  }
  return client;
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const { token } = await getClient().getAccessToken();
  const res = await fetch(url, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google Sheets ${res.status}: ${body.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

export function quoteSheet(title: string): string {
  return `'${title.replace(/'/g, "''")}'`;
}

export async function getSheetTitles(spreadsheetId: string): Promise<string[]> {
  const data = await call<{ sheets: { properties: { title: string } }[] }>(
    `${API}/${spreadsheetId}?fields=sheets.properties.title`,
  );
  return data.sheets.map((s) => s.properties.title);
}

export async function getValues(spreadsheetId: string, range: string): Promise<string[][]> {
  const data = await call<{ values?: string[][] }>(`${API}/${spreadsheetId}/values/${encodeURIComponent(range)}`);
  return data.values ?? [];
}

// RAW: giá trị được lưu đúng như chuỗi gửi lên, không bị hiểu thành công thức hay số
// (giữ được số 0 đầu SĐT, chặn chèn công thức kiểu "=IMPORTXML(...)").
export async function appendRows(spreadsheetId: string, range: string, rows: string[][]): Promise<void> {
  await call(
    `${API}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    { method: "POST", body: JSON.stringify({ values: rows }) },
  );
}

export async function addSheet(spreadsheetId: string, title: string): Promise<void> {
  await call(`${API}/${spreadsheetId}:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({ requests: [{ addSheet: { properties: { title } } }] }),
  });
}

// Lấy ID từ link sheet dạng https://docs.google.com/spreadsheets/d/<ID>/edit
export function extractSpreadsheetId(linkOrId: string): string | null {
  const trimmed = linkOrId.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  return /^[a-zA-Z0-9_-]{20,}$/.test(trimmed) ? trimmed : null;
}
