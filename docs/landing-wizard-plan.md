# Landing Wizard Plan — từ cuộn dài sang 4 bước Next/Back

Ngày: 2026-11-05. Nguồn sự thật UX: `FLOW_PLAN.md`. Nguồn dữ liệu: `FLOW_IMPLEMENTATION_PLAN.md` (zones từ `mbti.xlsx`).

## 1. Mục tiêu

1. **Task 1:** xóa hẳn badge "Nâng tầm phong cách giao tiếp của bạn" ở đầu landing, không thay thế. Tiêu đề `BETTER TALK, BETTER WORK` thành phần đầu tiên của bước 1.
2. **Task 2:** chuyển landing từ một trang cuộn dài (`intro → test → kết quả → tư vấn` cùng hiện, nhảy bằng `scrollIntoView`) sang **wizard 4 bước, mỗi lúc chỉ hiện 1 bước**, điều hướng bằng nút Tiếp theo / Quay lại:
   - Bước 0 — **Intro:** tiêu đề + đoạn VỀ DỰ ÁN (3 đoạn văn hiện tại) + meta (12 câu hỏi / ~3 phút / N lĩnh vực) + CTA.
   - Bước 1 — **Khám phá:** 4 bullet (`Tôi là ai?` / `Tôi giao tiếp thế nào?` / `Nghề nghiệp cần gì?` / `Tôi cần phát triển gì?`) + khối `TÔI QUYẾT LIỆT TRỞ THÀNH...` + slogan `BETTER TALK. BETTER WORK. BETTER YOU.`
   - Bước 2 — **Test:** giữ nguyên `QuizBody` (12 câu, auto-advance 260ms, progress bar, Câu trước / Câu tiếp theo) + **chọn lĩnh vực là sub-step bên trong** (màn `FieldStep` hiện tại: lưới lĩnh vực, ô incomplete disabled + ghi chú, nút `Xem kết quả của tôi`).
   - Bước 3 — **Kết quả + tư vấn cùng trang:** khối kết quả hiện tại (banner MBTI × lĩnh vực + `CirclesDiagram` + `ZoneModal` + fallback incomplete) **và** khối tư vấn `Muốn áp dụng thế mạnh này vào công việc?` (3 bước đăng ký → xác nhận → kết nối) nằm chung một màn, tư vấn ở phía dưới kết quả.

## 2. Quyết định đã chốt với người dùng (không mở lại khi implement)

- D1: badge xóa hẳn, không text thay thế.
- D2: đúng 4 bước như trên; chọn lĩnh vực là sub-step của Test, không phải bước riêng.
- D3: khối tư vấn nằm cùng trang với Kết quả (bước 3), không phải bước wizard riêng.
- D4: điều hướng **Next/Back + làm lại**, không có stepper nhảy tự do. CTA header: `Bài test` → nhảy tới bước Test; `Kết nối tư vấn` → mở `ConsultModal` từ mọi bước.
- D5: mở trang **luôn bắt đầu từ bước 0 Intro**, kể cả khi `localStorage` đã có kết quả. Dữ liệu cũ (`quizStore`, `resultStore`) vẫn load sẵn: test đã điền sẵn đáp án, lĩnh vực đã chọn sẵn — user Next nhanh tới Kết quả.
- D6: giữ nguyên logic tính MBTI (`computeResult`), stores, `ConsultModal`, `ZoneModal`, `ThanksOverlay`, gating ô incomplete.

## 3. Thiết kế state machine

```
step: 0 (Intro) → 1 (Khám phá) → 2 (Test: quiz → field) → 3 (Kết quả + Tư vấn)
```

- `const [step, setStep] = useState<0|1|2|3>(0)` trong `Landing.tsx`. Không đọc store để set step ban đầu (D5).
- Chuyển bước: `goNext()` / `goBack()` + `window.scrollTo({top: 0})` thay cho mọi `scrollIntoView` hiện tại (`scrollToTest`, `finishQuiz`, `confirmField`, `ThanksOverlay.onBackToResult`).
- Gating:
  - Bước 3 chỉ vào được khi `result?.field` tồn tại. Nút Next ở sub-step field (`Xem kết quả của tôi`) vừa `confirmField()` vừa `setStep(3)`.
  - User ở bước 0–2 không thể truy cập kết quả bằng URL/hash vì kết quả không còn là anchor section.
  - Nút header `Bài test`: `setStep(2)` + scroll top (thay `scrollToTest`).
- Sub-state trong bước 2: dùng sẵn `testDone = answeredCount === TOTAL && storedType` để toggle `QuizBody` ↔ `FieldStep`, giữ nguyên.
- `Làm lại`:
  - Trong `FieldStep.onRestart`: giữ nguyên (reset answers, `setCurrent(0)`), ở lại bước 2.
  - Ở bước 3: thêm nút text `Làm lại bài test` → clear answers + `setStep(2)` (không clear `resultStore` cho tới khi finish quiz mới, để user đổi ý vẫn còn kết quả cũ).
- `ThanksOverlay.onBackToResult`: đóng overlay + `setStep(3)` (thay scroll tới `#ket-qua`).

## 4. Thay đổi UI từng bước

