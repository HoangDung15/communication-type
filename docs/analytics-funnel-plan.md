# Plan đo lường độc lập Vercel: mở web → hoàn thành test → xem đăng ký tư vấn

## Chỉ số cần xem

| Mốc | Khi nào ghi | Báo cáo |
| --- | --- | --- |
| `page_view` | Trang `/` hoặc `/dang-ky` hiển thị trong trình duyệt | Người mở web (`COUNT(DISTINCT visitor_id)` trên cả hai trang), lượt mở trang (`COUNT(*)`); có thể lọc riêng `/` hoặc link từng KV |
| `quiz_completed` | Người dùng trả lời đủ 12 câu, chọn lĩnh vực và xác nhận để xem kết quả | Người hoàn thành test, số lượt hoàn thành |
| `registration_opened` | Người dùng bấm mở phần đăng ký tư vấn (modal bắt đầu bằng màn lưu ý), hoặc vào `/dang-ky` | Người bấm xem đăng ký, số lượt mở; tách `modal`/`page` |

Ba chỉ số “người” dùng cùng một `visitor_id` ẩn danh, nên có thể tính tỷ lệ `người hoàn thành test / người mở web` và `người xem đăng ký / người mở web` trong cùng khoảng ngày. Đây là **trình duyệt/thiết bị ước tính**, không phải danh tính người thật: xóa dữ liệu trình duyệt, đổi thiết bị, chặn JavaScript hoặc trình duyệt riêng tư có thể làm lệch số. Báo cáo thêm số lượt để không che mất việc một người làm lại test hoặc mở đơn nhiều lần.

## Cách ghi: API + Postgres hiện có

1. Tạo migration `analytics_events`: `id` (UUID do client tạo, khóa chính để chống ghi trùng khi retry), `occurred_at` (thời gian server), `event_name` (chỉ ba tên trên), `visitor_id` (UUID ẩn danh), `session_id` (UUID ẩn danh), `path` (chỉ `/` hoặc `/dang-ky`), `surface` (chỉ `modal`/`page` khi phù hợp), `entry_manager_id` và `attributed_manager_id` (khóa ngoại nullable tới `managers`). Index `(event_name, occurred_at)`, `(visitor_id, occurred_at)` và `(attributed_manager_id, occurred_at)`. Không lưu IP, User-Agent, UTM, MBTI, câu trả lời hay dữ liệu form trong bảng event; mã ref công khai chỉ dùng để tra KV lúc nhận event, không lưu lại trong bảng.
2. Tạo client helper trong `src/lib/analytics.ts`: sinh `visitor_id` ngẫu nhiên trong `localStorage` với hạn 30 ngày, `session_id` trong `sessionStorage` và `event_id` mới cho từng event. Nếu storage bị chặn, dùng ID chỉ tồn tại trong tab. Gửi bằng `fetch("/api/analytics", { method: "POST", keepalive: true, ... })`; lỗi ghi event không cản luồng test/form. Không tự retry vô hạn. ID có thể được gửi kèm nhiều event, nhưng không nối với đơn đăng ký. Helper lấy ref hiện tại từ URL trước, rồi mới đọc `attributionStore`, để lần vào link KV không bị lệch do thứ tự chạy `useEffect`.
3. Tạo `POST /api/analytics`: kiểm tra body bằng schema cố định, chỉ chấp nhận event/path/surface hợp lệ, giới hạn kích thước request và số lần gửi theo IP, dùng truy vấn tham số hóa; `INSERT ... ON CONFLICT (id) DO NOTHING`. Tra mã ref từ URL/stored attribution với bảng `managers` để lưu đúng `manager_id`; mã không tồn tại ghi NULL, không gán KV mặc định cho lượt vào tự nhiên. Chỉ chấp nhận request cùng origin khi có `Origin`; áp dụng bảo vệ chống spam ở hạ tầng nếu lưu lượng tăng. Không tin thời gian do client gửi. Trả lỗi gọn, không log payload chứa ID.
4. Thêm component client nhỏ ở `src/app/layout.tsx` để ghi `page_view` khi vào `/` hoặc `/dang-ky`, gồm chuyển trang trong Next.js. Tránh bắn trùng do render lại/React Strict Mode; lần tải lại trang là lượt xem mới. `page_view` tại `/dang-ky` và `registration_opened` là hai event riêng.
5. Trong `Landing.tsx`, đánh dấu lượt test khi hoàn tất 12 câu; ghi `quiz_completed` tại `confirmField()` khi người dùng xác nhận lĩnh vực để thấy kết quả. Mỗi lượt chỉ ghi một lần; không ghi khi chỉ khôi phục kết quả cũ từ `localStorage` hoặc mở màn test.
6. Trong `Landing.tsx`, ghi `registration_opened` tại `openConsult()` khi người dùng bấm mở modal, với `surface: "modal"`; lúc này họ thấy màn lưu ý. Trang `/dang-ky` ghi một lần khi phần đăng ký hiển thị, với `surface: "page"`. Không đặt event trong `RegisterForm` dùng chung để tránh ghi trùng do mount lại.
7. Thêm trang báo cáo trong `/quan-ly`, dùng truy vấn tổng hợp theo ngày (múi giờ `Asia/Ho_Chi_Minh`) và khoảng ngày chọn: số người/lượt từng mốc, tỷ lệ chuyển đổi theo `COUNT(DISTINCT visitor_id)`, tách nguồn modal/trang và từng KV. Mẫu số tổng là người xem **bất kỳ trang nào** trong hai trang được đo, để người vào thẳng `/dang-ky` vẫn được tính. Admin xem tất cả KV; tài khoản quản lý chỉ xem KV của mình. Mỗi nhóm event có thể chồng nhau; tỷ lệ không mặc định là hành trình theo đúng thứ tự. Nếu cần funnel theo thứ tự, thêm truy vấn cùng `visitor_id` với timestamp tăng dần.
8. API thỉnh thoảng dọn event thô quá 90 ngày sau khi ghi thành công; nếu cần xem xu hướng lâu hơn, lưu bảng tổng hợp theo ngày trước khi xóa. Tránh xuất `visitor_id` thô ra UI.

