require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { pool } = require('./db/db');
const tasksRouter = require('./routes/tasks');

const app  = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// --- ส่วนที่เพิ่มใหม่: หน้า UI สำหรับเช็คสถานะ Task Service บนเว็บ ---
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Task Service Status</title>
        <style>
            body { font-family: sans-serif; background: #064e3b; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .status-card { background: #065f46; padding: 2rem; border-radius: 1rem; box-shadow: 0 10px 25px rgba(0,0,0,0.3); text-align: center; border: 1px solid #059669; width: 350px; }
            .dot { height: 12px; width: 12px; background-color: #34d399; border-radius: 50%; display: inline-block; margin-right: 8px; animation: blink 1.5s infinite; }
            @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
            code { background: #000; padding: 2px 6px; border-radius: 4px; color: #6ee7b7; }
        </style>
    </head>
    <body>
        <div class="status-card">
            <h1><span class="dot"></span> Task Service</h1>
            <p>สถานะ: <code>ONLINE</code></p>
            <p>Port: <code>${PORT}</code></p>
            <hr style="border: 0; border-top: 1px solid #059669; margin: 20px 0;">
            <p style="font-size: 0.9rem;">API Endpoint: <code>/api/tasks</code></p>
        </div>
    </body>
    </html>
  `);
});

app.use('/api/tasks', tasksRouter);

async function start() {
  let retries = 10;
  while (retries > 0) {
    try { 
      await pool.query('SELECT 1'); 
      console.log('[task] DB Connected Successfully');
      break; 
    }
    catch (e) {
      console.log(`[task] Waiting DB... (${retries} left)`);
      retries--;
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  app.listen(PORT, () => console.log(`[task-service] Running on :${PORT}`));
}
start();