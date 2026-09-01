# Firebase Live Phone Auth — Technical Validation

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.1 |
| สถานะ | LIMITED FIREBASE HOSTING DEPLOYED — READY FOR OWNER REAL SMS TEST |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| Source of Truth | DEC-010, DEC-038, DEC-040, DEC-042, `AGENTS.md` v3.7, Firebase Web Phone Auth documentation |

## ขอบเขต

- เชื่อม Firebase Phone Authentication จริงเฉพาะ Auth
- Data adapter ยังคง `mock`; ไม่อ่าน/เขียน Firestore/Storage ใน hosted build นี้
- หมายเลขจริงต้องอยู่ใน local allowlist ที่ไม่ถูก commit
- ผู้ผ่าน Auth ถูก map ไปยัง Mock Owner เพื่อเปิดข้อมูล `SIMULATED/TEST ONLY`
- รองรับเบอร์ไทย 10 หลักและแปลงเป็น E.164 `+66` ก่อนส่ง

## ผลตรวจ

- Firebase Console: Phone provider = Enabled
- Firebase Console: project plan = Blaze (`Pay as you go`) ยืนยันเมื่อ 2026-09-01
- Authorized domains: Firebase Hosting domains และ localhost มีอยู่ แต่เอกสาร Firebase
  ระบุว่า Phone Auth ไม่รองรับ `localhost` เป็น hosted domain สำหรับส่ง SMS จริง
- SMS region policy: Allow mode; Thailand ถูกเลือกแล้วจากการตรวจล่าสุด
- Owner อนุมัติ DEC-042 และ Deploy เฉพาะ Hosting สำเร็จเมื่อ 2026-09-01:
  `https://durian-smartfarm.web.app`
- Firebase CLI ยืนยัน upload/release สำเร็จ 60 files ด้วย `--only hosting`; คำสั่งนี้
  ไม่ Deploy Firestore Rules/Indexes หรือ Storage Rules
- lint: ผ่าน
- TypeScript strict: ผ่าน
- Phone Auth unit test: 20/20 ผ่าน
- Firebase live mode build: ผ่าน
- Browser UI: แสดงขอบเขต `Firebase Phone Auth จริง · Mock Data` ถูกต้อง
- Browser console: ไม่มี warning/error
- Fail-closed: เมื่อ allowlist ว่าง ระบบปฏิเสธก่อนเรียก Firebase และไม่ส่ง SMS
- Fail-closed: live mode บน `localhost`/`127.0.0.1` ถูกปฏิเสธพร้อมข้อความให้ใช้
  HTTPS hosted domain และ unknown Firebase error แสดงเฉพาะ error code ที่ปลอดภัย
- Privacy check: raw allowlist 6 entries มี occurrence ใน public `dist` = 0;
  browser bundle ใช้ PBKDF2 digest + random salt และ raw phone อยู่เฉพาะ ignored env
- Hosted browser: แสดง `Firebase Phone Auth จริง · Mock Data` ผ่าน HTTPS และไม่มี
  console warning/error

## Acceptance Criteria ที่ยังรอ

- Owner ยืนยัน action-time ให้ใช้หมายเลขที่ระบุเพื่อส่งให้ Google Firebase
- ส่ง SMS จริง 1 ครั้ง, ยืนยัน OTP และตรวจว่าเปิดได้เฉพาะ Mock Data
- บันทึกผล Usage/Auth user โดยไม่คัดลอกหมายเลขจริงลง repository

## ข้อจำกัด

DEC-042 อนุมัติเฉพาะ Hosting สำหรับ Auth test และไม่อนุมัติ Firestore/Storage deploy
เพิ่มในคำสั่งนี้ ผลนี้ไม่ใช่ PA-2, Production, real farm data หรือ Physical/Field
Validation และไม่ปลด DEC-038 นอก carve-out ของ DEC-040/042
