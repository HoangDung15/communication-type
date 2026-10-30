// Kiểm tra cấu hình phần đăng ký trước khi chạy thật:
//   npm run check-sheet
// - Service Account truy cập được sheet tổng, có tab Config.
// - Truy cập được sheet của từng người quản lý trong tab Config.
// (Nội dung kết quả được kiểm tra khi chạy npm run sync-results.)

import { getSheetTitles, getValues, isGoogleConfigured } from "../src/lib/google-sheets";
import { listManagers } from "../src/lib/managers";

let problems = 0;
const ok = (msg: string) => console.log(`  ✓ ${msg}`);
const bad = (msg: string) => {
  problems++;
  console.log(`  ✗ ${msg}`);
};

async function main() {
  if (!isGoogleConfigured()) {
    console.log("Chưa khai báo GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY trong .env.local");
    process.exit(1);
  }

  console.log("\n▶ Sheet tổng và người quản lý");
  const masterId = process.env.MASTER_SHEET_ID;
  if (!masterId) {
    bad("Chưa khai báo MASTER_SHEET_ID");
  } else {
    try {
      const titles = await getSheetTitles(masterId);
      ok(`Truy cập được sheet tổng (các tab: ${titles.join(", ")})`);
      const configTab = process.env.MASTER_CONFIG_TAB || "Config";
      if (!titles.includes(configTab)) {
        bad(`Sheet tổng chưa có tab "${configTab}"`);
      } else {
        const managers = await listManagers();
        if (!managers.length) bad(`Tab "${configTab}" chưa có người quản lý nào hợp lệ`);
        for (const m of managers) {
          try {
            await getValues(m.spreadsheetId, "A1:A1");
            ok(`${m.name} (?ref=${m.ref}): truy cập được sheet`);
          } catch {
            bad(
              `${m.name} (?ref=${m.ref}): KHÔNG truy cập được sheet. Đã share quyền Người chỉnh sửa cho ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL} chưa?`,
            );
          }
        }
      }
    } catch (err) {
      bad(`Không truy cập được sheet tổng: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(problems ? `\nCó ${problems} vấn đề cần sửa.` : "\nMọi thứ đều ổn!");
  process.exit(problems ? 1 : 0);
}

main();
