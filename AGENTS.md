# AGENTS.md — Smart Durian Farm / KDOMS

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 5.2 |
| สถานะ | DEC-053 Approved — ปุ่มกลับจาก Orchard Layout ต้องไปเมนูต้นไม้; DEC-052/051 ยังคงมีผล |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-04 |
| Production Source | `00-Project-Management/Owner-Review-Decision_Firebase-Live-Operational-Go-Live_2026-09-04.md`, `00-Project-Management/Decision-Log.md` DEC-051 |
| Annual Cycle Source | `01-Requirements/KDOMS_Annual_Farm_Management_Cycle_Knowledge_v0.1.md`, `00-Project-Management/Annual-Farm-Management-Cycle-Implementation-Prompt_v1.0.md`, `06-System-Architecture/Annual-Farm-Management-Cycle-Architecture_v0.1.md`, `08-Testing/Annual-Farm-Management-Cycle-Validation-Report_v1.0.md` |
| Reporting Source | `01-Requirements/KDOMS_Management_Reporting_and_Cost_Knowledge_v0.1.md`, `00-Project-Management/Management-Reporting-and-Cost-Implementation-Prompt_v1.0.md`, `06-System-Architecture/Management-Reporting-and-Cost-Architecture_v0.1.md`, `08-Testing/Management-Reporting-and-Cost-Validation-Report_v0.1.md`, `08-Testing/Owner-Only-Financial-Access-Validation-Report_v1.0.md` |
| Source of Truth | `.agents/skills/kdoms-disease-analysis-development/SKILL.md`, `01-Requirements/KDOMS_Development_Mock_Data_and_Pilot_Knowledge_v1.0.md`, `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`, `01-Requirements/KDOMS_Farm_Profile_and_Management_Knowledge_v0.1.md`, `01-Requirements/KDOMS_Annual_Farm_Management_Cycle_Knowledge_v0.1.md`, `00-Project-Management/Annual-Farm-Management-Cycle-Implementation-Prompt_v1.0.md`, `06-System-Architecture/Annual-Farm-Management-Cycle-Architecture_v0.1.md`, `01-Requirements/KDOMS_Orchard_Layout_and_Target_Selection_Knowledge_v0.1.md`, `00-Project-Management/Phase-2-Farm-Management-Remediation-Prompt_v1.0.md`, `00-Project-Management/Owner-Review-Addendum_Tree-Register-Operational-Data-Entry_2026-09-01.md`, `08-Testing/Phase-3-Operational-Tree-Register-Form-Validation_v1.0.md`, `01-Requirements/KDOMS_AI_Fruit_Counting_Feasibility_Knowledge_v0.1.md`, `00-Project-Management/AI-Fruit-Counting-Feasibility-Plan_v0.1.md`, `08-Testing/AI-Fruit-Counting-WP1-Partial-Validation-Report_v0.1.md`, `00-Project-Management/Decision-Log.md`, `00-Project-Management/Owner-Review-Addendum_Disease-Analysis-P1_2026-09-01.md`, `06-System-Architecture/Disease-Analysis-P1-Deterministic-Mock-Architecture_v0.1.md`, `08-Testing/Disease-Analysis-P1-Validation-Report_v0.1.md`, `00-Project-Management/Owner-Review-Decision_Phase-7-External-PA1_2026-08-31.md`, `00-Project-Management/Owner-Review-Addendum_Development-Mock-Data-and-Pilot-Timing_2026-08-31.md`, `00-Project-Management/Owner-Review-Addendum_Gate-0_2026-08-31.md`, `00-Project-Management/Owner-Review-Addendum_Gate-1_2026-08-31.md`, `00-Project-Management/Owner-Review-Addendum_Gate-2_2026-08-31.md`, `00-Project-Management/Owner-Review-Addendum_Phase-3-Field-Validation-Pack_2026-08-31.md`, `00-Project-Management/Owner-Review-Addendum_Gate-3_2026-08-31.md`, `00-Project-Management/Owner-Review-Addendum_Gate-4_2026-08-31.md`, `00-Project-Management/Owner-Review-Addendum_Gate-5_2026-08-31.md`, `00-Project-Management/Owner-Review-Addendum_Gate-6_2026-08-31.md`, `00-Project-Management/Phase-7-Plan.md`, `09-Deployment/phase7-pa1-local-rehearsal-approval-v1.1.json`, `08-Testing/Phase-7-PA1-Local-Emulator-Rehearsal-Report_v1.1.md`, `06-System-Architecture/Phase-7-Work-Photo-Durable-Queue-and-Lifecycle-Architecture_v1.0.md`, `10-Operations/Phase-7-Photo-Data-Governance-Decision-Sheet_v1.0.md`, `08-Testing/Phase-7-Work-Photo-Physical-Device-Test-Protocol_v1.0.md`, `08-Testing/Phase-7-Pilot-Readiness-Checklist.md` |

## 1. เป้าหมาย

