# Implementation plan: landing flow (trang chủ → test → kết quả 3 vòng tròn → tư vấn)

Nguồn sự thật người dùng: `FLOW_PLAN.md` (hành trình + nội dung hiển thị).
Nguồn nội dung kết quả: file `mbti.xlsx` (snapshot khớp từng ô với sheet đích
`1eVQCucvuvRZYANLboJFzhECbImY1mL7pyEruU35t0ck` khi đối chiếu ngày 04/11/2026),
16 tabs MBTI, nội dung ở dòng 2. Chi tiết kiểm kê: `DATA_AUDIT.md`.

## 0. Cấu trúc dữ liệu thực tế (đã đọc từ `mbti.xlsx`)

- Mỗi tab = một MBTI. Dòng 1 = tên lĩnh vực. Dòng 2 = nội dung từng ô.
- Cả 16 tab đều có 8 lĩnh vực: `Lãnh đạo`, `Dịch vụ`, `Kinh tế - tài chính`,
  `Sáng tạo`, `Giáo dục`, `Kỹ thuật`, `Y tế`, `Công nghệ thông tin`.
  Chỉ ENTJ có ô nhãn `Lĩnh vực` ở A1. Bỏ cột `Kế toán - Tài Chính - Ngân hàng`
  của ESTJ theo yêu cầu và cột nháp trống `Công nghệ thông tin (Updated)` của INTJ.
- Format mỗi ô đầy đủ:
  - `# <MBTI> – NGÀNH X` (kicker, bỏ khi hiển thị)
  - `### GIAO ĐIỂM THỨ NHẤT: BẠN LÀ AI?` + body, có dòng `**Hình ảnh đại diện: ...**`
  - `### GIAO ĐIỂM THỨ HAI: PHONG CÁCH GIAO TIẾP...` + body
  - `### GIAO ĐIỂM THỨ BA: NGÀNH X CẦN NGƯỜI NHƯ THẾ NÀO?` + body
  - `### ĐIỂM GIAO MÀU VÀNG: THE <NAME>` + dòng phụ + 3 năng lực đánh số
  - `---` + đoạn promo cuối ("Bạn đã sẵn sàng... Đăng ký ngay...") → bỏ, UI dùng CTA riêng
- Tiêu đề khớp theo ý nghĩa bằng regex (`GIAO ĐIỂM THỨ NHẤT|THỨ HAI|THỨ BA`,
  `ĐIỂM GIAO MÀU VÀNG`), không khớp chuỗi tuyệt đối. Một số tab dùng `**...**`
  thay cho heading; bỏ ba dòng chỉ dẫn biên tập `Bao gồm`/`Hình ảnh`/`Lời dẫn`.
- Quy tắc complete: cả 4 zones đều non-empty sau trim. Hai ô nguồn bị cắt dở
  được viết bổ sung có đánh dấu trong `src/data/zones-completions.json`; ô nào
  vẫn thiếu → `complete: false`, UI hiển thị disabled kèm ghi chú.
- `results.json` cũ và render `/ket-qua` cũ giữ nguyên trong lúc chuyển đổi; lịch sử
  admin đọc chuỗi `mbti`/`field` thô nên không vỡ.

## Quyết định đã chốt với người dùng

- A1: sheet đích `1eVQCucvuvRZYANLboJFzhECbImY1mL7pyEruU35t0ck`.
- A2: đã đọc `mbti.xlsx` thay vì đọc sheet trực tiếp.
- A3: ô thiếu hiển thị disabled kèm ghi chú để người dùng tự đối chiếu.
- A4: dùng danh sách lĩnh vực của sheet mới, UI thích ứng theo.
- B5: landing một trang cuộn + giữ `/quiz`, `/ket-qua`, `/dang-ky` làm deep link.
- B6: thành công trong modal + nút "Xem lại kết quả", đóng modal về đúng vị trí cuộn.
- B7: đăng ký trực tiếp được, `mbti`/`field` nullable.
- B8: copy landing/modal viết placeholder trước.
- C9: dữ liệu admin tương thích ngược (giữ render cũ tới lúc cutover).
- C10: làm nhiều phase, từng phase một.

---

## Phase 1 — Data layer: sheet mới → 4 zones + completeness gate

Mục tiêu: thay nguồn dữ liệu sheet cũ bằng sheet mới, parse thành 4 zones.

1. Viết `src/lib/parse-zones.ts`: cắt nội dung ô thành `{ z1, z2, z3, yellow }`,
   mỗi zone `{ title, avatar?, body }`. Bỏ kicker `# ...` và đoạn promo sau `---`.
   Tái dùng phong cách parse block của `parse-result.ts` cho body từng zone.
2. Viết script import (mới, ví dụ `scripts/sync-zones.ts`): đọc sheet qua URL gviz
   với `RESULTS_SHEET_ID`, fallback đọc snapshot `mbti.xlsx` khi chạy local/offline.
   Ghi `src/data/results-zones.json`: `{ fields, byType[MBTI][field]: { zones, complete } }`.
   Bỏ qua cột `(Updated)` và cột trống.
3. Mở rộng `src/lib/results.ts` (server-only): `getFieldsByType()` (mặc định chỉ
   complete), `getFieldStatus(mbti, field)`, `getZoneContent(mbti, field)`.
