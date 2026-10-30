import type { Metadata } from "next";
import { connection } from "next/server";
import { RegisterForm } from "@/components/RegisterForm";
import { getPool } from "@/lib/db";

export const metadata: Metadata = { title: "Đăng ký tư vấn | MBTI · Giao tiếp" };

export default async function RegisterPage() {
  await connection();
  // Danh sách mã giới thiệu hợp lệ để form báo sai mã ngay (mã vốn công khai trong link của quản lý).
  // Lỗi database thì để form vẫn hiện; API sẽ kiểm tra lại khi gửi.
  let validCodes: string[] | null = null;
  try {
    const { rows } = await getPool().query<{ ref: string }>("SELECT ref FROM managers WHERE active");
    validCodes = rows.map((r) => r.ref);
  } catch (err) {
    console.error("[dang-ky] Không đọc được danh sách mã giới thiệu:", err);
  }
  return <RegisterForm validCodes={validCodes} />;
}
