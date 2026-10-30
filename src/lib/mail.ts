import nodemailer from "nodemailer";
import type { RegisterPayload } from "./register-schema";
import { site } from "./site";

// Email xác nhận gửi bằng Gmail của BTC (App Password). Bỏ trống GMAIL_USER để tắt.

export function isMailConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function sendConfirmation(p: RegisterPayload): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });

  const name = escapeHtml(p.name);
  await transporter.sendMail({
    from: `"${site.orgName}" <${process.env.GMAIL_USER}>`,
    to: p.email,
    subject: `Xác nhận đăng ký tư vấn – ${p.mbti}`,
    text: [
      `Chào ${p.name},`,
      "",
      `Cảm ơn bạn đã đăng ký tư vấn 1-1 cùng ${site.orgName}.`,
      `Kết quả của bạn: ${p.mbti} – lĩnh vực ${p.field}.`,
      `Đội ngũ sẽ liên hệ qua số ${p.phone} trong khung giờ: ${p.contactTime}.`,
      "",
      "Hẹn sớm gặp bạn!",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#2b2118;max-width:520px">
        <p>Chào <b>${name}</b>,</p>
        <p>Cảm ơn bạn đã đăng ký tư vấn 1-1 cùng ${escapeHtml(site.orgName)}.</p>
        <p style="background:#fff0c2;border-radius:12px;padding:12px 16px">
          Kết quả của bạn: <b style="font-size:18px">${escapeHtml(p.mbti)}</b><br>
          Lĩnh vực: ${escapeHtml(p.field)}
        </p>
        <p>Đội ngũ sẽ liên hệ qua số <b>${escapeHtml(p.phone)}</b> trong khung giờ: ${escapeHtml(p.contactTime)}.</p>
        <p>Hẹn sớm gặp bạn!</p>
      </div>`,
  });
}
