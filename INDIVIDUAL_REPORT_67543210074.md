# INDIVIDUAL_REPORT_67543210074-0.md

## ข้อมูลผู้จัดทำ
- **ชื่อ-นามสกุล:** นางสาว สุพิชญา ชื่นจุม
- **รหัสนักศึกษา:** 67543210074-0
- **กลุ่ม:** [7]

## ขอบเขตงานที่รับผิดชอบ
- Auth Service, Task Service, Activity Service
- Database configuration (auth-db, task-db, activity-db)
- Backend logic, logActivity() function
- Deployment บน Railway และ Local testing
- จัดทำ README

## สิ่งที่ได้ดำเนินการด้วยตนเอง
- เขียนและปรับปรุง routes และ backend logic สำหรับ Register และ Activity Service
- พัฒนาและปรับปรุงฟังก์ชัน logActivity()
- ตั้งค่า Database connections และ environment variables
- ทดสอบระบบบน Local environment และตรวจสอบ integration เบื้องต้น
- Deploy Services และ Database บน Railway

## ปัญหาที่พบและวิธีการแก้ไข
1. **ปัญหา Database connection ไม่เสถียรบน Railway**  
   - วิธีแก้: ตรวจสอบ Environment Variables และใช้ Pool connection ของ PostgreSQL  
2. **บาง API ไม่ทำงานเมื่อเรียกจาก Frontend**  
   - วิธีแก้: ตรวจสอบ Gateway URL และ CORS configuration, ทดสอบ End-to-End

## สิ่งที่ได้เรียนรู้จากงานนี้
- การแยก Service อย่างชัดเจน (service separation) ทำให้ Backend แต่ละส่วนพัฒนาและทดสอบได้อิสระ  
- การจัดการ Environment Variables และ Database connection บน Cloud Platform เช่น Railway  
- การทำงานร่วมกับสมาชิกทีมด้าน Frontend และ Gateway เพื่อให้ API เชื่อมต่อได้สมบูรณ์  

## แนวทางการพัฒนาต่อไปใน Set 2
- แยกและปรับปรุง Activity Service ให้รองรับ logging ที่ละเอียดขึ้น  
- ปรับระบบ deployment ให้เป็นอัตโนมัติ และรวม CI/CD pipeline  
- เพิ่ม unit test สำหรับแต่ละ Service เพื่อความมั่นใจในการเปลี่ยนแปลง