สร้างระบบบริหารจัดการสวนทุเรียนแบบ Multi-Farm ที่ข้อมูลของแต่ละสวนแยกจากกันอย่างชัดเจน ต้นทุเรียนทุกต้นมีตัวตนถาวรผ่านรหัสตำแหน่งและ QR และมีประวัติตลอดวงจรตั้งแต่ดูแลจนถึงขาย

## 2. ระยะที่อนุญาตในปัจจุบัน

- **คำสั่งล่าสุด DEC-053 (2026-09-04):** ปุ่ม `กลับ` จากหน้า
  `แปลนสวนและเลือกตำแหน่ง` ต้องกลับไปเมนู `ต้นไม้` (`/trees`)
- **คำสั่งล่าสุด DEC-052 (2026-09-04):** หน้าแปลนตำแหน่งต้นต้องเลือกแสดงแถว
  แนวตั้งหรือแนวนอนได้ และแสดงแต่ละต้นเป็นวงกลมพร้อม TAG/หมายเลขใต้ต้น โดยเป็น
  การเปลี่ยนรูปแบบแสดงผลเท่านั้น ไม่เปลี่ยน Position identity, Farm scope,
  selection/eligibility หรือข้อกำหนดด้าน QR
- **คำสั่งล่าสุด DEC-051 (2026-09-04):** Owner อนุมัติ Firebase Live
  Operational Go-Live สำหรับโมดูล Web App ปัจจุบันทั้งหมด อนุมัติ Admin
  Google/Phone sign-in, Operational bootstrap, Firestore Rules/Indexes และ Hosting
  deployment พร้อมยกเลิก runtime/scripts/tests ที่เรียก local Firebase test
  services ข้อห้าม Production/deployment ในรายการประวัติด้านล่างถูก supersede
  เฉพาะขอบเขตนี้
- Production build ต้องใช้ project `durian-smartfarm` โดยตรง; Mock adapter มีได้
  เฉพาะ unit/component test ส่วน deterministic Mock seed ที่เขียน Firebase Live
  ต้องแยก DEMO Farm และคง `SIMULATED/TEST ONLY` / `exampleData=true`
- System Admin ต้องตรวจจาก root `seedOwnerUid` หรือ Firebase custom claim
  `masterAdmin=true` เท่านั้น ห้ามเชื่อ Role จาก client; Operational bootstrap ห้าม
  แต่งข้อมูลภาคสนามหรือข้อมูลการเงินที่ Owner ไม่ได้กรอก
- Multi-Farm/Cross-Farm denial, Audit/idempotency, Owner-only Financial ตาม DEC-050,
  Agronomist Human Review และข้อห้าม automatic chemical advice ยังบังคับ
- สถานะ Physical Device/Field Validation เดิมยังเป็นหลักฐานย้อนหลังตามจริงและไม่
  ถูกเปลี่ยนเป็น Passed เพียงเพราะ Owner อนุมัติ Go-Live

- Gate 0, Gate 1 และ Gate 2 ผ่านเมื่อ 2026-08-31; Owner อนุมัติ Phase 3 ตาม
  `Owner-Review-Addendum_Gate-2_2026-08-31.md`
- Phase 3 — Tree Register & QR ดำเนินการและผ่าน automated/browser validation แล้ว
- Owner ยอมรับ residual risk, Deferred Physical Device Validation และอนุมัติ
  **Gate 3 Passed → Phase 4 Authorized** เมื่อ 2026-08-31
- Owner อนุมัติ DEC-027 ให้ใช้แนวทาง **Mock-first Development**: Phase การ
  สร้างแอปและ Engineering Gate ใช้ข้อมูลจำลอง/Emulator/automated/browser
  evidence และไม่ถูก block ด้วย Physical Device/Field evidence
- Owner อนุมัติ Field Validation Pack v1.0 สำหรับ Controlled Field Validation:
  ต้นจริง 30 ต้นในสวนทดลอง 1 แห่ง, ป้ายชั่วคราว `TEST ONLY` 5 ป้าย,
  Android อย่างน้อย 1 เครื่องและ iPhone อย่างน้อย 1 เครื่อง
- Owner อนุมัติ DEC-023 ให้กรอกค่า Mockup เป็น `SIMULATED/TEST ONLY` และจำลอง
  Android 360×800 กับ iPhone 390×844 สำหรับ Technical Preflight เท่านั้น
  ผล simulation ผ่านแบบ `CONDITIONAL GO — SIMULATION ONLY` ตาม
  `08-Testing/Phase-3-Controlled-Field-Technical-Preflight_v1.1.md`
- Simulation ไม่ใช่ Physical Device/Field/QR evidence; Physical Device/Field
  evidence ยัง `Deferred / Not Passed` และจะเก็บระหว่าง Controlled Pilot หลัง
  Deploy Pilot Candidate ที่ Owner อนุมัติ
- Physical Device/Field Validation ไม่ block Phase 4–6 แต่ต้องผ่านก่อน Production
  rollout, การผลิตป้ายถาวร หรือการขยายใช้งานเชิงปฏิบัติการ
