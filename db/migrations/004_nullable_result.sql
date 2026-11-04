-- Đăng ký trực tiếp không cần làm test: mbti/field được để trống (NULL).
ALTER TABLE registrations ALTER COLUMN mbti DROP NOT NULL;
ALTER TABLE registrations ALTER COLUMN field DROP NOT NULL;
