import assert from "node:assert/strict";
import { createVerify, generateKeyPairSync } from "node:crypto";
import { afterEach, test } from "node:test";
import { POST } from "../src/app/api/register/route";
import { extractSpreadsheetId, signServiceAccountJwt } from "../src/lib/google-sheets";
import { DB_FAILED_STATUS, recordFromPayload, SHEET_HEADER, toSheetRow } from "../src/lib/sheet-sync";
import type { RegisterPayload } from "../src/lib/register-schema";

const SHEET_ID = "1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789";
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const serviceAccount = {
  client_email: "robot@demo.iam.gserviceaccount.com",
  private_key: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
};

const db = globalThis as typeof globalThis & { pgPool?: { query: () => Promise<never> } };
const realFetch = globalThis.fetch;
const envBefore = { ...process.env };

afterEach(() => {
  delete db.pgPool;
  globalThis.fetch = realFetch;
  process.env = { ...envBefore };
});

const payload: RegisterPayload = {
  referral: "",
  name: "Nguyễn Văn An",
  birthYear: "1995",
  gender: "Nam",
  job: "Kế toán",
  phone: "0912345678",
  email: "an@example.com",
  facebook: "https://facebook.com/an",
  city: "Hà Nội",
  contactTime: "Tối",
  consultationGoal: "=HYPERLINK(\"x\")",
};

test("lấy được ID từ link Google Sheet hoặc ID thuần", () => {
  assert.equal(extractSpreadsheetId(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=0`), SHEET_ID);
  assert.equal(extractSpreadsheetId(`  ${SHEET_ID} `), SHEET_ID);
  assert.equal(extractSpreadsheetId("https://drive.google.com/file/d/abc"), null);
  assert.equal(extractSpreadsheetId("không phải link"), null);
});

test("JWT service account ký RS256 đúng và có đủ claim", () => {
  const jwt = signServiceAccountJwt(serviceAccount, 1_000);
  const [h, c, sig] = jwt.split(".");
  const claim = JSON.parse(Buffer.from(c, "base64url").toString());
  assert.deepEqual(JSON.parse(Buffer.from(h, "base64url").toString()), { alg: "RS256", typ: "JWT" });
  assert.equal(claim.iss, serviceAccount.client_email);
  assert.equal(claim.aud, "https://oauth2.googleapis.com/token");
  assert.equal(claim.exp - claim.iat, 3600);
  assert.ok(createVerify("RSA-SHA256").update(`${h}.${c}`).verify(publicKey, Buffer.from(sig, "base64url")));
});

test("dòng Sheet khớp số cột tiêu đề và giữ nguyên SĐT", () => {
  const row = toSheetRow(recordFromPayload(payload, { id: 7, managerName: "Lan", statusLabel: "Chưa liên hệ" }));
  assert.equal(row.length, SHEET_HEADER.length);
  assert.equal(row[0], "7");
  assert.equal(row[6], "0912345678");
});

function registerRequest() {
  return new Request("http://localhost/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 250)}` },
    body: JSON.stringify(payload),
  });
}

test("Neon lỗi: vẫn nhận đơn khi ghi được vào Sheet dự phòng", async () => {
  db.pgPool = { query: async () => { throw new Error("quota exceeded"); } };
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify(serviceAccount);
  process.env.BACKUP_SHEET_ID = SHEET_ID;
  delete process.env.GMAIL_USER;

  const appended: string[][][] = [];
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    if (url.startsWith("https://oauth2.googleapis.com/token")) return Response.json({ access_token: "t", expires_in: 3600 });
    if (url.includes(":append")) {
      appended.push(JSON.parse(String(init?.body)).values);
      return Response.json({});
    }
    if (url.includes("fields=sheets.properties.title")) return Response.json({ sheets: [{ properties: { title: "Đăng ký" } }] });
    if (url.includes("/values/")) return Response.json({ values: [["Mã đơn"]] }); // đã có tiêu đề
    throw new Error(`Không mong đợi: ${url}`);
  }) as typeof fetch;

  const res = await POST(registerRequest());
  assert.equal(res.status, 200);
  assert.equal((await res.json()).ok, true);
  assert.equal(appended.length, 1);
  const row = appended[0][0];
  assert.equal(row[0], ""); // chưa có mã đơn vì DB lỗi
  assert.equal(row.at(-1), DB_FAILED_STATUS);
});

test("Neon lỗi và không có Sheet dự phòng: báo lỗi cho khách", async () => {
  db.pgPool = { query: async () => { throw new Error("down"); } };
  delete process.env.BACKUP_SHEET_ID;
  const res = await POST(registerRequest());
  assert.equal(res.status, 502);
});
