# Plan flow: landing page, bài test và kết nối tư vấn

## Mục tiêu

Thiết kế lại hành trình người dùng của project, **giữ nguyên ngôn ngữ thiết kế hiện có**. Tài liệu này mô tả flow và nội dung người dùng nhìn thấy; không phải implementation plan.

Ưu tiên một landing page cuộn dọc với anchor đến từng phần nếu việc chuyển đổi không quá phức tạp. Nếu cần giữ một số màn hình riêng để flow hoạt động ổn định, trải nghiệm vẫn phải liền mạch như một hành trình duy nhất.

## Các quyết định đã chốt

- Kết quả cá nhân hóa theo **MBTI × lĩnh vực** của từng người.
- Người chưa làm bài test vẫn có thể đăng ký tư vấn trực tiếp.
- CTA trong kết quả mở **đơn đăng ký hiện có**, không tạo form tư vấn thứ hai.
- “Vòng tròn giữa” là **vùng vàng nơi cả ba vòng tròn giao nhau**, không phải vòng tròn thứ hai.
- Giữ nguyên các trường thông tin và trải nghiệm điền đơn đăng ký hiện có.

## Hành trình chính

### 1. Trang chủ

- Top bar có hai nút: **Kết nối tư vấn** và **Bài test**.
- Phần mở đầu giới thiệu ngắn dự án: dự án giúp người dùng hiểu phong cách giao tiếp của mình, nhìn nó trong bối cảnh lĩnh vực đang làm, rồi chọn kết nối tư vấn nếu muốn đi sâu hơn.
- Sắp xếp nội dung thành các phần theo chiều dọc, có nhịp kể chuyện và anchor rõ ràng. Tham khảo cách tổ chức landing page của [Cởi Mở Đi Unitour](https://vietcetera.com/vn/bo-suu-tap/coi-mo-di-unitour), nhưng giữ nội dung và thiết kế riêng của project.
- Nút **Bài test** cuộn đến phần bài test; nút **Kết nối tư vấn** mở modal đăng ký.

### 2. Kết nối tư vấn từ bất kỳ điểm nào

- Modal có tiêu đề **Đăng ký tư vấn 1-1**, lời giới thiệu ngắn về phiên tư vấn, rồi hiển thị đơn đăng ký hiện có.
- Người chưa làm bài test được điền và gửi đơn ngay. Không buộc họ phải làm test trước.
- Nếu người dùng đã có kết quả, hiển thị tóm tắt MBTI và lĩnh vực trong modal; cho họ biết kết quả này sẽ đi kèm đăng ký.
- Sau khi gửi thành công, giữ flow xác nhận/cảm ơn hiện có. Nếu đóng modal trước khi gửi, người dùng trở về đúng vị trí vừa xem.
- Tham khảo [Nói Nghe](https://www.noinghe.com/) về cách giải thích ngắn hành trình đăng ký → xác nhận → kết nối; không dùng nội dung hay lời hứa dịch vụ của họ cho project này.

### 3. Bài test

- Giữ bộ 12 câu hỏi và cách trả lời hiện có.
- Sau câu cuối, cho chọn **lĩnh vực** như bước cuối của bài test. Chỉ hiển thị các lĩnh vực có nội dung kết quả đầy đủ cho MBTI vừa tính được.
- Khi người dùng xác nhận lĩnh vực, chuyển thẳng đến phần trả kết quả; không thêm một trang trung gian hoặc bắt đăng ký mới cho xem kết quả.

### 4. Giới thiệu kết quả bằng ba vòng tròn (spotlight + modal)

Kết quả hiển thị như **chỉ ba vòng tròn lớn giao nhau**, không còn thẻ nội dung dàn sẵn dưới sơ đồ:

1. **Vòng 1 — Bạn là ai?**
2. **Vòng 2 — Phong cách giao tiếp của bạn là gì?**
3. **Vòng 3 — Lĩnh vực của bạn cần người như thế nào?**
4. **Điểm giao màu vàng** là vùng cả ba vòng chồng nhau: chân dung/hướng phát triển tổng hợp và các năng lực nên phát triển. Nhấn vào vùng giữa để mở.

Khi vừa đến kết quả, **tối cả màn hình** (dim nền), rồi **sáng từng vòng tròn lần lượt** 1 → 2 → 3 → vùng giữa để gợi ý nhấn. Mỗi bước đủ thời gian để đọc nhãn. Chạm vào vòng đang sáng (hoặc bất kỳ vòng nào) sẽ mở modal ngay và kết thúc lượt giới thiệu. Nếu người dùng không muốn chờ hiệu ứng, họ vẫn có thể chạm thẳng vào vòng để mở nội dung.

### 5. Đọc kết quả và CTA (mỗi vòng một modal)

- **Không hiện tất cả nội dung lên một lần.** Nhấn vào từng vòng tròn mở **một modal** hiển thị đúng nội dung vùng đó (tiêu đề, hình ảnh đại diện, phân tích từ sheet).
- Modal vùng vàng có CTA **Kết nối nhận tư vấn tại đây**. CTA mở đúng modal đăng ký ở mục 2, kèm tóm tắt kết quả của người dùng.
- Đóng modal quay lại sơ đồ ba vòng tròn (vị trí cuộn giữ nguyên). Vòng đã xem được đánh dấu để người dùng biết còn vùng nào chưa khám phá.
- Người dùng có thể xem lại vùng khác, làm lại bài test hoặc tiếp tục đăng ký. Sau khi đăng ký, vẫn có đường quay lại kết quả.

## Nội dung kết quả và giới hạn cần xử lý trong flow

- Sheet đích: [MBTI - GIAO TIẾP PROJECT](https://docs.google.com/spreadsheets/d/1eVQCucvuvRZYANLboJFzhECbImY1mL7pyEruU35t0ck/edit?gid=0#gid=0). Mỗi tab là một MBTI, mỗi cột là một lĩnh vực; nội dung trong một ô gồm bốn phần dùng cho bốn vùng kết quả.
- Project hiện dùng `src/data/results.json` được đồng bộ từ **một sheet khác** (`1kMLWs40b1lM3WC64m1AEMlMU-246XqmCUPe4aMXMZt8`). Màn hình kết quả hiện tại đọc format cũ. Flow mới phải lấy đúng nội dung của sheet đích theo cặp MBTI × lĩnh vực.
- Trước khi cho chọn lĩnh vực, kiểm tra cặp MBTI × lĩnh vực có đủ ba “Giao điểm” và “Điểm giao màu vàng”. Hiện có ít nhất hai ô còn dở: **ENTJ × Kinh tế - tài chính** và **ENFJ × Giáo dục**. Các ô này chưa nên dẫn người dùng đến kết quả thiếu phần.
- Dữ liệu trong sheet có vài cách viết tiêu đề khác nhau, nên nội dung của bốn vùng cần được xác định theo ý nghĩa, không dựa vào việc mọi ô có cùng một kiểu trình bày.
- Đơn đăng ký hiện tại chỉ nhận người đã có MBTI và lĩnh vực. Flow mới cần cho phép đăng ký trực tiếp mà không tự gán một kết quả giả; khi đã có kết quả thì gửi kèm như hiện nay.

## Điểm hoàn thành của flow

- Từ trang chủ, người dùng vào bài test bằng anchor hoặc mở đăng ký tư vấn bằng modal.
- Người chưa làm test đăng ký được; người đã làm test đăng ký với kết quả của mình.
- Hoàn thành test và chọn lĩnh vực dẫn ngay đến kết quả cá nhân hóa.
- Sơ đồ spotlight sáng lần lượt theo thứ tự 1 → 2 → 3 → vàng trên nền tối; nhấn vòng nào mở modal nội dung vùng đó, không dàn sẵn tất cả lên trang.
- Modal vùng vàng mở cùng đơn đăng ký; người dùng vẫn xem lại kết quả sau khi gửi đơn.
