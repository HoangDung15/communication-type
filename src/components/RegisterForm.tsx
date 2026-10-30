"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Blobs, SiteHeader } from "./SiteHeader";
import { AlertCircle, ArrowLeft } from "./icons";
import { btnPrimary, iconBtn } from "./ui";
import { attributionStore, resultStore, thanksStore, type StoredResult } from "@/lib/client-store";
import { formatScores } from "@/lib/mbti";
import { formSchema, GENDERS, suggestEmail, type FormField, type FormValues } from "@/lib/register-schema";
import { site } from "@/lib/site";

type Values = Record<FormField, string>;

const EMPTY: Values = {
  name: "",
  birthYear: "",
  gender: "",
  job: "",
  phone: "",
  email: "",
  facebook: "",
  city: "",
  contactTime: "",
};

const FIELD_ORDER: FormField[] = ["name", "birthYear", "gender", "job", "phone", "email", "facebook", "city", "contactTime"];

function validate(values: Values) {
  const parsed = formSchema.safeParse(values as FormValues);
  if (parsed.success) return { data: parsed.data, errors: {} as Partial<Values> };
  const errors: Partial<Values> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0] as FormField;
    if (!errors[key]) errors[key] = issue.message;
  }
  return { data: null, errors };
}

const inputBase =
  "w-full rounded-[14px] border-[1.5px] bg-white px-3.5 text-base text-ink placeholder:text-[#a8988a] transition-colors focus:outline-none focus:border-sun-deep";

