// Class dùng chung cho các trang /quan-ly

export const adminInput =
  "h-11 w-full rounded-xl border-[1.5px] border-line-strong bg-white px-3 text-[15px] text-ink placeholder:text-[#a8988a] focus:border-sun-deep focus:outline-none";

export const adminCard = "rounded-2xl border border-line bg-white";

export const adminBtn =
  "inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 text-sm font-semibold transition-colors";

export const adminBtnPrimary = `${adminBtn} bg-brand text-white hover:bg-brand-dark disabled:opacity-50`;
export const adminBtnSecondary = `${adminBtn} border border-line-strong bg-white text-ink hover:bg-cream`;

export function formatDateTime(d: Date | string): string {
  return new Date(d).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Link mở chat Zalo theo số điện thoại
export function zaloLink(phone: string): string {
  return `https://zalo.me/${phone}`;
}
