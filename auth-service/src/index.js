require('dotenv').config();
console.log("🔥 NEW VERSION LOADED");
const express = require('express');
const cors    = require('cors');
const { pool } = require('./db/db');
const authRouter = require('./routes/auth');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

/* =========================
   📄 HTML Register Page
========================= */
const registerPage = `
<!DOCTYPE html>
<html>
<head>
    <title>Auth Service - Register</title>
    <style>
        body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #1a1a1a; color: white; }
        .card { background: #2d2d2d; padding: 30px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); width: 320px; text-align: center; }
        input { width: 100%; margin: 10px 0; padding: 12px; border-radius: 6px; border: 1px solid #444; background: #3d3d3d; color: white; box-sizing: border-box; }
        button { width: 100%; padding: 12px; margin-top: 10px; background: #8a2be2; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
        #msg { margin-top: 15px; color: #d8b4fe; font-size: 14px; }
    </style>
</head>
<body>
    <div class="card">
        <h2>📝 สมัครสมาชิก (Auth)</h2>
        <input type="text" id="username" placeholder="Username">
        <input type="email" id="email" placeholder="Email">
        <input type="password" id="password" placeholder="Password">
        <button onclick="doRegister()">สมัครสมาชิก</button>
        <div id="msg">พร้อมเชื่อมต่อระบบ</div>
    </div>

    <script>
        async function doRegister() {
            const user = document.getElementById('username').value;
            const mail = document.getElementById('email').value;
            const pass = document.getElementById('password').value;
            const msg = document.getElementById('msg');
            
            if(!user || !mail || !pass) {
                msg.innerText = "กรุณากรอกข้อมูลให้ครบทุกช่อง";
                return;
            }

            msg.innerText = "กำลังส่งข้อมูล...";
            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: user, email: mail, password: pass })
                });

                const data = await res.json();

                if (res.ok) {
                    msg.innerText = "✅ สมัครสำเร็จ!";
                    document.getElementById('username').value = '';
                    document.getElementById('email').value = '';
                    document.getElementById('password').value = '';
                } else {
                    msg.innerText = "❌ " + (data.error || "สมัครไม่สำเร็จ");
                }
            } catch (err) {
                msg.innerText = "❌ เชื่อมต่อ API ล้มเหลว";
            }
        }
    </script>
</body>
</html>
`;

/* =========================
   🌐 Routes
========================= */

// หน้าแรก → redirect ไป register.html
app.get('/', (req, res) => {
  res.redirect('/register.html');
});

// หน้า register จริง
app.get('/register.html', (req, res) => {
  res.send(registerPage);
});

/* =========================
   🔌 API
========================= */
app.use('/api/auth', authRouter);

/* =========================
   ❤️ Health Check
========================= */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth' });
});

/* =========================
   🚀 Start Server
========================= */
async function start() {
  let retries = 10;

  while (retries > 0) {
    try { 
      await pool.query('SELECT 1'); 
      console.log('[auth] Database Connected!');
      break; 
    } catch (e) {
      console.log('[auth] Waiting DB... (' + retries + ' left)');
      retries--;
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  if (retries === 0) {
    console.error('[auth] DB connection failed ❌');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log('[auth-service] Running on :' + PORT);
  });
}

start();