## Theo dõi từng link KV

Link hiện tại của mỗi KV là `/<token>`; server kiểm tra token rồi chuyển sang `/?ref=<token>`. `AttributionCapture` lưu ref 30 ngày, và đơn đăng ký đã gắn `manager_id`. Có thể tận dụng cùng quy tắc đó cho event:

- **Lượt vào trực tiếp qua link KV:** `page_view` có ref hợp lệ trong URL thì ghi `entry_manager_id`. Báo cáo người/lượt vào của từng link dựa trên cột này. Lượt vào web không có ref thì để NULL, kể cả người đó từng vào qua link KV trước đây.
- **Test và mở đơn được ghi nhận cho KV:** dùng ref hợp lệ mới nhất trong URL hoặc `attributionStore` (30 ngày) để ghi `attributed_manager_id`. Khi người dùng mở link KV B sau link KV A, các hành động tiếp theo thuộc B. Người vào tự nhiên không có ref thì ở nhóm “Không qua link KV”.
- Một người mở hai link KV sẽ được tính ở **cả hai** hàng “lượt vào trực tiếp”, nhưng các hành động sau đó chỉ thuộc KV được gán tại thời điểm event. Vì vậy tổng số người theo từng KV có thể lớn hơn số người duy nhất toàn web. Hiển thị quy tắc này ngay trên báo cáo.

## Kiểm tra nghiệm thu

- Vào `/` chỉ có một `page_view`; reload thêm một lượt, cùng trình duyệt vẫn là một người trong kỳ. Chuyển tới `/dang-ky` ghi page view của trang đó.
- Mở màn test, trả lời dở hoặc xong 12 câu nhưng chưa xác nhận lĩnh vực: chưa có `quiz_completed`. Xác nhận lĩnh vực: một event; xem lại kết quả: không thêm; làm lại và hoàn thành: thêm một lượt nhưng vẫn một người.
- Bấm mở modal: một `registration_opened` với `surface: "modal"`, dù chưa bấm qua màn lưu ý. Bấm tiếp tục không ghi thêm; vào `/dang-ky`: một event `page`. Không ghi thêm khi form render lại.
- Gửi cùng `event_id` hai lần chỉ lưu một hàng. Payload sai, event lạ, đường dẫn lạ và request quá nhiều bị từ chối. Lỗi API event không làm hỏng bài test hoặc form.
- Đối chiếu bảng báo cáo với truy vấn SQL mẫu trên dữ liệu thử; xác nhận múi giờ và ranh giới ngày.
- Mở `/<token A>`: tăng lượt vào trực tiếp A; làm test và mở đơn: tính cho A. Sau đó mở `/<token B>`: tăng lượt vào trực tiếp B; hành động mới tính cho B. Vào `/` không ref: không tăng lượt vào trực tiếp của KV nào. Ref không hợp lệ không được gán KV.

## Phạm vi thay đổi

Đã triển khai trên branch `codex/analytics-funnel-main`: gỡ `<Analytics />` và package `@vercel/analytics`, thêm API, bảng event và trang `/quan-ly/thong-ke`. Web vẫn có thể **được host trên Vercel**; cách đo lường không phụ thuộc Vercel Analytics. `@vercel/functions` trong `src/lib/db.ts` hiện phục vụ quản lý kết nối database khi chạy trên Vercel và không liên quan việc ghi event.
