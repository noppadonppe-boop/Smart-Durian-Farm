# การกู้คืนหน้าเมื่อไฟล์แอปรุ่นเก่าโหลดไม่ได้

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| เจ้าของ | Project Owner |
| วันที่ | 2026-09-06 |
| สถานะ | ทดสอบและ Deploy Hosting สำเร็จ |
| Source | ภาพข้อผิดพลาด /trees จาก Owner หลังคำยืนยัน commit and deploy, DEC-051 |

## สาเหตุที่ตรวจพบ

ภาพเรียก `assets/TreesPage-BmCCwyYB.js` ซึ่งไม่มีใน release ปัจจุบัน ตรวจจาก Hosting ได้ HTTP 200 แต่ Content-Type เป็น text/html และเนื้อหาเป็น index.html จาก SPA fallback จึงใช้เป็น JavaScript module ไม่ได้ สอดคล้องกับแท็บเดิมที่ยังอ้างชื่อไฟล์ของ release เก่า ไม่ใช่หลักฐานว่าข้อมูลทะเบียนต้นสูญหาย

## การแก้ไข

- เพิ่ม root route ErrorBoundary แบบ eager เพื่อรับข้อผิดพลาดจาก lazy route และ provider
- แสดงคำแนะนำภาษาไทยและปุ่มโหลดหน้าใหม่แทน technical stack trace รองรับข้อความ module error ของ Chromium/Safari/Firefox
- ปุ่มตรวจ service worker update และรอ activation สูงสุด 5 วินาทีก่อน reload; update ล้มเหลวยัง reload ได้ และแสดงคำแนะนำเมื่อออฟไลน์
- ไม่ reload อัตโนมัติ ไม่ล้าง IndexedDB/ข้อมูลผู้ใช้ และแจ้งว่าข้อความที่ยังไม่บันทึกอาจหายเมื่อ reload
- แท็บที่โหลดโค้ดรุ่นเก่าก่อนแก้ไขต้อง refresh หนึ่งครั้งเพื่อรับ error boundary ใหม่

## หลักฐานและเกณฑ์ผ่าน

- Unit/component 4 tests ผ่าน: lazy route rejection, offline UI, browser error classification, service worker update failure/timeout
- ESLint และ TypeScript/production build ผ่าน มีคำเตือน chunk ขนาดใหญ่เดิม
- Chromium เปิด production build /trees โดย block TreesPage chunk: พบหัวข้อกู้คืนภาษาไทยและปุ่มโหลดหน้าใหม่จริง
- Firebase Hosting `durian-smartfarm` release complete; ตรวจ HTTP 200 และ SHA256 ของ index.html, sw.js และ member management bundles ตรงกับ build
- ไม่มี Firestore Rules หรือข้อมูลสมาชิก/ต้นไม้ถูกเปลี่ยนจากงานนี้; ไม่ใช่ physical iPad validation
