import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/admin/CopyButton";
import { NoteForm } from "@/components/admin/NoteForm";
import { TransferForm } from "@/components/admin/TransferForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { adminBtnPrimary, adminBtnSecondary, adminCard, adminInput, formatDateTime, zaloLink } from "@/components/admin/styles";
import { ArrowLeft, Chat, Mail, Phone } from "@/components/icons";
import { canTransfer, getRegistration, listTransferTargets } from "@/lib/admin-data";
import { requireUser } from "@/lib/auth";
import { displayReferralCode } from "@/lib/ref";
import { answerRows, answersShort, registrationText } from "@/lib/registration-text";
import { STATUSES } from "@/lib/statuses";
import { updateStatusAction } from "../../../actions";

type Props = { params: Promise<{ id: string }> };

export default async function RegistrationDetailPage({ params }: Props) {
  const user = await requireUser();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const r = await getRegistration(user, id);
  if (!r) notFound();
  // Chỉ đơn của BNV mới chuyển được (admin hoặc chính BNV thực hiện)
  const transferable = canTransfer(user, r);
  const targets = transferable ? await listTransferTargets() : [];

  const age = new Date().getFullYear() - r.birthYear;
  const resultHref = `/ket-qua?mbti=${r.mbti}&linh-vuc=${encodeURIComponent(r.field)}`;
  const source = [r.utmSource, r.utmMedium, r.utmCampaign].filter(Boolean).join(" / ");

  const info: [string, React.ReactNode][] = [
    ["Năm sinh", `${r.birthYear} (${age} tuổi)`],
    ["Giới tính", r.gender],
    ["Công việc / ngành học", r.job],
    ["Số điện thoại / Zalo", <a key="p" href={`tel:${r.phone}`} className="font-semibold hover:underline">{r.phone}</a>],
    ["Email", <a key="e" href={`mailto:${r.email}`} className="break-all hover:underline">{r.email}</a>],
    ["Facebook", <a key="f" href={r.facebook} target="_blank" rel="noopener noreferrer" className="break-all text-brand-dark hover:underline">{r.facebook}</a>],
    ["Nơi sống", r.city],
    ["Khung giờ liên hệ", r.contactTime],
    ["Kết quả MBTI", <span key="m"><b>{r.mbti}</b>{r.scores && <span className="ml-1.5 text-muted">({r.scores})</span>}</span>],
    ["Câu trả lời", answersShort(r.answers) ?? "Không có"],
    ["Lĩnh vực", <span key="l">{r.field} · <a href={resultHref} target="_blank" rel="noopener noreferrer" className="text-brand-dark hover:underline">Xem nội dung kết quả</a></span>],
    ["Người phụ trách", r.managerName ?? "Chưa có"],
    ["Mã giới thiệu", r.ref ? displayReferralCode(r.ref) : "Không có"],
    ["Nguồn truy cập", source || "Không rõ"],
    ["Đăng ký lúc", formatDateTime(r.createdAt)],
    ["Cập nhật lần cuối", r.updatedAt ? formatDateTime(r.updatedAt) : "Chưa cập nhật"],
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Link href="/quan-ly" className="flex items-center gap-1.5 self-start text-sm font-semibold text-body hover:text-ink">
        <ArrowLeft size={16} />
        Danh sách đăng ký
      </Link>

      <section className={`${adminCard} flex flex-col gap-4 p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold">{r.name}</h1>
            <p className="mt-1 text-sm text-muted">
              <b className="text-ink">{r.mbti}</b> · {r.field} · {r.city}
            </p>
          </div>
          <StatusBadge status={r.status} />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <a href={`tel:${r.phone}`} className={adminBtnPrimary}>
            <Phone size={16} />
            Gọi điện
          </a>
          <a href={zaloLink(r.phone)} target="_blank" rel="noopener noreferrer" className={adminBtnSecondary}>
            <Chat size={16} />
            Nhắn Zalo
          </a>
          <a href={r.facebook} target="_blank" rel="noopener noreferrer" className={adminBtnSecondary}>
            Mở Facebook
          </a>
          <a href={`mailto:${r.email}`} className={adminBtnSecondary}>
            <Mail size={16} />
            Gửi email
          </a>
          <CopyButton text={registrationText(r)} label="Sao chép toàn bộ đơn" className={`${adminBtnSecondary} col-span-2`} />
        </div>
      </section>

      <section className={`${adminCard} p-5`}>
        <h2 className="text-base font-bold">Thông tin đăng ký</h2>
        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-[180px_minmax(0,1fr)]">
          {info.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="-mt-2 text-[15px] sm:mt-0">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <AnswersSection answers={r.answers} />

      <section className={`${adminCard} flex flex-col gap-3 p-5`}>
        <h2 className="text-base font-bold">Trạng thái chăm sóc</h2>
        <form action={updateStatusAction} className="flex flex-wrap gap-2">
          <input type="hidden" name="id" value={r.id} />
          {STATUSES.map((s) => {
            const active = r.status === s.id;
            return (
              <button
                key={s.id}
                type="submit"
                name="status"
                value={s.id}
                aria-pressed={active}
                className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
                  active ? `border-transparent ${s.badge} ring-2 ring-ink/70` : "border-line-strong bg-white text-body hover:bg-cream"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </form>

        {transferable && (
          <div className="mt-2 border-t border-line pt-4">
            <TransferForm id={r.id} targets={targets} />
          </div>
        )}
      </section>

      <section className={`${adminCard} flex flex-col gap-3 p-5`}>
        <h2 className="text-base font-bold">Ghi chú</h2>
        <NoteForm id={r.id} note={r.note ?? ""} />
      </section>

    </div>
  );
}

function AnswersSection({ answers }: { answers: string | null }) {
  const rows = answerRows(answers);
  return (
    <section className={`${adminCard} p-5`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-bold">Câu trả lời bài test</h2>
        {rows && <span className="font-mono text-sm font-semibold tracking-wide text-body">{answersShort(answers)}</span>}
      </div>
      {rows ? (
        <ol className="mt-3 flex flex-col divide-y divide-line">
          {rows.map((a) => (
            <li key={a.index} className="flex gap-3 py-2.5">
              <span className="w-7 shrink-0 pt-0.5 text-sm font-bold text-muted">{a.index}.</span>
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-sm text-muted">{a.question}</span>
                <span className="text-[15px]">
                  <span className="mr-1.5 inline-flex size-6 items-center justify-center rounded-md bg-sun-soft text-xs font-bold text-sun-ink">
                    {a.choice}
                  </span>
                  {a.text}
                  <span className="ml-1.5 text-xs font-semibold text-muted">({a.letter})</span>
                </span>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-2 text-sm text-muted">Không có. Đơn này được gửi trước khi web lưu câu trả lời bài test.</p>
      )}
    </section>
  );
}