- อนุญาต Phase 4 เฉพาะ Work Orders, Worker Report/Verification, Care Events,
  Disease Incidents, in-app queue, audit และ local/emulator tests ตาม Prompt Phase 4
- Phase 4 ดำเนินการและผ่าน local/Mock/Firebase Emulator/Browser validation แล้ว;
  Owner อนุมัติ Gate 4 และ Phase 5 ตาม DEC-028 เมื่อ 2026-08-31
- Owner อนุมัติ DEC-030: ผู้สร้าง Work Order แนบรูปประกอบได้ 0–3 รูปขณะ Draft
  ก่อน Assign; Worker Report ต้องมีรูป BEFORE และ AFTER ที่อัปโหลดสำเร็จก่อน
  Submit โดยทั้งสองชุดต้องแยก purpose, สิทธิ์, audit และ Farm/Work scope
- Owner อนุมัติ DEC-034: Work photo ต้องถูก re-encode เป็น WebP
  ≤1,600px/≤5MB และไม่ส่ง EXIF/GPS ก่อนอัปโหลด; retry แบบจำกัด
  และลง Phase 6 Photo Recovery/Orphan อัตโนมัติ; real photo policy/device test รอ PA-1/PA-2
- Owner อนุมัติ DEC-036 ให้เพิ่ม Durable binary queue แบบ IndexedDB เพื่อ Retry
  หลังปิด/reload, local server-side lifecycle worker core, HEIC fallback และ
  governance decision sheet ก่อน Pilot; external worker `ENFORCE`, policy/resource
  จริงและอุปกรณ์จริงยังรอ PA-1/PA-2
- Phase 5 — Crop/Fruit/Harvest/Sales/Inventory ดำเนินการและผ่าน
  local/Mock/Firebase Emulator/Browser validation แล้ว; Owner อนุมัติ Gate 5
  และ Phase 6 ตาม DEC-029 เมื่อ 2026-08-31
- Phase 6 — Dashboard/Portfolio, Offline queue/retry/conflict, Photo recovery,
  Audit/Export, Security/Performance/Accessibility hardening ดำเนินการและผ่าน
  local/Mock/Firebase Emulator/Browser validation แล้ว; Owner อนุมัติ Gate 6 และ
  Phase 7 ตาม DEC-031 เมื่อ 2026-08-31
- Phase 7 อนุญาตให้จัดทำ Pilot Candidate readiness, Pilot plan, impact/cost review,
  runbook, training, evidence, privacy, backup/restore และ support package พร้อม
  local/Mock/Emulator validation โดยยังไม่อนุมัติ External Pilot Action
- Owner อนุมัติ DEC-035 ให้นำค่า deterministic Mockup มากรอกช่อง Owner PA-1
  input เป็น `OWNER-DIRECTED MOCK SUBSTITUTE / SIMULATED/TEST ONLY`; การกรอกครบ
  ไม่ทำให้ค่า `SIM-*`, `.example.invalid`, 0 THB หรือ Candidate จำลองเป็นข้อมูลจริง
  และไม่ใช่การอนุมัติ PA-1, deployment, external resource หรือ billing
- Owner อนุมัติ DEC-037 เฉพาะ PA-1 Local/Emulator rehearsal ด้วย deterministic
  Mock Data; อนุญาต local Candidate snapshot/freeze, build และ test แต่ไม่อนุมัติ
  external resource, billing, credential, deployment, real data/device, field work,
  QR encode/print หรือ Production
- Candidate `KDOMS-PC-SIM-20260831-02` ผ่าน full local/browser/Firebase Emulator
  rehearsal: IndexedDB queue อยู่ข้าม reload, Retry/re-link/commit/cleanup สำเร็จ,
  Work list Rules regression ปิดแล้ว และ lifecycle `DRY_RUN` ไม่มี mutation;
  Candidate ยังเป็น dirty local snapshot และ **ห้าม Deploy**
- Owner ตัดสิน `DEC-038: External PA-1 = NO-GO/BLOCKED` เมื่อ 2026-09-01 เพราะ
  actual values, governance owners/destination/region/key custody, cost ceiling และ
  clean frozen deployable Candidate ยังไม่ครบ อีกทั้ง Source ปัจจุบันไม่ตรง local
  frozen snapshot เดิม; ต้องจัด Owner Review ใหม่และรอ `GO` ก่อน External Action
- หมายเหตุหลังการตัดสิน: source drift ฝั่ง Local ถูก remediated ด้วย Candidate
  `KDOMS-PC-SIM-20260901-05` แล้ว แต่ Candidate ยังเป็น
  `FROZEN_LOCAL_REHEARSAL_ONLY_NOT_DEPLOYABLE`; actual values/governance/cost/
  external controls ยังขาด จึงไม่เปลี่ยน DEC-038 หรือ External PA-1 เป็น GO
