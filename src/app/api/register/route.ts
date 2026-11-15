import { after } from "next/server";
import { isMailConfigured, sendConfirmation } from "@/lib/mail";
import { isRateLimited } from "@/lib/rate-limit";
import { DEFAULT_REFERRAL } from "@/lib/ref";
import { registerSchema } from "@/lib/register-schema";
import { findManager, insertRegistration } from "@/lib/registrations";
import { appendToBackup, DB_FAILED_STATUS, mirrorRegistration, recordFromPayload } from "@/lib/sheet-sync";
import { statusOf } from "@/lib/statuses";

type Body = { ok: boolean; error?: string; field?: "referral"; emailSent?: boolean };

function json(body: Body, status = 200) {
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
  const payload = parsed.data;

  // Bot điền vào ô bẫy: trả về thành công nhưng không lưu gì.
  if (payload.website) return json({ ok: true });

  try {
    // Mã lấy từ link. Mã không còn (link cũ, attribution hết hạn) thì về người mặc định,
    // vì form không còn ô để khách sửa mã.
    let manager = payload.referral ? await findManager(payload.referral) : null;
    if (!manager) {
      manager = await findManager(DEFAULT_REFERRAL);
      payload.referral = manager ? DEFAULT_REFERRAL : "";
    }
    const id = await insertRegistration(payload, manager);
    // Chép sang Google Sheet sau khi đã trả lời khách, lỗi Sheet không ảnh hưởng đăng ký.
    const record = recordFromPayload(payload, { id, managerName: manager?.name ?? null, statusLabel: statusOf("new").label });
    after(() => mirrorRegistration(record, manager?.id ?? null));
  } catch (err) {
    console.error("[register] Lưu đăng ký thất bại:", err);
    // Neon lỗi (sập, hết quota…): vẫn nhận đơn nếu ghi được vào Sheet dự phòng.
    const saved = await appendToBackup(recordFromPayload(payload, { id: null, managerName: null, statusLabel: DB_FAILED_STATUS }));
    if (!saved) return json({ ok: false, error: "Gửi đăng ký chưa thành công" }, 502);
  }

  // Email lỗi thì chỉ ghi log, không chặn người dùng (đăng ký đã được lưu).
  const emailSent = isMailConfigured()
    ? await sendConfirmation(payload).then(
        () => true,
        (err) => {
          console.error("[register] Gửi email xác nhận thất bại:", err);
          return false;
        },
      )
    : false;

  return json({ ok: true, emailSent });
}
