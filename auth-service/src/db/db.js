const { Pool } = require('pg');

// ใช้ connectionString ตัวเดียวจะจัดการได้ง่ายกว่าและลดโอกาสสะกดผิดครับ
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// ตรวจสอบการเชื่อมต่อเบื้องต้น (Optional)
pool.on('error', (err) => {
  console.error('[PostgreSQL] Unexpected error on idle client', err);
});

module.exports = { pool };