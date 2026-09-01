# Architecture Baseline v0.2

> Evolving baseline หลัง Gate 6; การอนุมัติ source/knowledge ไม่ใช่คำสั่ง Deploy

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.2 |
| สถานะ | Approved Evolving Baseline — Limited Operational Tree Register (DEC-046) |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| Source of Truth | `AGENTS.md`, `01-Requirements/KDOMS_Development_Mock_Data_and_Pilot_Knowledge_v1.0.md`, `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`, `01-Requirements/KDOMS_Role_Access_Matrix_v0.1.md`, `00-Project-Management/Owner-Review-Addendum_Tree-Register-Operational-Data-Entry_2026-09-01.md`, `00-Project-Management/Decision-Log.md` (DEC-046) |

## 1. Target stack

- Vite + React + TypeScript
- Responsive PWA
- Firebase Authentication
- Cloud Firestore
- Cloud Storage
- Cloud Functions/trusted backend ตามความจำเป็น
- Firebase Local Emulator Suite สำหรับพัฒนาและทดสอบ

## 2. Context boundaries

```text
User / Mobile PWA
  → Authentication
  → Farm-scoped application services
  → Firestore / Storage
  → Trusted functions for privileged operations
  → Audit / Export / Notifications
```

ขอบเขตความปลอดภัยหลักคือ Organization และ Farm ไม่ใช่หน้าจอหรือ client state

- `organizationId`, `farmId`, `positionId` และ record IDs เป็น globally unique
  opaque IDs
- Human-readable Tag Code
  `{organizationCode}-{farmSequence}-{zone}-{row}-{tree}` ใช้ค้นหา/ยืนยันกับ
  context เท่านั้น ไม่ใช่ authorization
- QR route เป็น configurable base URL + `/t/{opaquePositionId}`

## 3. Tenant isolation

- ทุก query เริ่มจาก membership ที่ตรวจได้
- Path และ document fields ต้องไม่เปิดทางให้ client ย้ายข้อมูลข้าม Farm
- Privileged operation ตรวจ source and target scope บน trusted backend
- Storage path ผูก organization/farm/record และ rules เดียวกับ metadata
- Portfolio query ใช้ membership list/authorized aggregation ไม่ใช่ read ทุก Farm แล้วกรองใน client
- Canonical roles ใช้ 7 roles ตาม
  `01-Requirements/KDOMS_Role_Access_Matrix_v0.1.md`; `ORG_OWNER` เป็น
  organization-scoped และ role อื่นเป็น farm-scoped เว้น `AUDITOR` assignment

## 4. Data style

- Master data: Organization, Farm, Zone, Row, Position, user membership
- Stateful records: Work Order, Disease Incident, Crop Cycle, Harvest/Sales Lot
- Append-oriented events: Worker Report, Care Event, Fruit Observation, Inventory Movement, Audit Event
- Derived views: dashboard counters, summaries และ search indexes

ไม่ duplicate authoritative fields โดยไม่มี ownership และ update policy

Position, Planting Cycle, Tree Event และ record ที่เกี่ยวข้องต้องสืบทอด
`classification`/`exampleData` จาก runtime และ Farm ที่เชื่อถือได้ ห้ามรับค่า
classification จาก client เพื่อยกระดับ Mock เป็นข้อมูลจริง

## 5. Offline model

- Client operation ID สร้างก่อน queue
- Event write ตรวจ operation ID เพื่อป้องกัน duplicate
- Pending mutation มี farm scope ที่ immutable
- Photo upload และ metadata write ต้อง recover ได้เมื่อสำเร็จเพียงส่วนเดียว
- Conflict policy แยก event vs master data
- Master-data conflict ให้ `FARM_MANAGER` review และ escalate ถึง `ORG_OWNER`
- Event correction อ้าง event เดิม ห้าม silent overwrite
- UI แสดง last-known data และ sync state

## 6. Environment policy

- `development`: local/emulator-first
- `test`: isolated automated validation
- `production`: ใช้เฉพาะ resource และขอบเขตที่ Owner อนุมัติ แยก credentials/data ชัดเจน
- ห้ามใช้ข้อมูลสวนจริงใน test โดยไม่ทำ anonymization และอนุมัติ
- ใช้ least privilege, data minimization, farm-scoped export with audit และ
  archive-before-delete
- DEC-046 อนุญาตข้อมูลทะเบียนต้นจริงเฉพาะ Firebase Production + Farm ที่
  trusted-provision เป็น `classification=OPERATIONAL`, `isMock=false`; runtime/Farm
  อื่นต้องสร้าง `SIMULATED/TEST ONLY` และ `exampleData=true`
- ข้อมูลจริงนอกทะเบียนต้น, รูปจริง, QR/ป้ายถาวร และการขยาย Production ยังคงต้องมี
  approval ด้าน retention, backup, privacy, resource และ deployment ที่เกี่ยวข้อง

## 7. Phase-gated architecture decisions after Foundation

รายการนี้เป็น boundary สำหรับ Phase ถัดไป ไม่ใช่เงื่อนไขย้อนหลังของ Phase 1:

- Repository/package structure — วางแล้วใน Phase 1 ตาม
  `06-System-Architecture/Phase-1-Foundation-Architecture_v0.1.md`
- Auth provider — `DEC-010` Approved: Phone + SMS OTP; Phase 2 ใช้หมายเลขและ
  OTP ทดสอบบน Firebase Authentication Emulator เท่านั้น ส่วน account recovery
  และ Production SMS configuration ต้องตัดสินก่อน production
- Canonical role matrix — Approved ตาม `DEC-009`; enforcement รอ Phase 2
- Firestore schema/query/access matrix และ cross-farm Security Rules tests —
  ต้องออกแบบและทดสอบใน Phase 2 ก่อนผ่าน Gate 2
- Offline operation/conflict contract — baseline Approved ตาม `DEC-011`;
  implementation เชิงธุรกิจทำใน Phase ที่เป็นเจ้าของ workflow
- Image compression, path, retention และ orphan cleanup — ต้องตัดสินก่อนเปิด
  image upload feature
- Audit/event retention, backup/export/restore, monitoring, error reporting และ
  privacy policy — ต้องอนุมัติก่อนขยาย production data/environment นอกข้อยกเว้น
  จำกัดของ DEC-046

Gate 1–6 ผ่านแล้วและปัจจุบันอยู่ Phase 7 readiness ตาม Decision Log
การจัดลำดับนี้ไม่อนุมัติรายละเอียดที่ยัง Open, production resource เพิ่ม หรือ Deploy

Production domain สำหรับ QR ไม่ใช่ Gate 0 blocker หรือเงื่อนไขสร้าง Foundation
แต่ต้องได้รับ `Approved` ก่อนใช้ QR/ป้ายจริงหรือผลิตป้ายถาวร

## 8. Gate boundaries

- Gate 0–6: ผ่านตาม Decision Log ด้วย Mock/Emulator/browser evidence
- DEC-046: อนุมัติ source-ready operational Tree Register data entry แบบจำกัด;
  คำสั่ง Deploy/activation และการ trusted-provision Farm ต้องดำเนินการแยก
- Physical Device/Field Validation: ต้องผ่านก่อน Controlled Pilot completion,
  Production rollout, QR/ป้ายถาวร หรือ scale-up แต่ไม่ย้อนกลับไป block source work
- Phase 7: Pilot readiness ยังไม่ใช่การอนุมัติ External Pilot Action หรือ Go-Live
