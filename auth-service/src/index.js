require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { pool } = require('./db/db');
const authRouter = require('./routes/auth');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- แก้ใหม่: เข้าหน้าแรกปุ๊บ เจอหน้าสมัครสมาชิกทันที ไม่ต้องง้อไฟล์ public ---
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Auth Service - Register</title>
        <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #1a1a1a; color: white; }
            .card { background: #2d2d2d; padding: 30px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); width: 320px; text-align: center; }
            input { width: 100%; margin: 10px 0; padding: 12px; border-radius: 6px; border: 1px solid #444; background: #3d3d3d; color: white; box-sizing: border-box; }
            button { width: 100%; padding: 12px; margin-top: 10px; background: #8a2be2; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
            #msg { margin-top: 15px; color: #d8b4fe; }
        </style>
    </head>
    <body>
        <div class="card">
            <h2>📝 สมัครสมาชิก (Auth)</h2>
            <input type="text" id="user" placeholder="Username">
            <input type="password" id="pass" placeholder="Password">
            <button onclick="doRegister()">สมัครสมาชิก</button>
            <div id="msg">พร้อมเชื่อมต่อระบบ</div>
        </div>
        <script>
            async function doRegister() {
                const user = document.getElementById('user').value;
                const pass = document.getElementById('pass').value;
                const msg = document.getElementById('msg');
                msg.innerText = "กำลังส่งข้อมูล...";
                try {
                    const res = await fetch('/api/auth/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: user, password: pass })
                    });
                    const data = await res.json();
                    msg.innerText = data.message || "สำเร็จ!";
                } catch (err) { msg.innerText = "เชื่อมต่อ API ล้มเหลว"; }
            }
        </script>
    </body>
    </html>
  `);
});

app.use('/api/auth', authRouter);

async function start() {
  let retries = 10;
  while (retries > 0) {
    try { 
      await pool.query('SELECT 1'); 
      console.log('[auth] Database Connected!');
      break; 
    }
    catch (e) {
      console.log(`[auth] Waiting DB... (${retries} left)`);
      retries--;
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  app.listen(PORT, () => console.log(`[auth-service] Running on :${PORT}`));
}
start();