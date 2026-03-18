const jwt = require('jsonwebtoken');

// ใช้ Secret จาก Environment หรือค่า Default (ต้องตรงกันทุก Service)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// 1. ฟังก์ชันสร้าง Token (ตัวที่หายไป)
const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

// 2. ฟังก์ชันตรวจสอบ Token (Middleware)
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // เก็บข้อมูล user ไว้ใน request
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

module.exports = { generateToken, verifyToken };