# Smart Durian Farm Web App — Phase 6 + Firebase Production Firestore

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.2.0 |
| สถานะ | Firebase Production Firestore Ready; Owner OTP Seed Pending; Storage Provisioning Pending |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| Source of Truth | `../../AGENTS.md` v3.6, Development/Mock Data/Pilot Knowledge v1.0.4, DEC-027, DEC-038, DEC-040 และ DEC-041 |

Web App สำหรับ Smart Durian Farm / KDOMS ตามแนวทาง Mock-first Development
runtime ปกติเชื่อม Firebase Authentication และ Cloud Firestore ของ project
`durian-smartfarm` จริงตาม DEC-041 ข้อมูลเริ่มต้นยังเป็น `SIMULATED/TEST ONLY`
และเก็บใต้ shared document `durian-smartfarm/root`

## เปิดแอปด้วย Firebase Production

runtime ปกติไม่ต้องเปิด Firebase Emulator และอ่านค่า Web config จาก `.env` ที่ Git
ignore อยู่แล้ว

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

เปิด URL ที่ Vite แสดง ยืนยัน Phone OTP แล้วกด **Seed Mock Data ไป Firebase**
ในหน้า No-Farm หรือหน้าหลัก ระบบจะเขียนชุดข้อมูลทุกเมนูไปยัง
`durian-smartfarm/root` แล้วอ่าน Farm membership กลับด้วย Firebase UID ของผู้ใช้

ระหว่างรันด้วย Development Server หน้า Login จะแสดงปุ่ม
**เข้าสู่ระบบโดยผู้ดูแล** สำหรับตรวจทุกโมดูลโดยไม่ใช้ OTP ปุ่มนี้สลับทั้ง Auth และ
Data Adapter ไปยังบัญชี `ORG_OWNER` และข้อมูล `SIMULATED/TEST ONLY` ในเครื่อง
จึงไม่อ่าน/เขียน Firestore Production ส่วน Production build จะไม่แสดงปุ่มและ
ฟังก์ชันทางลัดจะปฏิเสธการเข้าใช้เสมอ

## ขอบเขตที่ทำเสร็จ

- Phase 1–3: local foundation, Phone OTP Emulator, Multi-Farm access,
  Tree Register, planting cycle, Tag/QR route และ scan/manual confirmation
- Tree Register ดาวน์โหลด Excel Template ที่เปิดใน Microsoft Excel/Google Sheets,
  นำกลับเข้าเป็น `.xlsx`/`.csv`, Preview 49 คอลัมน์ และเขียนแบบ atomic/idempotent
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

ไฟล์แพ็กหลักอยู่ใน `src/demo/` ได้แก่ Phase 2, Phase 4, Phase 5, Phase 6 และ
Disease Analysis P1 โดย Seeder รวมแต่ละแพ็กตาม dependency แล้วตรวจความสัมพันธ์
ก่อนเขียนลง Emulator

- เวอร์ชัน `1.0.0`
- ป้ายกำกับ `SIMULATED/TEST ONLY`
- deterministic และ resettable
- ครอบคลุม authorized/hidden Farm Dashboard, pending/retry/duplicate/conflict,
  role downgrade/revocation, partial/orphan photo, correction audit และ export
- ไม่มีข้อมูลสวน/ลูกค้า/บุคคลจริง เบอร์/อีเมลจริง พิกัดจริง หรือ Production identifier

รีเซ็ต Firebase Emulator และ Seed ครบทุกโมดูล:

```powershell
pnpm seed:emulator
```

หากต้องการทดสอบเป็นช่วง สามารถ Seed แยกตามฟังก์ชันได้ แต่ละคำสั่งจะรีเซ็ตข้อมูล
ก่อน แล้ว Seed dependency ที่จำเป็นให้อัตโนมัติ:

```powershell
pnpm seed:emulator:foundation
pnpm seed:emulator:trees
pnpm seed:emulator:work
pnpm seed:emulator:commercial
pnpm seed:emulator:operations
pnpm seed:emulator:disease-analysis
```

ตรวจ Seeder แบบครบวงจรโดยให้คำสั่งเปิดและปิด Emulator เอง:

```powershell
pnpm test:seed:emulator
```

Full Seed ประกอบด้วย Auth test accounts, Organization/Farm/Membership,
Tree/Planting Cycle/Tag/QR route, Work/Care/Disease/รูป Placeholder, Crop/Fruit/
Harvest/Sales/Inventory, Dashboard/Offline/Conflict/Recovery/Audit และ Disease
Analysis Session/Human Review รวม 127 records ทุกชุดติดป้าย
`SIMULATED/TEST ONLY`

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
- `/trees/import` — ดาวน์โหลด Template และ Preview/Import Excel หรือ CSV จาก Google Sheets
- `/members`, `/audit` — Access และ Audit

## Firebase Emulator — Phone OTP และ Rules แบบ Local

Firebase Project จริงไม่จำเป็นสำหรับขั้นตอนนี้ Local Emulator รองรับ Phone OTP,
Firestore/Storage Rules และ adapter integration โดยต้องมี Java 21 การเปิด Phone
provider หรือกำหนด test phone ใน Firebase Console ไม่มีผลต่อ Auth Emulator
เพราะ Emulator สร้างรหัสใหม่และแสดงในหน้าต่างที่รัน Emulator เอง

```powershell
pnpm emulators
```

อีกหน้าต่างหนึ่ง ให้ reset บัญชี/ข้อมูลจำลองแล้วเปิดแอปในโหมด Emulator:

```powershell
pnpm seed:emulator
pnpm dev:emulator
```

