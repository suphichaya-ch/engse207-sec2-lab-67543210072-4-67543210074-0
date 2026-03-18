-- ═══════════════════════════════════════════════════════
--  ACTIVITIES TABLE (Microservices Architecture)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS activities (
  id           SERIAL       PRIMARY KEY,
  user_id      INTEGER      NOT NULL,
  username     VARCHAR(50),             -- Denormalized for fast reading
  event_type   VARCHAR(50)  NOT NULL,   -- e.g., 'USER_LOGIN', 'TASK_DONE'
  entity_type  VARCHAR(20),             -- e.g., 'task', 'user'
  entity_id    INTEGER,                 -- ID of the related object
  summary      TEXT,                    -- Human readable description
  meta         JSONB,                   -- Extra details (old values, IP, etc.)
  created_at   TIMESTAMP    DEFAULT NOW()
);

-- Index พื้นฐาน (ที่คุณทำไว้ ดีมากครับ)
CREATE INDEX IF NOT EXISTS idx_activities_user_id   ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_event_type ON activities(event_type);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);

-- เพิ่ม Index สำหรับการค้นหาด้วยชื่อ (เผื่อทำช่อง Search ใน Admin)
CREATE INDEX IF NOT EXISTS idx_activities_username   ON activities(username);