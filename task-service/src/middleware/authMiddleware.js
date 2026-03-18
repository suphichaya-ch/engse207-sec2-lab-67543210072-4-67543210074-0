const { verifyToken } = require('./jwtUtils');

module.exports = function requireAuth(req, res, next) {
  // 1. ดึง Token จาก Header Authorization
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  // 2. ถ้าไม่มี Token ให้ปฏิเสธการเข้าถึงทันที
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    // 3. ตรวจสอบความถูกต้องของ Token (จะได้ Payload: { sub, email, role, username })
    const decoded = verifyToken(token);
    req.user = decoded; 
    next(); // ผ่านด่าน! ไปทำงานใน Controller/Route ต่อได้
  } catch (err) {
    // 4. กรณี Token ผิดพลาด (หมดอายุ หรือ ปลอม)
    // ส่ง Log ไปที่ Log Service (Fire-and-forget: ไม่ต้องรอผลลัพธ์)
    fetch('http://log-service:3003/api/logs/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: 'task-service', 
        level: 'ERROR', 
        event: 'JWT_INVALID',
        ip_address: req.headers['x-real-ip'] || req.ip,
        message: 'Invalid JWT: ' + err.message,
        meta: { error: err.message }
      })
    }).catch(() => {
      // ถ้า Log service ล่ม ก็ปล่อยผ่าน ไม่ให้ระบบหลักค้าง
    });

    return res.status(401).json({ error: 'Unauthorized: ' + err.message });
  }
};