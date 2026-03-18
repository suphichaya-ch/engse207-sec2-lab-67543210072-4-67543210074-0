require('dotenv').config();
console.log("🔥 [auth] NEW VERSION LOADED - Ready for Docker/Railway");

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Database Pool (ปรับปรุงเรื่อง SSL ให้รัน Local ได้) ──
const isLocal = process.env.DATABASE_URL && 
               (process.env.DATABASE_URL.includes("localhost") || 
                process.env.DATABASE_URL.includes("auth-db") || 
                process.env.DATABASE_URL.includes("127.0.0.1"));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false } // ถ้าไม่ใช่ Local (เป็น Railway) ให้ใช้ SSL
});

pool.on('error', (err) => {
  console.error('[PostgreSQL] Unexpected error on idle client', err);
});

app.use(cors());
app.use(express.json());

/* =========================
    📄 HTML UI (Register & Login)
========================= */
app.get(['/', '/register.html', '/login.html'], (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <title>Auth Service - Access Control</title>
        <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #0f172a; color: white; }
            .card { background: #1e293b; padding: 40px; border-radius: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); width: 350px; text-align: center; border: 1px solid #334155; }
            h2 { color: #a855f7; margin-bottom: 20px; }
            .tabs { display: flex; justify-content: space-around; margin-bottom: 20px; cursor: pointer; border-bottom: 1px solid #334155; }
            .tab { padding: 10px; color: #94a3b8; font-weight: bold; }
            .tab.active { color: #a855f7; border-bottom: 2px solid #a855f7; }
            input { width: 100%; margin: 10px 0; padding: 12px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: white; box-sizing: border-box; outline: none; }
            button { width: 100%; padding: 12px; margin-top: 15px; background: #8a2be2; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.3s; }
            button:hover { background: #9333ea; }
            #msg { margin-top: 15px; font-size: 14px; min-height: 20px; }
            .err { color: #f87171; }
            .ok { color: #4ade80; }
            #loginForm { display: none; }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="tabs">
                <div id="regTab" class="tab active" onclick="showForm('register')">สมัครสมาชิก</div>
                <div id="loginTab" class="tab" onclick="showForm('login')">เข้าสู่ระบบ</div>
            </div>
            <div id="registerForm">
                <h2>📝 Register</h2>
                <input id="regUser" placeholder="Username">
                <input id="regEmail" placeholder="Email">
                <input id="regPass" type="password" placeholder="Password">
                <button onclick="handleAuth('register')">Sign Up</button>
            </div>
            <div id="loginForm">
                <h2>🔑 Login</h2>
                <input id="loginEmail" placeholder="Email">
                <input id="loginPass" type="password" placeholder="Password">
                <button onclick="handleAuth('login')">Sign In</button>
            </div>
            <div id="msg">กรุณากรอกข้อมูล</div>
        </div>
        <script>
            function showForm(type) {
                document.getElementById('registerForm').style.display = type === 'register' ? 'block' : 'none';
                document.getElementById('loginForm').style.display = type === 'login' ? 'block' : 'none';
                document.getElementById('regTab').className = type === 'register' ? 'tab active' : 'tab';
                document.getElementById('loginTab').className = type === 'login' ? 'tab active' : 'tab';
            }
            async function handleAuth(type) {
                const msg = document.getElementById('msg');
                let payload = {}, url = '';
                if (type === 'register') {
                    payload = { username: document.getElementById('regUser').value, email: document.getElementById('regEmail').value, password: document.getElementById('regPass').value };
                    url = '/api/auth/register';
                } else {
                    payload = { email: document.getElementById('loginEmail').value, password: document.getElementById('loginPass').value };
                    url = '/api/auth/login';
                }
                msg.innerText = "กำลังประมวลผล...";
                try {
                    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    const data = await res.json();
                    msg.innerText = res.ok ? "✅ " + (data.message || "สำเร็จ!") : "❌ " + (data.error || "เกิดข้อผิดพลาด");
                    msg.className = res.ok ? "ok" : "err";
                    if(res.ok && type === 'login' && data.token) localStorage.setItem('token', data.token);
                } catch { msg.innerText = "❌ เชื่อมต่อ API ล้มเหลว"; msg.className = "err"; }
            }
        </script>
    </body>
    </html>
  `);
});

/* =========================
    🔌 API & Routes
========================= */
app.use('/api/auth', authRouter);
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'auth' }));

/* =========================
    🚀 Start Server + Auto Migration
========================= */
async function start() {
  let retries = 10;
  while (retries > 0) {
    try {
      const client = await pool.connect();
      console.log("✅ [auth] DB Connected Successfully");

      // Auto Create Tables
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role VARCHAR(20) DEFAULT 'member',
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS logs (
          id SERIAL PRIMARY KEY,
          level VARCHAR(20) NOT NULL,
          event VARCHAR(100) NOT NULL,
          user_id INTEGER,
          message TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
        -- Seed Admin
        INSERT INTO users (username, email, password_hash, role)
        VALUES ('admin', 'admin@lab.local', '$2b$10$ZFSu9jujm16MjmDzk3fIYO36TyW7tNXJl3MGQuDkWBoiaiNJ2iFca', 'admin')
        ON CONFLICT (username) DO NOTHING;
      `);
      
      client.release();
      break;
    } catch (err) {
      console.log(`[auth] Waiting DB... (${retries} left) - ${err.message}`);
      retries--;
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  if (retries === 0) {
    console.error("❌ DB connection failed. Exit.");
    process.exit(1);
  }

  app.listen(PORT, '0.0.0.0', () => console.log(`🚀 [auth-service] Running on :${PORT}`));
}

start();

module.exports = { pool };