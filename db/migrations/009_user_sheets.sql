-- Google Sheet riêng của từng tài khoản /quan-ly (người dùng tự kết nối ở trang Tài khoản).
-- Đơn mới được thêm một dòng vào Sheet của người phụ trách và của admin; NULL = chưa kết nối.
ALTER TABLE users ADD COLUMN sheet_id text CHECK (sheet_id ~ '^[A-Za-z0-9_-]{20,}$');
ALTER TABLE users ADD COLUMN sheet_connected_at timestamptz;
