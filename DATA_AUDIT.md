# Kiểm kê dữ liệu MBTI × lĩnh vực

Đối chiếu ngày 04/11/2026 giữa [Google Sheet nguồn](https://docs.google.com/spreadsheets/d/1eVQCucvuvRZYANLboJFzhECbImY1mL7pyEruU35t0ck/edit) và `mbti.xlsx`: nội dung từng ô sử dụng ở dòng 1–2 của 16 tab khớp hoàn toàn. `npm run sync-zones:local` tạo `src/data/results-zones.json` từ bản Excel; `npm run sync-zones` đọc Google Sheet. Hai lệnh dùng cùng parser.

## Kết quả import

- 16 MBTI × 8 lĩnh vực = **128 cặp đầy đủ** bốn phần (`z1`, `z2`, `z3`, `yellow`) trong dữ liệu sản phẩm.
- **126 cặp** lấy trọn từ nguồn; **2 cặp** có vùng 3 được viết tiếp và vùng vàng được tạo thêm trong `src/data/zones-completions.json`. Chúng được đánh dấu `supplementedZones` trong dữ liệu xuất ra.
- Loại hẳn ngành **Kế toán - Tài chính - Ngân hàng** theo yêu cầu. Cột `Công nghệ thông tin (Updated)` của INTJ cũng bỏ qua vì là bản nháp trống; bản `Công nghệ thông tin` chính vẫn được nhập.
- Dữ liệu kết quả cũ trong `src/data/results.json` và lệnh `sync-results` cũng đã loại ngành Kế toán để lần đồng bộ sau không đưa ngành này trở lại.
- Bỏ tiêu đề MBTI đầu ô, dòng chỉ dẫn biên tập `Bao gồm`/`Hình ảnh người đại diện`/`Lời dẫn`, và đoạn kêu gọi đăng ký sau dấu phân cách. Giữ nội dung mô tả của từng phần.

## Nội dung thiếu trong nguồn, đã bổ sung trong repo

| Cặp | Ô nguồn | Phần thiếu trong nguồn | Cách bổ sung |
| --- | --- | --- | --- |
| ENTJ × Kinh tế - tài chính | `ENTJ!D2` | `z3` bị cắt giữa câu ở “đánh giá rủi ro, nhận”; không có `yellow`. | Viết tiếp câu và đoạn về truyền đạt rủi ro; vùng vàng theo cấu trúc ENTJ: tên vai trò, lời dẫn, ba năng lực. |
| ENFJ × Giáo dục | `ENFJ!E2` | `z3` bị cắt giữa câu ở “biết mình cần cải thiện điều”; không có `yellow`. | Viết tiếp câu và đoạn về người học; vùng vàng theo cấu trúc ENFJ: tên vai trò, ba năng lực đánh số. |

Phần bổ sung là nội dung mới, không phải nguyên văn từ Sheet hoặc Excel. Lệnh đồng bộ chỉ nối vào đoạn nguồn khi phần cuối vẫn khớp; nếu nguồn thay đổi mà vẫn thiếu, lệnh dừng để duyệt lại. Nếu nguồn đã có đủ bốn vùng, nội dung nguồn được ưu tiên và phần bổ sung không áp dụng.

## Chỗ cần biên tập thêm

- `ESFP!H2` (Công nghệ thông tin) đủ bốn phần nhưng là bản thô: thiếu dòng mở đầu ghi MBTI và có lỗi gõ như “ơhong”, “rấy”. Nội dung được nhập theo nguồn, chưa tự sửa lời văn.
- `ESTP!A2`, `ENTP!A2`, `ISFJ!A2` (Lãnh đạo) cũng thiếu dòng mở đầu ghi MBTI. Vị trí cột và bốn phần vẫn rõ ràng, nên đã nhập bình thường.
