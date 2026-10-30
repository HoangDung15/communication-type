// Mã ref của người quản lý: chữ thường không dấu, số, "-" hoặc "_", tối đa 32 ký tự.
export function normalizeRef(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const ref = value.trim().toLowerCase();
  return /^[a-z0-9_-]{1,32}$/.test(ref) ? ref : undefined;
}
