const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db/db');
const { generateToken, verifyToken } = require('../middleware/jwtUtils');

const router = express.Router();

// Dummy hash สำหรับ timing-safe compare
const DUMMY_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8y0R6VQwWi4KFOeFHrgb3R04QLbL7a';

/* ============================================================
    🌐 GET Routes (เพื่อให้แสดงผลบน Browser ได้ ไม่ขึ้นหน้าแดง)
   ============================================================ */

router.get('/register', (req, res) => {
  res.json({
    status: "Online 🟢",
    message: "Welcome to Auth API (Register Endpoint)",
    method_required: "POST",
    instruction: "Please use the Register form on the main page or send a POST request."
  });
});

router.get('/login', (req, res) => {
  res.json({
    status: "Online 🟢",
    message: "Welcome to Auth API (Login Endpoint)",
    method_required: "POST",
    instruction: "Please use the Login form on the main page or send a POST request."
  });
});

/* ============================================================
    🛠️ Helpers
   ============================================================ */

async function logToDB({ level, event, userId, ip, message, meta }) {
  try {
    // เพิ่ม ip_address ให้ตรงกับชื่อ column ในตาราง logs
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

async function logActivity(data) {
  const ACTIVITY_URL = process.env.ACTIVITY_SERVICE_URL || 'http://activity-service:3003';
  try {
    fetch(`${ACTIVITY_URL}/api/activity/internal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(err => console.warn('[Activity-Service] Unreachable'));
  } catch (e) {
    console.warn('[Activity-Service] fetch is not defined or failed');
  }
}

/* ============================================================
    🔌 POST Routes (ตัวประมวลผลจริง)
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

    logToDB({
      level: 'INFO', event: 'REGISTER_SUCCESS', userId: user.id, ip,
      message: `New user registered: ${user.username}`
    });

    logActivity({
      userId: user.id, username: user.username,
      eventType: 'USER_REGISTERED', entityType: 'user', entityId: user.id,
      summary: `${user.username} สมัครสมาชิกใหม่`
    });

    res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ', user });
  } catch (err) {
    console.error("🔥 REGISTER ERROR:", err.message);
    res.status(500).json({ error: 'Server error', debug: err.message }); 
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
    console.error("🔥 LOGIN ERROR:", err.message);
    res.status(500).json({ error: 'Server error', debug: err.message });
  }
});

module.exports = router;