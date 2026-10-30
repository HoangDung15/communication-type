// Chạy các file SQL trong db/migrations theo thứ tự tên, mỗi file đúng một lần.
//   npm run db:migrate
// Dùng kết nối trực tiếp (DATABASE_URL_UNPOOLED) theo khuyến nghị của Neon cho migration.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

const DIR = join(process.cwd(), "db", "migrations");

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) {
    console.error("Thiếu DATABASE_URL_UNPOOLED / DATABASE_URL trong .env.local (chạy: neon env pull)");
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    const { rows } = await client.query<{ name: string }>("SELECT name FROM schema_migrations");
    const applied = new Set(rows.map((r) => r.name));

    const files = readdirSync(DIR).filter((f) => f.endsWith(".sql")).sort();
    let count = 0;
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = readFileSync(join(DIR, file), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log(`  ✓ ${file}`);
        count++;
      } catch (err) {
        await client.query("ROLLBACK");
        throw new Error(`Migration ${file} thất bại: ${err instanceof Error ? err.message : err}`);
      }
    }
    console.log(count ? `Đã chạy ${count} migration.` : "Database đã ở phiên bản mới nhất.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
