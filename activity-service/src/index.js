require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const app  = express();
const PORT = process.env.PORT || 3003;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// ── ส่วนที่เพิ่มใหม่: หน้า UI สำหรับเช็คสถานะบนเว็บ ──
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Activity Service Status</title>
        <style>
            body { font-family: sans-serif; background: #0f172a; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .status-card { background: #1e293b; padding: 2rem; border-radius: 1rem; box-shadow: 0 10px 25px rgba(0,0,0,0.3); text-align: center; border: 1px solid #334155; }
            .dot { height: 12px; width: 12px; background-color: #22c55e; border-radius: 50%; display: inline-block; margin-right: 8px; }
            code { background: #000; padding: 2px 6px; border-radius: 4px; color: #38bdf8; }
        </style>
    </head>
    <body>
        <div class="status-card">
            <h1><span class="dot"></span> Activity Service Online</h1>
            <p>สถานะระบบ: <code>READY</code></p>
            <p>Port: <code>${PORT}</code></p>
            <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;">
            <small style="color: #94a3b8;">Endpoint หลัก: <code>/api/activity/me</code></small>
        </div>
    </body>
    </html>
  `);
});

// ── Middleware: JWT ทั่วไป ─────────────────────────────────────────────
function requireAuth(req, res, next) {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch (e) { res.status(401).json({ error: 'Invalid token' }); }
}

// ── Middleware: Admin only ─────────────────────────────────────────────
function requireAdmin(req, res, next) {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const user = jwt.verify(token, JWT_SECRET);
    if (user.role !== 'admin') return res.status(403).json({ error: 'admin only' });
    req.user = user; next();
  } catch (e) { res.status(401).json({ error: 'Invalid token' }); }
}

// ── API Routes ────────────────────────────────────────────────────────
app.post('/api/activity/internal', async (req, res) => {
  const { user_id, username, event_type, entity_type, entity_id, summary, meta } = req.body;
  if (!user_id || !event_type) return res.status(400).json({ error: 'user_id and event_type are required' });
  try {
    await pool.query(
      `INSERT INTO activities (user_id, username, event_type, entity_type, entity_id, summary, meta) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [user_id, username || null, event_type, entity_type || null, entity_id || null, summary || null, meta ? JSON.stringify(meta) : null]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[activity] Insert error:', err.message);
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/activity/me', requireAuth, async (req, res) => {
  const { event_type, limit = 50, offset = 0 } = req.query;
  const conditions = ['user_id = $1'];
  const values = [req.user.sub];
  let idx = 2;
  if (event_type) { conditions.push(`event_type = $${idx++}`); values.push(event_type); }
  const where = 'WHERE ' + conditions.join(' AND ');
  try {
    const countRes = await pool.query(`SELECT COUNT(*) FROM activities ${where}`, values);
    const total = parseInt(countRes.rows[0].count);
    values.push(parseInt(limit));
    values.push(parseInt(offset));
    const result = await pool.query(`SELECT * FROM activities ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`, values);
    res.json({ activities: result.rows, total, limit: parseInt(limit) });
  } catch (err) { res.status(500).json({ error: 'DB error' }); }
});

app.get('/api/activity/all', requireAdmin, async (req, res) => {
  const { event_type, username, limit = 100, offset = 0 } = req.query;
  const conditions = [];
  const values = [];
  let idx = 1;
  if (event_type) { conditions.push(`event_type = $${idx++}`); values.push(event_type); }
  if (username) { conditions.push(`username = $${idx++}`); values.push(username); }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  try {
    const countRes = await pool.query(`SELECT COUNT(*) FROM activities ${where}`, values);
    const total = parseInt(countRes.rows[0].count);
    values.push(parseInt(limit));
    values.push(parseInt(offset));
    const result = await pool.query(`SELECT * FROM activities ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`, values);
    res.json({ activities: result.rows, total, limit: parseInt(limit) });
  } catch (err) { res.status(500).json({ error: 'DB error' }); }
});

app.get('/api/activity/health', (_, res) =>
  res.json({ status: 'ok', service: 'activity-service', time: new Date() })
);

// ── Start ──────────────────────────────────────────────────────────────
async function start() {
  let retries = 10;
  while (retries > 0) {
    try {
      await pool.query('SELECT 1');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS activities (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          username VARCHAR(50),
          event_type VARCHAR(50) NOT NULL,
          entity_type VARCHAR(20),
          entity_id INTEGER,
          summary TEXT,
          meta JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_act_user ON activities(user_id);
        CREATE INDEX IF NOT EXISTS idx_act_event ON activities(event_type);
        CREATE INDEX IF NOT EXISTS idx_act_time ON activities(created_at DESC);
      `);
      console.log('[activity] DB Connected & Tables Ready');
      break;
    } catch (e) {
      console.log(`[activity] Waiting DB... (${retries} left)`);
      retries--;
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  app.listen(PORT, () => console.log(`[activity-service] Running on :${PORT}`));
}
start();