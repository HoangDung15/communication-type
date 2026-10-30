-- Người quản lý: mỗi người có một mã ref riêng (link ?ref=lan)
CREATE TABLE managers (
  id          serial PRIMARY KEY,
  ref         text NOT NULL UNIQUE CHECK (ref ~ '^[a-z0-9_-]{1,32}$'),
  name        text NOT NULL,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Đăng ký tư vấn
CREATE TABLE registrations (
  id            bigserial PRIMARY KEY,
  created_at    timestamptz NOT NULL DEFAULT now(),
  name          text NOT NULL,
  birth_year    smallint NOT NULL,
  gender        text NOT NULL,
  job           text NOT NULL,
  phone         text NOT NULL,
  email         text NOT NULL,
  facebook      text NOT NULL,
  city          text NOT NULL,
  contact_time  text NOT NULL,
  mbti          char(4) NOT NULL,
  field         text NOT NULL,
  scores        text,
  ref           text,
  manager_id    integer REFERENCES managers(id) ON DELETE SET NULL,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  -- Dùng cho trang quản lý: new | called | scheduled | unreachable | done
  status        text NOT NULL DEFAULT 'new',
  note          text
);

CREATE INDEX registrations_manager_created_idx ON registrations (manager_id, created_at DESC);
CREATE INDEX registrations_created_idx ON registrations (created_at DESC);
