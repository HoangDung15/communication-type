import type { Metadata } from "next";
import { FieldPicker } from "@/components/FieldPicker";
import { getCompleteFieldsByType } from "@/lib/zones";

export const metadata: Metadata = { title: "Chọn lĩnh vực | BETTER TALK, BETTER WORK" };

// Deep link dự phòng: landing đã có bước chọn lĩnh vực inline, trang này giữ cho link cũ.
export default function FieldPage() {
  return <FieldPicker fieldsByType={getCompleteFieldsByType()} />;
}
