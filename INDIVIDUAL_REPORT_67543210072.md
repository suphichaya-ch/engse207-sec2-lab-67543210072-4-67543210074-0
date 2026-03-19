# INDIVIDUAL_REPORT_67543210072-4.md

## ข้อมูลผู้จัดทำ
- **ชื่อ-นามสกุล:** นายวรวัฒน์ จันทร์เที่ยง
- **รหัสนักศึกษา:** 67543210072-4
- **กลุ่ม:** [7]

## ขอบเขตงานที่รับผิดชอบ
- Frontend pages และ configuration
- Gateway Strategy และ integration
- End-to-End testing
- TEAM_SPLIT.md, INDIVIDUAL_REPORT และ Screenshots
- Push โค้ดขึ้น Repository

## สิ่งที่ได้ดำเนินการด้วยตนเอง
- ปรับแต่ง Frontend configuration และเชื่อมต่อ API กับ Backend
- วางแผนและจัดการ Gateway Strategy สำหรับการเรียก Service ต่าง ๆ
- ทดสอบระบบแบบ End-to-End ระหว่าง Frontend และ Backend
- จัดทำ TEAM_SPLIT, INDIVIDUAL_REPORT และ Screenshots
- Push โค้ดและตรวจสอบ version control

## ปัญหาที่พบและวิธีการแก้ไข
1. **Frontend เรียก API ไม่เจอ Backend บาง Service**  
   - วิธีแก้: ตรวจสอบ URL และ port ของ Gateway และแก้ configuration ใน Frontend  
2. **End-to-End testing ไม่สมบูรณ์**  
   - วิธีแก้: ทดสอบทีละฟีเจอร์และบันทึกผลการทดสอบเพื่อสื่อสารกับสมาชิกทีม

## สิ่งที่ได้เรียนรู้จากงานนี้
- การออกแบบและจัดการ Gateway Strategy ทำให้ Frontend เรียก API หลาย Service ได้อย่างถูกต้อง  
- การทำงานร่วมกับ Backend และ Database ต้องประสานกันเพื่อให้ End-to-End flow สมบูรณ์  
- การจัดทำเอกสารและ Screenshots เป็นสิ่งสำคัญสำหรับการสื่อสารทีมและการตรวจสอบ

## แนวทางการพัฒนาต่อไปใน Set 2
- ปรับ Frontend ให้มีฟีเจอร์ครบทุก API ของ Backend  
- เพิ่ม automated testing สำหรับ End-to-End flow  
- ปรับปรุง integration ระหว่าง Gateway และ Service ให้เสถียรและง่ายต่อการ deploy