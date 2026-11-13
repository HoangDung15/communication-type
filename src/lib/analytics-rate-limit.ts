const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 120;
const hits = new Map<string, number[]>();

export function isAnalyticsRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((time) => now - time >= WINDOW_MS) || hits.size > 5000) hits.delete(key);
    }
  }
  return recent.length > MAX_REQUESTS;
}