4. Chấp nhận: script chạy sạch; ENTJ × Kinh tế - tài chính và ENFJ × Giáo dục được
   bổ sung có ghi nguồn gốc; mọi ô complete cho ra 4 zones non-empty.

## Phase 2 — Đăng ký không cần kết quả test (DB + form dùng chung)

Mục tiêu: đăng ký tư vấn trực tiếp với `mbti`/`field` NULL.

1. Migration: `mbti`, `field` nullable trong bảng `registrations`.
2. `registerSchema`: `mbti`/`field` optional; giữ nguyên logic `findManager` + BNV mặc định.
3. Admin danh sách/chi tiết: dòng NULL hiện badge "Chưa làm test"; bộ lọc xử lý NULL.
4. Tách `RegisterForm` thành component form thuần (`initialResult?`, `validCodes`,
   `onSuccess`) để `/dang-ky` và modal dùng chung. Giữ nguyên trường và validation.
5. Chấp nhận: gửi không kết quả thành công; gửi có kết quả thì đính kèm; admin hiện cả hai.

## Phase 3 — Landing page (một trang cuộn, giữ deep link)

Mục tiêu: `/` thành landing theo FLOW_PLAN §1.

1. Thêm section trên `/`: intro (copy hiện có), `#bai-test`, `#ket-qua`, khối tư vấn
   3 bước đăng ký → xác nhận → kết nối (copy placeholder).
2. `SiteHeader`: nút **Kết nối tư vấn** mở modal; nút **Bài test** cuộn tới `#bai-test`.
3. Giữ `/quiz`, `/ket-qua`, `/dang-ky` hoạt động như deep link.
4. Chấp nhận: hai nút top bar đúng hành vi; deep link còn dùng được.

## Phase 4 — Quiz: chọn lĩnh vực là bước cuối của test

Mục tiêu: FLOW_PLAN §3 — sau câu 12 chọn lĩnh vực inline rồi tới kết quả.

1. Gộp lưới `FieldPicker` vào `Quiz` thành bước 13; options từ accessor Phase 1;
   ô incomplete hiển thị disabled + ghi chú.
2. Xác nhận → `resultStore.set()` → tới `#ket-qua`, giữ param `?mbti=&linh-vuc=` để
   chia sẻ được.
3. Chấp nhận: không trang trung gian; ô thiếu không chọn được và có ghi chú.

## Phase 5 — Kết quả: ba vòng tròn spotlight + modal từng vùng

Mục tiêu: FLOW_PLAN §4–5.

1. Component `CirclesDiagram` (SVG, palette hiện có): khi vào kết quả, **tối cả màn
   hình** (overlay dim toàn cục) rồi **sáng từng vòng tròn** 1→2→3→vùng giữa,
   mỗi bước đủ lâu để đọc nhãn; chạm vào bất kỳ vòng nào mở modal ngay và kết thúc
   intro. Chỉ ba vòng tròn lớn giao nhau, vùng giữa là phần chồng nhau của cả ba.
2. Nhấn một vòng → mở **`ZoneModal`** hiển thị đúng nội dung vùng đó (tiêu đề,
   avatar, body render bằng `parseResult`). **Không render `ZoneCards` dàn sẵn**
   dưới sơ đồ nữa (gỡ khỏi `ZoneResult` và landing, giữ file để dùng sau nếu cần).
3. Đóng modal quay lại sơ đồ, giữ nguyên vị trí cuộn; vòng đã xem đánh dấu để biết
   còn vùng nào chưa khám phá. Modal vùng vàng có CTA **"Kết nối nhận tư vấn tại đây"**
   mở modal tư vấn kèm tóm tắt.
4. Chấp nhận: thứ tự sáng đúng; mỗi vòng mở đúng modal; CTA mở đúng modal.

## Phase 6 — Modal tư vấn + đường quay lại

Mục tiêu: FLOW_PLAN §2 + B6.

1. `ConsultModal`: tiêu đề **Đăng ký tư vấn 1-1** + intro ngắn (placeholder) + form dùng
   chung; hiện chip tóm tắt MBTI×lĩnh vực khi có kết quả; gửi trực tiếp khi chưa có.
2. Thành công: xác nhận trong modal (nội dung mirror `/cam-on`) + nút "Xem lại kết quả"
   (đóng modal, về đúng vị trí cuộn). Không redirect bắt buộc, không lưu nháp khi đóng
   giữa chừng.
3. Chấp nhận: đăng ký được từ mọi điểm; đóng modal về đúng vị trí.

## Phase 7 — Cutover + kiểm tra

1. Chuyển quiz/result/register sang dữ liệu zones; gỡ render format cũ sau khi xác nhận;
   giữ `/dang-ky` làm fallback non-JS cho modal.
2. Chạy `tsc --noEmit` + đi hết 5 tiêu chí ở FLOW_PLAN §Điểm hoàn thành; cập nhật tài liệu
   sync với sheet ID mới.

## Thứ tự và checkpoint

Làm tuần tự Phase 1 → 7, mỗi phase một PR trên `feature/landing-flow-plan`, mỗi phase
xong dừng checkpoint trước khi sang phase tiếp theo.
