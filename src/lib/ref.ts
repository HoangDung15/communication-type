// Mã ref của người quản lý: chữ thường không dấu, số, "-" hoặc "_", tối đa 32 ký tự.
export function normalizeRef(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const ref = value.trim().toLowerCase();
  return /^[a-z0-9_-]{1,32}$/.test(ref) ? ref : undefined;
}

// Mã người quản lý có dạng "kv" + số (kv36 … kv42). Khách chỉ cần nhập phần số.
export const REF_PREFIX = "kv";

// Mã mặc định khi khách vào link chung (không có mã) và không nhập mã nào.
export const DEFAULT_REFERRAL = "bnv";

// Mã khách nhập trong form → mã ref: "36", "KV36", "kv 36" đều thành "kv36".
export function normalizeReferralCode(value: string): string | undefined {
  const compact = value.replace(/\s+/g, "").toLowerCase();
  return normalizeRef(/^\d{1,6}$/.test(compact) ? REF_PREFIX + compact : compact);
}

// Mã ref → phần hiển thị trong ô nhập: "kv36" → "36".
export function displayReferralCode(ref: string): string {
  return ref.startsWith(REF_PREFIX) && /^\d+$/.test(ref.slice(REF_PREFIX.length)) ? ref.slice(REF_PREFIX.length) : ref.toUpperCase();
}
