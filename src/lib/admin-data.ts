import type { PoolClient } from "pg";
import { generatePassword, hashPassword, verifyPassword, type CurrentUser } from "./auth";
import { getPool } from "./db";
import { displayReferralCode, normalizeReferralCode } from "./ref";
import { isStatus, type StatusId } from "./statuses";

// Truy vấn cho trang /quan-ly. Mọi hàm nhận người dùng hiện tại và tự giới hạn dữ liệu:
// quản lý chỉ thấy đăng ký của mình, admin thấy tất cả.

export const PAGE_SIZE = 50;

export type Filters = {
  q?: string;
  status?: StatusId;
  mbti?: string;
  manager?: string; // admin: id người quản lý hoặc "none"
  from?: string; // yyyy-mm-dd, theo giờ Việt Nam
  to?: string;
  page: number;
};

export function parseFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : undefined) || undefined;
  const date = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);
  const status = get("status");
  const mbti = get("mbti")?.toUpperCase();
  const manager = get("manager");
  return {
    q: get("q")?.slice(0, 100),
    status: isStatus(status) ? status : undefined,
    mbti: mbti && /^[EI][SN][TF][JP]$/.test(mbti) ? mbti : undefined,
    manager: manager === "none" || /^\d+$/.test(manager ?? "") ? manager : undefined,
    from: date(get("from")),
    to: date(get("to")),
    page: Math.max(1, Number(get("page")) || 1),
  };
}

function buildWhere(user: CurrentUser, f: Filters, opts: { skipStatus?: boolean } = {}) {
  const where: string[] = [];
  const params: unknown[] = [];
  const p = (v: unknown) => {
    params.push(v);
    return `$${params.length}`;
  };

  if (user.role === "manager") where.push(`r.manager_id = ${p(user.managerId)}`);
  else if (f.manager === "none") where.push("r.manager_id IS NULL");
  else if (f.manager) where.push(`r.manager_id = ${p(Number(f.manager))}`);

  if (f.q) {
    const like = p(`%${f.q.replace(/[\\%_]/g, "\\$&")}%`);
    const digits = f.q.replace(/\D/g, "");
    where.push(
      `(r.name ILIKE ${like} OR r.email ILIKE ${like} OR r.job ILIKE ${like}${digits.length >= 3 ? ` OR r.phone LIKE ${p(`%${digits}%`)}` : ""})`,
    );
  }
  if (f.status && !opts.skipStatus) where.push(`r.status = ${p(f.status)}`);
  if (f.mbti) where.push(`r.mbti = ${p(f.mbti)}`);
  if (f.from) where.push(`r.created_at >= (${p(f.from)}::date)::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh'`);
  if (f.to) where.push(`r.created_at < ((${p(f.to)}::date + 1)::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh')`);

  return { sql: where.length ? `WHERE ${where.join(" AND ")}` : "", params };
}

export type RegistrationRow = {
  id: number;
  createdAt: Date;
  name: string;
  phone: string;
  mbti: string;
  field: string;
  city: string;
  status: StatusId;
  managerName: string | null;
};

export async function listRegistrations(user: CurrentUser, f: Filters) {
  const { sql, params } = buildWhere(user, f);
  const pool = getPool();
  const [rows, total] = await Promise.all([
    pool.query<RegistrationRow>(
      `SELECT r.id::int, r.created_at AS "createdAt", r.name, r.phone, r.mbti, r.field, r.city, r.status,
              m.name AS "managerName"
         FROM registrations r LEFT JOIN managers m ON m.id = r.manager_id
         ${sql}
        ORDER BY r.created_at DESC
        LIMIT ${PAGE_SIZE} OFFSET ${(f.page - 1) * PAGE_SIZE}`,
      params,
    ),
    pool.query<{ count: number }>(`SELECT count(*)::int AS count FROM registrations r ${sql}`, params),
  ]);
  return { rows: rows.rows, total: total.rows[0].count };
}

