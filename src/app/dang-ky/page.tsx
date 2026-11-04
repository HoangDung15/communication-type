import type { Metadata } from "next";
import { connection } from "next/server";
import { RegisterForm } from "@/components/RegisterForm";
import { getPool } from "@/lib/db";

export const metadata: Metadata = { title: "Đăng ký tư vấn | BETTER TALK, BETTER WORK" };

// Trang dự phòng cho modal + non-JS: cho phép gửi trực tiếp không cần kết quả.
export default async function RegisterPage() {
  await connection();
  let validCodes: string[] | null = null;
  try {
    const { rows } = await getPool().query<{ ref: string }>("SELECT ref FROM managers WHERE active");
    validCodes = rows.map((r) => r.ref);
  } catch (err) {
    console.error("[dang-ky] Không đọc được danh sách mã giới thiệu:", err);
  }
  return <RegisterForm validCodes={validCodes} requireResult={false} />;
}
