import { getPool } from "./db";
import type { RegisterPayload } from "./register-schema";

export type Manager = { id: number; ref: string; name: string };

// Tìm người quản lý đang hoạt động theo mã ref của link giới thiệu.
export async function findManager(ref: string | undefined): Promise<Manager | null> {
  if (!ref) return null;
  const { rows } = await getPool().query<Manager>("SELECT id, ref, name FROM managers WHERE ref = $1 AND active", [ref]);
  return rows[0] ?? null;
}

export async function insertRegistration(p: RegisterPayload, manager: Manager | null): Promise<number> {
  const { rows } = await getPool().query<{ id: string }>(
    `INSERT INTO registrations
       (name, birth_year, gender, job, phone, email, facebook, city, contact_time,
        mbti, field, scores, ref, manager_id, utm_source, utm_medium, utm_campaign)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
     RETURNING id`,
    [
      p.name,
      Number(p.birthYear),
      p.gender,
      p.job,
      p.phone,
      p.email,
      p.facebook,
      p.city,
      p.contactTime,
      p.mbti,
      p.field,
      p.scores ?? null,
      p.ref ?? null,
      manager?.id ?? null,
      p.utmSource ?? null,
      p.utmMedium ?? null,
      p.utmCampaign ?? null,
    ],
  );
  return Number(rows[0].id);
}
