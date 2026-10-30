import { isGoogleConfigured } from "@/lib/google-sheets";
import { isMailConfigured, sendConfirmation } from "@/lib/mail";
import { findManager, type Manager } from "@/lib/managers";
import { isRateLimited } from "@/lib/rate-limit";
import { normalizeRef } from "@/lib/ref";
import { registerSchema } from "@/lib/register-schema";
import { appendRegistration, buildRow } from "@/lib/registrations";

function json(body: { ok: boolean; error?: string; emailSent?: boolean }, status = 200) {
  return Response.json(body, { status });
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return json({ ok: false, error: "Bạn đã gửi quá nhiều lần, vui lòng thử lại sau ít phút" }, 429);
  }

  const raw = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return json({ ok: false, error: "Thông tin đăng ký chưa hợp lệ" }, 400);
  }
  const payload = { ...parsed.data, ref: normalizeRef(parsed.data.ref) };

  // Bot điền vào ô bẫy: trả về thành công nhưng không lưu gì.
  if (payload.website) return json({ ok: true });

  const masterId = process.env.MASTER_SHEET_ID;
  if (!isGoogleConfigured() || !masterId) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[register] Chưa cấu hình Google Sheet, đăng ký (chỉ in ra khi dev):", buildRow(payload, null));
      return json({ ok: true });
    }
    console.error("[register] Thiếu cấu hình GOOGLE_* hoặc MASTER_SHEET_ID");
    return json({ ok: false, error: "Hệ thống chưa sẵn sàng" }, 503);
  }

  let manager: Manager | null = null;
  try {
    manager = await findManager(payload.ref);
  } catch (err) {
    // Không đọc được tab Config thì vẫn lưu vào sheet tổng, chỉ không chia được cho quản lý.
    console.error("[register] Không đọc được tab Config:", err);
  }

  const row = buildRow(payload, manager);

  // 1. Sheet tổng: bắt buộc thành công.
  try {
    await appendRegistration(masterId, process.env.MASTER_REGISTRATIONS_TAB || "DangKy", row);
  } catch (err) {
    console.error("[register] Ghi sheet tổng thất bại:", err);
    return json({ ok: false, error: "Gửi đăng ký chưa thành công" }, 502);
  }

  // 2. Sheet của người quản lý và 3. email xác nhận: lỗi thì ghi log, không chặn người dùng
  // (dữ liệu đã nằm an toàn trong sheet tổng).
  const [, emailSent] = await Promise.all([
    manager &&
      appendRegistration(manager.spreadsheetId, null, row).catch((err) =>
        console.error(`[register] Ghi sheet của quản lý "${manager.ref}" thất bại:`, err),
      ),
    isMailConfigured()
      ? sendConfirmation(payload).then(
          () => true,
          (err) => {
            console.error("[register] Gửi email xác nhận thất bại:", err);
            return false;
          },
        )
      : false,
  ]);

  return json({ ok: true, emailSent });
}
