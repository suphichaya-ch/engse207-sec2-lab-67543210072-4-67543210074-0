const { Pool } = require('pg');

const isLocal = process.env.DATABASE_URL && 
               (process.env.DATABASE_URL.includes("localhost") || 
                process.env.DATABASE_URL.includes("127.0.0.1"));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // 🟢 จุดสำคัญ: ถ้าไม่ใช่เครื่องตัวเอง (เป็น Railway) ให้เปิด SSL
  ssl: isLocal ? false : { rejectUnauthorized: false }
});

module.exports = { pool };