- Owner อนุมัติ DEC-039 และ Disease Analysis P1 — Deterministic Mock Analysis
  เมื่อ 2026-09-01; ดำเนินการและผ่าน Local/Mock/Firebase Emulator/Browser
  validation แล้วสำหรับ Analysis Session, Mock Confidence/Quality, Abstain และ
  Agronomist Human Review โดยไม่เขียน confirmed diagnosis หรือสร้าง Treatment
  Work Order อัตโนมัติ
- Disease Analysis P1 ไม่อนุมัติภาพ/ข้อมูลจริง, dataset, external AI/API/model,
  credential, billing, deployment, Pilot หรือ Production; P2 ต้องขออนุมัติแยก
  และ DEC-026 Treatment/Chemical Policy ยังคง `Open`
- Owner อนุมัติ DEC-040 ให้ทำ Limited Firebase Phone Auth Technical Test จริง
  เมื่อ 2026-09-01: ใช้ Web App config ของโครงการที่มีอยู่, ส่ง SMS เฉพาะหมายเลข
  ใน local allowlist และ map ผู้ผ่าน Auth ไปยัง Mock Owner/Mock Data เท่านั้น;
  ต้องแจ้ง consent ก่อนส่งหมายเลขให้ Google และห้าม commit หมายเลขจริง
- Owner อนุมัติ DEC-041 ให้ใช้ Firebase Production project `durian-smartfarm`,
  Deploy Firestore Rules/Indexes, อ่าน/เขียน deterministic Mock Data จริงใต้
  `durian-smartfarm/root` และใช้ปุ่ม Seed ที่หน้าหลักหลัง Phone Auth
- DEC-041 กำหนด shared operational path ไม่แยกโฟลเดอร์ตาม User แต่ยังบังคับ
  Organization/Farm membership; anonymous/ผู้ใช้ทั่วไปห้าม Seed/Admin และ Cross-Farm
  ต้องถูกปฏิเสธเสมอ
- Firebase Storage ยังไม่ provision (`Get Started` ยังไม่เสร็จ) จึงยัง Deploy
  Storage Rules/เขียน placeholder ไม่ได้; Seeder Production ต้องข้ามรูปจำลอง 3 ไฟล์
- DEC-041 ไม่อนุมัติข้อมูล/ภาพภาคสนามจริง, public Hosting, Controlled Pilot, PA-2,
  permanent QR/tag หรือ operational Production rollout; DEC-038 ยังคง Blocked ในส่วนนี้
- Firebase Console ยืนยันเมื่อ 2026-09-01 ว่า project plan เป็น Blaze แล้ว แต่การ
  เปลี่ยน plan ไม่ใช่ Hosting/deployment approval; Phone Auth เว็บส่ง SMS จริงจาก
  `localhost`/`127.0.0.1` ไม่ได้และยังรอ Owner อนุมัติ hosted-domain deployment แยก
- Owner อนุมัติ DEC-042 เมื่อ 2026-09-01 ให้ Deploy เฉพาะ Firebase Hosting ไปยัง
  `durian-smartfarm.web.app` สำหรับ Phone OTP จริง โดย data adapter ยังคง Mock และ
  ห้าม Deploy Firestore/Storage ในคำสั่งนี้; Hosting deployment สำเร็จแล้ว
- Hosted build ใช้ PBKDF2 allowlist digest เท่านั้น หมายเลขจริงคงอยู่เฉพาะ ignored
  local env และไม่ถูกฝังใน public bundle; SMS/OTP action ต้องให้ Owner ดำเนินการเอง
- Owner อนุมัติ DEC-043 เมื่อ 2026-09-01 ให้จัดทำ Farm Profile Knowledge/Mockup
  และแก้ Farm Management แบบ Local/Mock/Firebase Emulator: `ORG_OWNER` เพิ่ม/
  แก้ไข/ระงับ/เปิดใหม่/Archive พร้อม Audit; ห้าม Hard delete, ข้อมูลจริง และ Deploy
- Owner อนุมัติ `AIFC-01` ตาม DEC-032 เฉพาะ `AIFC-G0` และ WP0–WP2 แบบ
  Mock/local-only สำหรับ Knowledge, deterministic workflow/harness, Human Review,
  Multi-Farm/offline/audit และ metric definitions; ผลต้องติดป้าย
  `SIMULATED/TEST ONLY` และเริ่มเป็น `ESTIMATED`
- Owner อนุมัติ DEC-033 ให้ Fruit Observation ในช่วงที่มีผลเลือกที่มาของจำนวนได้
  ทั้ง `MANUAL` (คนนับ) และ `AI_ASSISTED` (AI ช่วยนับ + คนตรวจ) โดยแยกจาก
  `countMethod`; ภายใต้ AIFC-G0 ผล AI ต้องอ้าง mock Count Session, เป็น
  `ESTIMATED`, ห้าม `FULL_COUNT` และ FLOWERING ยังไม่ใช้ AI fruit count