// Số đăng ký theo từng trạng thái (theo các bộ lọc khác, bỏ qua bộ lọc trạng thái).
export async function countByStatus(user: CurrentUser, f: Filters): Promise<Record<string, number>> {
  const { sql, params } = buildWhere(user, f, { skipStatus: true });
  const { rows } = await getPool().query<{ status: string; count: number }>(
    `SELECT r.status, count(*)::int AS count FROM registrations r ${sql} GROUP BY r.status`,
    params,
  );
  return Object.fromEntries(rows.map((r) => [r.status, r.count]));
}

export type RegistrationDetail = {
  id: number;
  createdAt: Date;
  updatedAt: Date | null;
  name: string;
  birthYear: number;
  gender: string;
  job: string;
  phone: string;
  email: string;
  facebook: string;
  city: string;
  contactTime: string;
  mbti: string;
  field: string;
  scores: string | null;
  ref: string | null;
  managerId: number | null;
  managerName: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  status: StatusId;
  note: string | null;
};

const DETAIL_COLUMNS = `r.id::int, r.created_at AS "createdAt", r.updated_at AS "updatedAt", r.name,
  r.birth_year AS "birthYear", r.gender, r.job, r.phone, r.email, r.facebook, r.city,
  r.contact_time AS "contactTime", r.mbti, r.field, r.scores, r.ref, r.manager_id AS "managerId",
  m.name AS "managerName", r.utm_source AS "utmSource", r.utm_medium AS "utmMedium",
  r.utm_campaign AS "utmCampaign", r.status, r.note`;

export async function getRegistration(user: CurrentUser, id: number): Promise<RegistrationDetail | null> {
  const { rows } = await getPool().query<RegistrationDetail>(
    `SELECT ${DETAIL_COLUMNS}
       FROM registrations r LEFT JOIN managers m ON m.id = r.manager_id
      WHERE r.id = $1 AND ($2::int IS NULL OR r.manager_id = $2)`,
    [id, user.role === "manager" ? user.managerId : null],
  );
  return rows[0] ?? null;
}

export async function exportRegistrations(user: CurrentUser, f: Filters): Promise<RegistrationDetail[]> {
  const { sql, params } = buildWhere(user, f);
  const { rows } = await getPool().query<RegistrationDetail>(
    `SELECT ${DETAIL_COLUMNS} FROM registrations r LEFT JOIN managers m ON m.id = r.manager_id
     ${sql} ORDER BY r.created_at DESC LIMIT 20000`,
    params,
  );
  return rows;
}

export async function updateRegistration(
  user: CurrentUser,
  id: number,
  changes: { status?: StatusId; note?: string; managerId?: number | null },
): Promise<boolean> {
  const sets: string[] = [];
  const params: unknown[] = [id];
  const p = (v: unknown) => {
    params.push(v);
    return `$${params.length}`;
  };
  if (changes.status) sets.push(`status = ${p(changes.status)}`);
  if (changes.note !== undefined) sets.push(`note = ${p(changes.note.slice(0, 2000) || null)}`);
  // Chỉ admin được chuyển khách cho người quản lý khác
  if (changes.managerId !== undefined && user.role === "admin") sets.push(`manager_id = ${p(changes.managerId)}`);
  if (!sets.length) return false;

  const scope = user.role === "manager" ? ` AND manager_id = ${p(user.managerId)}` : "";
  const res = await getPool().query(`UPDATE registrations SET ${sets.join(", ")}, updated_at = now() WHERE id = $1${scope}`, params);
  return (res.rowCount ?? 0) > 0;
}

// ---- Người quản lý & tài khoản (chỉ admin) ----

export type ManagerRow = {
  id: number;
  ref: string;
  name: string;
  active: boolean;
  userId: number | null;
  username: string | null;
  lastLoginAt: Date | null;
  total: number;
  newCount: number;
};

export async function listManagers(): Promise<ManagerRow[]> {
  const { rows } = await getPool().query<ManagerRow>(
    `SELECT m.id, m.ref, m.name, m.active, u.id AS "userId", u.username, u.last_login_at AS "lastLoginAt",
            count(r.id)::int AS total, count(r.id) FILTER (WHERE r.status = 'new')::int AS "newCount"
       FROM managers m
       LEFT JOIN users u ON u.manager_id = m.id
       LEFT JOIN registrations r ON r.manager_id = m.id
      GROUP BY m.id, u.id
      ORDER BY m.active DESC, m.name`,
  );
  return rows;
}

