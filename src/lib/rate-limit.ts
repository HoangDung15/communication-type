// Giới hạn số lần gửi đăng ký theo IP, lưu trong bộ nhớ của từng instance server.
// Đủ để chặn spam đơn giản; không cần chính xác tuyệt đối.

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 8;
const hits = new Map<string, number[]>();

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);

  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }
  return recent.length > MAX_REQUESTS;
}