- Owner อนุมัติ DEC-045 เมื่อ 2026-09-01 ให้พัฒนา Orchard Layout และ Shared
  Target Selector แบบ Local/Mock/Firebase Emulator: แสดง Farm/Zone/Row/Tree,
  Row ซ้าย→ขวา, Tree บน→ล่าง, เลือก Single/Set/Row/Zone รวมข้าม Zone ภายใน
  Farm เดียวกัน และจำกัด Position `ไม่มีต้น` ตาม Workflow; topology จริงยัง `TBD`
- Owner อนุมัติ DEC-046 เมื่อ 2026-09-01 ให้เปลี่ยนหน้าจอเป็น `เพิ่มตำแหน่งปลูก`
  สำหรับ limited operational Tree Register data entry; `exampleData=false` ได้
  เฉพาะ Firebase Production + Farm จริง (`isMock=false`) ส่วน Mock/Emulator/Farm
  จำลองต้องคง `exampleData=true`; source รุ่นนี้ยังไม่ได้ Deploy และรูปจริง/Storage,
  QR/ป้ายถาวร, PA-2, Controlled Pilot และโมดูลอื่นยังไม่ได้รับอนุมัติ
- Owner อนุมัติ DEC-047 เมื่อ 2026-09-01 ให้ Shared Target Selector คงทั้ง
  `แปลนต้น` และ `ตารางติ๊กเลือก` โดยใช้ selection เดียวกัน รองรับ Zone ทุกค่า
  แบบ data-driven เช่น Z02/Z03 และมี action จากตำแหน่งที่เลือกครบ Work ทั่วไป,
  Work ดูแล, Disease Incident, Fruit Observation และ Harvest Lot ตามสิทธิ์เดิม
- Owner อนุมัติ DEC-052 เมื่อ 2026-09-04 ให้หน้า `แปลนต้น` เลือกแสดง Row เป็น
  แนวตั้งหรือแนวนอน โดยคงลำดับ `treeSequence` เดิม และแสดงวงกลมต้นไม้พร้อม
  Human-readable TAG/หมายเลขใต้ต้น; การสลับทิศทางต้องไม่ล้าง selection
- Owner อนุมัติ DEC-048 เมื่อ 2026-09-01 ให้เพิ่ม Annual Farm Management Cycle
  ระดับ Farm รอบละ 12 เดือน ค่าเริ่มต้น 1 มิ.ย.–31 พ.ค. แต่ Owner กำหนดวันเริ่ม
  เฉพาะสวนได้; วางแผน Farm/Zone เป็นหลักและรายต้นเฉพาะจำเป็น; รอบ Closed แก้ได้
  เฉพาะ Correction พร้อม Audit/revision โดยอนุมัติ implementation แบบ Mock-first
  Local/Firebase Emulator เท่านั้น
- Owner อนุมัติ DEC-049 เมื่อ 2026-09-01 ให้เพิ่ม Unified Farm Management Report
  รายสัปดาห์ รายเดือน ราย 3 เดือน และรายปี พร้อมค่าแรง วัสดุ ค่าใช้จ่าย ผลผลิต
  ยอดขายเทียบต้นทุน Drill-down/CSV/Audit แบบ Mock-first Local/Firebase Emulator;
  ค่าแรงเป็น Management Cost ไม่ใช่ Payroll และไม่อนุมัติ Production cost write,
  ข้อมูลจริง บัญชี ภาษี Scheduler/Distribution Deployment PA-2/Pilot/Production
- Owner อนุมัติ DEC-050 เมื่อ 2026-09-01 ให้เจ้าขององค์กรเห็นข้อมูลทั้งหมด และ
  ผู้ใช้อื่นทุกคนไม่เห็นข้อมูลการเงิน; ต้องตรวจ trusted Organization membership
  `ACTIVE` + `isOwner=true`, แยก Financial record/collection จากข้อมูลปฏิบัติการ,
  ปฏิเสธ forged Owner และให้ legacy mixed document Fail closed; อนุมัติเฉพาะ
  Local/Mock/Firebase Emulator และเอกสาร ไม่อนุมัติ Deploy/Migration Production
- AIFC-01 ไม่อนุมัติภาพ/ข้อมูลจริง, public dataset, external AI/API/model,
  deployment, Production, Controlled Pilot, External Pilot Action, Phase 7
  execution หรือ commercial use; `AIFC-G1` ยังไม่ผ่าน
- DEC-010 ยังคง Phone + SMS OTP; DEC-040 อนุมัติ Auth จริงและ DEC-041 อนุมัติ
  Firestore Production เฉพาะ deterministic `SIMULATED/TEST ONLY`
- ยกเว้น DEC-040/041/042/046 ให้ห้าม Storage ที่ยังไม่ provision, Hosting deployment
  อื่นนอก limited Auth test,
  billing change เพิ่มเติม, production domain, service-account key และข้อมูลจริง
  นอก limited Tree Register scope ใน repository จนได้รับ approval แยกตาม Gate;
  DEC-027 และ DEC-046 ไม่ใช่ deployment authorization
