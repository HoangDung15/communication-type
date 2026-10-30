// Cache đơn giản trong bộ nhớ server, có thời hạn. Nếu lần tải lại bị lỗi (Google chậm, hết quota)
// thì trả bản cũ thay vì báo lỗi cho người dùng.

type Entry<T> = { value: T; at: number };

export function memoCache<T>(load: () => Promise<T>, ttlSeconds: () => number) {
  let entry: Entry<T> | null = null;
  let pending: Promise<T> | null = null;

  return async function get(): Promise<T> {
    const fresh = entry && Date.now() - entry.at < ttlSeconds() * 1000;
    if (entry && fresh) return entry.value;
    if (pending) return entry ? entry.value : pending;

    pending = load()
      .then((value) => {
        entry = { value, at: Date.now() };
        return value;
      })
      .finally(() => {
        pending = null;
      });

    if (entry) {
      // Đã có bản cũ: tải ngầm, trả bản cũ ngay.
      pending.catch((err) => console.error("[cache] refresh failed, serving stale data:", err));
      return entry.value;
    }
    return pending;
  };
}
