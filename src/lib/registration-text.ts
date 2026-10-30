import { formatDateTime } from "@/components/admin/styles";
import type { RegistrationDetail } from "./admin-data";
import { DIMENSIONS, QUESTIONS, type Choice } from "./questions";
import { displayReferralCode } from "./ref";
import { statusOf } from "./statuses";

export type AnswerRow = {
  index: number; // 1..12
  question: string;
  choice: "A" | "B";
  text: string;
  letter: string; // chữ MBTI ứng với đáp án (E, I, S, N…)
};

// "abaab…" → từng câu kèm nội dung câu hỏi và đáp án đã chọn
export function answerRows(answers: string | null): AnswerRow[] | null {
  if (!answers || !/^[ab]{12}$/.test(answers)) return null;
  return QUESTIONS.map((q, i) => {
    const c = answers[i] as Choice;
    const dim = DIMENSIONS.find((d) => d.id === q.dimension)!;
    return { index: i + 1, question: q.text, choice: c === "a" ? "A" : "B", text: q[c], letter: (c === "a" ? dim.a : dim.b).letter };
  });
}

// Dạng gọn: "1A 2B 3A …"
export function answersShort(answers: string | null): string | null {
  const rows = answerRows(answers);
  return rows ? rows.map((r) => `${r.index}${r.choice}`).join(" ") : null;
}

// Toàn bộ đơn đăng ký dạng văn bản để sao chép (dán vào Zalo, ghi chú…)
export function registrationText(r: RegistrationDetail): string {
  const age = new Date().getFullYear() - r.birthYear;
  const rows = answerRows(r.answers);
  const lines = [
    "ĐƠN ĐĂNG KÝ TƯ VẤN",
    `Thời gian đăng ký: ${formatDateTime(r.createdAt)}`,
    "",
    `Họ và tên: ${r.name}`,
    `Năm sinh: ${r.birthYear} (${age} tuổi)`,
    `Giới tính: ${r.gender}`,
    `Công việc / ngành học: ${r.job}`,
    `SĐT / Zalo: ${r.phone}`,
    `Email: ${r.email}`,
    `Facebook: ${r.facebook}`,
    `Nơi sống: ${r.city}`,
    `Khung giờ liên hệ: ${r.contactTime}`,
    "",
    `Kết quả MBTI: ${r.mbti}${r.scores ? ` (${r.scores})` : ""}`,
    `Lĩnh vực: ${r.field}`,
    `Mã giới thiệu: ${r.ref ? displayReferralCode(r.ref) : "Không có"}`,
    `Người phụ trách: ${r.managerName ?? "Chưa có"}`,
    `Trạng thái: ${statusOf(r.status).label}`,
  ];
  if (r.note) lines.push(`Ghi chú: ${r.note}`);
  lines.push("", "Câu trả lời bài test:");
  if (rows) {
    lines.push(answersShort(r.answers)!);
    for (const a of rows) lines.push(`${a.index}. ${a.question} → ${a.choice}. ${a.text}`);
  } else {
    lines.push("Không có (đơn đăng ký trước khi web lưu câu trả lời)");
  }
  return lines.join("\n");
}
