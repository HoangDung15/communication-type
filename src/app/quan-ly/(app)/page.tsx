import Link from "next/link";
import { adminBtnPrimary, adminBtnSecondary, adminCard, adminInput, formatDateTime } from "@/components/admin/styles";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { countByStatus, listManagerOptions, listRegistrations, PAGE_SIZE, parseFilters, type Filters } from "@/lib/admin-data";
import { requireUser } from "@/lib/auth";
import { MBTI_TYPES } from "@/lib/mbti";
import { STATUSES } from "@/lib/statuses";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// Tạo query string giữ nguyên bộ lọc hiện tại, ghi đè một vài khoá
function qs(f: Filters, override: Partial<Record<keyof Filters, string | number | undefined>> = {}): string {
  const merged = { ...f, page: undefined, ...override } as Record<string, unknown>;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) if (v !== undefined && v !== "" && !(k === "page" && v === 1)) params.set(k, String(v));
  const s = params.toString();
  return s ? `?${s}` : "";
}

export default async function RegistrationsPage({ searchParams }: Props) {
  const user = await requireUser();
  const filters = parseFilters(await searchParams);
  const isAdmin = user.role === "admin";

  const [{ rows, total }, counts, managers] = await Promise.all([
    listRegistrations(user, filters),
    countByStatus(user, filters),
    isAdmin ? listManagerOptions() : Promise.resolve([]),
  ]);
  const allCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilter = Boolean(filters.q || filters.mbti || filters.manager || filters.from || filters.to);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Đăng ký tư vấn</h1>
          <p className="mt-0.5 text-sm text-muted">
            {isAdmin ? "Tất cả đăng ký" : `Khách của ${user.displayName}`} · {total} kết quả
          </p>
        </div>
        <a href={`/quan-ly/xuat-file${qs(filters)}`} className={adminBtnSecondary}>
          Tải file Excel
        </a>
      </div>

      {/* Lọc theo trạng thái */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
        <StatusChip href={`/quan-ly${qs(filters, { status: undefined })}`} active={!filters.status} label="Tất cả" count={allCount} />
        {STATUSES.map((s) => (
          <StatusChip
            key={s.id}
            href={`/quan-ly${qs(filters, { status: s.id })}`}
            active={filters.status === s.id}
            label={s.label}
            count={counts[s.id] ?? 0}
          />
        ))}
      </div>

      {/* Bộ lọc */}
      <form method="get" className={`${adminCard} flex flex-col gap-3 p-3`}>
        {filters.status && <input type="hidden" name="status" value={filters.status} />}
        <div className="flex gap-2">
          <input
            name="q"
            aria-label="Tìm kiếm"
            defaultValue={filters.q}
            placeholder="Tìm tên, SĐT, email, công việc"
            className={`${adminInput} flex-1`}
          />
          <button type="submit" className={`${adminBtnPrimary} h-11 px-5`}>
            Lọc
          </button>
        </div>
        {/* Bộ lọc thêm: thu gọn trên điện thoại cho đỡ chiếm chỗ */}
        <details open={Boolean(filters.mbti || filters.manager || filters.from || filters.to)} className="group">
          <summary className="cursor-pointer select-none text-sm font-semibold text-brand-dark">Bộ lọc thêm</summary>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4 md:items-end">
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          MBTI
          <select name="mbti" defaultValue={filters.mbti ?? ""} className={adminInput}>
            <option value="">Tất cả</option>
            {[...MBTI_TYPES].sort().map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        {isAdmin ? (
          <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
            Người quản lý
            <select name="manager" defaultValue={filters.manager ?? ""} className={adminInput}>
              <option value="">Tất cả</option>
              <option value="none">Chưa có người phụ trách</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                  {m.active ? "" : " (đã ngưng)"}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          Từ ngày
          <input type="date" name="from" defaultValue={filters.from} className={adminInput} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          Đến ngày
          <input type="date" name="to" defaultValue={filters.to} className={adminInput} />
        </label>
        </div>
        </details>
        {hasFilter && (
          <Link href={`/quan-ly${qs({ page: 1, status: filters.status })}`} className="self-start text-sm font-semibold text-muted hover:text-ink">
            Xoá tất cả bộ lọc
          </Link>
        )}
      </form>

      {rows.length === 0 ? (
        <div className={`${adminCard} px-6 py-14 text-center`}>
          <p className="text-base font-semibold">Chưa có đăng ký nào</p>
          <p className="mt-1 text-sm text-muted">
            {hasFilter || filters.status ? "Thử bỏ bớt bộ lọc để xem thêm." : "Đăng ký mới sẽ hiện ở đây ngay khi khách gửi form."}
          </p>
        </div>
      ) : (
        <>
          {/* Điện thoại: dạng thẻ */}
          <ul className="flex flex-col gap-2 md:hidden">
            {rows.map((r) => (
              <li key={r.id}>
                <Link href={`/quan-ly/dang-ky/${r.id}`} className={`${adminCard} flex flex-col gap-1.5 p-3.5 active:bg-cream`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold">{r.name}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <span className="text-sm text-body">
                    {r.phone} · <b>{r.mbti}</b> · {r.field}
                  </span>
                  <span className="text-xs text-muted">
                    {formatDateTime(r.createdAt)} · {r.city}
                    {isAdmin && ` · ${r.managerName ?? "Chưa có người phụ trách"}`}
                  </span>
                  <span className="mt-1 self-end text-sm font-semibold text-brand-dark">Xem chi tiết →</span>
                </Link>
              </li>
            ))}
          </ul>

          {/* Máy tính: dạng bảng */}
          <div className={`${adminCard} hidden overflow-x-auto md:block`}>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-cream text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Thời gian</th>
                  <th className="px-4 py-3 font-semibold">Họ tên</th>
                  <th className="px-4 py-3 font-semibold">SĐT / Zalo</th>
                  <th className="px-4 py-3 font-semibold">MBTI · Lĩnh vực</th>
                  <th className="px-4 py-3 font-semibold">Nơi sống</th>
                  {isAdmin && <th className="px-4 py-3 font-semibold">Người phụ trách</th>}
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3">
                    <span className="sr-only">Chi tiết</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-line last:border-0 hover:bg-cream/60">
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDateTime(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/quan-ly/dang-ky/${r.id}`} className="font-semibold text-ink underline-offset-2 hover:underline">
                        {r.name}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <a href={`tel:${r.phone}`} className="text-ink hover:underline">
                        {r.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <b>{r.mbti}</b> · {r.field}
                    </td>
                    <td className="px-4 py-3">{r.city}</td>
                    {isAdmin && <td className="px-4 py-3">{r.managerName ?? <span className="text-muted">Chưa có</span>}</td>}
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link href={`/quan-ly/dang-ky/${r.id}`} className={`${adminBtnSecondary} h-9`}>
                        Xem chi tiết
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <nav aria-label="Phân trang" className="flex items-center justify-center gap-2">
              {filters.page > 1 && (
                <Link href={`/quan-ly${qs(filters, { page: filters.page - 1 })}`} className={adminBtnSecondary}>
                  Trang trước
                </Link>
              )}
              <span className="px-2 text-sm text-muted">
                Trang {filters.page} / {pages}
              </span>
              {filters.page < pages && (
                <Link href={`/quan-ly${qs(filters, { page: filters.page + 1 })}`} className={adminBtnSecondary}>
                  Trang sau
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}

function StatusChip({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
        active ? "border-ink bg-ink text-white" : "border-line bg-white text-body hover:border-line-strong"
      }`}
    >
      {label}
      <span className={`rounded-full px-1.5 text-xs ${active ? "bg-white/20" : "bg-cream"}`}>{count}</span>
    </Link>
  );
}
