-- ═══════════════════════════════════════════════════════
--  ACTIVITIES TABLE
--  บันทึก event ทุกอย่างที่เกิดในระบบ
--  user_id และ username เก็บไว้เพื่อ query ได้โดยไม่ต้อง
--  JOIN ข้าม database (Denormalization pattern)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS activities (
  id          SERIAL       PRIMARY KEY,
  user_id     INTEGER      NOT NULL,
  username    VARCHAR(50),             -- ← denormalized: เก็บจาก JWT ณ เวลาที่เกิด event
  event_type  VARCHAR(50)  NOT NULL,   -- 'USER_LOGIN', 'TASK_CREATED', ...
  entity_type VARCHAR(20),             -- 'user', 'task'
  entity_id   INTEGER,                 -- id ของสิ่งที่ถูก act on
  summary     TEXT,                    -- 'alice created task "Deploy to Railway"'
  meta        JSONB,                   -- { old_status: 'TODO', new_status: 'DONE' }
  created_at  TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_user_id   ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_event_type ON activities(event_type);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);