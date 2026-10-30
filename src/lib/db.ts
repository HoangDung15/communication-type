import { parseEnv } from "@neon/env";
import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";
import config from "../../neon";

// Kết nối Postgres (Neon) dùng chung cho các API. Chỉ dùng phía server.
// Trên Vercel (Fluid compute), attachDatabasePool giúp đóng kết nối rảnh đúng lúc khi instance bị thu hồi.

const globalForDb = globalThis as unknown as { pgPool?: Pool };

export function getPool(): Pool {
  if (!globalForDb.pgPool) {
    // Kết nối pooled cho ứng dụng; báo lỗi rõ ràng nếu thiếu biến môi trường.
    const { postgres } = parseEnv(config, ["DATABASE_URL"]);
    const pool = new Pool({ connectionString: postgres.databaseUrl, max: 5 });
    attachDatabasePool(pool);
    globalForDb.pgPool = pool;
  }
  return globalForDb.pgPool;
}
