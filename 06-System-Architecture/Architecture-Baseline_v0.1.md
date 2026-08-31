# Architecture Baseline v0.1

> เอกสารแนวคิดสำหรับ Gate 0 ยังไม่ใช่ schema หรือ infrastructure ที่อนุมัติให้สร้าง

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.1 |
| สถานะ | Proposed — Owner Review Required |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | `AGENTS.md`, `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`, `01-Requirements/KDOMS_Role_Access_Matrix_v0.1.md` |

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
- `production`: สร้างหลังอนุมัติ แยก credentials/data ชัดเจน
- ห้ามใช้ข้อมูลสวนจริงใน test โดยไม่ทำ anonymization และอนุมัติ
- ใช้ least privilege, data minimization, farm-scoped export with audit และ
  archive-before-delete
- ห้าม real/production data จนกว่า retention, backup และ privacy policy จะ Approved

## 7. Phase-gated architecture decisions after Foundation

รายการนี้เป็น boundary สำหรับ Phase ถัดไป ไม่ใช่เงื่อนไขย้อนหลังของ Phase 1:

- Repository/package structure — วางแล้วใน Phase 1 ตาม
  `06-System-Architecture/Phase-1-Foundation-Architecture_v0.1.md`
- Auth provider และ account recovery — `DEC-010` ยัง Open และต้องตัดสินก่อน Phase 2
- Canonical role matrix — Approved ตาม `DEC-009`; enforcement รอ Phase 2
- Firestore schema/query/access matrix และ cross-farm Security Rules tests —
  ต้องออกแบบและทดสอบใน Phase 2 ก่อนผ่าน Gate 2
- Offline operation/conflict contract — baseline Approved ตาม `DEC-011`;
  implementation เชิงธุรกิจทำใน Phase ที่เป็นเจ้าของ workflow
- Image compression, path, retention และ orphan cleanup — ต้องตัดสินก่อนเปิด
  image upload feature
- Audit/event retention, backup/export/restore, monitoring, error reporting และ
  privacy policy — ต้องอนุมัติก่อนใช้ production data หรือ production environment

การจัดลำดับนี้ไม่อนุมัติรายละเอียดที่ยัง Open และไม่อนุญาตให้เริ่ม Phase 2
โดยไม่มี Gate 1 approval

Production domain สำหรับ QR ไม่ใช่ Gate 0 blocker หรือเงื่อนไขสร้าง Foundation
แต่ต้องได้รับ `Approved` ก่อนใช้ QR/ป้ายจริงและก่อน Phase 3 sign-off

## 8. Gate boundaries

- Gate 0: Product & Documentation Readiness เท่านั้น
- Field Validation Gate: topology, ป้าย 5–10 ป้าย และ Tree Survey 30–50 ต้น
  ก่อนล็อก Phase 3/ผลิตป้ายจริง
- Phase 7: Operational Application Pilot ด้วยแอปที่ผ่าน Gate 6
