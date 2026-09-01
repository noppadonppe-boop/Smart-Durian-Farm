# Smart Durian Farm Web App — Phase 6 + AIFC Mock Feasibility

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.9 |
| สถานะ | Local Mock Application Ready — ไม่ต้องมี Firebase Project |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| Source of Truth | `../../AGENTS.md` v3.3, Development/Mock Data/Pilot Knowledge v1.0.4, DEC-027, DEC-037 และ DEC-038 |

Web App แบบ local/Firebase Emulator only สำหรับ Smart Durian Farm / KDOMS
ตามแนวทาง Mock-first Development ข้อมูลทุกชุดต้องเป็น
`SIMULATED/TEST ONLY` และไม่เชื่อม Production

## เปิดแอปด้วย Mock Data — วิธีที่แนะนำ

ไม่ต้องสร้าง Firebase Project, ไม่ต้องเปิด Billing, ไม่ต้องมี Credential และไม่ต้อง
เปิด Firebase Emulator สำหรับการพัฒนา UI/Workflow ตามปกติ

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

เปิด URL ที่ Vite แสดง แล้วกด **เปิดแอปสาธิตทันที** ระบบจะใช้บัญชีเจ้าของสวน
จำลองและโหลด Farm, Tree, Work, Care, Disease, Production, Inventory, Dashboard,
Offline/Conflict, Photo recovery และ Audit จาก Mock Data Pack ภายในเครื่อง

หากไม่มี `.env.local` แอปเลือก `mock` โดยอัตโนมัติ การ reload หน้าเว็บจะสร้าง
runtime ใหม่จากชุดข้อมูลตั้งต้น จึงสามารถทดลองแก้ข้อมูลโดยไม่กระทบข้อมูลจริง

## ขอบเขตที่ทำเสร็จ

- Phase 1–3: local foundation, Phone OTP Emulator, Multi-Farm access,
  Tree Register, planting cycle, Tag/QR route และ scan/manual confirmation
- Work Order: Draft, Assigned, Accepted, In Progress, pause/resume, Submitted,
  Verified, Rejected, Rework และ Closed
- target แบบ Tree, Tree Set, Row และ Zone โดย snapshot opaque Position IDs
- Worker flow: accept/start/confirm tree/report/submit พร้อมผลสำเร็จหรือ exception
  รายต้น
- ผู้สร้าง Work Order แนบรูปประกอบได้ 0–3 รูปขณะ Draft ก่อน Assign
- Worker Report ต้องมี before/after evidence รวมไม่เกิน 6 รูป โดยทุกไฟล์ต้อง
  อัปโหลดสำเร็จใน Mock adapter หรือ Firebase Storage Emulator ก่อน Submit
- Manager/Agronomist verification, reject/rework reason, immutable audit event และ
  idempotency key
- Care Event: fertilizer, chemical, water, pruning และ inspection
- Disease Incident: observed symptom, severity, suspected/confirmed diagnosis,
  treatment, follow-up และ outcome
- Worker ห้ามวินิจฉัย; chemical/treatment คง `PENDING_SPECIALIST` จน Agronomist
  อนุมัติ
- in-app urgent/rework/follow-up queue; ไม่มี SMS หรือ push ภายนอก
- Firestore/Storage Rules แบบ deny-by-default พร้อม Cross-Farm, wrong-tree,
  role และ evidence tests
- Crop Cycle และ Fruit Observation ที่ระบุ method, count, confidence, unit,
  actor และเวลา พร้อมแยก measured/estimated/unknown
- Fruit Observation เลือกที่มาของจำนวนเป็น `MANUAL` หรือ `AI_ASSISTED` ได้
  โดย AI เป็น deterministic mock, ให้คนแก้จำนวนก่อนบันทึก และบังคับ `ESTIMATED`
- Harvest Lot และ Sales Lot แบบ partial พร้อม customer reference ขั้นต่ำ,
  ยอดมัดจำ/รับแล้ว/ค้าง, correction, archive และ idempotency
- Trace Tree/Zone → Crop Cycle → Harvest → Sales
- Inventory receipt/issue/signed adjustment, lot/unit/expiry, low-stock/expiry alert
  และ direct cost ที่เชื่อม Work/Care reference
- negative stock และ Cross-Farm ถูกปฏิเสธ; `SALES_INVENTORY` ใช้สิทธิ์ตาม Farm
- Farm Dashboard ปรับตามบทบาท และ Portfolio เฉพาะ Organization Owner ซึ่งรวม
  เฉพาะสวนที่ได้รับสิทธิ์
- Offline queue แสดง Pending/Syncing/Synced/Conflict พร้อม retry/idempotency และ
  ตรวจ role ใหม่เมื่อ reconnect
- Master conflict ใช้ Owner/Manager review พร้อม reason/before-after audit
- partial photo retry และ orphan cleanup แบบจำกัดสิทธิ์/มี audit
- Operational Audit และ Farm-scoped minimal CSV Export พร้อม formula protection
- route/Firebase adapter code splitting, PWA performance budget และ Light/Dark theme

## Mock Data Pack

