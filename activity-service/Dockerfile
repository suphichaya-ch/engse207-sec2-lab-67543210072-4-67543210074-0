# activity-service/Dockerfile

# ใช้ Node.js 18 Alpine สำหรับขนาดเล็กและเร็ว
FROM node:18-alpine

# ตั้งค่า Working Directory
WORKDIR /app

# ก๊อปปี้เฉพาะไฟล์ package.json และ package-lock.json เพื่อใช้ cache layer
COPY package*.json ./

# ติดตั้ง dependencies สำหรับ production เท่านั้น
RUN npm install --production

# ก๊อปปี้โค้ดของ service เอง
COPY src/ ./src

# เปิดพอร์ตให้ตรงกับโค้ด (3003)
EXPOSE 3003

# ตั้งค่า NODE_ENV เป็น production
ENV NODE_ENV=production

# คำสั่งเริ่ม service
CMD ["node", "src/index.js"]