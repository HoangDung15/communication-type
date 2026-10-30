import type { Metadata } from "next";
import { FieldPicker } from "@/components/FieldPicker";
import { getFieldsByType } from "@/lib/results";

export const metadata: Metadata = { title: "Chọn lĩnh vực | MBTI · Giao tiếp" };

export default function FieldPage() {
  return <FieldPicker fieldsByType={getFieldsByType()} />;
}
