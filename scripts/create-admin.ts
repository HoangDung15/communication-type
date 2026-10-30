// Tạo (hoặc đặt lại mật khẩu) tài khoản admin cho trang /quan-ly.
//   npm run admin:create -- <ten-dang-nhap> "<Tên hiển thị>"
// Mật khẩu được tạo ngẫu nhiên và chỉ in ra một lần trên màn hình. Đăng nhập xong nên đổi ở mục "Tài khoản".

import { randomInt, randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";
import { Client } from "pg";

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

async function main() {
  const username = (process.argv[2] ?? "").trim().toLowerCase();
  const displayName = (process.argv[3] ?? "Admin").trim();
  if (!/^[a-z0-9_.-]{3,32}$/.test(username)) {
    console.error('Cách dùng: npm run admin:create -- <ten-dang-nhap> "<Tên hiển thị>"');
    console.error("Tên đăng nhập gồm 3–32 ký tự: chữ thường không dấu, số, . - _");
    process.exit(1);
  }

  // Cùng cách tạo và băm mật khẩu với src/lib/auth.ts
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const password = Array.from({ length: 12 }, () => alphabet[randomInt(alphabet.length)]).join("");
  const salt = randomBytes(16);
  const hash = `scrypt$${salt.toString("base64")}$${(await scrypt(password, salt, 64)).toString("base64")}`;

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const { rows } = await client.query<{ role: string }>("SELECT role FROM users WHERE username = $1", [username]);
    if (rows[0] && rows[0].role !== "admin") {
      console.error(`"${username}" đang là tài khoản người quản lý, hãy chọn tên khác.`);
      process.exit(1);
    }
    await client.query(
      `INSERT INTO users (username, display_name, password_hash, role) VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, display_name = EXCLUDED.display_name, active = true`,
      [username, displayName, hash],
    );
    await client.query("DELETE FROM sessions WHERE user_id = (SELECT id FROM users WHERE username = $1)", [username]);
  } finally {
    await client.end();
  }

  console.log(`\nTài khoản admin: ${username}`);
  console.log(`Mật khẩu:        ${password}`);
  console.log("\nLưu lại mật khẩu này ngay, nó sẽ không hiện lại. Đăng nhập tại /quan-ly/dang-nhap.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