ไฟล์หลักคือ
`src/demo/phase6-mock-data-pack-v1.0.json`

- เวอร์ชัน `1.0.0`
- ป้ายกำกับ `SIMULATED/TEST ONLY`
- deterministic และ resettable
- ครอบคลุม authorized/hidden Farm Dashboard, pending/retry/duplicate/conflict,
  role downgrade/revocation, partial/orphan photo, correction audit และ export
- ไม่มีข้อมูลสวน/ลูกค้า/บุคคลจริง เบอร์/อีเมลจริง พิกัดจริง หรือ Production identifier

รีเซ็ต Firebase Emulator ให้เป็นค่าตั้งต้นของแพ็ก:

```powershell
pnpm seed:emulator
```

Mock adapter ในเบราว์เซอร์จะรีเซ็ตเมื่อสร้าง runtime ใหม่ และใช้ ID ที่สร้างซ้ำได้
สำหรับ mutation จำลอง

## หน้าจอสำคัญ

- `/` — Dashboard และ trusted Farm context
- `/work`, `/work/new`, `/work/:workOrderId` — Work workflow
- `/care` — Care Event และ specialist approval
- `/disease`, `/disease/:incidentId` — symptom/diagnosis/follow-up
- `/production` — Crop Cycle, Fruit Observation, Harvest/Sales และ traceability
- `/inventory` — stock balance, alerts, receipt/issue/adjustment และ direct cost
- `/portfolio` — Owner-only authorized Farm portfolio
- `/sync` — Offline queue, Conflict และ Photo recovery
- `/notifications` — คิวในแอป
- `/scan` — QR/manual confirmation และ mismatch stop
- `/trees`, `/trees/:positionId` — Tree Register และ history
- `/members`, `/audit` — Access และ Audit

## Firebase Emulator — ใช้เฉพาะเมื่อต้องการทดสอบ Rules

Firebase Project จริงไม่จำเป็นสำหรับขั้นตอนนี้ Local Emulator ใช้เฉพาะการตรวจ
Firestore/Storage Rules และ adapter integration โดยต้องมี Java 21

```powershell
Copy-Item .env.example .env.local
```

แก้ `VITE_DATA_ADAPTER=firebase-emulator` ใน `.env.local` แล้วรัน:

```powershell
pnpm install --frozen-lockfile
pnpm emulators
```

อีกหน้าต่างหนึ่ง:

```powershell
pnpm seed:emulator
pnpm dev
```

`.env.example` เริ่มต้นที่ `mock` และมีเฉพาะ local demo identifiers ไม่ใช่ credential

## การตรวจสอบ

```powershell
pnpm validate
```

ชุดนี้รัน lint, TypeScript strict, unit/component tests, production build,
performance budget, offline runtime scan และ Firebase Auth/Firestore/Storage
Emulator tests

ผลล่าสุด:

- unit/component: 125/125 ใน 17 test files
- emulator/security/integration: 45/45 ใน 7 test files
- mobile browser 320×736: หน้าเข้าสู่ระบบและ Dashboard ไม่มี horizontal overflow
- browser functional: เปิดแอป Mock แบบคลิกเดียวและ Dashboard โหลดโดยไม่มี console warning/error
- offline runtime scan: ผ่าน 52 ไฟล์
- performance: JS 332,238/350,000; CSS 41,140/60,000; total 1,303,589/1,800,000 bytes
- PWA build: ผ่าน; precache 52 entries, 1,254.56 KiB
- Mock Data Pack reset: ผ่าน

รายงานอยู่ที่
`../../08-Testing/Phase-6-Validation-Report_v1.0.md` และส่วนเพิ่มรูป Work Order อยู่ที่
`../../08-Testing/Phase-4-Work-Photo-Enhancement-Validation_v1.0.md`; ผล AIFC อยู่ที่
`../../08-Testing/AI-Fruit-Counting-WP1-Partial-Validation-Report_v0.1.md`

## ข้อห้ามและความเสี่ยงคงค้าง

- ห้าม Firebase Production, billing, public deployment, production domain,
  credentials/service-account key, SMS จริง และเบอร์จริง
- QR base URL ยัง `TBD`; ห้าม encode/พิมพ์ URL ที่ไม่ได้อนุมัติและห้ามผลิตป้ายถาวร
- Physical Device/Field Validation ถูกเลื่อนไป Controlled Pilot หลัง Owner
  อนุมัติ Pilot Candidate และไม่ block Gate ทางวิศวกรรม Phase 5
- Physical/Field evidence ยังต้องผ่านก่อน Production, ป้ายถาวร หรือขยายใช้งาน
- dependency audit มี moderate 2 รายการเฉพาะ dev-only transitive ของ
  `firebase-tools`; high/critical = 0 และต้องติดตาม upstream ก่อน Pilot Candidate
- Backup/Restore/Monitoring/Incident เป็น Draft; destination, RPO/RTO และ contacts ยัง `TBD`
- Phase 7 อนุญาตเฉพาะ planning/readiness; External Pilot Action/Deploy ยังต้องขอแยก
- AIFC-G1 ยังไม่ผ่าน; ห้ามภาพจริง external AI/API/model และ commercial use
