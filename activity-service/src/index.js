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

// ── Database Pool ──
const isLocal = process.env.DATABASE_URL && 
               (process.env.DATABASE_URL.includes("localhost") || 
                process.env.DATABASE_URL.includes("activity-db") || 
                process.env.DATABASE_URL.includes("127.0.0.1"));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false } 
});

/* ============================================================
    🌐 GET Routes สำหรับ Browser (กันหน้าแดง)
   ============================================================ */

// 1. หน้าแรก (Root)
app.get('/', (req, res) => {
  res.json({
    service: "Activity Service",
    status: "Online 🟢",
    message: "ระบบบันทึกกิจกรรมพร้อมใช้งาน",
    endpoints: {
      internal_log: "/api/activity/internal (POST)",
      my_history: "/api/activity/me (GET + Token)"
    }
  });
});

// 2. หน้า /api/activity/internal (ขอดูสถานะผ่าน Browser)
app.get('/api/activity/internal', (req, res) => {
  res.json({
    status: "Online 🟢",
    path: "/api/activity/internal",
    instruction: "กรุณาใช้ Method POST เพื่อบันทึก log ใหม่"
  });
});

// 3. หน้า /api/activity/me (ขอดูสถานะผ่าน Browser)
app.get('/api/activity/me', (req, res) => {
  res.json({
    status: "Online 🟢",
    path: "/api/activity/me",
    instruction: "กรุณาส่ง JWT Token มาใน Header เพื่อเรียกดูประวัติกิจกรรมของคุณ"
  });
});

/* ============================================================
    🔌 API Logic (POST และคำสั่งเดิม)
   ============================================================ */

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
    res.status(500).json({ error: 'DB insert error' });
  }
});

app.get('/api/activity/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM activities WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20`,
      [req.user.sub || req.user.id]
    );
    res.json({ activities: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'DB query error' });
  }
});

/* ============================================================
    🚀 Start Server
   ============================================================ */
async function start() {
  try {
    await pool.query('SELECT 1'); // เช็ค DB
    console.log('✅ [activity] DB Ready');
  } catch (err) {
    console.warn('[activity] DB not ready, but starting server...');
  }
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Activity Service running on port ${PORT}`);
  });
}

start();