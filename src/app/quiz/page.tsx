import type { Metadata } from "next";
import { redirect } from "next/navigation";

// Deep link cũ: bài test giờ nằm trong landing (#bai-test).
export const metadata: Metadata = { title: "Làm bài | BETTER TALK, BETTER WORK" };

export default function QuizPage() {
  redirect("/#bai-test");
}
