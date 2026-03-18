require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const app  = express();
const PORT = process.env.PORT || 3003;

// ดึง Secret จาก Environment Variable (ต้องตรงกับ auth-service)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

app.use(cors());
app.use(express.json());

// ── Database Pool ──
const isLocal = process.env.DATABASE_URL && 
                (process.env.DATABASE_URL.includes("localhost") || 
                 process.env.DATABASE_URL.includes("127.0.0.1"));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false } 
});

// Middleware ตรวจสอบ Token
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Unauthorized: No token' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    console.error("JWT Verify Error:", e.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/* ============================================================
    🌐 API Routes (แก้ไขแล้ว: ตัดตัวที่ซ้ำออก)
   ============================================================ */

// หน้าแรกเช็คสถานะ
app.get('/', (req, res) => {
  res.json({ service: "Activity Service", status: "Online 🟢" });
});

// 1. ดึงประวัติกิจกรรม (GET /api/activity/me)
app.get('/api/activity/me', requireAuth, async (req, res) => {
  try {
    // ใช้ sub จาก Token (ปกติจะเป็น User ID)
    const userId = req.user.sub || req.user.id;
    
    const result = await pool.query(
      `SELECT * FROM activities WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20`,
      [userId]
    );
    res.json({ activities: result.rows });
  } catch (err) {
    console.error("DB Query Error:", err.message);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// 2. บันทึกกิจกรรม (POST /api/activity/internal) - ใช้เรียกภายในระหว่าง Service
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
    console.error("DB Insert Error:", err.message);
    res.status(500).json({ error: 'Database insert error', details: err.message });
  }
});

/* ============================================================
    🚀 Start Server
   ============================================================ */
async function start() {
  try {
    await pool.query('SELECT 1'); 
    console.log('✅ [activity] DB Connected & Ready');
  } catch (err) {
    console.error('❌ [activity] DB Connection Failed:', err.message);
  }
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Activity Service running on port ${PORT}`);
  });
}

start();