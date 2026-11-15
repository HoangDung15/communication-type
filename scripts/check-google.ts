// Kiểm tra cấu hình Google Sheet trong .env.local:
//   npm run check-google
// 1. Đọc được GOOGLE_SERVICE_ACCOUNT_JSON  2. Google cấp được access token
// 3. (nếu có BACKUP_SHEET_ID) Sheet dự phòng đã chia sẻ quyền và ghi được tab "Đăng ký".

import { getAccessToken, isGoogleConfigured, serviceAccountEmail, sheetUrl } from "../src/lib/google-sheets";
import { backupSheetId, ensureSheetTab } from "../src/lib/sheet-sync";

async function main() {
  if (!isGoogleConfigured()) {
    console.error("✗ Chưa đọc được GOOGLE_SERVICE_ACCOUNT_JSON trong .env.local (thiếu, hoặc không phải JSON hợp lệ).");
    console.error("  Mẹo: bọc giá trị trong dấu nháy đơn: GOOGLE_SERVICE_ACCOUNT_JSON='{ ...nội dung file json... }'");
    process.exit(1);
  }
  console.log(`✓ Đọc được khoá. Email robot: ${serviceAccountEmail()}`);

  await getAccessToken();
  console.log("✓ Google đã cấp access token (khoá hợp lệ, Sheets API dùng được).");

  const backup = backupSheetId();
  if (!backup) {
    console.log("· Chưa đặt BACKUP_SHEET_ID: bỏ qua bước thử Sheet dự phòng.");
    return;
  }
  await ensureSheetTab(backup);
  console.log(`✓ Sheet dự phòng ghi được, đã có tab "Đăng ký": ${sheetUrl(backup)}`);
}

main().catch((err) => {
  console.error("✗", err instanceof Error ? err.message : err);
  console.error("  403 = Sheet chưa chia sẻ quyền Người chỉnh sửa cho email robot; 404 = sai link Sheet;");
  console.error("  lỗi token = khoá sai/đã bị xoá hoặc chưa bật Google Sheets API.");
  process.exit(1);
});
