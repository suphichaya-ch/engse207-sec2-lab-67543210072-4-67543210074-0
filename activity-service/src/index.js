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

// ── Database Pool (ปรับปรุงเงื่อนไข SSL สำหรับ Docker) ──
const isLocal = process.env.DATABASE_URL && 
               (process.env.DATABASE_URL.includes("localhost") || 
                process.env.DATABASE_URL.includes("activity-db") || 
                process.env.DATABASE_URL.includes("127.0.0.1"));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false } 
});

pool.on('error', (err) => {
  console.error('[PostgreSQL] Unexpected error on idle client', err);
});

// UI Status
app.get('/', (req, res) => {
  res.send(`
    <html>
    <body style="background:#0f172a;color:white;font-family:sans-serif;text-align:center;padding-top:100px;">
      <h1 style="color:#38bdf8;">🟢 Activity Service ONLINE</h1>
      <div style="background:#1e293b; display:inline-block; padding:20px; border-radius:10px; border:1px solid #334155;">
        <p><b>Port:</b> ${PORT}</p>
        <p><b>Status:</b> Database Connected ✅</p>
        <p><b>Endpoint:</b> <code>/api/activity/internal</code></p>
      </div>
    </body>
    </html>
  `);
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'activity' });
});

/* =========================
    🛡️ Middleware
========================= */
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized: No token' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/* =========================
    🌐 API Routes
========================= */

// POST internal log (เรียกจาก Service อื่น)
app.post('/api/activity/internal', async (req, res) => {
  const { userId, username, eventType, entityType, entityId, summary, meta } = req.body;
  if (!userId || !eventType) return res.status(400).json({ error: 'Missing userId or eventType' });

  try {
    await pool.query(
      `INSERT INTO activities (user_id, username, event_type, entity_type, entity_id, summary, meta)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [userId, username || null, eventType, entityType || null, entityId || null, summary || null, meta ? JSON.stringify(meta) : null]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[activity] Insert error:', err.message);
    res.status(500).json({ error: 'DB insert error' });
  }
});

// GET log ของตัวเอง
app.get('/api/activity/me', requireAuth, async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;

  try {
    const result = await pool.query(
      `SELECT * FROM activities WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [req.user.sub || req.user.id, limit, offset] // รองรับทั้ง sub และ id จาก JWT
    );
    res.json({ activities: result.rows });
  } catch (err) {
    console.error('[activity] Query error:', err.message);
    res.status(500).json({ error: 'DB query error' });
  }
});

/* =========================
    🚀 Start Server & DB Init
========================= */
async function start() {
  let retries = 10; // เพิ่มจำนวนครั้งในการลองใหม่
  while (retries > 0) {
    try {
      const client = await pool.connect();
      console.log('✅ [activity] DB Connected & Ready');
      
      // Auto Create Table
      await client.query(`
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
        CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
        CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
      `);
      
      client.release();
      break;
    } catch (err) {
      console.log(`[activity] Waiting DB... (${retries} left) - ${err.message}`);
      retries--;
      await new Promise(r => setTimeout(r, 4000)); // รอ 4 วินาทีก่อนลองใหม่
    }
  }

  if (retries === 0) {
    console.error('❌ [activity] DB connection failed. Exit.');
    process.exit(1);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [activity-service] Running on :${PORT}`);
  });
}

start();