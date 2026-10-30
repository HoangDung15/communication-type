import { isMailConfigured, sendConfirmation } from "@/lib/mail";
import { isRateLimited } from "@/lib/rate-limit";
import { normalizeRef } from "@/lib/ref";
import { registerSchema } from "@/lib/register-schema";
import { findManager, insertRegistration, type Manager } from "@/lib/registrations";

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

  let manager: Manager | null = null;
  try {
    manager = await findManager(payload.ref);
    await insertRegistration(payload, manager);
  } catch (err) {
    console.error("[register] Lưu đăng ký thất bại:", err);
    return json({ ok: false, error: "Gửi đăng ký chưa thành công" }, 502);
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
