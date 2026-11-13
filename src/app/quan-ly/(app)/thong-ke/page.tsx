import { adminCard, adminInput, adminBtnPrimary } from "@/components/admin/styles";
import { requireUser } from "@/lib/auth";
import { defaultReportDates, getAnalyticsReport, parseReportDate, type Counts } from "@/lib/analytics-report";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function percent(part: number, total: number) {
  return total ? `${Math.round(part / total * 100)}%` : "—";
}

function Summary({ counts, isManager }: { counts: Counts; isManager: boolean }) {
  const views = counts.page_view.people;
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {([
        [isManager ? "Vào link của tôi" : "Người mở web", counts.page_view, null],
        ["Hoàn thành bài test", counts.quiz_completed, isManager ? null : percent(counts.quiz_completed.people, views)],
        ["Xem đăng ký tư vấn", counts.registration_opened, isManager ? null : percent(counts.registration_opened.people, views)],
      ] as const).map(([label, count, rate]) => (
        <div key={label} className={`${adminCard} p-5`}>
          <p className="text-sm font-semibold text-muted">{label}</p>
          <p className="mt-2 text-3xl font-extrabold">{count.people}</p>
          <p className="mt-1 text-sm text-body">{count.events} lượt{rate && ` · ${rate} so với người mở web`}</p>
        </div>
      ))}
    </div>
  );
}

export default async function AnalyticsPage({ searchParams }: Props) {
  const user = await requireUser();
  const params = await searchParams;
  const defaults = defaultReportDates();
  const from = parseReportDate(params.from) ?? defaults.from;
  const to = parseReportDate(params.to) ?? defaults.to;
  const report = from <= to ? await getAnalyticsReport(user, from, to) : null;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-extrabold">Thống kê truy cập</h1>
        <p className="mt-1 text-sm text-muted">
          Số người là số trình duyệt ước tính; một người dùng nhiều thiết bị có thể được tính nhiều lần.
        </p>
      </div>
      <form method="get" className={`${adminCard} flex flex-wrap items-end gap-3 p-4`}>
        <label className="flex flex-col gap-1 text-sm font-semibold">Từ ngày
          <input type="date" name="from" defaultValue={from} className={adminInput} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">Đến ngày
          <input type="date" name="to" defaultValue={to} className={adminInput} />
        </label>
        <button type="submit" className={`${adminBtnPrimary} h-11 px-5`}>Xem</button>
        <span className="text-xs text-muted">Theo giờ Việt Nam</span>
      </form>
      {!report ? <p>Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.</p> : (
        <>
          <Summary counts={report.totals} isManager={user.role === "manager"} />
          <section className={`${adminCard} overflow-x-auto p-4`}>
            <h2 className="mb-1 text-lg font-bold">Theo link KV</h2>
            <p className="mb-4 text-sm text-muted">
              Lượt vào link tính khi URL có mã KV. Test và mở đơn được ghi cho mã KV gần nhất trong 30 ngày.
              Một người mở nhiều link có thể xuất hiện ở nhiều hàng.
            </p>
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead><tr className="border-b border-line text-muted">
                <th className="pb-2 pr-4">KV</th>
                <th className="pb-2 pr-4">Vào link</th>
                <th className="pb-2 pr-4">Hoàn thành test</th>
                <th className="pb-2">Mở đơn</th>
              </tr></thead>
              <tbody>{report.managers.map((manager) => (
                <tr key={manager.id ?? "none"} className="border-b border-line last:border-0">
                  <td className="py-3 pr-4 font-semibold">{manager.name}{manager.ref && <span className="ml-1 text-xs font-normal text-muted">/{manager.ref}</span>}</td>
                  <td className="py-3 pr-4">{manager.counts.page_view.people} người · {manager.counts.page_view.events} lượt</td>
                  <td className="py-3 pr-4">{manager.counts.quiz_completed.people} người · {manager.counts.quiz_completed.events} lượt</td>
                  <td className="py-3">{manager.counts.registration_opened.people} người · {manager.counts.registration_opened.events} lượt</td>
                </tr>
              ))}</tbody>
            </table>
          </section>
          <section className={`${adminCard} overflow-x-auto p-4`}>
            <h2 className="mb-3 text-lg font-bold">Theo ngày</h2>
            <table className="w-full min-w-[550px] text-left text-sm">
              <thead><tr className="border-b border-line text-muted">
                <th className="pb-2 pr-4">Ngày</th><th className="pb-2 pr-4">Mở web</th>
                <th className="pb-2 pr-4">Hoàn thành test</th><th className="pb-2">Mở đơn</th>
              </tr></thead>
              <tbody>{report.days.map(({ day, counts }) => (
                <tr key={day} className="border-b border-line last:border-0">
                  <td className="py-2 pr-4 font-semibold">{day}</td>
                  <td className="py-2 pr-4">{counts.page_view.people}</td>
                  <td className="py-2 pr-4">{counts.quiz_completed.people}</td>
                  <td className="py-2">{counts.registration_opened.people}</td>
                </tr>
              ))}</tbody>
            </table>
            {report.days.length === 0 && <p className="py-5 text-center text-sm text-muted">Chưa có dữ liệu trong khoảng ngày này.</p>}
          </section>
        </>
      )}
    </div>
  );
}
