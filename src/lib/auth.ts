import { createHash, randomBytes, randomInt, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getPool } from "./db";

// Đăng nhập cho trang /quan-ly. Chỉ dùng phía server.

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

export const SESSION_COOKIE = "ql_session";
const SESSION_DAYS = 30;

export type CurrentUser = {
  id: number;
  username: string;
  displayName: string;
  role: "admin" | "manager";
  managerId: number | null;
};

// ---- Mật khẩu ----

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, saltB64, hashB64] = stored.split("$");
  if (algo !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length);
  return timingSafeEqual(actual, expected);
}

// Mật khẩu ngẫu nhiên dễ đọc (bỏ các ký tự dễ nhầm như 0/O, 1/l/I).
export function generatePassword(length = 12): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length }, () => alphabet[randomInt(alphabet.length)]).join("");
}

// ---- Phiên đăng nhập ----

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function startSession(userId: number): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const pool = getPool();
  await pool.query("INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)", [hashToken(token), userId, expires]);
  await pool.query("UPDATE users SET last_login_at = now() WHERE id = $1", [userId]);
  // Dọn phiên hết hạn cho gọn bảng
  await pool.query("DELETE FROM sessions WHERE expires_at < now()");

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await getPool().query("DELETE FROM sessions WHERE id = $1", [hashToken(token)]);
  store.delete(SESSION_COOKIE);
}

// Người dùng hiện tại (dùng chung trong một request nhờ cache).
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const { rows } = await getPool().query<CurrentUser>(
    `SELECT u.id, u.username, u.display_name AS "displayName", u.role, u.manager_id AS "managerId"
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN managers m ON m.id = u.manager_id
      WHERE s.id = $1 AND s.expires_at > now() AND u.active
        AND (u.role = 'admin' OR m.active)`,
    [hashToken(token)],
  );
  return rows[0] ?? null;
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/quan-ly/dang-nhap");
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/quan-ly");
  return user;
}