- Phase 4–6 ใช้ Mock Data Pack ที่ versioned, deterministic, resettable และติดป้าย
  `SIMULATED/TEST ONLY`; ห้ามนำข้อมูลต้น/topology/บุคคลจริงเข้า repository หรือ
  Emulator และห้ามแต่งข้อมูลภาคสนามเป็นข้อมูลจริง
- topology/tag/physical configuration ยังไม่ถูกยืนยันจากภาคสนามและต้อง carry
  forward ไป Controlled Pilot / Physical Device Validation
- QR base URL ยัง `TBD`; ห้าม encode/พิมพ์ QR URL ที่ไม่ได้อนุมัติและห้ามผลิตป้ายถาวร
- Cross-Farm access ต้องถูกปฏิเสธทุกกรณี; Critical issue ต้องหยุดส่วนที่เกี่ยวข้อง
  เก็บหลักฐาน และรายงาน Owner
- Phase 5 อนุญาตเฉพาะ Crop Cycle, Fruit Observation, Harvest/Sales Lot,
  Inventory/direct-cost linkage, farm-scoped audit และ local/emulator tests ตาม
  Prompt Phase 5; customer reference ต้องเป็นข้อมูลขั้นต่ำและไม่ใช่ข้อมูลจริง
- Phase 6 ผ่าน Engineering Validation และ Gate 6 ผ่านตาม DEC-031
- Phase 7 ต้องหยุดที่ Pilot readiness/approval package จนกว่า Owner จะอนุมัติ
  environment, deployment, resource, cost, cohort, devices, data/privacy,
  evidence, backup/restore, incident, rollback และ field execution เป็นรายการ
- ห้ามสร้าง Firebase/Hosting/Storage/Auth project, billing, domain, credential,
  deploy, ส่ง SMS, ใช้ข้อมูลจริงนอก DEC-046, encode Test QR, ผลิตป้าย หรือลงพื้นที่
  ก่อน External Pilot Action approval; Production/Go-Live ต้องอนุมัติแยกหลัง Pilot
- แอปจริงต้องไม่พึ่ง external runtime CDN สำหรับ offline-critical flow และ
  network-denied smoke test ต้องไม่มี console error
- หลักฐาน Gate 3 และ deferral อยู่ที่ `08-Testing/Gate-3-Acceptance-Checklist.md`,
  `08-Testing/Physical-Device-Validation-Gate_v1.0.md` และ Owner Addendum Gate 3
- หลักฐาน Phase 4/Gate 4 อยู่ที่ `08-Testing/Phase-4-Validation-Report_v1.0.md`,
  `08-Testing/Gate-4-Acceptance-Checklist.md` และ Owner Addendum Gate 4
- หลักฐาน Phase 5 อยู่ที่ `08-Testing/Phase-5-Validation-Report_v1.0.md` และ
  `08-Testing/Gate-5-Acceptance-Checklist.md` และ Owner Addendum Gate 5
- หลักฐาน Phase 6/Gate 6 อยู่ที่ `08-Testing/Phase-6-Validation-Report_v1.0.md`,
  `08-Testing/Gate-6-Acceptance-Checklist.md` และ Owner Addendum Gate 6
- หลักฐานเตรียม Phase 7 อยู่ที่ Phase 7 Plan, Pilot Impact/Approval Pack,
  Controlled Pilot Runbook และ Phase 7 Pilot Readiness Checklist; การจัดทำเอกสาร
  เหล่านี้ไม่เท่ากับอนุมัติ Deploy, Field Pilot หรือ Production
- หลักฐาน Work photo จริงต้องใช้
  `08-Testing/Phase-7-Work-Photo-Physical-Device-Test-Protocol_v1.0.md`
  และห้ามทำเครื่องหมาย Passed ก่อนมี Android+iPhone evidence จริงครบ

## 3. เอกสารที่ต้องอ่านก่อนทำงาน

1. `01-Requirements/KDOMS_Development_Mock_Data_and_Pilot_Knowledge_v1.0.md`
2. `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`
3. `01-Requirements/KDOMS_Codex_Master_Prompt_v1.1.md`
4. `04-Tag-and-QR/Tag-and-QR-Standard_v0.1.md`
5. `05-UX-UI/KDOMS_UX_UI_Knowledge_v0.1.md`
6. `00-Project-Management/Decision-Log.md`
7. เมื่อทำงาน Farm Profile/Farm Management ให้อ่าน
   `01-Requirements/KDOMS_Farm_Profile_and_Management_Knowledge_v0.1.md`
8. เมื่อทำงาน AIFC-01 ให้อ่าน
   `01-Requirements/KDOMS_AI_Fruit_Counting_Feasibility_Knowledge_v0.1.md` และ
   `00-Project-Management/AI-Fruit-Counting-Feasibility-Plan_v0.1.md`
9. เมื่อทำงาน Disease Analysis ให้อ่าน
   `.agents/skills/kdoms-disease-analysis-development/SKILL.md`,
   `00-Project-Management/Owner-Review-Addendum_Disease-Analysis-P1_2026-09-01.md`
   และ `06-System-Architecture/Disease-Analysis-P1-Deterministic-Mock-Architecture_v0.1.md`
