# ── Base image ──
FROM node:18-alpine

# ── Set working directory ──
WORKDIR /app

# ── Copy package.json และ package-lock.json เพื่อ npm install ──
COPY package*.json ./
RUN npm install --production

# ── Copy โค้ดทั้งหมดของ activity-service ──
COPY . .

# ── Expose port (Railway จะ override ได้) ──
EXPOSE 3003

# ── Start server ──
CMD ["node", "src/index.js"]