import { exportRegistrations, parseFilters } from "@/lib/admin-data";
import { getCurrentUser } from "@/lib/auth";
import { statusOf } from "@/lib/statuses";
import { formatDateTime } from "@/components/admin/styles";

// Xuất danh sách đăng ký (theo bộ lọc đang chọn) ra file CSV mở được bằng Excel.

function cell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  // Chặn Excel hiểu nội dung thành công thức
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Chưa đăng nhập", { status: 401 });

  const sp = Object.fromEntries(new URL(request.url).searchParams);
  const rows = await exportRegistrations(user, parseFilters(sp));

  const header = [
    "Thời gian", "Họ và tên", "Năm sinh", "Giới tính", "Công việc / ngành học", "SĐT / Zalo", "Email",
    "Facebook", "Nơi sống", "Khung giờ liên hệ", "MBTI", "Lĩnh vực", "Điểm từng nhóm", "Người phụ trách",
    "Mã ref", "Nguồn (utm_source)", "Kênh (utm_medium)", "Chiến dịch (utm_campaign)", "Trạng thái", "Ghi chú",
  ];
  const lines = [header, ...rows.map((r) => [
    formatDateTime(r.createdAt), r.name, r.birthYear, r.gender, r.job, r.phone, r.email, r.facebook, r.city,
    r.contactTime, r.mbti, r.field, r.scores, r.managerName, r.ref, r.utmSource, r.utmMedium, r.utmCampaign,
    statusOf(r.status).label, r.note,
  ])].map((row) => row.map(cell).join(","));

  const date = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
  // BOM để Excel nhận đúng tiếng Việt (UTF-8)
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dang-ky-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
