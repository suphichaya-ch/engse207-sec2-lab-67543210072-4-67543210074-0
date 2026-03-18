-- 1. สร้าง Table Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  status      VARCHAR(20) DEFAULT 'TODO', 
  priority    VARCHAR(10) DEFAULT 'medium',
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- เพิ่ม Index ให้ค้นหา task ตามรายคนได้ไวขึ้น
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

-- 2. สร้าง Table Logs
CREATE TABLE IF NOT EXISTS logs (
  id          SERIAL PRIMARY KEY,
  level       VARCHAR(20) NOT NULL,
  event       VARCHAR(100) NOT NULL,
  user_id     INTEGER,
  ip_address  VARCHAR(45), -- เพิ่มไว้เก็บ IP สำหรับความปลอดภัย
  message     TEXT,
  meta        JSONB,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- เพิ่ม Index ให้ไล่ดู Log ตามเวลาได้เร็ว
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC);