-- 1. สร้าง Table Users
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50)  UNIQUE NOT NULL,
  email         VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT         NOT NULL, 
  role          VARCHAR(20)  DEFAULT 'member',
  created_at    TIMESTAMP    DEFAULT NOW(),
  last_login    TIMESTAMP
);

-- เพิ่ม Index ให้หา User ได้เร็วเวลา Login
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. สร้าง Table Logs
CREATE TABLE IF NOT EXISTS logs (
  id          SERIAL       PRIMARY KEY,
  level       VARCHAR(20)  NOT NULL, 
  event       VARCHAR(100) NOT NULL,
  user_id     INTEGER      REFERENCES users(id) ON DELETE SET NULL, -- เชื่อมกับ users.id
  ip_address  VARCHAR(45),
  message     TEXT,
  meta        JSONB,
  created_at  TIMESTAMP    DEFAULT NOW()
);

-- เพิ่ม Index ให้ดึง Log ล่าสุดขึ้นมาดูได้ไว
CREATE INDEX IF NOT EXISTS idx_logs_time ON logs(created_at DESC);

-- 3. Seed users สำหรับทดสอบ (ใช้ ON CONFLICT เพื่อไม่ให้ Error เวลารันซ้ำ)
-- alice: password123
-- admin: admin123
INSERT INTO users (username, email, password_hash, role) VALUES
  ('alice', 'alice@lab.local', 
   '$2b$10$PjnT4Aw1VHdFD89uFMsbtOunaa8XXNtp.8aGFlC4Rf2F1zAp3V.KC', 
   'member'),
  ('admin', 'admin@lab.local', 
   '$2b$10$ZFSu9jujm16MjmDzk3fIYO36TyW7tNXJl3MGQuDkWBoiaiNJ2iFca', 
   'admin')
ON CONFLICT (username) DO NOTHING;