CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50)  UNIQUE NOT NULL,
  email         VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT         NOT NULL, -- ใช้ TEXT แทนเพื่อรองรับ Hash ทุกรูปแบบ
  role          VARCHAR(20)  DEFAULT 'member',
  created_at    TIMESTAMP    DEFAULT NOW(),
  last_login    TIMESTAMP
);

CREATE TABLE IF NOT EXISTS logs (
  id          SERIAL       PRIMARY KEY,
  level       VARCHAR(20)  NOT NULL, -- เอา CHECK ออกเพื่อให้รองรับ log ทุกประเภท
  event       VARCHAR(100) NOT NULL,
  user_id     INTEGER,
  ip_address  VARCHAR(45),
  message     TEXT,
  meta        JSONB,
  created_at  TIMESTAMP    DEFAULT NOW()
);

-- Seed users สำหรับทดสอบ
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