require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path'); // เพิ่มตรงนี้
const { pool } = require('./db/db');
const authRouter = require('./routes/auth');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- ส่วนที่เพิ่มใหม่: บอกให้ Express ส่งไฟล์หน้าเว็บที่อยู่ในโฟลเดอร์ public ---
app.use(express.static(path.join(__dirname, '../public')));

// หน้าแรกของเว็บ (จะโชว์ข้อความนี้ถ้าหาไฟล์ index.html ไม่เจอ)
app.get('/', (req, res) => {
  res.send(`
    <div style="text-align:center; margin-top:50px; font-family: sans-serif;">
      <h1>🔐 Auth Service is Online</h1>
      <p>API is ready at <code>/api/auth</code></p>
      <a href="/register.html" style="color: blue;">Go to Register Page</a>
    </div>
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