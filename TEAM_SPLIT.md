# TEAM_SPLIT.md

## ข้อมูลกลุ่ม
- **กลุ่มที่:** [ระบุเลขกลุ่ม]
- **รายวิชา:** ENGSE207 Software Architecture

## รายชื่อสมาชิก
| รหัสนักศึกษา | ชื่อ-นามสกุล |
|---------------|---------------|
| 67543210074-0 | นางสาว สุพิชญา ชื่นจุม |
| 67543210072-4 | นายวรวัฒน์ จันทร์เที่ยง |

## การแบ่งงานหลัก

### สมาชิกคนที่ 1: นางสาว สุพิชญา ชื่นจุม
**รับผิดชอบงานหลักดังต่อไปนี้**
- **Service / Module:** Auth Service, Task Service, Activity Service
- **หน้าที่:**
  - ปรับปรุง Codebase ของ Register และ Activity Service
  - พัฒนาและปรับปรุงฟังก์ชัน `logActivity()`
  - ทดสอบระบบบน Local environment
  - Deploy Services + Database (auth-db, task-db, activity-db) บน Railway
  - จัดทำ README

### สมาชิกคนที่ 2: นายวรวัฒน์ จันทร์เที่ยง
**รับผิดชอบงานหลักดังต่อไปนี้**
- **Service / Module:** Frontend, Gateway
- **หน้าที่:**
  - ปรับแต่ง Frontend configuration
  - วางแผนและจัดการ Gateway Strategy
  - ทดสอบระบบแบบ End-to-End
  - จัดทำ TEAM_SPLIT, INDIVIDUAL_REPORT พร้อม Screenshots
  - Push โค้ดขึ้น Repository

## งานที่ดำเนินการร่วมกัน
- ออกแบบ Architecture Diagram และวางโครงสร้างระบบ
- ทดสอบระบบบางส่วนแบบ End-to-End
- จัดทำ README และ Screenshots สำหรับการนำเสนอ (ยังไม่สมบูรณ์เต็มรูปแบบ)

## เหตุผลในการแบ่งงาน
- แบ่งงานตาม service boundary และความเชี่ยวชาญ
- สุพิชญาเน้นด้าน Backend, Database และ Deployment
- วรวัฒน์เน้นด้าน Frontend, Integration และ Testing

## สรุปการเชื่อมโยงงานของสมาชิก
- งานของ Backend (Auth, Task, Activity Service) มีการเชื่อมต่อกับ Frontend ผ่าน Gateway บางส่วนแล้ว
- การทดสอบ End-to-End ทำได้บางขั้นตอน แต่ยังไม่ครบทุกฟีเจอร์
- การ Deploy และ Configuration ดำเนินการสำเร็จบาง Service ส่วนบางจุดยังต้องปรับปรุงให้เรียบร้อย