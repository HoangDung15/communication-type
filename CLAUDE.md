# CLAUDE.md — communication-type

Web Next.js (App Router) + React 19: landing test phong cách giao tiếp MBTI × lĩnh vực, kết quả 3 vòng tròn, đăng ký tư vấn 1-1, trang admin.

## Lệnh

- `npm run dev` — chạy local (port 3000).
- `npm run lint` — thực chất là `tsc --noEmit`; chạy trước mọi PR.
- `npm run db:migrate`, `npm run sync-zones`, `npm run sync-results` — DB/dữ liệu (cần `.env.local`).

## Cấu trúc

- `src/app/page.tsx` (server: đọc managers + zones, render `<Landing>`) → `src/components/Landing.tsx` là trung tâm flow landing (client state: quiz, field, result, modal).
- `src/lib/questions.ts` (12 câu hỏi), `src/lib/mbti.ts` (`computeResult`), `src/lib/client-store.ts` (persist `localStorage`: `quizStore`, `resultStore`, keys `mbti.*.v1` — mọi thao tác bọc try/catch, ẩn danh vẫn chạy).
- Dữ liệu kết quả: `src/data/results-zones.json` (nguồn thật, parse bởi `src/lib/parse-zones.ts`, snapshot `mbti.xlsx`) + `src/data/results.json` legacy (giữ tới cutover, xem `FLOW_IMPLEMENTATION_PLAN.md`).
- Tư vấn: `ConsultModal.tsx` + `RegisterForm.tsx` dùng chung cho modal và `/dang-ky`; `mbti`/`field` nullable (đăng ký trực tiếp không cần test).
- Deep link `/quiz`, `/ket-qua`, `/dang-ky` giữ hoạt động (quyết định B5).

## Quy ước làm việc

- Ngôn ngữ UI: tiếng Việt. Copy landing giữ nguyên 100% khi refactor flow — mọi chỉnh chữ là task riêng.
- Flow landing hiện tại: một trang cuộn (`scrollIntoView` giữa `#bai-test` → `#chon-linh-vuc` → `#ket-qua`). Hướng chuyển: **wizard 4 bước** (Intro → Khám phá → Test → Kết quả+Tư vấn), xem `docs/landing-wizard-plan.md` — đọc trước khi sửa `Landing.tsx`.
- Không thêm dependency cho task UI; không đổi DB schema/API/admin khi làm flow landing.
- Ô nội dung thiếu (`complete: false`) luôn render disabled kèm ghi chú, không cho chọn.
- Commit message tiếng Việt hoặc Anh đều được, kết thúc bằng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
