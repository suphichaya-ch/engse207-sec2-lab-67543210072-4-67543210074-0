# ENGSE207 Software Architecture — Final Lab Set 2

## วิชา
**ENGSE207 Software Architecture**  
**มหาวิทยาลัย:** มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา  

---

## 👥 สมาชิกในกลุ่ม

| Student ID | ชื่อ-นามสกุล | หน้าที่ |
|------------|---------------|---------|
| 67543210074-0 | นางสาว สุพิชญา ชื่นจุม | Backend / Deployment / Log Service / README |
| 67543210072-4 | นายวรวัฒน์ จันทร์เที่ยง | Frontend / Gateway / End-to-End Testing / Documentation / Push |

---

## 📌 Overview
ระบบเป็น **Microservices Task Management System** ประกอบด้วย:
- Auth Service
- Task Service
- Activity (Log) Service
- Frontend
- Nginx เป็น API Gateway รองรับ HTTPS
- JWT Authentication

---

## 🎯 Objectives
- ออกแบบระบบแบบ Microservices
- ใช้ HTTPS ด้วย Self-Signed Certificate
- ใช้ JWT Authentication
- บันทึก log การใช้งานระบบ
- ใช้ Docker Compose สำหรับจัดการ Service


## โครงสร้าง Repository
final-lab-sec2-set2-[student1]-[student2]/
├── README.md
├── TEAM_SPLIT.md
├── INDIVIDUAL_REPORT_[studentid].md
├── docker-compose.yml
├── .env.example
│
├── auth-service/
│   ├── Dockerfile
│   ├── package.json
│   ├── init.sql                    ← auth-db schema + seed users
│   └── src/
│       ├── index.js
│       ├── db/db.js
│       ├── middleware/jwtUtils.js
│       └── routes/auth.js          ← เพิ่ม /register + logActivity()
│
├── task-service/
│   ├── Dockerfile
│   ├── package.json
│   ├── init.sql                    ← task-db schema
│   └── src/
│       ├── index.js
│       ├── db/db.js
│       ├── middleware/authMiddleware.js
│       ├── middleware/jwtUtils.js
│       └── routes/tasks.js         ← เพิ่ม logActivity() ทุก CRUD
│
├── activity-service/               ← service ใหม่ทั้งหมด
│   ├── Dockerfile
│   ├── package.json
│   ├── init.sql                    ← activity-db schema
│   └── src/
│       ├── index.js
│       └── routes/activity.js
│
├── frontend/
│   ├── index.html                  ← ปรับจาก Set 1: เพิ่ม Register + ใช้ config.js
│   ├── activity.html               ← หน้าใหม่: ดู Activity Timeline
│   └── config.js                   ← Railway Service URLs
│
└── screenshots/
---

## 🏗️ Architecture Overview

Browser / Postman
│
│ HTTPS :443
▼
Nginx (API Gateway)
│
┌────┼─────────────┐
│ │ │
/api/auth → Auth Service
/api/tasks → Task Service
/api/logs → Activity/Log Service
/ → Frontend
│
▼
PostgreSQL

---

