require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const tasksRouter = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 3002;

// ── Database Pool (ปรับปรุง SSL ให้รองรับ Docker Network) ──
const isLocal = process.env.DATABASE_URL && 
               (process.env.DATABASE_URL.includes("localhost") || 
                process.env.DATABASE_URL.includes("task-db") || 
                process.env.DATABASE_URL.includes("127.0.0.1"));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false }, // ถ้าไม่ใช่ Local (เช่น Railway) ให้เปิด SSL
  max: 10,
  idleTimeoutMillis: 30000
});

// จัดการ error กรณี client หลุด
pool.on('error', (err) => {
  console.error('[PostgreSQL] Unexpected error on idle client', err);
});

app.use(cors());
app.use(express.json());

/* =========================
    🌐 UI หน้า Status (Modern Look)
========================= */
app.get('/', (req, res) => {
  res.send(`
    <html>
    <head><title>Task Service</title></head>
    <body style="background:#064e3b; color:white; text-align:center; padding-top:100px; font-family:sans-serif; margin:0;">
      <div style="background:rgba(0,0,0,0.2); display:inline-block; padding:40px; border-radius:20px; border:1px solid #059669;">
        <h1 style="margin:0; font-size:32px;">🟢 Task Service ONLINE</h1>
        <p style="opacity:0.8; margin-top:10px;">Port: ${PORT}</p>
        <hr style="border:0; border-top:1px solid #059669; margin:20px 0;">
        <p>API Endpoint: <code style="background:#022c22; padding:5px 10px; border-radius:5px;">/api/tasks</code></p>
        <p>Status: <span style="color:#34d399;">Database Connected ✅</span></p>
      </div>
    </body>
    </html>
  `);
});

/* =========================
    ❤️ Health Check
========================= */
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'task' }));

/* =========================
    🔌 API Routes
========================= */
// ส่ง pool ไปให้ router ใช้งานผ่าน middleware หรือวิธีอื่น (หรือใช้ Export ตามปกติ)
app.use('/api/tasks', tasksRouter);

/* =========================
    🚀 Start Server + Auto Migration
========================= */
async function start() {
  let retries = 10;
  while (retries > 0) {
    try {
      // ใช้ client.connect เพื่อความชัวร์ในการเช็คสถานะ
      const client = await pool.connect();
      console.log("✅ [task] Database Connected & Ready");

      // สร้าง table tasks และ index ถ้ายังไม่มี
      await client.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          completed BOOLEAN DEFAULT false,
          user_id INTEGER, -- เพิ่มไว้รองรับการระบุเจ้าของ task
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
      `);

      client.release(); // คืน connection ให้ pool
      break; 
    } catch (err) {
      console.log(`[task] Waiting DB... (${retries} left) - ${err.message}`);
      retries--;
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  if (retries === 0) {
    console.error("❌ [task] DB connection failed. Exit.");
    process.exit(1);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [task-service] Running on Port :${PORT}`);
  });
}

start();

// ส่งออก pool เพื่อให้ในไฟล์ routes/tasks.js สามารถ require('{ pool }') ไปใช้ได้
module.exports = { pool };