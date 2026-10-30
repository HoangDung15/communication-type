# MBTI · Giao tiếp

Web test phong cách giao tiếp qua MBTI (12 câu) theo lĩnh vực nghề nghiệp, thu đăng ký tư vấn 1-1 và chia về sheet của từng người quản lý theo link `?ref=`.

Tài liệu tổng hợp và ảnh thiết kế: [docs/Tong-hop-du-an-MBTI-Giao-tiep.pdf](docs/Tong-hop-du-an-MBTI-Giao-tiep.pdf)

## Chạy ở máy

```bash
npm install
npm run dev
```

Mở http://localhost:3000. Khi chưa có file `.env.local`, đăng ký chỉ in ra console.

## Cập nhật nội dung kết quả

Nội dung kết quả được lưu sẵn trong [src/data/results.json](src/data/results.json), không đọc Google khi người dùng truy cập. Khi team sửa nội dung trong Google Sheet:

```bash
npm run sync-results
```

Sau đó commit file `src/data/results.json` và đẩy lên, Vercel sẽ tự deploy lại.

- Sheet kết quả phải để chế độ **"Bất kỳ ai có đường liên kết đều có thể xem"**. Không cần Service Account.
- Lệnh tự kiểm tra trước khi ghi: thiếu tab, ô trống, nội dung sai tab, nội dung bị dán lặp. Có lỗi nghiêm trọng thì **không ghi đè** file đang dùng.
- Mỗi MBTI chỉ hiện những lĩnh vực có nội dung. Ô trống thì lĩnh vực đó tự ẩn với MBTI đó.
- Chỉ lấy dòng "Kết quả phong cách giao tiếp"; các dòng khác như "Key vấn đề", "Phần CTA" không hiển thị.
- Cột có chữ `(Updated)` trong tên bị bỏ qua (bản nháp). Muốn dùng bản đó thì đổi tên cột hoặc sửa `IGNORED_COLUMN` trong `scripts/sync-results.ts`.

## Luồng trang

| Đường dẫn | Trang |
|---|---|
| `/` | Trang bìa (ghi nhận `?ref=` và `utm_*`) |
| `/quiz` | 12 câu hỏi, tự lưu tiến trình |
| `/linh-vuc` | Chọn lĩnh vực (chỉ hiện lĩnh vực có nội dung cho MBTI đó) |
| `/ket-qua?mbti=ENTJ&linh-vuc=...` | Kết quả |
| `/dang-ky` | Form đăng ký |
| `/cam-on` | Trang cảm ơn |
| `POST /api/register` | Ghi sheet tổng + sheet người quản lý + email |

## Cấu hình Google Sheet cho phần đăng ký (làm một lần)

1. **Tạo Service Account**
   - Vào https://console.cloud.google.com, tạo project mới.
   - *APIs & Services → Library* → bật **Google Sheets API**.
   - *IAM & Admin → Service Accounts* → tạo tài khoản → tab *Keys* → *Add key → JSON*. Tải file JSON về.
   - Lấy `client_email` và `private_key` trong file JSON điền vào `.env.local` (xem `.env.example`).

2. **Sheet tổng**: tạo Google Sheet mới, chia sẻ quyền **Người chỉnh sửa** cho `client_email`, điền ID vào `MASTER_SHEET_ID`.
   - Tab `DangKy` sẽ được tự tạo khi có đăng ký đầu tiên.
   - Tạo tab `Config` với dòng tiêu đề và mỗi người quản lý một dòng:

     | ma_ref | ten | link_sheet | dang_hoat_dong |
     |---|---|---|---|
     | lan | Chị Lan | https://docs.google.com/spreadsheets/d/... | TRUE |

   - `ma_ref`: chữ thường không dấu, số, `-` hoặc `_`. Link của người đó là `https://ten-mien/?ref=lan`.
   - Đặt `dang_hoat_dong` = `FALSE` để tạm ngưng chia cho một người.

3. **Sheet của từng quản lý**: mỗi người tạo một Google Sheet, chia sẻ quyền **Người chỉnh sửa** cho `client_email` rồi gửi link để điền vào tab `Config`. Đăng ký được ghi vào **tab đầu tiên**; dòng tiêu đề tự tạo nếu sheet trống. Quản lý có thể thêm cột ghi chú ở bên phải cột R.

4. Kiểm tra:

   ```bash
   npm run check-sheet
   ```

   Lệnh này báo sheet tổng thiếu tab `Config` và người quản lý nào chưa chia sẻ quyền.

> Mã ref được lưu trên máy người dùng 30 ngày. Người vào web không có ref vẫn được lưu đầy đủ trong sheet tổng, cột "Người phụ trách" để trống.

## Format nội dung trong sheet kết quả

- Dòng 1 của mỗi tab: cột A là "Lĩnh vực", các cột sau là tên lĩnh vực. Cùng một lĩnh vực nên viết tên giống nhau ở các tab (khác hoa thường, khoảng trắng hay gạch ngắn/dài vẫn được gộp).
- Dòng "Kết quả phong cách giao tiếp": nội dung, mỗi ô phải bắt đầu bằng mã MBTI của tab. Web tự tách thành khối dựa vào:
  - Dòng đầu có dấu `|`: phần sau `|` hiện dưới mã MBTI.
  - Dòng trong ngoặc `( ... )` trước mục đầu tiên: ghi chú nhỏ.
  - Dòng bắt đầu bằng emoji (ví dụ `✨`): bắt đầu một mục mới.
  - Dòng ngắn kết thúc bằng `:` (ví dụ `Điểm mạnh:`, `👉 Mẹo:`): tiêu đề nhóm trong mục. Chữ "mạnh" → nền xanh mint, "yếu"/"lưu ý" → nền đào, "mẹo" → nền vàng.
  - Dòng bắt đầu bằng `•` hoặc `-`: gạch đầu dòng.
- Trang kết quả hiện 2 mục đầu, các mục còn lại nằm sau nút "Xem thêm".

## Email xác nhận (tuỳ chọn)

Bật xác minh 2 bước cho Gmail của BTC → *Tài khoản Google → Bảo mật → Mật khẩu ứng dụng* → tạo mật khẩu, điền `GMAIL_USER` và `GMAIL_APP_PASSWORD`. Bỏ trống để tắt. Email lỗi không ảnh hưởng việc lưu đăng ký.

## Deploy lên Vercel

1. Đẩy code lên GitHub, vào https://vercel.com → *Add New Project* → chọn repo.
2. *Settings → Environment Variables*: khai báo các biến như `.env.local`. Với `GOOGLE_PRIVATE_KEY`, dán nguyên giá trị có `\n`.
3. *Analytics* → bật **Web Analytics** để xem lượt truy cập theo trang (phễu: `/` → `/quiz` → `/linh-vuc` → `/ket-qua` → `/dang-ky` → `/cam-on`) và theo nguồn UTM.

## Chỉnh nội dung thường gặp

| Muốn sửa | File |
|---|---|
| Câu hỏi, đáp án | `src/lib/questions.ts` |
| Tên BTC | biến `NEXT_PUBLIC_ORG_NAME` |
| Lời dẫn trang bìa | `src/lib/site.ts`, `src/app/page.tsx` |
| Ô "Bước tiếp theo" ở trang cảm ơn | `thanksNextSteps` trong `src/lib/site.ts` |
| Màu sắc | `src/app/globals.css` |
| Biểu tượng theo lĩnh vực | `src/components/FieldIcon.tsx` |