10. เมื่อทำงาน Orchard Layout หรือการเลือกเป้าหมาย ให้อ่าน
   `01-Requirements/KDOMS_Orchard_Layout_and_Target_Selection_Knowledge_v0.1.md`
11. เมื่อทำงานรอบปี แผนประจำปี การเลือกรอบ การปิดรอบ หรือข้อมูลรายปี ให้อ่าน
   `01-Requirements/KDOMS_Annual_Farm_Management_Cycle_Knowledge_v0.1.md`
12. เมื่อทำงานรายงานการจัดการสวน ต้นทุนแรงงาน ค่าใช้จ่าย หรือยอดขายเทียบต้นทุน
    ให้อ่าน `01-Requirements/KDOMS_Management_Reporting_and_Cost_Knowledge_v0.1.md`
    และ `01-Requirements/KDOMS_Report_Catalogue_and_KPI_Definitions_v0.1.md`

ลำดับอำนาจเมื่อข้อมูลขัดกัน:

1. คำสั่งล่าสุดของเจ้าของโครงการ
2. Development, Mock Data & Pilot Knowledge เวอร์ชันล่าสุดสำหรับ data/test/pilot timing
3. Scope Knowledge เวอร์ชันล่าสุด
4. Decision Log ที่มีสถานะ Approved
5. Master Prompt
6. เอกสารประกอบอื่น

สถานะมาตรฐานของ Decision Log คือ `Proposed`, `Open`, `Approved`, `Deferred`,
`Blocked` และ `Superseded` เท่านั้น สถานะ `Confirmed` ที่เคยใช้เป็นหลักฐานเชิง
ประวัติ ไม่เท่ากับการอนุมัติอย่างเป็นทางการ และห้ามยกระดับเป็น `Approved`
โดยไม่มีข้อความยืนยันจากเจ้าของโครงการ

## 4. กติกาการทำงาน

- รายงานและเขียนเอกสารหลักเป็นภาษาไทย ใช้คำอังกฤษกำกับเมื่อช่วยลดความกำกวม
- ก่อนแก้ไข ให้ตรวจ Working Directory, สถานะไฟล์ และเอกสาร Source of Truth
- ระหว่าง Development ให้ใช้ Mock Data Pack ที่สร้างซ้ำ/reset ได้ และอย่า block
  การสร้างฟังก์ชันเพราะยังไม่มี Physical/Field evidence
- เปลี่ยนแปลงครั้งละขอบเขตเล็กและตรวจสอบผลทุกครั้ง
- อย่าสร้างข้อเท็จจริงภาคสนาม เช่น จำนวนแถว พิกัด พันธุ์ หรือปีปลูก หากยังไม่มีหลักฐาน ให้ทำเครื่องหมาย `TBD`
- แยก `ข้อยืนยัน`, `ข้อเสนอ`, `ข้อสันนิษฐาน` และ `คำถามที่ต้องตัดสินใจ` ให้ชัดเจน
- รักษาไฟล์ของผู้ใช้และการเปลี่ยนแปลงที่ไม่เกี่ยวข้อง
- ห้ามลบหรือเขียนทับข้อมูลสำคัญโดยไม่มีการอนุมัติ
- ทุก Phase ต้องมีแผน เกณฑ์ผ่าน Gate ผลทดสอบ และสรุปสิ่งที่เปลี่ยน

## 5. กฎโดเมนที่ห้ามละเมิด

### Multi-Farm

- โครงสร้างหลักคือ `Organization → Farm → Farm-scoped data`
- ทุกข้อมูลเชิงปฏิบัติการต้องมี `organizationId` และ `farmId` หรืออยู่ภายใต้เส้นทางที่บังคับขอบเขตดังกล่าว
- สิทธิ์ของผู้ใช้ในสวนหนึ่งต้องไม่เปิดเผยข้อมูลอีกสวนหนึ่ง
- ผู้ใช้คนเดียวอาจมีบทบาทต่างกันในแต่ละสวน
- Dashboard รวมหลายสวนแสดงได้เฉพาะข้อมูลที่ผู้ใช้มีสิทธิ์
- ราคา ยอดขาย ยอดรับ/ค้าง ต้นทุน ค่าแรง ค่าใช้จ่าย แผนต้นทุน Financial KPI,
  Report, Audit, Drill-down และ Export เป็น Owner-only ตาม DEC-050
- การย้ายต้น วัสดุ หรือธุรกรรมระหว่างสวนอยู่นอก MVP จนกว่าจะอนุมัติเพิ่ม

### Tree identity

- ป้ายประจำตำแหน่งปลูกเป็นรหัสถาวรและไม่ถูกนำกลับไปใช้กับตำแหน่งอื่น
- Human-readable Tag Code ใช้รูปแบบข้อเสนอ
  `{organizationCode}-{farmSequence}-{zone}-{row}-{tree}` เช่น
  `KGL-F01-Z01-R03-T017` และต้องไม่ซ้ำภายใน namespace ของ Organization/Farm
