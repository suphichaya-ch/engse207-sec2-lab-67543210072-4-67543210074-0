const express     = require('express');
const { pool }    = require('../db/db');
const requireAuth = require('../middleware/authMiddleware');

const router = express.Router();

// ── Helper 1: บันทึก log ลง task-db (Database ตัวเอง) ───────────────────
async function logToDB({ level, event, userId, message, meta }) {
  try {
    await pool.query(
      `INSERT INTO logs (level, event, user_id, message, meta) VALUES ($1,$2,$3,$4,$5)`,
      [level, event, userId || null, message || null,
       meta ? JSON.stringify(meta) : null]
    );
  } catch (e) { console.error('[task-log]', e.message); }
}

// ── Helper 2: ส่ง activity event ไป Activity Service (Timeline ระบบ) ──
async function logActivity({ userId, username, eventType, entityId, summary, meta }) {
  const ACTIVITY_URL = process.env.ACTIVITY_SERVICE_URL || 'http://activity-service:3003';
  fetch(`${ACTIVITY_URL}/api/activity/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId, 
      username, 
      event_type: eventType,
      entity_type: 'task', 
      entity_id: entityId || null,
      summary, 
      meta: meta || null
    })
  }).catch(() => {
    console.warn('[task] activity-service unreachable — skipping event log');
  });
}

// ── GET /api/tasks/health (ไม่ต้อง JWT) ───────────────────────────────
router.get('/health', (_, res) => res.json({ status: 'ok', service: 'task-service' }));

// ── ทุก route ต่อจากนี้ต้องผ่าน JWT (requireAuth) ───────────────────────
router.use(requireAuth);

// ── GET /api/tasks/ — ดึงรายการงาน ────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await pool.query(
        `SELECT t.*, u.username FROM tasks t
         LEFT JOIN users u ON t.user_id = u.id
         ORDER BY t.created_at DESC`
      );
    } else {
      result = await pool.query(
        `SELECT t.*, u.username FROM tasks t
         LEFT JOIN users u ON t.user_id = u.id
         WHERE t.user_id = $1 ORDER BY t.created_at DESC`,
        [req.user.sub]
      );
    }
    res.json({ tasks: result.rows, count: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/tasks/ — สร้าง task ใหม่ ────────────────────────────────
router.post('/', async (req, res) => {
  const { title, description, status = 'TODO', priority = 'medium' } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  try {
    const result = await pool.query(
      `INSERT INTO tasks (user_id, title, description, status, priority)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.sub, title, description, status, priority]
    );
    const task = result.rows[0];

    // 1. บันทึก Log ภายใน
    await logToDB({
      level: 'INFO', event: 'TASK_CREATED', userId: req.user.sub,
      message: `Created task: ${title}`, meta: { task_id: task.id }
    });

    // 2. ส่ง Activity Timeline
    logActivity({
      userId: req.user.sub, 
      username: req.user.username,
      eventType: 'TASK_CREATED', 
      entityId: task.id,
      summary: `${req.user.username} สร้าง task "${title}"`,
      meta: { task_id: task.id, title, priority }
    });

    res.status(201).json({ task });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /api/tasks/:id — แก้ไข task ───────────────────────────────────
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority } = req.body;

  try {
    const check = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (!check.rows[0]) return res.status(404).json({ error: 'Task not found' });
    
    if (check.rows[0].user_id !== req.user.sub && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Forbidden' });

    const result = await pool.query(
      `UPDATE tasks
       SET title = COALESCE($1, title), description = COALESCE($2, description),
           status = COALESCE($3, status), priority = COALESCE($4, priority),
           updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [title, description, status, priority, id]
    );

    // ส่ง Activity เฉพาะเมื่อสถานะเปลี่ยน (ตามโจทย์)
    if (status && status !== check.rows[0].status) {
      logActivity({
        userId: req.user.sub,
        username: req.user.username,
        eventType: 'TASK_STATUS_CHANGED',
        entityId: parseInt(id),
        summary: `${req.user.username} เปลี่ยนสถานะ task #${id} เป็น ${status}`,
        meta: { 
          task_id: parseInt(id), 
          old_status: check.rows[0].status, 
          new_status: status 
        }
      });
    }

    res.json({ task: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── DELETE /api/tasks/:id — ลบ task ──────────────────────────────────
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const check = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (!check.rows[0]) return res.status(404).json({ error: 'Task not found' });
    
    if (check.rows[0].user_id !== req.user.sub && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Forbidden' });

    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);

    // บันทึก Log และส่ง Activity
    await logToDB({
      level: 'INFO', event: 'TASK_DELETED', userId: req.user.sub,
      message: `Deleted task #${id}`
    });

    logActivity({
      userId: req.user.sub,
      username: req.user.username,
      eventType: 'TASK_DELETED',
      entityId: parseInt(id),
      summary: `${req.user.username} ลบ task #${id}`,
      meta: { task_id: parseInt(id) }
    });

    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;