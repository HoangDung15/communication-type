-- Tài khoản đăng nhập trang /quan-ly.
-- admin: thấy mọi đăng ký, quản lý người quản lý và tài khoản.
-- manager: chỉ thấy đăng ký của manager_id của mình.
CREATE TABLE users (
  id             serial PRIMARY KEY,
  username       text NOT NULL UNIQUE CHECK (username ~ '^[a-z0-9_.-]{3,32}$'),
  display_name   text NOT NULL,
  password_hash  text NOT NULL,
  role           text NOT NULL CHECK (role IN ('admin', 'manager')),
  manager_id     integer UNIQUE REFERENCES managers(id) ON DELETE CASCADE,
  active         boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  last_login_at  timestamptz,
  CHECK (role = 'admin' OR manager_id IS NOT NULL)
);

-- Phiên đăng nhập: chỉ lưu mã băm của token, token gốc nằm trong cookie httpOnly.
CREATE TABLE sessions (
  id          text PRIMARY KEY,
  user_id     integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL
);
CREATE INDEX sessions_user_idx ON sessions (user_id);

-- Trạng thái chăm sóc khách
ALTER TABLE registrations
  ADD CONSTRAINT registrations_status_check
  CHECK (status IN ('new', 'contacted', 'scheduled', 'done', 'unreachable'));
ALTER TABLE registrations ADD COLUMN updated_at timestamptz;
