import { notFound, redirect } from "next/navigation";
import { getPool } from "@/lib/db";
import { displayReferralCode, normalizeReferralCode } from "@/lib/ref";

// Link của người quản lý theo mã số: /36 → trang bìa với ?ref=36 (mã kv36).
// Các trang có sẵn (/quiz, /ket-qua, /quan-ly...) luôn được ưu tiên hơn đường dẫn này.

type Props = {
  params: Promise<{ ref: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ShortRefPage({ params, searchParams }: Props) {
  const ref = normalizeReferralCode(decodeURIComponent((await params).ref));
  if (!ref) notFound();

  const { rows } = await getPool().query("SELECT 1 FROM managers WHERE ref = $1 AND active", [ref]);
  if (!rows.length) notFound();

  // Giữ lại các tham số utm_* nếu link có gắn thêm (ví dụ /36?utm_source=facebook)
  const query = new URLSearchParams({ ref: displayReferralCode(ref) });
  for (const [k, v] of Object.entries(await searchParams)) {
    if (k.startsWith("utm_") && typeof v === "string") query.set(k, v.slice(0, 100));
  }
  redirect(`/?${query}`);
}
