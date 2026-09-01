# Firebase Emulator Full Mock Seed — Validation Report

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Passed — Local/Firebase Emulator Only |
| เจ้าของเอกสาร | Project Owner |
| วันที่ตรวจ | 2026-09-01 |
| Source of Truth | AGENTS.md v3.4, KDOMS Development Mock Data and Pilot Knowledge v1.0.4, KDOMS Scope Knowledge v0.2, DEC-027, DEC-037, DEC-038 และ DEC-039 |

## 1. สรุปผล

สร้าง Full Mock Seed แบบ deterministic, resettable และแยกตามฟังก์ชันสำเร็จ
สำหรับ Firebase Authentication, Cloud Firestore และ Cloud Storage Emulator
ภายใต้ project จำลองคงที่ `demo-smart-durian` ข้อมูลทั้งหมดติดป้าย
`SIMULATED/TEST ONLY` และ Seeder ปฏิเสธ host ที่ไม่ใช่ loopback

ผลนี้เป็นหลักฐาน Engineering Validation ในเครื่อง/Emulator เท่านั้น ไม่ใช่การ Seed
Firebase Production และไม่อนุมัติ external resource, billing, credential, deployment,
ข้อมูล/รูปจริง, SMS จริง, Controlled Pilot หรือ Production

## 2. โมดูล Seeder

| โมดูล | ขอบเขต | คำสั่ง |
|---|---|---|
| Foundation | Auth test accounts, Organization, Farm, Membership และ Audit | `pnpm seed:emulator:foundation` |
| Tree Register | Position, Planting Cycle, Tree Event, Tag และ QR route จำลอง | `pnpm seed:emulator:trees` |
| Work/Care/Disease | Work Order/Event, Work photo placeholder, Care และ Disease Incident/photo state | `pnpm seed:emulator:work` |
| Commercial | Crop Cycle, Fruit Observation, Harvest/Sales Lot, Inventory, Balance และ Audit | `pnpm seed:emulator:commercial` |
| Operations | Dashboard, Offline queue, Conflict, Photo recovery และ Audit | `pnpm seed:emulator:operations` |
| Disease Analysis P1 | Deterministic Analysis Session, Abstain และ Human Review audit | `pnpm seed:emulator:disease-analysis` |

แต่ละคำสั่ง reset Emulator ก่อน Seed และเติม dependency ตั้งแต่ Foundation ถึงโมดูล
เป้าหมายให้อัตโนมัติ ส่วน `pnpm seed:emulator` Seed ครบทั้ง 6 โมดูล

## 3. จำนวนข้อมูลที่ตรวจยืนยัน

| ขอบเขต | จำนวน |
|---|---:|
| Firebase Auth test accounts | 6 |
| Foundation: Root / Organization / Org Member / Farm / Farm Member / Membership Audit | 1 / 1 / 6 / 4 / 9 / 1 |
| Tree: Position / Planting Cycle / Tree Event / Tag / QR Route | 4 / 5 / 5 / 4 / 4 |
| Work/Care/Disease: Work Order / Work Event / Storage Object / Care / Care Event / Disease / Disease Event / Disease Photo | 6 / 6 / 3 / 1 / 1 / 2 / 2 / 2 |
| Commercial: Crop / Fruit / Harvest / Sales / Inventory Item / Movement / Balance / Audit | 2 / 4 / 2 / 1 / 3 / 4 / 3 / 11 |
| Operations: Dashboard / Offline / Conflict / Recovery / Audit | 18 / 1 / 2 / 2 / 1 |
| Disease Analysis: Session / Event | 3 / 3 |
| รวม Firestore/Storage records ที่ Seeder ตรวจ | 127 |

## 4. หลักฐานการตรวจสอบ

| รายการ | ผล |
|---|---|
| Full seed/reset/verification | ผ่าน — 127 records ใน 6 โมดูล |
| Modular seed commands | ผ่าน — Foundation 22, Trees 44, Work 67, Commercial 97, Operations 121 และ Disease Analysis 73 records เมื่อรวม dependency |
| Auth mapping | ผ่าน — test accounts 6 บัญชีผูก UID ที่สร้างโดย Auth Emulator |
| Storage metadata | ผ่าน — Placeholder 3 objects, `SIMULATED/TEST ONLY`, ไม่มีข้อมูลจริง |
| Multi-Farm/Rules integration | ผ่าน — 49/49 ใน 8 test files |
| Unit/component | ผ่าน — 171/171 ใน 20 test files |
| ESLint | ผ่าน ไม่มี warning/error |
| TypeScript strict และ Production/PWA build | ผ่าน |
| AIFC guard | ผ่าน — `AI_ASSISTED` เป็น `ESTIMATED` และไม่ใช้ `FULL_COUNT` |
| Disease Analysis guard | ผ่าน — `diagnosisWritebackStatus = NOT_WRITTEN` |

คำเตือน Firebase CLI เรื่อง MOTD/remote config จาก network ที่ถูกจำกัดไม่กระทบ
Emulator; คำสั่งตรวจจบด้วย exit code 0

## 5. Acceptance Criteria

- Seeder เชื่อมเฉพาะ `127.0.0.1`/`localhost` และ project `demo-smart-durian`
- Reset แล้วได้ชุดข้อมูลและ ID เดิมซ้ำได้ โดยไม่ใช้ข้อมูลจริง
- Seed แยกโมดูลได้และ dependency ของแต่ละโมดูลครบ
- ทุก Operational record อยู่ใน Organization/Farm path หรือมี scope ที่ตรวจได้
- Cross-Farm read/write ยังคงถูก Rules ปฏิเสธ
- Work photo ใช้เฉพาะ binary placeholder จำลองและ metadata ที่ไม่มี EXIF/GPS
- ไม่มี confirmed diagnosis writeback หรือ Treatment Work Order อัตโนมัติจาก Analysis
- ไม่มี external AI/API/model, Firebase Production, SMS, billing หรือ credential

## 6. ความเสี่ยงและคำถามเปิด

- ข้อมูลนี้มีไว้ทดสอบ workflow ไม่ใช่ field evidence หรือค่าจริงของสวน
- QR base URL, topology/tag configuration และ Physical Device evidence ยังไม่ยืนยัน
- External PA-1 ยังขาด governance, cost ceiling และ clean deployable Candidate
- Orphan/retention lifecycle จริงยังต้องมี Data Custodian, operator/approver,
  destination/region/key custody และ PA-1/PA-2 approval; ตอนนี้คง `DRY_RUN`
- Disease Analysis P2 และ AIFC-G1 ยังไม่อนุมัติ

## 7. ข้อสรุป Gate

- Full Mock Seed: `Passed — Local/Firebase Emulator Only`
- Gate 6: `Passed` — ไม่เปลี่ยนจากงานนี้
- Phase 7: จำกัดที่ readiness/approval package
- External PA-1: `NO-GO/BLOCKED` ตาม DEC-038
- Deployment, Controlled Pilot, PA-2 และ Production: `Not Approved`

ขั้นถัดไปที่อนุญาตคือใช้ Full Mock Seed นี้ทดสอบ Local/Emulator และจัดเตรียม
evidence เพิ่มเติม โดยต้องขอ Owner Review และได้รับ `GO` แยกก่อน External Action
ทุกชนิด
