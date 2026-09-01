# Firebase Production Firestore Connection — Validation Report

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Conditional Passed — Firestore Connected/Rules Deployed; Owner OTP Seed Pending |
| เจ้าของเอกสาร | Project Owner |
| วันที่ตรวจ | 2026-09-01 |
| Source of Truth | AGENTS.md v3.6, DEC-041, Firebase Production Shared Root Architecture v1.0 |

## 1. ผลลัพธ์

- ตรวจพบ Cloud Firestore `(default)` ของ project `durian-smartfarm`
- Deploy `firestore.rules` และ `firestore.indexes.json` สำเร็จ
- Web App production build ใช้ Firebase Auth/Firestore จริงโดยไม่เชื่อม Emulator
- หน้า Login แสดง `Firebase Authentication + Firestore Production` และไม่มี
  console error หรือจอขาว
- Full deterministic seed harness ผ่าน 127 records/6 modules บน Emulator path ใหม่
- Production Seed พร้อมเขียน 124 Firestore records; placeholder Storage 3 ไฟล์ถูกข้าม
  จนกว่า Storage จะ provision

## 2. ผลตรวจอัตโนมัติ

| รายการ | ผล |
|---|---|
| ESLint | ผ่าน |
| TypeScript strict | ผ่าน |
| Unit/component | ผ่าน 171/171 ใน 20 files |
| Firestore/Auth/Storage Emulator Rules | ผ่าน 49/49 ใน 8 files |
| Full modular seed verification | ผ่าน 127 records ใน 6 modules |
| Production/PWA build | ผ่าน |
| Browser production login/white-screen smoke | ผ่าน; 0 console errors |
| Firestore Production Rules/Indexes deploy | ผ่าน |
| Storage Rules deploy | Blocked — Firebase Storage ยังไม่ Get Started |
| End-user Production Seed/readback | Pending — ต้องใช้ Owner Phone OTP |

## 3. Security Evidence

- Data root คือ `durian-smartfarm/root`
- Operational records ยังคงแยก Organization/Farm และไม่แยก User folder
- Seed Owner ตรวจด้วย immutable UID ใน root document
- Seed bypass ใช้ได้เฉพาะ record ที่มี seed batch marker และ `exampleData=true`
- Cross-Farm/role/negative-stock/wrong-tree tests ผ่านครบ
- Anonymous ไม่มี Seed/Admin และไม่มีสิทธิ์อ่าน/เขียนจนกว่าจะมี membership ที่อนุมัติ

## 4. ข้อจำกัดและขั้นตอนปิดงาน

การสร้าง root จริงต้องให้ Project Owner ยืนยัน Phone Auth/OTP ด้วยตนเอง แล้วกดปุ่ม
Seed บนหน้า No-Farm หรือหน้าหลัก ระบบจึงจะเขียนข้อมูลและอ่าน membership กลับด้วย
Firebase UID จริง ห้ามผู้พัฒนาสร้าง Owner UID แทนเพราะจะทำให้สิทธิ์ถาวรผูกผิดคน

Firebase Storage ต้องให้ Owner เปิดจาก Console ก่อน จึงค่อย Deploy Storage Rules
และทดสอบรูป placeholder; ขั้นตอนนี้ไม่ block Firestore Database แต่ block flow รูป

## 5. Gate

- Gate 6: Passed — ไม่เปลี่ยน
- DEC-041 Firestore Production Mock Test: Approved / Infrastructure Passed
- Production end-user Seed: Pending Owner OTP
- Storage: Blocked ที่ one-time provisioning
- Real data/photo, Public Hosting, Controlled Pilot, PA-2 และ operational Production
  rollout: Not Approved
