// Mã ref công khai của người quản lý: chữ thường không dấu, số, "-" hoặc "_", tối đa 32 ký tự.
// Link khách thấy là /<ref> (token 8 ký tự). Tên đăng nhập trang quản lý là cột riêng, không phải mã này.
export function normalizeRef(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const ref = value.trim().toLowerCase();
  return /^[a-z0-9_-]{1,32}$/.test(ref) ? ref : undefined;
}

// Mã cũ dạng "kv" + số (kv36 … kv42). Chỉ còn để đọc đơn đăng ký đã lưu trước khi đổi link.
const REF_PREFIX = "kv";

// Người quản lý mặc định khi khách vào không qua link giới thiệu (trước đây là "bnv").
export const DEFAULT_REFERRAL = "hrrsfe8r";

// Chuỗi trên link hoặc ?ref= → mã ref. Số trần (link cũ /36) vẫn thành "kv36" để không khớp mã mới và trả 404.
export function normalizeReferralCode(value: string): string | undefined {
  const compact = value.replace(/\s+/g, "").toLowerCase();
  return normalizeRef(/^\d{1,6}$/.test(compact) ? REF_PREFIX + compact : compact);
}

// Mã ref → chữ hiện trong trang quản lý. Đơn cũ "kv36" vẫn hiện "36"; mã mới hiện nguyên token.
export function displayReferralCode(ref: string): string {
  return ref.startsWith(REF_PREFIX) && /^\d+$/.test(ref.slice(REF_PREFIX.length)) ? ref.slice(REF_PREFIX.length) : ref;
}