export function RegisterForm() {
  const router = useRouter();
  const [result, setResult] = useState<StoredResult | null>(null);
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Partial<Values>>({});
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [touched, setTouched] = useState<Set<FormField>>(() => new Set());
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const honeypot = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const r = resultStore.get();
    if (!r) router.replace("/quiz");
    else if (!r.field) router.replace("/linh-vuc");
    else setResult(r);
  }, [router]);

  // Chỉ báo lỗi cho ô người dùng đã rời khỏi (hoặc mọi ô sau khi đã bấm gửi), tránh báo lỗi khi đang gõ dở.
  function showErrors(next: Values, touchedNow: Set<FormField>, all = triedSubmit) {
    const found = validate(next).errors;
    const visible: Partial<Values> = {};
    for (const f of FIELD_ORDER) if (found[f] && (all || touchedNow.has(f))) visible[f] = found[f];
    setErrors(visible);
  }

  function update(field: FormField, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    if (triedSubmit || touched.has(field) || field === "gender") {
      const t = new Set(touched).add(field);
      setTouched(t);
      showErrors(next, t);
    }
  }

  function blur(field: FormField) {
    if (!values[field]) return;
    const t = new Set(touched).add(field);
    setTouched(t);
    showErrors(values, t);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!result || submitting) return;
    setTriedSubmit(true);
    setServerError(null);

    const { data, errors: found } = validate(values);
    setErrors(found);
    if (!data) {
      const first = FIELD_ORDER.find((f) => found[f]);
      if (first) document.getElementById(`f-${first}`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const attribution = attributionStore.get();
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          mbti: result.type,
          field: result.field,
          scores: formatScores(result.scores),
          ref: attribution?.ref,
          utmSource: attribution?.utmSource,
          utmMedium: attribution?.utmMedium,
          utmCampaign: attribution?.utmCampaign,
          website: honeypot.current?.value || undefined,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; emailSent?: boolean };
      if (!res.ok || !body.ok) throw new Error(body.error || "Gửi đăng ký chưa thành công");
      thanksStore.set({ name: data.name, email: data.email, emailSent: Boolean(body.emailSent) });
      router.push("/cam-on");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Gửi đăng ký chưa thành công");
      setSubmitting(false);
    }
  }

  const emailSuggestion = errors.email ? suggestEmail(values.email) : null;

  const fieldProps = (field: FormField, multiline = false) => ({
    id: `f-${field}`,
    name: field,
    value: values[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(field, e.target.value),
    onBlur: () => blur(field),
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `e-${field}` : undefined,
    className: `${inputBase} ${multiline ? "resize-y py-3 leading-normal" : "h-[50px]"} ${errors[field] ? "border-[#c2410c]" : "border-line-strong"}`,
  });

  return (
    <div className="relative flex min-h-dvh flex-col">
      <div className="hidden md:block">
        <Blobs variant="soft" />
        <SiteHeader />
      </div>

      <main
        className={`relative mx-auto flex w-full max-w-[640px] flex-1 flex-col px-5 pb-8 pt-4 transition-opacity md:mb-12 md:mt-10 md:flex-none md:rounded-[28px] md:border md:border-line md:bg-white md:px-10 md:py-9 ${result ? "opacity-100" : "opacity-0"}`}
      >
        <button type="button" onClick={() => router.back()} className="flex items-center gap-3 self-start text-[15px] font-semibold">
          <span className={iconBtn}>
            <ArrowLeft />
          </span>
          Quay lại kết quả
        </button>

        <h1 className="mt-6 text-[26px] font-extrabold leading-[1.3] md:text-[30px]">Đăng ký tư vấn 1-1</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-body">Điền thông tin để đội ngũ {site.orgName} liên hệ với bạn.</p>

        {result && (
          <div className="mt-[18px] flex items-center gap-3 rounded-2xl border border-line bg-white px-3.5 py-3 md:bg-cream">
            <span className="rounded-[10px] bg-sun px-2.5 py-2 text-base font-extrabold tracking-[1px]">{result.type}</span>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">Lĩnh vực: {result.field}</span>
              <span className="text-[13px] text-muted">Kết quả này sẽ được gửi kèm đăng ký</span>
            </div>
          </div>
        )}

        <form noValidate onSubmit={onSubmit} className="mt-[22px] flex flex-col gap-[18px]">
          <Field label="Họ và tên" field="name" error={errors.name}>
            <input {...fieldProps("name")} type="text" autoComplete="name" placeholder="Nguyễn Văn A" />
          </Field>

          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 sm:gap-3">
            <Field label="Năm sinh" field="birthYear" error={errors.birthYear}>
              <input {...fieldProps("birthYear")} type="text" inputMode="numeric" maxLength={4} autoComplete="bday-year" placeholder="1995" />
            </Field>
            <fieldset className="flex flex-col gap-1.5" aria-describedby={errors.gender ? "e-gender" : undefined}>
              <legend className="mb-1.5 text-sm font-semibold">
                Giới tính <span className="text-brand-dark">*</span>
              </legend>
              <div id="f-gender" tabIndex={-1} className="flex gap-1.5">
                {GENDERS.map((g) => {
                  const active = values.gender === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      aria-pressed={active}
                      onClick={() => update("gender", g)}
                      className={`h-[50px] flex-1 rounded-[14px] border-[1.5px] text-sm transition-colors ${
                        active
                          ? "border-brand bg-peach-soft font-bold text-brand-dark"
                          : `${errors.gender ? "border-[#c2410c]" : "border-line-strong"} bg-white font-semibold hover:bg-cream`
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
              {errors.gender && <ErrorText id="e-gender">{errors.gender}</ErrorText>}
            </fieldset>
          </div>

          <Field label="Công việc / ngành học" field="job" error={errors.job}>
            <input {...fieldProps("job")} type="text" autoComplete="organization-title" placeholder="VD: Trưởng nhóm kinh doanh tại công ty bất động sản" />
          </Field>

          <Field label="Số điện thoại / Zalo" field="phone" error={errors.phone}>
            <input {...fieldProps("phone")} type="tel" inputMode="tel" autoComplete="tel" placeholder="0912 345 678" />
          </Field>

          <Field
            label="Email"
            field="email"
            error={errors.email}
            after={
              emailSuggestion && (
                <button
                  type="button"
                  onClick={() => update("email", emailSuggestion)}
                  className="self-start rounded-lg bg-sun-soft px-3 py-1.5 text-[13px] font-semibold text-sun-ink hover:bg-sun-light"
                >
                  Sửa thành {emailSuggestion}
                </button>
              )
            }
          >
            <input {...fieldProps("email")} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="ban@gmail.com" />
          </Field>

          <Field label="Link Facebook" field="facebook" error={errors.facebook} hint="Mở trang cá nhân Facebook, sao chép đường link trên thanh địa chỉ rồi dán vào đây">
            <input {...fieldProps("facebook")} type="url" inputMode="url" autoComplete="url" autoCapitalize="none" spellCheck={false} placeholder="https://facebook.com/ten-cua-ban" />
          </Field>

          <Field label="Nơi sống" field="city" error={errors.city}>
            <input {...fieldProps("city")} type="text" autoComplete="address-level1" placeholder="VD: Quận 7, TP. Hồ Chí Minh" />
          </Field>

          <Field label="Khung thời gian BTC có thể liên hệ" field="contactTime" error={errors.contactTime}>
            <textarea {...fieldProps("contactTime", true)} rows={3} placeholder="VD: Tối thứ 2–6 sau 19h, hoặc sáng cuối tuần" />
          </Field>

          {/* Ô bẫy chống bot, người dùng không nhìn thấy */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label htmlFor="website">Website</label>
            <input ref={honeypot} id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          <p className="text-[13px] leading-relaxed text-muted">
            Thông tin chỉ dùng để {site.orgName} liên hệ tư vấn, không chia sẻ cho bên thứ ba.
          </p>

          {serverError && (
            <div role="alert" className="flex items-start gap-2 rounded-xl bg-peach-soft px-3.5 py-3 text-sm text-danger">
              <AlertCircle size={18} className="mt-px shrink-0" />
              <span>{serverError}. Bạn vui lòng thử lại sau giây lát.</span>
            </div>
          )}

          <button type="submit" disabled={submitting} className={btnPrimary}>
            {submitting ? "Đang gửi..." : "Gửi đăng ký"}
          </button>
        </form>
      </main>
    </div>
  );
}

function Field({
  label,
  field,
  error,
  hint,
  after,
  children,
}: {
  label: string;
  field: FormField;
  error?: string;
  hint?: string;
  after?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`f-${field}`} className="text-sm font-semibold">
        {label} <span className="text-brand-dark">*</span>
      </label>
      {hint && <span className="-mt-0.5 text-[13px] leading-snug text-muted">{hint}</span>}
      {children}
      {error && <ErrorText id={`e-${field}`}>{error}</ErrorText>}
      {after}
    </div>
  );
}

function ErrorText({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <span id={id} className="flex items-center gap-1.5 text-[13px] text-danger">
      <AlertCircle size={14} className="shrink-0" />
      {children}
    </span>
  );
}