- **StepShell chung** cho cả 4 bước (viết mới trong `Landing.tsx` hoặc `components/WizardShell.tsx`):
  - Khung card trắng `rounded-[28px] border bg-white` (tái dùng style card test hiện tại) bọc nội dung từng bước để nhất quán.
  - Hàng điều hướng dưới cùng: `Quay lại` (secondary, ẩn ở bước 0) + `Tiếp theo` (primary; nhãn theo bước: `Khám phá tiếp →` / `Bắt đầu bài test →`). Bước 2 ẩn Next chung vì `QuizBody`/`FieldStep` đã có nút riêng; chỉ giữ `Quay lại → bước 1`.
  - Text tiến trình `Bước X / 4` + thanh progress 4 nấc (div đơn giản, không thêm lib).
- **Bước 0 Intro:** lấy từ `Landing.tsx:134-186`, **xóa block badge `:131-133`**, giữ h1, 3 đoạn VỀ DỰ ÁN, meta list, CTA (`Bài test` → `setStep(2)`, link tư vấn → `openConsult`).
- **Bước 1 Khám phá:** tách từ `Landing.tsx:145-157` (4 bullet + TÔI QUYẾT LIỆT + slogan) thành section riêng.
- **Bước 2 Test:** giữ nguyên card `#bai-test` nhưng bỏ `id`/anchor, bỏ `scroll-mt`; thêm nút `← Quay lại` về bước 1 (đặt cạnh `Câu trước` hoặc trên card khi ở câu 0).
- **Bước 3 Kết quả + Tư vấn:** ghép block `#ket-qua` (`:229-254`) + block tư vấn (`:257-270`) vào một màn; bỏ anchor; giữ `CirclesDiagram`, `ZoneModal`, fallback incomplete.
- **Header:** giữ nguyên, chỉ đổi handler `Bài test`.

## 5. Files chạm tới (dự kiến diff nhỏ, 1 PR)

| File | Việc |
|---|---|
| `src/components/Landing.tsx` | Chính: thêm `step` state, StepShell, tách Intro/Explore, ghép Result+Tư vấn, xóa badge + `scrollIntoView`, đổi `finishQuiz`/`confirmField` thành `setStep` |
| `src/components/WizardShell.tsx` *(mới, optional)* | Tách StepShell + progress nếu `Landing.tsx` phình quá ~600 dòng |
| `src/lib/client-store.ts` | Không đổi logic; chỉ xác nhận `quizStore`/`resultStore` vẫn persist qua các bước |
| `src/components/Quiz.tsx`, `FieldPicker.tsx`, `/quiz`, `/ket-qua` routes | Không đổi (deep link giữ nguyên theo B5 của plan cũ) |

Không thêm dependency. Không đổi schema DB, API, admin.

## 6. Các bước implement (thứ tự)

1. **Xóa badge:** xóa span `:131-133`, verify build + snapshot text không còn chuỗi "Nâng tầm".
2. **Thêm step state + shell:** `step` state, render có điều kiện 4 bước, nav Next/Back, scroll-top on change. Chưa di chuyển nội dung (mỗi bước render placeholder trước để test chuyển bước).
3. **Tách Intro / Khám phá:** chuyển đúng đoạn văn hiện tại vào bước 0/1, không sửa copy.
4. **Gắn Test + field sub-step:** chuyển `QuizBody` + `FieldStep` vào bước 2; `finishQuiz` ở lại sub-step field (bỏ scroll); `confirmField` → `setStep(3)`.
5. **Ghép Kết quả + Tư vấn:** chuyển 2 block vào bước 3; `ThanksOverlay` back → `setStep(3)`; thêm nút `Làm lại bài test`.
6. **Header + cleanup:** `Bài test` → `setStep(2)`; xóa `scrollToTest`, các `id="bai-test"|"ket-qua"|"chon-linh-vuc"`, class `scroll-mt`; giữ `id` trong `FieldStep` chỉ nếu test nào query tới.
7. **Verify:** `tsc --noEmit`, đi hết matrix bên dưới.

## 7. Kiểm thử chấp nhận

- [ ] Không còn chuỗi "Nâng tầm phong cách" trong DOM trang chủ.
- [ ] Mở trang (kể cả đã có kết quả lưu) luôn thấy bước Intro; reload giữa test vẫn ở Intro nhưng đáp án/lĩnh vực giữ nguyên khi Next tới.
- [ ] Next/Back đi hết 0→1→2→3 và ngược lại; không có scroll dọc giữa các nội dung bước (mỗi lúc 1 bước + header).
- [ ] Làm hết 12 câu → hiện chọn lĩnh vực inline; ô incomplete disabled + ghi chú; `Xem kết quả của tôi` → bước 3 hiện đúng MBTI × lĩnh vực + 3 vòng tròn.
- [ ] Bước 3 hiện cả kết quả lẫn khối tư vấn; modal zone, modal tư vấn, ThanksOverlay + `Xem lại kết quả` hoạt động; `Làm lại bài test` về bước 2 với đáp án cũ còn nguyên.
- [ ] Header `Bài test` từ mọi bước đều tới bước Test; `Kết nối tư vấn` mở modal từ mọi bước.
- [ ] Mobile 360px: nav Next/Back không tràn, card full-width như hiện tại.
- [ ] `tsc --noEmit` sạch.

## 8. Rủi ro & ghi chú

- User đã quen flow cuộn + anchor sẽ mất khả năng link `#bai-test`/`#ket-qua` — chấp nhận theo D4; deep link `/quiz`, `/ket-qua` vẫn giữ.
- Bỏ `scrollIntoView` đổi sang `window.scrollTo(0)` có thể lộ header trống trên màn hình cao — dùng `behavior: "instant"` để tránh cảm giác giật.
- Copy các bước giữ nguyên 100% đợt này; mọi chỉnh chữ là việc riêng, không lẫn vào PR wizard.
