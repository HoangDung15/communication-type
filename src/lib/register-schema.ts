import { z } from "zod";
import { normalizeReferralCode } from "./ref";

// Dùng chung cho form (trình duyệt) và API (server) để quy tắc kiểm tra luôn giống nhau.

export const GENDERS = ["Nam", "Nữ", "Khác"] as const;

const currentYear = new Date().getFullYear();

function normalizePhone(value: string): string {
  const digits = value.trim().replace(/[\s.\-()]/g, "");
  if (digits.startsWith("+84")) return "0" + digits.slice(3);
  if (digits.startsWith("84") && digits.length === 11) return "0" + digits.slice(2);
  return digits;
}

// Đầu số di động Việt Nam (10 số). Số Zalo luôn là số di động.
const MOBILE_PREFIX = /^0(3[2-9]|5[2-9]|7[06-9]|8[1-9]|9\d)/;

const phoneSchema = z
  .string()
  .transform(normalizePhone)
  .superRefine((v, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: "custom", message });
    if (!v) return fail("Vui lòng nhập số điện thoại");
    if (!/^\d+$/.test(v)) return fail("Số điện thoại chỉ gồm chữ số");
    if (v.length !== 10) return fail(`Số điện thoại cần đủ 10 số (bạn đang nhập ${v.length} số)`);
    if (!MOBILE_PREFIX.test(v)) return fail("Đầu số chưa đúng, vui lòng kiểm tra lại (ví dụ 0912 345 678)");
  });

// Tên miền email hay gõ nhầm → tên miền đúng
const DOMAIN_TYPOS: Record<string, string> = {
  "gmai.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.om": "gmail.com",
  "gmail.vn": "gmail.com",
  "gmail.com.vn": "gmail.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "hotmai.com": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "outlok.com": "outlook.com",
  "outlook.con": "outlook.com",
  "icloud.con": "icloud.com",
};

// Gợi ý sửa email khi tên miền bị gõ nhầm, ví dụ "ban@gmial.com" → "ban@gmail.com".
export function suggestEmail(value: string): string | null {
  const email = value.trim().toLowerCase();
  const at = email.lastIndexOf("@");
  if (at < 1) return null;
  const fixed = DOMAIN_TYPOS[email.slice(at + 1)];
  return fixed ? `${email.slice(0, at)}@${fixed}` : null;
}

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .superRefine((v, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: "custom", message });
    if (!v) return fail("Vui lòng nhập email");
    if (v.length > 254 || !z.email().safeParse(v).success) return fail("Email chưa đúng định dạng, ví dụ ban@gmail.com");
    const suggestion = suggestEmail(v);
    if (suggestion) return fail(`Có phải bạn muốn nhập ${suggestion}?`);
  });

// Chỉ nhận link Facebook: facebook.com/..., m.facebook.com/..., fb.com/..., fb.me/...
const FACEBOOK_LINK = /^(https?:\/\/)?((www|m|web|mbasic)\.)?(facebook\.com|fb\.com|fb\.me)\/\S+$/i;

const facebookSchema = z
  .string()
  .trim()
  .superRefine((v, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: "custom", message });
    if (!v) return fail("Vui lòng dán link Facebook của bạn");
    if (v.length > 300) return fail("Link Facebook quá dài");
    if (!FACEBOOK_LINK.test(v)) return fail("Vui lòng dán link Facebook, ví dụ facebook.com/ten-cua-ban");
  })
  .transform((v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`));

const text = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `Vui lòng nhập ${label}`)
    .max(max, `${label[0].toUpperCase() + label.slice(1)} quá dài (tối đa ${max} ký tự)`);

// Mã người giới thiệu, không bắt buộc (ví dụ 36 → "kv36"; bỏ trống → ""). Nếu có nhập thì mã phải tồn tại:
// việc này được kiểm tra riêng với danh sách quản lý đang hoạt động (form và API).
const referralSchema = z
  .string()
  .superRefine((v, ctx) => {
    if (v.trim() && !normalizeReferralCode(v)) ctx.addIssue({ code: "custom", message: "Mã giới thiệu chưa đúng, ví dụ 36" });
  })
  .transform((v) => normalizeReferralCode(v) ?? "");

export const INVALID_REFERRAL = "Mã giới thiệu không tồn tại, vui lòng hỏi lại người đã giới thiệu bạn";

export const formSchema = z.object({
  referral: referralSchema,
  name: text(2, 100, "họ và tên"),
  birthYear: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Năm sinh gồm 4 chữ số, ví dụ 1995")
    .refine((y) => Number(y) >= 1940 && Number(y) <= currentYear - 15, "Năm sinh chưa hợp lệ"),
  gender: z.enum(GENDERS, "Vui lòng chọn giới tính"),
  job: text(2, 200, "công việc / ngành học"),
  phone: phoneSchema,
  email: emailSchema,
  facebook: facebookSchema,
  city: text(2, 150, "nơi sống"),
  contactTime: text(2, 300, "khung thời gian liên hệ"),
});

export type FormValues = z.input<typeof formSchema>;
export type FormField = keyof FormValues;

const optional = (max: number) => z.string().trim().max(max).optional();

export const registerSchema = formSchema.extend({
  mbti: z.string().regex(/^[EI][SN][TF][JP]$/),
  field: z.string().trim().min(1).max(100),
  scores: optional(40),
  answers: z.string().regex(/^[ab]{12}$/).optional(),
  utmSource: optional(100),
  utmMedium: optional(100),
  utmCampaign: optional(100),
  // Ô bẫy ẩn: người thật không thấy nên luôn để trống; bot điền vào sẽ bị bỏ qua.
  website: optional(200),
});

export type RegisterPayload = z.output<typeof registerSchema>;
