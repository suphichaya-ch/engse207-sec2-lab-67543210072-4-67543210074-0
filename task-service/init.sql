CREATE TABLE IF NOT EXISTS tasks (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER      NOT NULL,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  -- ปรับ CHECK ให้รองรับทั้งตัวเล็กและตัวใหญ่ หรือเอาออกเพื่อให้ยืดหยุ่น
  status      VARCHAR(20)  DEFAULT 'TODO', 
  priority    VARCHAR(10)  DEFAULT 'medium',
  created_at  TIMESTAMP    DEFAULT NOW(),
  updated_at  TIMESTAMP    DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logs (
  id          SERIAL PRIMARY KEY,
  level       VARCHAR(20)  NOT NULL, -- ขยายเป็น 20 กันพลาด
  event       VARCHAR(100) NOT NULL,
  user_id     INTEGER,
  message     TEXT,
  meta        JSONB,
  created_at  TIMESTAMP    DEFAULT NOW()
);