const { verifyToken } = require('./jwtUtils');

module.exports = async function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded; 
    next(); 
  } catch (err) {
    // 🚩 ส่วนนี้คือจุดที่มักจะทำแอปพัง (สีแดง) ถ้า Log Service มีปัญหา
    const logUrl = process.env.LOG_SERVICE_URL || 'http://localhost:3003';
    
    // หุ้มด้วย try-catch อีกชั้นเพื่อไม่ให้ error ของ fetch ทำแอปพัง
    try {
      if (typeof fetch !== 'undefined') {
        fetch(`${logUrl}/api/logs/internal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service: 'task-service', 
            level: 'ERROR', 
            event: 'JWT_INVALID',
            message: 'Invalid JWT: ' + err.message
          })
        }).catch(() => {}); // ignore fetch error
      }
    } catch (logErr) {
      console.error("Failed to send log:", logErr.message);
    }

    // ส่งคำตอบกลับไปหา User ทันที (ไม่ต้องรอส่ง log เสร็จ)
    return res.status(401).json({ error: 'Unauthorized: ' + err.message });
  }
};