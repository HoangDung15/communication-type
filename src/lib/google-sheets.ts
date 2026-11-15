import { createSign } from "node:crypto";

// Lớp mỏng gọi Google Sheets API v4 bằng service account. Chỉ chạy phía server.
// Khoá lấy từ biến GOOGLE_SERVICE_ACCOUNT_JSON (dán nguyên nội dung file JSON tải từ Google Cloud).
// Tự ký JWT bằng node:crypto để không phải thêm thư viện.

const API = "https://sheets.googleapis.com/v4/spreadsheets";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const TIMEOUT_MS = 10_000;

type ServiceAccount = { client_email: string; private_key: string };

export class GoogleSheetsError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function readServiceAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ServiceAccount>;
    if (!parsed.client_email || !parsed.private_key) return null;
    // Một số nơi lưu biến môi trường biến xuống dòng thành chuỗi "\n"
    return { client_email: parsed.client_email, private_key: parsed.private_key.replace(/\\n/g, "\n") };
  } catch {
    return null;
  }
}

export function isGoogleConfigured(): boolean {
  return readServiceAccount() !== null;
}

/** Email "robot" mà người dùng phải chia sẻ quyền Người chỉnh sửa trên Sheet. */
export function serviceAccountEmail(): string | null {
  return readServiceAccount()?.client_email ?? null;
}

/** JWT ký RS256 để đổi lấy access token (luồng service account của Google). */
export function signServiceAccountJwt(sa: ServiceAccount, nowSec = Math.floor(Date.now() / 1000)): string {
  const enc = (v: object) => Buffer.from(JSON.stringify(v)).toString("base64url");
  const unsigned = `${enc({ alg: "RS256", typ: "JWT" })}.${enc({
    iss: sa.client_email,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: nowSec,
    exp: nowSec + 3600,
  })}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(sa.private_key).toString("base64url");
  return `${unsigned}.${signature}`;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const sa = readServiceAccount();
  if (!sa) throw new GoogleSheetsError(0, "Chưa cấu hình GOOGLE_SERVICE_ACCOUNT_JSON");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: signServiceAccountJwt(sa) }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new GoogleSheetsError(res.status, `Google từ chối khoá service account (${res.status})`);
  const body = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return body.access_token;
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${await getAccessToken()}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new GoogleSheetsError(res.status, `Google Sheets ${res.status}: ${body.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

export function quoteSheet(title: string): string {
  return `'${title.replace(/'/g, "''")}'`;
}

export async function getSheetTitles(spreadsheetId: string): Promise<string[]> {
  const data = await call<{ sheets: { properties: { title: string } }[] }>(`${API}/${spreadsheetId}?fields=sheets.properties.title`);
  return data.sheets.map((s) => s.properties.title);
}

export async function getValues(spreadsheetId: string, range: string): Promise<string[][]> {
  const data = await call<{ values?: string[][] }>(`${API}/${spreadsheetId}/values/${encodeURIComponent(range)}`);
  return data.values ?? [];
}

// RAW: lưu đúng chuỗi gửi lên, không hiểu thành công thức hay số
// (giữ số 0 đầu SĐT, chặn chèn công thức kiểu "=IMPORTXML(...)").
export async function appendRows(spreadsheetId: string, range: string, rows: string[][]): Promise<void> {
  await call(`${API}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: "POST",
    body: JSON.stringify({ values: rows }),
  });
}

export async function addSheet(spreadsheetId: string, title: string): Promise<void> {
  await call(`${API}/${spreadsheetId}:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({ requests: [{ addSheet: { properties: { title, gridProperties: { frozenRowCount: 1 } } } }] }),
  });
}

/** Lấy ID từ link dạng https://docs.google.com/spreadsheets/d/<ID>/edit, hoặc nhận thẳng ID. */
export function extractSpreadsheetId(linkOrId: string): string | null {
  const trimmed = linkOrId.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,})/);
  if (match) return match[1];
  return /^[a-zA-Z0-9_-]{20,}$/.test(trimmed) ? trimmed : null;
}

export function sheetUrl(spreadsheetId: string): string {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
}
