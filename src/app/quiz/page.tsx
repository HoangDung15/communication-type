import type { Metadata } from "next";
import { Quiz } from "@/components/Quiz";

export const metadata: Metadata = { title: "Làm bài | MBTI · Giao tiếp" };

export default function QuizPage() {
  return <Quiz />;
}
