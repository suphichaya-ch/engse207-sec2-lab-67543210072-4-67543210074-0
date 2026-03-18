const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db/db');
const { generateToken, verifyToken } = require('../middleware/jwtUtils');

const router = express.Router();

const DUMMY_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8y0R6VQwWi4KFOeFHrgb3R04QLbL7a';

/* ============================================================
    🌐 GET Routes
   ============================================================ */

router.get('/register', (req, res) => {
  res.json({ status: "Online 🟢", message: "Welcome to Auth API (Register)" });
});

router.get('/login', (req, res) => {
  res.json({ status: "Online 🟢", message: "Welcome to Auth API (Login)" });
});

// ดึงข้อมูลตัวเอง (ตรวจสอบว่า verifyToken ทำงานได้ไหม)
router.get('/me', verifyToken, (req, res) => {
  try {
    res.json({ 
      status: "Online 🟢",
      message: "ตรวจสอบข้อมูลสำเร็จ",
      user: req.user 
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Error in /me route" });
  }
});

router.get('/health', (req, res) => {
  res.json({ status: "ok", service: "auth-service" });
});

/* ============================================================
    🛠️ Helpers (ปรับปรุงเพื่อกัน Error 500)
   ============================================================ */

async function logToDB({ level, event, userId, ip, message, meta }) {
  try {
    if (!pool) return;
    await pool.query(
      `INSERT INTO logs (level, event, user_id, ip_address, message, meta)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [level, event, userId || null, ip || null, message || null, 
       meta ? JSON.stringify(meta) : null]
    );
  } catch (err) {
    console.error('[auth-db-log] Error:', err.message);
  }
}

// ปรับปรุง logActivity ให้ไม่พังถ้า fetch ไม่มีหรือ Service ปลายทางปิดอยู่
async function logActivity(data) {
  const ACTIVITY_URL = process.env.ACTIVITY_SERVICE_URL || 'https://activity-srevice-production.up.railway.app';
  
  try {
    // ใช้ dynamic import สำหรับ node-fetch ถ้า fetch ปกติไม่มี
    const fetchMethod = global.fetch || require('node-fetch'); 
    
    fetchMethod(`${ACTIVITY_URL}/api/activity/internal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(err => console.warn('[Activity-Service] Unreachable:', err.message));
  } catch (e) {
    console.warn('[Activity-Service] Logging failed silently');
  }
}

/* ============================================================
    🔌 POST Routes
   ============================================================ */

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.ip;

  if (!username || !email || !password)
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });

  try {
    const exists = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email.toLowerCase().trim(), username.trim()]
    );
    if (exists.rows.length > 0)
      return res.status(409).json({ error: 'Email หรือ Username ถูกใช้งานแล้ว' });

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, 'member') RETURNING id, username, email, role`,
      [username.trim(), email.toLowerCase().trim(), hash]
    );
    const user = result.rows[0];

    logToDB({ level: 'INFO', event: 'REGISTER_SUCCESS', userId: user.id, ip, message: `New user: ${user.username}` });
    logActivity({ userId: user.id, username: user.username, eventType: 'USER_REGISTERED', summary: `${user.username} สมัครสมาชิกใหม่` });

    res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ', user });
  } catch (err) {
    res.status(500).json({ error: 'Server error during registration', debug: err.message }); 
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.ip;

  if (!email || !password)
    return res.status(400).json({ error: 'กรุณากรอก email และ password' });

  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    const result = await pool.query(
      'SELECT id, username, email, password_hash, role FROM users WHERE email = $1',
      [normalizedEmail]
    );
    
    const user = result.rows[0] || null;
    const hash = user ? user.password_hash : DUMMY_HASH;
    const isValid = await bcrypt.compare(password, hash);

    if (!user || !isValid) {
      logToDB({ level: 'WARN', event: 'LOGIN_FAILED', ip, message: `Failed: ${normalizedEmail}` });
      return res.status(401).json({ error: 'Email หรือ Password ไม่ถูกต้อง' });
    }

    const token = generateToken({ sub: user.id, email: user.email, role: user.role, username: user.username });

    logToDB({ level: 'INFO', event: 'LOGIN_SUCCESS', userId: user.id, ip, message: `In: ${user.username}` });
    logActivity({ userId: user.id, username: user.username, eventType: 'USER_LOGIN', summary: `${user.username} เข้าสู่ระบบ` });

    res.json({ message: 'Login สำเร็จ', token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Server error during login', debug: err.message });
  }
});

module.exports = router;