export async function listManagerOptions(): Promise<{ id: number; name: string; active: boolean }[]> {
  const { rows } = await getPool().query("SELECT id, name, active FROM managers ORDER BY active DESC, name");
  return rows;
}

export function normalizeUsername(value: string): string | undefined {
  const u = value.trim().toLowerCase();
  return /^[a-z0-9_.-]{3,32}$/.test(u) ? u : undefined;
}

async function inTransaction<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export type CreateManagerResult = { ok: true; username: string; password: string } | { ok: false; error: string };

export async function createManager(input: { name: string; ref: string; username: string }): Promise<CreateManagerResult> {
  const name = input.name.trim().slice(0, 100);
  // Admin gõ "36" hay "kv36" đều lưu thành "kv36"
  const ref = normalizeReferralCode(input.ref);
  const username = normalizeUsername(input.username || input.ref);
  if (name.length < 2) return { ok: false, error: "Vui lòng nhập tên người quản lý" };
  if (!ref) return { ok: false, error: "Mã giới thiệu chỉ gồm chữ thường không dấu, số, - hoặc _ (tối đa 32 ký tự)" };
  if (!username) return { ok: false, error: "Tên đăng nhập gồm 3–32 ký tự: chữ thường không dấu, số, . - _" };

  const password = generatePassword();
  const hash = await hashPassword(password);
  try {
    await inTransaction(async (c) => {
      const m = await c.query<{ id: number }>("INSERT INTO managers (ref, name) VALUES ($1, $2) RETURNING id", [ref, name]);
      await c.query(
        "INSERT INTO users (username, display_name, password_hash, role, manager_id) VALUES ($1, $2, $3, 'manager', $4)",
        [username, name, hash, m.rows[0].id],
      );
    });
  } catch (err) {
    const detail = String((err as { constraint?: string }).constraint ?? "");
    if (detail.includes("managers_ref")) return { ok: false, error: `Mã giới thiệu "${displayReferralCode(ref)}" đã được dùng` };
    if (detail.includes("users_username")) return { ok: false, error: `Tên đăng nhập "${username}" đã được dùng` };
    throw err;
  }
  return { ok: true, username, password };
}

export async function setManagerActive(managerId: number, active: boolean): Promise<void> {
  await inTransaction(async (c) => {
    await c.query("UPDATE managers SET active = $2 WHERE id = $1", [managerId, active]);
    await c.query("UPDATE users SET active = $2 WHERE manager_id = $1", [managerId, active]);
    // Tạm ngưng thì đăng xuất ngay khỏi mọi thiết bị
    if (!active) await c.query("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE manager_id = $1)", [managerId]);
  });
}

export async function resetPassword(userId: number): Promise<{ username: string; password: string } | null> {
  const password = generatePassword();
  const { rows } = await getPool().query<{ username: string }>(
    "UPDATE users SET password_hash = $2 WHERE id = $1 AND role = 'manager' RETURNING username",
    [userId, await hashPassword(password)],
  );
  if (!rows[0]) return null;
  await getPool().query("DELETE FROM sessions WHERE user_id = $1", [userId]);
  return { username: rows[0].username, password };
}

export async function changeOwnPassword(user: CurrentUser, current: string, next: string): Promise<string | null> {
  if (next.length < 8) return "Mật khẩu mới cần ít nhất 8 ký tự";
  const { rows } = await getPool().query<{ hash: string }>("SELECT password_hash AS hash FROM users WHERE id = $1", [user.id]);
  if (!rows[0] || !(await verifyPassword(current, rows[0].hash))) return "Mật khẩu hiện tại chưa đúng";
  await getPool().query("UPDATE users SET password_hash = $2 WHERE id = $1", [user.id, await hashPassword(next)]);
  return null;
}

export async function findUserForLogin(username: string) {
  const { rows } = await getPool().query<{ id: number; hash: string }>(
    `SELECT u.id, u.password_hash AS hash
       FROM users u LEFT JOIN managers m ON m.id = u.manager_id
      WHERE u.username = $1 AND u.active AND (u.role = 'admin' OR m.active)`,
    [username],
  );
  return rows[0] ?? null;
}
