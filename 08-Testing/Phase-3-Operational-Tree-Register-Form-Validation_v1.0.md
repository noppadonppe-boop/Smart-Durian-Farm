# Phase 3 Operational Tree Register Form Validation Report

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Passed — Source Ready; Deployment/Physical Validation Pending |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| Source of Truth | `00-Project-Management/Owner-Review-Addendum_Tree-Register-Operational-Data-Entry_2026-09-01.md`, `00-Project-Management/Decision-Log.md` (DEC-046), `06-System-Architecture/Phase-3-Tree-Register-QR-Architecture_v0.1.md`, `03-Tree-Data/Tree-Register-Data-Dictionary_v0.1.md` |

## 1. ขอบเขตที่ตรวจ

- หน้าจอเพิ่มตำแหน่งปลูกภาษาไทยแบบ 3 ส่วน
- เลือก Zone/Row เดิมและยืนยัน Zone/Row ใหม่พร้อมทิศทางการนับ
- Tag preview และการยืนยัน permanent Position identity
- ข้อมูล Planting Cycle, แหล่งต้นพันธุ์ และสถานะ `empty`
- GPS, ลำต้น, ทรงพุ่ม และความสูงแบบ all-or-none evidence
- การแก้ไขรอบปัจจุบันและการปลูกทดแทนด้วยฟอร์มชุดเดียวกัน
- การเก็บ measurement จาก Spreadsheet import ลง repository
- การแยก `exampleData=true/false` ตาม runtime/Farm และ Firestore Rules
- Responsive UI, build, performance และ offline-critical runtime

## 2. ผลการตรวจอัตโนมัติ

| รายการ | ผล |
|---|---|
| ESLint | ผ่าน — 0 warning/error |
| TypeScript strict typecheck | ผ่าน |
| Unit/UI test | ผ่าน — 23 files, 201 tests |
| Firebase Emulator/Rules test | ผ่าน — 8 files, 59 tests |
| Production build | ผ่าน — Vite/PWA build สำเร็จ |
| Initial JavaScript budget | ผ่าน — 332,004 / 350,000 bytes |
| Initial CSS budget | ผ่าน — 58,865 / 60,000 bytes |
| Total offline runtime budget | ผ่าน — 1,596,185 / 1,800,000 bytes |
| Offline external-runtime scan | ผ่าน — 71 local build files, ไม่พบ external runtime dependency |

## 3. ผล Browser/Responsive validation

ทดสอบผ่าน Local Mock adapter เพื่อยืนยัน UI โดยไม่เขียนข้อมูลจริง:

- ขนาด 390×844: ไม่มี horizontal overflow; document/main width 375 px ภายใน
  viewport 390 px
- ขนาด 320×800: ไม่มี horizontal overflow; document/main width 305 px ภายใน
  viewport 320 px
- หน้าแสดงหัวข้อ `เพิ่มตำแหน่งปลูก` และปุ่ม `บันทึกตำแหน่งปลูก`
- กรอกลำดับ 3 ใน DEMO-F01/Z01/R01 แล้ว Tag preview เป็น
  `DEMO-F01-Z01-R01-T003`
- เปลี่ยนสถานะจาก `ไม่มีต้น` เป็น `ปกติ` แล้วช่องพันธุ์และแหล่งต้นพันธุ์เปิดใช้
- เปิดกลุ่ม GPS แล้วแสดง latitude, longitude, accuracy, method, measuredAt,
  measuredBy, confidence และ source ครบ
- เลือกลงทะเบียน Zone/Row ใหม่แล้วแสดงช่องยืนยัน topology และทิศทางการนับ
- ไม่พบ browser console warning/error หลังแก้ code-splitting

## 4. Security/consistency evidence

- Firebase Production repository สร้าง `exampleData=false` เฉพาะเมื่อ Farm
  ปัจจุบันเป็น Farm จริง; Farm จำลองถูกบังคับเป็น `exampleData=true`
- Phase 2 repository อ่าน Farm ที่ trusted provisioning กำหนดเป็น
  `classification=OPERATIONAL`/`exampleData=false` เป็น `isMock=false` และการแก้
  Farm Profile ยังคง classification เดิมตลอด transaction/audit
- Mock repository และ Firebase Emulator ไม่สามารถสร้าง operational classification
- Rules บังคับ classification เดียวกันระหว่าง Position, Cycle, Event, Tag และ Route
- Rules ปฏิเสธ Cross-Farm, การใช้ Tag ซ้ำ และ measurement group ที่กรอกไม่ครบ
- Status `empty` ถูกปฏิเสธเมื่อมีพันธุ์ ปีปลูก แหล่งต้นพันธุ์ หรือค่าการวัดต้น
- การ import GPS/ลำต้น/ทรงพุ่ม/ความสูงถูกแปลงเป็น typed baseline measurements
  และส่งต่อถึง repository แทนการคงอยู่เฉพาะ preview/raw row

## 5. Residual risks / รายการยังเปิด

1. Source รุ่นนี้ยังไม่ได้ Deploy ไป Firebase Hosting/Firestore Production
2. ต้อง trusted-provision/ยืนยัน Farm จริง (`classification=OPERATIONAL`,
   `isMock=false`), Organization/Farm membership, Farm code, Zone/Row และทิศทาง
   การนับก่อนกรอกข้อมูลภาคสนาม; หน้าเพิ่มสวนเดิมยังสร้าง Farm จำลอง
3. Firebase Storage และรูปจริงยังไม่พร้อม; UI จงใจแสดงว่า Deferred
4. Physical Device/Field Validation, กล้อง/QR, permanent tag และ PA-2 ยังไม่ผ่าน
5. `plantSource` และ `rowCountingDirection` ยังเป็น direct-form-only ในแม่แบบ
   Spreadsheet 49 คอลัมน์; รอ Owner ตัดสิน schema รุ่นถัดไป

## 6. Acceptance result

ผลตรวจด้าน source, domain, repository, Rules, build, offline และ responsive UI
**ผ่าน** สำหรับการเตรียม limited operational Tree Register ตาม DEC-046

ผลนี้ไม่ใช่ deployment evidence และไม่เปลี่ยน Physical Device/Field Validation,
Storage/รูปจริง, QR/ป้ายถาวร, PA-2 หรือ broader Production rollout เป็น Passed
