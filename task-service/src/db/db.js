// activity-service/src/db/db.js
require('dotenv').config();
const { Pool } = require('pg');

// ตรวจสอบ DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL is not defined in .env');
}

// Pool สำหรับเชื่อม PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
       ? { rejectUnauthorized: false } // Cloud / Railway
       : false                        // Local / Docker
});

// จัดการ Error กรณี Client หลุด
pool.on('error', (err) => {
  console.error('[PostgreSQL] Unexpected error on idle client', err);
});

module.exports = { pool };