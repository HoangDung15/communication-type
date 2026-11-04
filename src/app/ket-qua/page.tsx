import type { Metadata } from "next";
import { connection } from "next/server";
import { ZoneResultPage } from "@/components/result/ZoneResultPage";
import { getPool } from "@/lib/db";
import { isMbtiType } from "@/lib/mbti";
import { getZoneContent } from "@/lib/zones";

export const metadata: Metadata = { title: "Kết quả của bạn | BETTER TALK, BETTER WORK" };

type Props = { searchParams: Promise<{ mbti?: string; "linh-vuc"?: string }> };

// Deep link: /ket-qua?mbti=ENTJ&linh-vuc=Dịch%20vụ — cùng sơ đồ zones như landing.
export default async function ResultPage({ searchParams }: Props) {
  await connection();
  const params = await searchParams;
  const type = params.mbti?.toUpperCase();
  const field = params["linh-vuc"];

  let validCodes: string[] | null = null;
  try {
    const { rows } = await getPool().query<{ ref: string }>("SELECT ref FROM managers WHERE active");
    validCodes = rows.map((r) => r.ref);
  } catch (err) {
    console.error("[ket-qua] Không đọc được danh sách mã giới thiệu:", err);
  }

  if (!isMbtiType(type) || !field) {
    return (
      <ZoneResultPage
        type=""
        field=""
        entry={null}
        validCodes={validCodes}
        error="Không tìm thấy kết quả. Bạn hãy làm bài test để xem phân tích nhé."
      />
    );
  }

  const found = getZoneContent(type, field);
  if (!found) {
    return (
      <ZoneResultPage
        type={type}
        field={field}
        entry={null}
        validCodes={validCodes}
        error={`Chưa có nội dung cho ${type} trong lĩnh vực "${field}". Bạn thử chọn lĩnh vực khác nhé.`}
      />
    );
  }

  return <ZoneResultPage type={type} field={found.field} entry={found.entry} validCodes={validCodes} error={null} />;
}