หน้า Login ใช้หมายเลขทดสอบที่แสดงในแอป กดขอรหัส แล้วนำ OTP 6 หลักจาก
หน้าต่าง `pnpm emulators` มากรอก รหัสจะเปลี่ยนทุกครั้งและไม่มี SMS จริงถูกส่ง

ถ้าต้องการใช้ Mock OTP แบบไม่เปิด Emulator ให้ override เฉพาะ process ปัจจุบัน:

```powershell
$env:VITE_DATA_ADAPTER='mock'
$env:VITE_AUTH_ADAPTER='mock'
pnpm dev
```

`pnpm dev:emulator` โหลด `.env.emulator` ซึ่งบังคับ project จำลองและ loopback
เท่านั้น ส่วน `.env.example` ยังคงเริ่มที่ `mock`; ทั้งสองไฟล์ไม่มี credential จริง

## Firebase Production — DEC-041 Shared Root

คำสั่ง `pnpm dev` ใช้ Firebase Phone Authentication และ Firestore Production จริง
จาก `.env` ที่ถูก ignore โดย Git ไม่มีการเชื่อม Local Emulator ใน runtime ปกติ
ผู้ใช้คนแรกยืนยัน Phone OTP แล้วกดปุ่ม Seed ในหน้า No-Farm/หน้าหลักเพื่อสร้าง
deterministic Mock Data ใต้ `durian-smartfarm/root`

ค่าของ Web App อยู่ใน `.env` ซึ่งถูก ignore โดย Git ต้องกำหนด
`FIREBASE_LIVE_AUTH_ALLOWED_PHONE_NUMBERS` เฉพาะหมายเลขที่ Owner อนุญาต โดยห้าม
ใช้ prefix `VITE_` กับหมายเลขจริง จากนั้นรันคำสั่งเตรียม allowlist เพื่อสร้างเฉพาะ
PBKDF2 digest + random salt สำหรับ browser bundle

```powershell
pnpm prepare:firebase-auth-allowlist
pnpm dev
```

Limited Hosting build ตาม DEC-042 ใช้ `VITE_DATA_ADAPTER=mock` จากไฟล์
`.env.firebase-live.local` และ Deploy เฉพาะ Hosting:

```powershell
npm run deploy:firebase-auth-hosting
```

คำสั่งนี้ build Firebase Phone Auth จริง + Mock Data แล้วเรียก Firebase CLI ด้วย
`--only hosting --project durian-smartfarm`; ไม่ Deploy Firestore/Storage

ก่อนส่ง OTP ผู้ใช้ต้องรับทราบว่าหมายเลขจะถูกส่งให้ Google Firebase ปุ่ม Seed ต้อง
พิมพ์ชื่อ project และยืนยันป้าย `SIMULATED/TEST ONLY` ทุกครั้ง Firestore Rules และ
Indexes Deploy แล้ว แต่ Firebase Storage ยังไม่ผ่าน Get Started จึงตั้ง
`VITE_FIREBASE_STORAGE_READY=false` และข้าม placeholder 3 ไฟล์ชั่วคราว

## การตรวจสอบ

```powershell
pnpm validate
```

ชุดนี้รัน lint, TypeScript strict, unit/component tests, production build,
performance budget, offline runtime scan และ Firebase Auth/Firestore/Storage
Emulator tests

ผลตรวจเฉพาะ Full Mock Seed ล่าสุด:

- unit/component: 171/171 ใน 20 test files
- emulator/security/integration: 49/49 ใน 8 test files
- Seeder verification: 127 records ใน 6 โมดูล พร้อม root document, Auth 6 บัญชีและ Storage 3 objects
- lint และ TypeScript strict: ผ่าน
- production/PWA build: ผ่าน
- deterministic reset และ Cross-Farm reference validation: ผ่าน

รายงานอยู่ที่
`../../08-Testing/Phase-6-Validation-Report_v1.0.md` และส่วนเพิ่มรูป Work Order อยู่ที่
`../../08-Testing/Phase-4-Work-Photo-Enhancement-Validation_v1.0.md`; ผล AIFC อยู่ที่
`../../08-Testing/AI-Fruit-Counting-WP1-Partial-Validation-Report_v0.1.md`; ผล Full
Mock Seed อยู่ที่ `../../08-Testing/Firebase-Emulator-Full-Mock-Seed-Validation_v1.0.md`

## ข้อห้ามและความเสี่ยงคงค้าง

- Firebase Production Firestore อนุมัติเฉพาะ deterministic Mock Data ตาม DEC-041;
  ห้ามข้อมูล/ภาพจริง, public deployment, production domain และ service-account key
- QR base URL ยัง `TBD`; ห้าม encode/พิมพ์ URL ที่ไม่ได้อนุมัติและห้ามผลิตป้ายถาวร
- Physical Device/Field Validation ถูกเลื่อนไป Controlled Pilot หลัง Owner
  อนุมัติ Pilot Candidate และไม่ block Gate ทางวิศวกรรม Phase 5
- Physical/Field evidence ยังต้องผ่านก่อน Production, ป้ายถาวร หรือขยายใช้งาน
- dependency audit มี moderate 2 รายการเฉพาะ dev-only transitive ของ
  `firebase-tools`; high/critical = 0 และต้องติดตาม upstream ก่อน Pilot Candidate
- Backup/Restore/Monitoring/Incident เป็น Draft; destination, RPO/RTO และ contacts ยัง `TBD`
- Phase 7 อนุญาตเฉพาะ planning/readiness; External Pilot Action/Deploy ยังต้องขอแยก
- AIFC-G1 ยังไม่ผ่าน; ห้ามภาพจริง external AI/API/model และ commercial use
