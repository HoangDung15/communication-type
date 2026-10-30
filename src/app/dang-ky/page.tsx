import type { Metadata } from "next";
import { RegisterForm } from "@/components/RegisterForm";

export const metadata: Metadata = { title: "Đăng ký tư vấn | MBTI · Giao tiếp" };

export default function RegisterPage() {
  return <RegisterForm />;
}