- `organizationId`, `farmId` และ `positionId` ภายในระบบเป็น globally unique
  opaque IDs; Human-readable code ไม่ใช่ primary security boundary
- ต้นที่ปลูกทดแทนใช้ตำแหน่งเดิม แต่เพิ่ม `plantingCycle`
- QR ใช้ configurable permanent route `/t/{opaquePositionId}` ไม่เก็บข้อมูลโรค
  ยา หรือข้อมูลที่เปลี่ยนแปลงได้ และไม่ใช้แทน authorization
- GPS ใช้นำทางคร่าว ๆ ไม่ใช้ยืนยันต้นเพียงอย่างเดียว
- การยืนยันงานรายต้นใช้ Farm + Zone + Row + Position + QR

### Audit and offline

- เหตุการณ์สำคัญต้องมีผู้กระทำ เวลา สวน ต้นหรือกลุ่มเป้าหมาย และหลักฐานที่เกี่ยวข้อง
- งานภาคสนามต้องรองรับสัญญาณไม่เสถียรและแสดงสถานะ Pending/Syncing/Synced/Conflict
- การส่งข้อมูลซ้ำต้องออกแบบให้ idempotent
- ห้ามแก้ประวัติแบบเงียบ ๆ; ใช้ correction event หรือเก็บ before/after ใน audit log

## 6. คุณภาพและความปลอดภัย

- ใช้ TypeScript strict mode เมื่อเริ่มเขียนแอป
- Validation ต้องมีทั้งฝั่งผู้ใช้และฝั่งที่เชื่อถือได้
- Firebase Security Rules ต้องมี emulator tests โดยเฉพาะ Cross-Farm denial
- UI hiding ไม่ใช่ Financial security boundary; Non-owner ต้องไม่ query/receive
  Financial payload และ Rules ต้องปฏิเสธทุก Canonical Role รวม forged `ORG_OWNER`
- ห้ามเก็บ secret, service-account key หรือข้อมูลส่วนบุคคลจริงไว้ใน repository
- ใช้ข้อมูลจำลองในตัวอย่าง UX และการทดสอบ
- ค่า Mock ต้องติดป้าย `SIMULATED/TEST ONLY`; ข้อมูลจริงอนุญาตเฉพาะ Controlled
  Pilot/Production environment ที่ Owner อนุมัติและห้าม commit กลับ repository
- รูปภาพต้องมีนโยบายขนาดไฟล์ การบีบอัด และสิทธิ์เข้าถึงก่อนใช้จริง
- Work photo binary queue ต้องแยก Farm/actor, ใช้ idempotency key เดิม, ลบเมื่อ
  commit/logout/หมดอายุไม่เกิน 7 วัน และห้าม Retry จาก metadata อย่างเดียว
- Orphan/retention delete จริงต้องทำ server-side หลังตรวจ Work reference และมี
  approved Data Custodian, operator/approver, destination/region/key custody;
  ก่อน PA-1/PA-2 ใช้ได้เฉพาะ local `DRY_RUN`
- สำหรับ Work Order ใน Mock/local/Emulator ให้รับเฉพาะ JPEG/PNG/WebP ไม่เกิน
  5 MB ต่อไฟล์; รูปคำสั่งงานแนบโดยผู้สร้างเท่านั้นและแก้หลัง Assign ไม่ได้;
  รูปส่งงานรวมไม่เกิน 6 รูปและต้องมี BEFORE/AFTER อย่างน้อยประเภทละ 1 รูป
- Repository และ Mock Data Pack ใช้ได้เฉพาะรูปจำลอง/placeholder ที่ติดป้าย
  `SIMULATED/TEST ONLY`; ห้าม commit รูปสวน บุคคล หรือข้อมูลภาคสนามจริง

## 7. Definition of Done สำหรับงานเอกสาร

- ระบุเวอร์ชัน สถานะ เจ้าของ และวันที่ปรับปรุง
- เชื่อมโยงกับ Source of Truth ที่เกี่ยวข้อง
- ไม่มีค่าภาคสนามที่แต่งขึ้นโดยไม่ระบุว่าเป็นตัวอย่าง
- มี Acceptance Criteria หรือคำถามที่ต้องตัดสินใจ
- ตรวจคำศัพท์ รหัส Farm/Tree และขอบเขต Multi-Farm ให้สอดคล้องกัน
- อัปเดต Decision Log เมื่อมีการตัดสินใจใหม่

## 8. รูปแบบรายงานเมื่อจบงาน

รายงานสั้น ๆ เป็นภาษาไทยโดยระบุ:

1. ผลลัพธ์ที่ทำเสร็จ
2. ไฟล์ที่สร้างหรือแก้ไข
3. การตรวจสอบที่ทำ
4. ความเสี่ยงหรือคำถามที่ยังเปิด
5. Gate ปัจจุบันและขั้นตอนที่ต้องขออนุมัติต่อไป
