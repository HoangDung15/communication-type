-- 12 câu trả lời của bài test, theo thứ tự câu 1 → 12, mỗi ký tự là "a" hoặc "b" (ví dụ "abaabbaabbab").
-- Đơn đăng ký cũ (trước khi có cột này) để trống.
ALTER TABLE registrations ADD COLUMN answers text CHECK (answers ~ '^[ab]{12}$');
