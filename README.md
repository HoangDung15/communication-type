# MBTI · Giao tiếp

Web test phong cách giao tiếp qua MBTI (12 câu) theo lĩnh vực nghề nghiệp, thu đăng ký tư vấn 1-1 vào database Neon Postgres, chia cho từng người quản lý theo link `?ref=`.

## Chạy ở máy

```bash
npm install
neon env pull      # lấy DATABASE_URL về .env.local (cần neon login trước)
npm run db:migrate # tạo / cập nhật bảng
npm run dev
```

Mở http://localhost:3000.

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
| `POST /api/register` | Lưu đăng ký vào database + gửi email xác nhận (nếu bật) |

## Database (Neon Postgres)

- Bảng được định nghĩa bằng file SQL trong `db/migrations/`. Muốn đổi cấu trúc: thêm file mới (ví dụ `002_...sql`) rồi chạy `npm run db:migrate`. Không sửa file đã chạy.
- `managers`: người quản lý, mỗi người một mã `ref` (chữ thường không dấu, số, `-`, `_`). Link của người đó là `https://ten-mien/?ref=lan`. Đặt `active = false` để tạm ngưng.
- `registrations`: mỗi lượt đăng ký, gồm kết quả MBTI, lĩnh vực, mã ref, người quản lý, nguồn UTM, trạng thái và ghi chú.
- Mã ref được lưu trên máy người dùng 30 ngày. Người vào web không có ref vẫn được lưu đầy đủ, chỉ để trống người quản lý.
- Ứng dụng dùng kết nối pooled (`DATABASE_URL`); migration dùng kết nối trực tiếp (`DATABASE_URL_UNPOOLED`).

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
2. *Settings → Environment Variables*: khai báo các biến như `.env.local` (tối thiểu `DATABASE_URL`).
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
