# Decision Log

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 5.2 |
| สถานะ | DEC-053 Approved — Orchard Layout Back Navigation ไปเมนูต้นไม้ |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-04 |
| Source of Truth | `AGENTS.md`, `01-Requirements/KDOMS_Development_Mock_Data_and_Pilot_Knowledge_v1.0.md`, `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`, `01-Requirements/KDOMS_Farm_Profile_and_Management_Knowledge_v0.1.md`, `01-Requirements/KDOMS_Annual_Farm_Management_Cycle_Knowledge_v0.1.md`, `01-Requirements/KDOMS_Management_Reporting_and_Cost_Knowledge_v0.1.md`, `00-Project-Management/Annual-Farm-Management-Cycle-Implementation-Prompt_v1.0.md`, `00-Project-Management/Management-Reporting-and-Cost-Implementation-Prompt_v1.0.md`, `00-Project-Management/Owner-Review-Addendum_Management-Reporting-and-Cost_2026-09-01.md`, `00-Project-Management/Phase-2-Farm-Management-Remediation-Prompt_v1.0.md`, `00-Project-Management/Owner-Review-Addendum_Tree-Register-Operational-Data-Entry_2026-09-01.md`, `01-Requirements/KDOMS_AI_Fruit_Counting_Feasibility_Knowledge_v0.1.md`, `00-Project-Management/AI-Fruit-Counting-Feasibility-Plan_v0.1.md`, `00-Project-Management/Owner-Review-Addendum_Disease-Analysis-P1_2026-09-01.md`, `06-System-Architecture/Disease-Analysis-P1-Deterministic-Mock-Architecture_v0.1.md`, `08-Testing/Disease-Analysis-P1-Validation-Report_v0.1.md`, `00-Project-Management/Owner-Review-Addendum_Development-Mock_Data_and_Pilot_Timing_2026-08-31.md`, `00-Project-Management/Owner-Review-Addendum_Gate-0_2026-08-31.md`, `00-Project-Management/Owner-Review-Addendum_Gate-1_2026-08-31.md`, `00-Project-Management/Owner-Review-Addendum_Gate-2_2026-08-31.md`, `00-Project-Management/Owner-Review-Addendum_Phase-3-Field-Validation-Pack_2026-08-31.md`, `00-Project-Management/Owner-Review-Addendum_Gate-3_2026-08-31.md`, `00-Project-Management/Owner-Review-Addendum_Gate-4_2026-08-31.md`, `00-Project-Management/Owner-Review-Addendum_Gate-5_2026-08-31.md`, `00-Project-Management/Owner-Review-Addendum_Gate-6_2026-08-31.md`, `00-Project-Management/Owner-Review-Decision_Phase-7-External-PA1_2026-08-31.md`, `00-Project-Management/Phase-7-Plan.md`, `09-Deployment/phase7-pa1-local-rehearsal-approval-v1.1.json`, `08-Testing/Phase-7-PA1-Local-Emulator-Rehearsal-Report_v1.1.md`, `06-System-Architecture/Phase-7-Work-Photo-Durable-Queue-and-Lifecycle-Architecture_v1.0.md`, `10-Operations/Phase-7-Photo-Data-Governance-Decision-Sheet_v1.0.md` |

> Owner อนุมัติ Gate 0 และ Gate 1 เมื่อ 2026-08-31 พร้อมเลือก Phone + SMS OTP
> สำหรับ DEC-010 และอนุญาตให้เริ่ม Phase 2 แบบ local/emulator-only
> Owner อนุมัติ Gate 2 เมื่อ 2026-08-31 และอนุญาตให้เริ่ม Phase 3 ตาม Prompt
> Phase 3 โดยยังคง Field Validation Gate และข้อห้าม Production
> Owner อนุมัติ Field Validation Pack v1.0 สำหรับ Controlled Field Validation
> 30 ต้น/5 ป้าย TEST ONLY/Android+iPhone โดย Gate 3 ยัง Blocked
> Owner อนุญาตให้กรอกข้อมูล Mockup และจำลอง Android/iPhone Technical Preflight
> เมื่อ 2026-08-31 โดยไม่อนุญาตอุปกรณ์/กล้อง/เครือข่ายจริงหรือการลงพื้นที่
> Owner ยอมรับ residual risk และ Deferred Physical Device Validation ไปก่อน
> Pre-Production/Operational Application Pilot; Gate 3 ผ่านและอนุมัติ Phase 4
> แบบ mock/Firebase Emulator only เมื่อ 2026-08-31
> Owner อนุมัติ Mock-first Development และแก้ timing ให้ Physical Device/Field
> Validation ดำเนินการระหว่าง Controlled Pilot หลัง Deploy Pilot Candidate;
> ไม่เป็นตัว block Phase การสร้างแอป แต่ต้องผ่านก่อน Production/permanent tags/
> operational scale-up เมื่อ 2026-08-31
> Owner อนุมัติ Gate 4 และอนุญาต Phase 5 ตาม Prompt Phase 5 แบบ
> Mock/local/Firebase Emulator only เมื่อ 2026-08-31 โดยไม่อนุญาต Phase 6
> Owner อนุมัติ Gate 5 และอนุญาต Phase 6 ตาม Prompt Phase 6 แบบ
> Mock/local/Firebase Emulator only เมื่อ 2026-08-31 โดยไม่อนุญาต Phase 7
> Owner อนุมัติให้ Work Order มีรูปประกอบจากผู้สร้าง และให้ Worker แนบรูป
> ก่อน–หลังเมื่อส่งงาน พร้อมให้อัปเดต Knowledge เมื่อ 2026-08-31
> Owner อนุมัติ Gate 6 และอนุญาตเริ่ม Phase 7 — Operational Application Pilot
> เมื่อ 2026-08-31 โดยกำหนดให้ตรวจ Pilot plan และรายการผลกระทบก่อน และยังไม่
> อนุมัติ Production deployment หรือ External Pilot Action ใดโดยอัตโนมัติ
> Owner อนุมัติโครงการย่อย AI Fruit Counting Feasibility (`AIFC-01`) เฉพาะ
> `AIFC-G0` และ WP0–WP2 แบบ Mock/local-only เมื่อ 2026-08-31; ไม่รวมภาพจริง,
> external AI, deploy, Production, Controlled Pilot, Phase 7 execution หรือ
> commercial use โดยบันทึกเป็น DEC-032 เพราะ DEC-031 ถูกใช้แล้วก่อนคำสั่งนี้
> Owner กำหนดให้การบันทึกจำนวนผลในแต่ละช่วงที่มีผลเลือกได้ทั้ง `คนนับ` และ
> `AI ช่วยนับ + คนตรวจ` โดยแยกที่มาของจำนวนออกจากขอบเขตการนับ และยังคง
> ข้อจำกัด AIFC-G0 แบบ Mock/local-only เมื่อ 2026-08-31
> Owner อนุมัติ Work Photo Resilience/Privacy เมื่อ 2026-08-31:
> retry/recovery อัตโนมัติ, resize/compress/strip EXIF-GPS, retention/backup/export
> policy และ Android/iPhone Controlled Pilot test; การทดสอบเครื่องจริงยังรอ PA-1/PA-2
> Owner สั่งให้นำค่า deterministic Mockup มากรอกช่อง Owner actual ของ PA-1 เมื่อ
> 2026-08-31 โดยคงป้าย `SIMULATED/TEST ONLY`; การกรอกนี้ไม่ใช่ PA-1 approval
> และไม่อนุญาต deployment, external resource, billing หรือข้อมูลจริง
> Owner กำหนด Pre-Pilot photo hardening เพิ่มเมื่อ 2026-08-31: Durable binary
> queue, server-side Orphan/retention worker, HEIC fallback validation, governance
> roles/destination/region/key custody และการตัดสิน retention/RPO/RTO ใน PA-1/PA-2
> Owner อนุมัติ PA-1 เฉพาะ Local/Emulator rehearsal ด้วย Mock Data เมื่อ
> 2026-08-31 โดยยืนยันว่าไม่อนุมัติ external resource, billing, deployment,
> credential, ข้อมูลจริง อุปกรณ์จริง การลงพื้นที่ หรือ Production
> Candidate `KDOMS-PC-SIM-20260831-02` ผ่าน Local/Browser/Firebase Emulator
> rehearsal หลังปิด Work list Rules defect; ผลนี้เป็น execution evidence ภายใต้
> DEC-037 เดิม ไม่ใช่ Owner decision ใหม่และไม่อนุญาต Deploy
> Owner ตัดสิน External PA-1 เป็น `NO-GO` เมื่อ 2026-09-01 เพราะ Owner actual
> values, governance, cost ceiling และ clean frozen deployable Candidate ยังไม่ครบ
> และ Source ปัจจุบันไม่ตรง local frozen snapshot เดิม; PA-2/Deployment/Production
> ยังคงห้ามดำเนินการ
> Post-decision update: source drift ฝั่ง Local ถูกปิดด้วย Candidate
> `KDOMS-PC-SIM-20260901-05` แต่ Candidate ยัง not deployable และ prerequisite
> ด้าน actual values/governance/cost/external controls ยังไม่ครบ จึงคง DEC-038
> เป็น `Blocked` โดยไม่มี External GO
> Owner อนุมัติ Disease Analysis `P1 — Deterministic Mock Analysis` เมื่อ
> 2026-09-01 สำหรับ Analysis Session, Mock Confidence, Abstain, Agronomist
> Human Review, audit/idempotency/Cross-Farm tests แบบ Local/Mock/Firebase
> Emulator เท่านั้น โดยไม่อนุมัติภาพจริง, external AI/API/model, diagnosis
> writeback, treatment automation, deployment, Pilot หรือ Production และ
> ยืนยันว่า DEC-026 ยังคง `Open`
> Owner อนุมัติให้เชื่อม Firebase Phone Authentication จริงแบบจำกัดเมื่อ
> 2026-09-01 สำหรับหมายเลขใน local allowlist และข้อมูลแอป `SIMULATED/TEST ONLY`
> เท่านั้น โดยไม่อนุมัติ Firestore/Storage/Hosting/deployment/Production; การส่ง
> SMS จริงต้องมี consent และนับตามโควตา Firebase ของโครงการ
> Owner แจ้งและ Firebase Console ยืนยันเมื่อ 2026-09-01 ว่า project plan เปลี่ยนเป็น
> Blaze (`Pay as you go`) แล้ว; การเปลี่ยนแผนนี้ไม่ใช่การอนุมัติ Hosting/deployment
> และ Phone Auth บนเว็บยังรอ hosted domain ตามข้อกำหนด Firebase
> Owner สั่งให้เปลี่ยน Web App ไปใช้ Firebase Production `durian-smartfarm`,
> ใช้ shared document `durian-smartfarm/root`, ยกเลิก Emulator จาก runtime ปกติ,
> วางปุ่ม Seed deterministic Mock Data ที่หน้าหลัก และอ่าน/เขียน Firestore จริง
> เมื่อ 2026-09-01; บันทึกเป็น DEC-041 โดยยังไม่อนุมัติข้อมูล/ภาพภาคสนามจริง,
> public Hosting, Controlled Pilot หรือการขยายใช้งานเชิงปฏิบัติการ
> Owner อนุมัติ Limited Firebase Hosting deployment ไปยัง
> `durian-smartfarm.web.app` เมื่อ 2026-09-01 เพื่อทดสอบ Phone OTP จริง โดย build
> ใช้ Firebase Auth จริง + Mock Data และคำสั่ง Deploy ต้องไม่รวม Firestore/Storage;
> deployment สำเร็จและยังไม่มีการส่ง SMS ในขั้นตรวจนี้
> Owner อนุมัติ Farm Management remediation เมื่อ 2026-09-01 ให้เพิ่มเมนู
> จัดการสวนสำหรับ ORG_OWNER, Farm Profile/Mockup, เพิ่ม/แก้ไข/ระงับ/เปิดใหม่/
> Archive พร้อม Audit และห้าม Hard delete โดยให้พัฒนาแบบ Local/Mock/Firebase
> Emulator และตรวจเท่าที่จำเป็น; ข้อมูลจริงและ deployment ยังไม่อนุมัติ
> Owner สั่งให้แก้การส่งออกและนำเข้าทะเบียนต้นผ่าน Excel/Google Sheets เป็น
> ภาษาไทยเมื่อ 2026-09-01; แม่แบบใหม่ใช้หัวคอลัมน์/ค่าตัวเลือกภาษาไทย และยัง
> รองรับไฟล์ภาษาอังกฤษรุ่นเดิมโดย normalize เป็น canonical value ก่อน validation
> Owner ยืนยัน Orchard Layout และ Shared Target Selector เมื่อ 2026-09-01:
> แถวเรียงซ้ายไปขวา ต้นเรียงบนลงล่าง เลขแถวเริ่มใหม่ต่อ Zone เลขต้นเริ่มใหม่ต่อ
> Row ด้านบนต้องมีจุดอ้างอิง เลือกชุดต้นข้าม Zone ใน Farm เดียวกันได้ และ Position
> `ไม่มีต้น` เลือกเฉพาะ Workflow ที่รองรับ; อนุมัติ implementation แบบ Mock-first เท่านั้น
> Owner สั่งให้เปลี่ยนหน้าจอเพิ่มตำแหน่งปลูกจากแบบจำลองเป็นหน้าจอสำหรับเริ่มใช้
> งานจริงเมื่อ 2026-09-01 และให้ใช้รูปแบบหน้าต่างที่แนะนำ; อนุมัติข้อมูลทะเบียนต้น
> ภาคสนามจริงเฉพาะ Firebase Production + Farm จริง (`isMock=false`) โดย Mock,
> Emulator และ Farm จำลองยังต้องเก็บ `exampleData=true`; การ Deploy รุ่นนี้,
> รูปจริง/Storage, QR/ป้ายถาวร, PA-2 และ rollout โมดูลอื่นยังต้องอนุมัติแยก
> Owner ยืนยันเมื่อ 2026-09-01 ให้เก็บ Shared Target Selector ทั้งสองรูปแบบ คือ
> `แปลนต้น` และ `ตารางติ๊กเลือก`; ต้องรองรับหลาย Zone เช่น Z02/Z03 แบบ data-driven
> และมีเมนูสร้างรายการจากตำแหน่งที่เลือกครบสำหรับ Work ทั่วไป, Work ดูแล,
> Disease Incident, Fruit Observation และ Harvest Lot ตามสิทธิ์/eligibility เดิม
> Owner สั่งออกแบบหน้าแปลนตำแหน่งต้นใหม่เมื่อ 2026-09-04 ให้เลือกแสดงแถว
> แนวตั้งหรือแนวนอนได้ และแสดงตำแหน่งต้นเป็นวงกลมพร้อม TAG/หมายเลขใต้ต้น
> โดยยังคง Farm/Position identity, selection และ Workflow eligibility เดิม
> Owner อนุมัติ Annual Farm Management Cycle เมื่อ 2026-09-01 ให้หนึ่งรอบยาว
> 12 เดือน ค่าเริ่มต้นมิถุนายน–พฤษภาคม แต่ Owner กำหนดวันเริ่มเฉพาะสวนได้;
> วางแผนระดับ Farm/Zone เป็นหลัก ใช้รายต้นเฉพาะจำเป็น และรอบ Closed แก้ได้เฉพาะ
> Correction พร้อม Audit/revision โดย implementation เป็น Mock-first เท่านั้น
> Owner อนุมัติข้อเสนอรายงานการจัดการสวนและต้นทุนเมื่อ 2026-09-01 ให้พัฒนา
> รายสัปดาห์ รายเดือน ราย 3 เดือน และรายปี รวมผลผลิต ยอดขาย ค่าแรง ปุ๋ย
> สารป้องกันกำจัดศัตรูพืช ฮอร์โมน และค่าใช้จ่ายอื่นแบบ Mock-first; ไม่ใช่
> Payroll/บัญชี/ภาษี และไม่อนุมัติ Deployment หรือข้อมูลจริง
> Owner ยืนยันเมื่อ 2026-09-01 ว่าเจ้าของต้องเห็นข้อมูลทั้งหมด และผู้ใช้อื่นทุกคน
> ต้องไม่เห็นข้อมูลที่เกี่ยวกับการเงิน จึงกำหนด Financial Data Boundary แยกจาก
> ข้อมูลปฏิบัติการ และใช้ trusted Organization Owner flag ไม่เชื่อชื่อ Role จาก Client

| ID | เรื่อง | สถานะ | ข้อสรุปปัจจุบัน | แหล่งที่มา/ขั้นตอนต่อไป |
|---|---|---|---|---|
| DEC-001 | รูปแบบผลิตภัณฑ์ | Approved | Responsive Web App / PWA | Project Owner, Gate 0 Review, 2026-08-31 |
| DEC-002 | Technology baseline | Approved | Vite + React + TypeScript + Firebase; local/emulator-first | Project Owner, Gate 0 Review, 2026-08-31; ห้าม production/billing/deployment |
| DEC-003 | Multi-Farm | Approved | Organization มีหลาย Farm; ข้อมูลปฏิบัติการและสิทธิ์แยกตาม Farm | Project Owner, Gate 0 Review, 2026-08-31 |
| DEC-004 | Tree identity | Approved | Human Tag ระบุตำแหน่งถาวร; ปลูกทดแทนเพิ่ม `plantingCycle`; internal IDs เป็น opaque และ unique ทั้งระบบ | Project Owner, Gate 0 Review, 2026-08-31 |
| DEC-005 | ขนาดกลุ่มตรวจภาคสนาม | Approved | ขอบเขตเริ่มต้นของ Controlled Pilot ใช้ป้ายทดลองและ cohort จำกัดตาม Owner อนุมัติ; จำนวนเดิม 5–10 ป้ายและ 30–50 ต้นยังเป็น planning baseline ไม่ใช่ข้อมูลภาคสนามจริง | Project Owner, Gate 0 Review, 2026-08-31; timing ก่อนล็อก Phase 3 ถูกแทนโดย DEC-027 |
| DEC-006 | Tag material | Approved | อะลูมิเนียม 10×15 ซม. พิมพ์ UV/เลเซอร์ เคลือบด้าน ติดเสาแยก เป็นข้อเสนอสำหรับทดสอบ 5–10 ป้ายเท่านั้น | Project Owner, Gate 0 Review, 2026-08-31; ยังไม่อนุมัติผลิตจำนวนมาก |
| DEC-007 | Human-readable Tag namespace | Approved | `{organizationCode}-{farmSequence}-{zone}-{row}-{tree}`; ตัวอย่าง `KGL-F01-Z01-R03-T017` โดย `KGL` คือ organizationCode และ `F01` คือ farmSequence | Project Owner, Gate 0 Review, 2026-08-31; รหัสภาคสนามจริงยัง `TBD` |
| DEC-008 | QR route และ production domain | Approved | Configurable base URL + `/t/{opaquePositionId}`; QR ไม่ใช่ authorization | Project Owner, Gate 0 Review, 2026-08-31; production domain เลื่อนไปก่อนผลิตป้ายจริง/Phase 3 sign-off |
| DEC-009 | Canonical roles | Approved | `ORG_OWNER`, `FARM_MANAGER`, `AGRONOMIST`, `WORKER`, `SALES_INVENTORY`, `VIEWER`, `AUDITOR` และ Role/Access Matrix แบบ least privilege | Project Owner, Gate 0 Review, 2026-08-31 |
| DEC-010 | Sign-in method | Approved | เบอร์โทรศัพท์ + SMS OTP; Phase 2 ใช้หมายเลขและ OTP ทดสอบบน Firebase Authentication Emulator เท่านั้น | Project Owner, Gate 1 Review, 2026-08-31; Production SMS/Auth/billing ยังไม่อนุมัติ และต้องกำหนด account recovery ก่อน production |
| DEC-011 | Offline conflict policy | Approved | Append-oriented events + idempotency; master-data conflict ให้ `FARM_MANAGER` review และ escalate ถึง `ORG_OWNER`; ใช้ correction event | Project Owner, Gate 0 Review, 2026-08-31 |
| DEC-012 | Sales MVP boundary | Approved | Harvest/Sales lot, customer reference ขั้นต่ำ, ราคา, มัดจำ, รับแล้ว, ค้าง; ไม่รวม accounting/tax/payroll/banking | Project Owner, Gate 0 Review, 2026-08-31 |
| DEC-013 | Cross-farm transfer | Deferred | ไม่รวมการโอนต้น สต็อก เงิน หรือประวัติระหว่างสวนใน MVP | พิจารณาหลัง Operational Application Pilot |
| DEC-014 | Product display name | Approved | Display name `Smart Durian Farm`; technical name `KDOMS` | Project Owner, Gate 0 Review, 2026-08-31 |
| DEC-015 | Phase 1 start | Approved | Gate 0 ผ่าน อนุมัติเริ่ม Phase 1 Foundation | Project Owner, Gate 0 Review, 2026-08-31; Phase 1 เสร็จและ Gate 1 ผ่านแล้ว |
| DEC-016 | Internal identifiers | Approved | `organizationId`, `farmId`, `positionId` และ record IDs เป็น globally unique opaque IDs; ห้ามเชื่อถือ human code เป็น authorization | Project Owner, Gate 0 Review, 2026-08-31 |
| DEC-017 | Data policy baseline | Approved | Least privilege, data minimization, farm-scoped export with audit, archive-before-delete; ห้าม real/production data จนกว่า retention/backup/privacy จะ Approved | Project Owner, Gate 0 Review, 2026-08-31 |
| DEC-018 | Gate/Pilot terminology | Superseded | Gate 0 = Product & Documentation Readiness; timing เดิมที่ให้ Field Validation อยู่ก่อนล็อก Phase 3 ถูกแทนแล้ว; Operational Application Pilot ยังคงเป็น Pilot หลัง Engineering build | Superseded by DEC-027, 2026-08-31; เก็บไว้เป็นประวัติ |
| DEC-019 | Offline-critical runtime dependency | Approved | แอปจริงต้องไม่พึ่ง external runtime CDN สำหรับ offline-critical flow และ network-denied smoke test ต้องไม่มี console error | Project Owner, Gate 0 Review, 2026-08-31; หลักฐาน Gate 1 ผ่าน |
| DEC-020 | Phase 2 start | Approved | Gate 1 ผ่าน อนุมัติเริ่ม Phase 2 Multi-Farm & Access Control ตาม Prompt Phase 2 แบบ local/emulator-only | Project Owner, Gate 1 Review, 2026-08-31; Phase 2 เสร็จและ Gate 2 ผ่านแล้ว |
| DEC-021 | Phase 3 start | Approved | Gate 2 ผ่าน อนุมัติเริ่ม Phase 3 Tree Register & QR ตาม Prompt Phase 3 แบบ local/emulator-only | Project Owner, Gate 2 Review, 2026-08-31; Phase 3 เสร็จและ Gate 3 ผ่านแล้วตาม DEC-024/025 |
| DEC-022 | Phase 3 Controlled Field Validation | Approved | ใช้ Pack v1.0 สำรวจจริง 30 ต้นในสวนทดลอง 1 แห่ง, ป้ายชั่วคราว `TEST ONLY` 5 ป้าย, Android ≥1 และ iPhone ≥1; QR base URL `TBD`; Cross-Farm ต้อง deny ทุกกรณี | Project Owner, Controlled Field Validation Review, 2026-08-31; ต้องปิด Field Execution Brief ก่อนลงพื้นที่, Critical issue ให้หยุด/รายงาน, ไม่ใช่ Gate 3 approval |
| DEC-023 | Simulated Android/iPhone Technical Preflight | Approved | อนุญาตกรอกค่าจาก Mockup เป็น `SIMULATED/TEST ONLY` และจำลอง Android/iPhone viewport, local network/Test URL และ application flows; ห้ามอ้างเป็น Physical Device/Field evidence | Project Owner, 2026-08-31; simulation ผ่าน; Gate status ภายหลังเปลี่ยนตาม DEC-024/025 โดย Physical evidence ยังไม่ผ่าน |
| DEC-024 | Physical Device Validation timing และ Owner risk acceptance | Superseded | หลักฐาน Android/iPhone, camera, QR, network และ field ยังคง `Deferred / Not Passed`; เงื่อนไขเดิมที่ต้องผ่านก่อน Pilot Candidate ถูกแทนด้วยการทดสอบระหว่าง Controlled Pilot | Superseded by DEC-027, 2026-08-31; automated/simulation ยังไม่เท่ากับผ่านและ defect ต้องแก้/retest ก่อน Production |
| DEC-025 | Gate 3 และ Phase 4 start | Approved | Gate 3 ผ่าน อนุมัติเริ่ม Phase 4 — Work, Care & Disease แบบ mock data/Firebase Emulator only | Project Owner, Gate 3 Review, 2026-08-31; ห้าม Production, public deployment, real SMS/phone, credential, field work, permanent tag และ Phase 5 |
| DEC-026 | Chemical/treatment approval policy | Open | Phase 4 ใช้ conservative workflow: observed symptom แยก diagnosis, Worker ห้ามยืนยัน diagnosis/approve treatment, chemical/treatment คง `PENDING_SPECIALIST` จน Agronomist อนุมัติ และไม่มีคำแนะนำสารเคมีอัตโนมัติ | ต้องให้ Owner/Agronomist กำหนด policy จริงก่อน field use/Production; ไม่ block local Phase 4 |
| DEC-027 | Mock-first Development และ Pilot validation timing | Approved | Phase การสร้างแอปและ Engineering Gate ใช้ versioned/resettable `SIMULATED/TEST ONLY` data โดยไม่รอ Physical/Field evidence; Deploy Pilot Candidate แบบจำกัดสิทธิ์ก่อน แล้วเก็บ real-device/field evidence ระหว่าง Controlled Pilot; ต้องผ่านก่อน Production, permanent tags หรือ scale-up | Project Owner instruction, Owner Review Addendum — Development Mock Data and Pilot Timing, 2026-08-31; ไม่ข้าม Phase Gate และไม่อนุมัติ deployment/real data ทันที |
| DEC-028 | Gate 4 และ Phase 5 start | Approved | Gate 4 ผ่าน อนุมัติเริ่ม Phase 5 — Fruit, Harvest, Sales & Inventory แบบ Mock/local/Firebase Emulator only ตาม Prompt Phase 5 | Project Owner, Gate 4 Review, 2026-08-31; Phase 5 ผ่าน Engineering Validation และรอ Gate 5; ห้าม Production/deployment/ข้อมูลจริง/Phase 6 |
| DEC-029 | Gate 5 และ Phase 6 start | Approved | Gate 5 ผ่าน อนุมัติเริ่ม Phase 6 — Dashboard, Offline, Audit & Security Hardening แบบ Mock/local/Firebase Emulator only ตาม Prompt Phase 6 | Project Owner, Gate 5 Review, 2026-08-31; Phase 6 ผ่าน Engineering Validation และ Gate 6 ผ่านแล้วตาม DEC-031 |
| DEC-030 | Work Order instruction photo และ Worker completion evidence | Approved | ผู้สร้าง Work Order แนบรูปประกอบได้ 0–3 รูปเฉพาะขณะ `DRAFT` ก่อน Assign; Worker Report ต้องมีรูป `BEFORE` อย่างน้อย 1 และ `AFTER` อย่างน้อย 1 รวมไม่เกิน 6 รูปและทุกไฟล์ต้องอัปโหลดสำเร็จก่อน Submit; รูปทั้งสองชุดแยก purpose, Farm/Work scope, สิทธิ์ และ audit อย่างชัดเจน | Project Owner instruction, 2026-08-31; ดำเนินการแบบ Mock/local/Firebase Emulator และอัปเดต Knowledge โดยไม่อนุญาต Production/ข้อมูลจริง |
| DEC-031 | Gate 6 และ Phase 7 start | Approved | Gate 6 ผ่านและอนุมัติเริ่ม Phase 7 — Operational Application Pilot เพื่อจัดทำ Pilot Candidate readiness, Pilot plan, impact/cost review, runbook, evidence และ operations package; ยังไม่อนุมัติ Production deployment และ External Pilot Action ต้องขออนุมัติแยกเป็นรายการ | Project Owner, Gate 6 Review, 2026-08-31; Owner Addendum Gate 6; ห้ามสร้าง external resource, deploy, billing, credential, real SMS/data, QR/ป้ายจริง หรือเริ่ม Field Pilot ก่อน Owner ตรวจและอนุมัติ Pilot plan/ผลกระทบ |
| DEC-032 | AI Fruit Counting Feasibility (`AIFC-01`) | Approved | อนุมัติ `AIFC-G0` และ WP0–WP2 แบบ Mock/local-only สำหรับ Knowledge, Plan, Architecture, Capture/Ground-Truth Protocol, Acceptance Checklist และ deterministic mock workflow/harness; ผล AI ต้องเป็น `SIMULATED/TEST ONLY` และเริ่มต้นเป็น `ESTIMATED` พร้อม Human Review | Project Owner instruction, 2026-08-31; ไม่อนุมัติภาพ/ข้อมูลจริง, external AI/API/model, deploy, Production, Controlled Pilot, External Pilot Action, Phase 7 execution หรือ commercial use; ใช้ DEC-032 เนื่องจาก DEC-031 มีอยู่ก่อนแล้ว |
| DEC-033 | ทางเลือกที่มาของจำนวนผล: คนนับหรือ AI ช่วยนับ | Approved | Fruit Observation ในช่วงที่มีผลต้องเลือก `countingMode` เป็น `MANUAL` หรือ `AI_ASSISTED`; ค่านี้แยกจาก `countMethod` (`FULL_COUNT`/`SAMPLE`/`ESTIMATE`/`UNKNOWN`) เพื่อให้ใช้หลายวิธีได้และตรวจย้อนกลับได้ โหมด AI ต้องให้คนตรวจ/แก้ก่อนบันทึก, อ้าง Count Session, เป็น `ESTIMATED` และห้ามอ้าง `FULL_COUNT` ใน AIFC-G0 | Project Owner instruction, 2026-08-31; FLOWERING ยังไม่ใช้ AI fruit count และขอบเขตยังเป็น `SIMULATED/TEST ONLY` Mock/local-only ตาม DEC-032 |
| DEC-034 | Work Photo Resilience, Privacy & Pilot Validation | Approved | Work photo ต้องเตรียมเป็น WebP ≤1,600px/≤5MB โดยไม่ส่ง EXIF/GPS; retry ไม่เกิน 3 ครั้งและสร้าง Phase 6 `FAILED`/`ORPHANED` recovery record อัตโนมัติ; จัดทำ retention/backup/export baseline และทดสอบกล้อง/upload บน Android/iPhone ระหว่าง Controlled Pilot | Project Owner instruction, 2026-08-31; ค่า retention/RPO/RTO ที่เสนอยังต้องยืนยันใน PA-1/PA-2; ไม่อนุมัติ deploy, ข้อมูล/ภาพจริง หรือลงพื้นที่ก่อน PA-1/PA-2 |
| DEC-035 | Owner-selected PA-1 Mock Substitute | Approved | ให้นำค่า PA-1 จาก deterministic Owner Mockup มากรอกช่อง Owner input โดยติดป้าย `OWNER-DIRECTED MOCK SUBSTITUTE / SIMULATED/TEST ONLY`; ใช้เพื่อทำแบบฟอร์มและตรวจซ้ำเท่านั้น ไม่ทำให้ค่า Mock เป็นข้อเท็จจริงหรือ external configuration | Project Owner instruction, 2026-08-31; PA-1 ยัง `NOT_APPROVED`, Candidate ยัง `NOT_FROZEN_NOT_DEPLOYABLE`, ห้าม deployment/resource/billing/real data จนมี approval แยก |
| DEC-036 | Pre-Pilot Work Photo Durable Queue, Lifecycle และ Governance | Approved | ก่อน Pilot ให้มี IndexedDB durable binary queue ที่ Retry ต่อหลังปิด/reload, server-side Orphan/retention worker แบบ fail-closed, HEIC decode test พร้อม JPEG/approved on-device conversion fallback และ governance decision sheet; Owner ต้องรับ/แก้ retention/RPO/RTO พร้อมระบุ Data Custodian, operator/approver, destination/region/key custody | Project Owner instruction, 2026-08-31; อนุมัติ implementation/validation แบบ Local/Mock/Emulator เท่านั้น ค่า policy/ผู้รับผิดชอบ/resource จริงยัง `TBD`; worker `ENFORCE`, external scheduler/storage, อุปกรณ์/ภาพจริง และ Pilot ยังรอ PA-1/PA-2 |
| DEC-037 | PA-1 Local/Emulator Mock Rehearsal | Approved | อนุมัติ freeze Candidate snapshot และดำเนิน local/browser/Firebase Emulator rehearsal ด้วย deterministic Mock Data ตาม Owner PA-1 form; Candidate `KDOMS-PC-SIM-20260831-02` ผ่านตามรายงาน v1.1 | Project Owner exact approval, 2026-08-31; ห้าม external resource, billing, credential, deployment, real data/device, field execution, QR print และ Production; External PA-1/PA-2/PA-3 ยังต้องอนุมัติแยก |
| DEC-038 | Phase 7 External PA-1 | Blocked | Owner ตัดสิน `NO-GO`; คง PA-1 เฉพาะ Local/Emulator ตาม DEC-037 และห้ามสร้าง external resource, billing, credential หรือ deployment เพราะ ณ เวลาตัดสิน actual values/governance/cost ceiling/clean frozen deployable Candidate ยังไม่ครบและ Source ไม่ตรง snapshot เดิม; ต่อมา Local source drift ปิดด้วย Candidate `...-05` แต่ Candidate ยัง not deployable และ blocker อื่นยังเปิด | Project Owner exact decision, 2026-09-01; จัด Owner Review ใหม่เมื่อ prerequisite ครบ และต้องรอ Owner `GO` ก่อน External Action; PA-2, Controlled Pilot, Physical/Field, Test QR, real data/photo/phone/SMS/participant, Public และ Production ยังไม่อนุมัติ |
| DEC-039 | Disease Analysis P1 — Deterministic Mock Analysis | Approved | อนุมัติ Analysis Session, neutral mock candidate finding, Mock Confidence/Quality, Abstain, Agronomist Human Review, append-oriented audit, idempotency, wrong-tree และ Cross-Farm validation แบบ Local/Mock/Firebase Emulator; Human Review ไม่เขียน `confirmedDiagnosis` และไม่สร้าง Treatment Work Order อัตโนมัติ | Project Owner exact instruction และ Owner Review Addendum Disease Analysis P1, 2026-09-01; ไม่อนุมัติภาพ/ข้อมูลจริง, dataset, external AI/API/model, credential, billing, deployment, Pilot หรือ Production; DEC-026 คง `Open`; P2 ต้องขออนุมัติแยก |
| DEC-040 | Limited Firebase Phone Auth จริง | Approved | อนุมัติ technical test โดยเชื่อม Web App กับ Firebase Phone Authentication จริงและส่ง SMS เฉพาะหมายเลขที่กำหนดใน local allowlist; เมื่อยืนยันสำเร็จให้เข้าถึงเฉพาะ Mock Owner และข้อมูล `SIMULATED/TEST ONLY` ในเครื่อง | Project Owner exact instruction, 2026-09-01; Firebase Console ยืนยัน plan = Blaze (`Pay as you go`) เมื่อ 2026-09-01; ต้องแจ้ง consent ก่อนส่งหมายเลขให้ Google; real SMS บนเว็บต้องใช้ HTTPS hosted domain และยังไม่อนุมัติ Firestore/Storage/Hosting, public deploy, real farm data, PA-2 หรือ Production; account recovery ยังคง Open; DEC-038 ยังคง Blocked นอก carve-out นี้ |
| DEC-041 | Firebase Production Firestore Shared Root และ Production Mock Seed | Approved | เปลี่ยน runtime ปกติเป็น Firebase Production project `durian-smartfarm`; เก็บข้อมูลใต้ document `durian-smartfarm/root` แล้วแยก `Organization → Farm → menu collection` โดยไม่สร้างโฟลเดอร์ข้อมูลปฏิบัติการตาม User; อนุมัติ Deploy Firestore Rules/Indexes และ Seed เฉพาะ deterministic `SIMULATED/TEST ONLY` จากปุ่มหน้าหลักหลัง Phone Auth | Project Owner exact instruction, 2026-09-01; Firestore Rules/Indexes Deploy สำเร็จ; Storage Rules Deploy ยัง Blocked เพราะ Firebase Storage ยังไม่ผ่านขั้นตอน Get Started จึงข้าม placeholder 3 ไฟล์; Anonymous/ผู้ใช้ทั่วไปใช้ shared path เดียวกันแต่ต้องมี Farm membership และห้าม Seed/Admin; ไม่อนุมัติข้อมูล/ภาพจริง, public Hosting, Controlled Pilot, PA-2 หรือ operational Production rollout |
| DEC-042 | Limited Firebase Hosting สำหรับ Phone Auth จริง + Mock Data | Approved | อนุมัติ Deploy Web App ไปยัง `durian-smartfarm.web.app` เฉพาะ build ที่ใช้ Firebase Phone Auth จริงและ Mock data adapter; คำสั่ง Deploy จำกัด `--only hosting` และไม่ Deploy Firestore/Storage | Project Owner exact instruction, 2026-09-01; Hosting deploy สำเร็จ 60 files; หน้า HTTPS แสดง `Firebase Phone Auth จริง · Mock Data` และไม่มี browser console error; allowlist ใช้ PBKDF2 digest โดย raw phone อยู่เฉพาะ ignored local env; ยังไม่อนุมัติข้อมูลจริง, Storage, PA-2, Controlled Pilot หรือ operational Production rollout |
| DEC-043 | Farm Profile และ Farm Management Remediation | Approved | อนุมัติ Knowledge/Prompt และ implementation แบบ Local/Mock/Firebase Emulator สำหรับเมนู `เพิ่มเติม → จัดการสวน` ของ `ORG_OWNER`; เพิ่ม/แก้ไข/ระงับ/เปิดใช้งานใหม่/Archive พร้อม Audit, atomic Owner membership, idempotency, duplicate-code/Cross-Farm denial และ deterministic Farm Profile Mockup 4 สวน; ห้าม Hard delete | Project Owner exact instruction, 2026-09-01; ใช้ `KDOMS_Farm_Profile_and_Management_Knowledge_v0.1.md` และ Prompt Remediation v1.0; ไม่อนุมัติข้อมูลจริง, Firebase/Hosting deploy, Storage, PA-2, Controlled Pilot หรือ operational Production rollout |
| DEC-044 | ภาษาไทยสำหรับ Excel/Google Sheets ทะเบียนต้น | Approved | แม่แบบทะเบียนต้นที่ส่งออกใช้หัวคอลัมน์ คำแนะนำ ตัวอย่าง และค่าตัวเลือกภาษาไทยครบ 49 คอลัมน์; import รองรับภาษาไทยและไฟล์ภาษาอังกฤษรุ่นเดิม แต่ปฏิเสธไฟล์ที่ผสมหัวคอลัมน์สองภาษา และ normalize ค่าเป็น canonical ก่อน validation/บันทึก | Project Owner exact instruction, 2026-09-01; เป็นการปรับ UX/compatibility ภายใต้ขอบเขตข้อมูลเดิม ไม่อนุมัติข้อมูลจริง, deployment, PA-2, Controlled Pilot หรือ Production rollout |
| DEC-045 | Orchard Layout และ Shared Target Selector | Approved | แสดง Farm/Zone/Row/Tree เป็นแปลนเชิงโครงสร้าง โดย Row เรียงซ้าย→ขวาและเริ่ม `R01` ใหม่ต่อ Zone, Tree เรียงบน→ล่างและเริ่ม `T001` ใหม่ต่อ Row; ด้านบนมี reference label; ใช้ตัวเลือกกลางสำหรับ Work/Disease/Fruit/Harvest, เลือกชุดต้นข้าม Zone ใน Farm เดียวกันได้ และจำกัด Position `ไม่มีต้น` ตาม Workflow | Project Owner exact confirmation, 2026-09-01; อนุมัติ Knowledge/implementation/test แบบ Local/Mock/Firebase Emulator เท่านั้น จุดอ้างอิง/topology จริงยัง `TBD`; ไม่อนุมัติข้อมูลจริง, deployment เพิ่ม, Controlled Pilot, PA-2 หรือ Production rollout |
| DEC-046 | Tree Register Operational Data Entry | Approved | เปลี่ยนหน้าจอเป็น `เพิ่มตำแหน่งปลูก` แบบแบ่งส่วน และอนุมัติให้สร้าง/แก้ข้อมูลทะเบียนต้นภาคสนามจริงได้เฉพาะ Firebase Production + Farm จริง (`isMock=false`); Mock/Emulator/Farm จำลองยังเป็น `exampleData=true`; รองรับ Zone/Row confirmation, Planting Cycle, แหล่งต้นพันธุ์ และ GPS/ลำต้น/ทรงพุ่ม/ความสูงพร้อม measurement evidence | Project Owner exact instruction และ `Owner-Review-Addendum_Tree-Register-Operational-Data-Entry_2026-09-01.md`, 2026-09-01; เป็น limited real-data carve-out ของ Tree Register เท่านั้น ไม่ใช่คำสั่ง Deploy และไม่อนุมัติรูปจริง/Storage, QR/ป้ายถาวร, PA-2, Controlled Pilot หรือ broader Production rollout |

| DEC-047 | Orchard Selector สองมุมมองและเมนูจากตำแหน่งที่เลือก | Approved | Shared Target Selector ต้องมีทั้ง `แปลนต้น` และ `ตารางติ๊กเลือก` โดยใช้ selection เดียวกันขณะสลับมุมมอง; แยก Zone ทุก Zone ที่มีในทะเบียนแบบ data-driven ไม่จำกัด Z01; หน้าแปลนมี action ครบ 5 ปลายทางตาม scope คือ Work ทั่วไป, Work ดูแล, Disease Incident, Fruit Observation และ Harvest Lot พร้อมส่ง intent + opaque Position IDs ไปยังฟอร์มที่ถูกต้อง | Project Owner exact instruction, 2026-09-01; พัฒนา/ทดสอบแบบ Mock-first และคง Role/Farm/empty-tree eligibility, Cross-Farm denial, QR confirmation และ boundary เดิม; ไม่อนุมัติ deployment, ข้อมูลจริงของ Work/Disease/Fruit/Harvest, PA-2, Controlled Pilot หรือ broader Production rollout |
| DEC-048 | Annual Farm Management Cycle | Approved | เพิ่มรอบบริหารสวนรายปีระดับ Farm; ค่าเริ่มต้น 1 มิ.ย.–31 พ.ค. Owner กำหนดวันเริ่มเฉพาะสวนได้โดยรอบยาว 12 เดือน; วางแผน Farm/Zone เป็นหลักและ Tree Set เฉพาะจำเป็น; Annual Cycle แยกจาก Crop Cycle/Planting Cycle; Cycle header/closed summary ของรอบ Closed แก้ได้เฉพาะ Correction พร้อม Audit/revision ส่วน Plan ใหม่ระหว่าง Active/Closing เป็น append-only ตามสิทธิ์ | Project Owner exact instruction, 2026-09-01; ผล Local/Mock/Firebase Emulator/Browser อยู่ที่ `08-Testing/Annual-Farm-Management-Cycle-Validation-Report_v1.0.md`; ไม่อนุมัติ deployment, ข้อมูลจริงนอก DEC-046, PA-2, Controlled Pilot หรือ Production rollout |
| DEC-049 | Management Reporting and Cost Baseline | Approved | เพิ่ม Unified Farm Management Report รายสัปดาห์ รายเดือน ราย 3 เดือน และรายปี; รวมงาน โรค/ติดตาม จำนวนผล Harvest/Sales ต้นทุนวัสดุจาก Inventory Issue ค่าแรง ค่าใช้จ่ายดำเนินงาน และยอดขายเทียบต้นทุน; แยก Capital และระบุว่า Management Margin ไม่ใช่กำไรบัญชี; บันทึกต้นทุนแบบ Append-only/Audit/Idempotency พร้อม Drill-down/CSV | Project Owner ตอบ `อนุมัติ` ต่อข้อเสนอ, 2026-09-01; ใช้ `Owner-Review-Addendum_Management-Reporting-and-Cost_2026-09-01.md`; อนุมัติเฉพาะ Mock-first Local/Firebase Emulator ไม่อนุมัติ Production cost write/rules, ข้อมูลจริง, Payroll/บัญชี/ภาษี, scheduler/distribution, deployment, PA-2, Controlled Pilot หรือ Production rollout |
| DEC-050 | Owner-only Financial Data Access | Approved | เฉพาะผู้ที่มี Organization membership แบบ Active และ trusted `isOwner=true` เท่านั้นที่อ่าน บันทึก แก้ไข สรุป Drill-down หรือ Export ข้อมูลการเงินได้; ผู้ใช้อื่นทุก Role รวม `FARM_MANAGER`, `SALES_INVENTORY`, `VIEWER`, `AUDITOR` และผู้ที่มีชื่อ Role `ORG_OWNER` แต่ไม่มี trusted Owner flag เห็นเฉพาะข้อมูลปฏิบัติการที่ไม่มีราคา ยอดขาย ยอดรับ/ค้าง ต้นทุน ค่าแรง ค่าใช้จ่าย แผนต้นทุน หรือ Financial Audit; legacy mixed document ต้อง Fail closed | Project Owner exact instruction, 2026-09-01; supersedes เฉพาะส่วนสิทธิ์ข้อมูลการเงินของ DEC-049/Role Matrix เดิม; อนุมัติ implementation/test แบบ Local/Mock/Firebase Emulator และเอกสารเท่านั้น ไม่อนุมัติ Deploy, migration Production, ข้อมูลจริง, PA-2, Controlled Pilot หรือ Production rollout |
| DEC-051 | Firebase Live Operational Go-Live | Approved | Browser runtime ใช้ Firebase project `durian-smartfarm` เท่านั้น; อนุมัติ Admin Google/Phone sign-in, trusted System Admin, Operational bootstrap, Firestore/Hosting deployment และข้อมูลจริงในโมดูล Web App ปัจจุบันทั้งหมด; ยกเลิก runtime/scripts/tests ที่เรียก local Firebase test services; deterministic Mock seed ยังใช้ใน Firebase Live ได้เฉพาะ DEMO Farm และต้องคง `SIMULATED/TEST ONLY` | Project Owner exact instructions, 2026-09-04; `Owner-Review-Decision_Firebase-Live-Operational-Go-Live_2026-09-04.md`; supersede ข้อห้าม Production/deployment เดิมเฉพาะขอบเขต Web App แต่คง Multi-Farm, Audit, Owner-only Financial, Human Review, no automatic chemical advice และไม่เปลี่ยน Deferred physical evidence เป็น Passed |
| DEC-052 | Orchard Layout Direction Selector และ Tree Circle/TAG | Approved | หน้า `แปลนต้น` ต้องเลือกแสดง Row เป็นแนวตั้งหรือแนวนอนได้; ตำแหน่งต้นแสดงเป็นวงกลมพร้อม Human-readable TAG/หมายเลขใต้ต้น; การสลับทิศทางเป็น presentation เท่านั้นและต้องไม่เปลี่ยนลำดับ `treeSequence`, opaque Position ID หรือ selection | Project Owner exact instruction และภาพตัวอย่าง, 2026-09-04; คงหลาย Zone แบบ data-driven, checklist view, Farm/Workflow eligibility, Cross-Farm denial และ QR confirmation ตาม DEC-045/047 |
| DEC-053 | Orchard Layout Back Navigation | Approved | ปุ่ม `กลับ` จากหน้า `แปลนสวนและเลือกตำแหน่ง` ต้องเปิดเมนู `ต้นไม้` ที่ `/trees` ไม่ย้อนกลับไปหน้า `เพิ่มเติม` | Project Owner exact instruction, 2026-09-04; เป็นการแก้ navigation ภายใน Web App ไม่มีผลต่อ Farm scope, selection หรือข้อมูล |

## สถานะมาตรฐาน

- `Proposed`: Working Proposal ที่ยังต้องได้รับการอนุมัติ
- `Open`: ยังไม่มีข้อเสนอเดียวที่พร้อมตัดสิน หรือยังต้องการข้อมูลเพิ่ม
- `Approved`: เจ้าของโครงการอนุมัติอย่างชัดเจนและมีหลักฐานอ้างอิง
- `Deferred`: ตั้งใจเลื่อนไปยัง Gate/Phase ที่ระบุ
- `Blocked`: เงื่อนไขที่ป้องกันการเริ่มงานหรือผ่าน Gate
- `Superseded`: ถูกแทนที่ด้วย Decision อื่นโดยยังเก็บประวัติไว้

สถานะ `Confirmed` เดิมเป็น historical evidence เท่านั้น ไม่เท่ากับ formal
`Approved`; รายการที่เป็น `Approved` ในตารางนี้มีหลักฐาน Owner Review แล้ว

## Acceptance criteria

- ไม่มีสถานะนอกชุดมาตรฐานในรายการ Decision
- Working Proposal เปลี่ยนเป็น `Approved` ได้เฉพาะเมื่อ Owner อนุมัติและมีหลักฐาน
- การเปลี่ยนเป็น `Approved` ต้องมีแหล่งอ้างอิง ผู้อนุมัติ และวันที่
- DEC-015 เป็น `Approved` จากข้อความอนุมัติ Gate 0 เมื่อ 2026-08-31
- DEC-010 และ DEC-020 เป็น `Approved` จากข้อความอนุมัติ Gate 1 และการเลือก
  Phone + SMS OTP ของ Project Owner เมื่อ 2026-08-31
- DEC-021 เป็น `Approved` จากข้อความอนุมัติ Gate 2 ของ Project Owner เมื่อ
  2026-08-31 โดยไม่ยกเลิก Field Validation Gate
- DEC-022 เป็น `Approved` สำหรับ Controlled Field Validation เท่านั้น และไม่เปลี่ยน
  Gate 3 เป็น Approved หรืออนุญาต Phase 4
- DEC-023 เป็น `Approved` สำหรับ Browser/Viewport Technical Simulation เท่านั้น
  ไม่อนุญาตอุปกรณ์ กล้อง QR/เครือข่ายจริง หรือการลงพื้นที่
- DEC-024 เป็น historical decision ที่ถูก DEC-027 แทนเฉพาะ timing; หลักฐาน
  Physical Device/Field ยังคง `Deferred / Not Passed`
- DEC-025 เป็น `Approved` จากข้อความ Gate 3 ของ Project Owner และอนุญาต Phase 4
  เฉพาะ mock/Firebase Emulator โดยไม่อนุญาต Phase 5
- DEC-026 คง `Open`; implementation ต้องเลือก least privilege และห้ามขยายสิทธิ์
  จน Owner อนุมัติ approval policy
- DEC-027 เป็น `Approved`; การไม่มี Physical/Field evidence ไม่ block Engineering
  Phase แต่ไม่อนุมัติข้าม Gate, deploy, ใช้ข้อมูลจริง หรืออ้างว่า evidence ผ่าน
- DEC-028 เป็น `Approved` จากข้อความ Gate 4 ของ Project Owner และอนุญาต Phase 5
  เฉพาะ Mock/local/Firebase Emulator โดยไม่อนุญาต Phase 6 หรือ deployment
- DEC-029 เป็น `Approved` จากข้อความ Gate 5 ของ Project Owner และอนุญาต Phase 6
  เฉพาะ Mock/local/Firebase Emulator โดยไม่อนุญาต Phase 7 หรือ deployment
- DEC-030 เป็น `Approved` จากคำสั่งล่าสุดของ Project Owner; รูปประกอบใบงานเป็น
  reference และต้องไม่ปะปนกับรูป BEFORE/AFTER ซึ่งเป็นหลักฐานการส่งงาน
- DEC-031 เป็น `Approved` จากข้อความ Gate 6 ของ Project Owner; อนุญาตเริ่ม
  Phase 7 planning/readiness แต่ไม่อนุมัติ Production deployment หรือ External
  Pilot Action จนกว่า Pilot plan, impact, cost และ resource จะผ่าน Owner Review
- DEC-032 เป็น `Approved` จากคำสั่งล่าสุดของ Project Owner; อนุญาตเฉพาะ
  `AIFC-G0` และ WP0–WP2 แบบ Mock/local-only และไม่ขยายเป็น real media/data,
  external AI, deployment, Controlled Pilot, Phase 7 execution หรือ commercial use
- DEC-033 เป็น `Approved` จากคำสั่งล่าสุดของ Project Owner; อนุญาตให้เลือก
  คนนับหรือ AI ช่วยนับใน Fruit Observation โดยไม่เปลี่ยน AIFC Gate และไม่ทำให้
  ผล AI จำลองกลายเป็น `MEASURED`, `FULL_COUNT` หรือหลักฐานภาคสนาม
- DEC-034 เป็น `Approved` จากคำสั่งล่าสุดของ Project Owner สำหรับ
  Work photo engineering/Pilot protocol; ค่า policy ที่เสนอและ External Pilot execution ยังรอ PA-1/PA-2
- DEC-035 เป็น `Approved` สำหรับการกรอก Owner PA-1 input ด้วย deterministic Mock
  เท่านั้น; ไม่ใช่การอนุมัติ PA-1 หรือ External Pilot Action และห้ามอ้างค่า Mock
  เป็น resource, cost, URL, owner mapping หรือ Candidate ที่ใช้งานจริง
- DEC-036 เป็น `Approved` สำหรับ Pre-Pilot Work Photo hardening แบบ
  Local/Mock/Emulator; lifecycle `ENFORCE`, external resource และข้อมูลจริงยังห้ามใช้
- DEC-037 เป็น `Approved` เฉพาะ PA-1 Local/Emulator rehearsal ด้วย Mock Data;
  อนุญาต local Candidate freeze/build/test แต่ไม่อนุมัติ deployment หรือ External Action
- DEC-038 เป็น `Blocked` จาก Owner `NO-GO` สำหรับ External PA-1; คง DEC-037
  และ Mock/Synthetic-only โดยต้องจัด Owner Review ใหม่และได้รับ `GO` ก่อนสร้าง
  resource, billing, credential หรือ Deploy
- DEC-039 เป็น `Approved` จากคำสั่งล่าสุดของ Project Owner; อนุมัติเฉพาะ
  Disease Analysis P1 แบบ Deterministic Mock Local/Emulator พร้อม Human Review
  โดยไม่อนุมัติ automatic diagnosis, chemical/treatment advice, ภาพจริง,
  external model, deployment หรือ P2/Pilot/Production; implementation ผ่าน
  Unit/UI/Rules/Firebase Emulator/build/offline/browser validation ตามรายงาน v0.1
- DEC-040 เป็น `Approved` จากคำสั่งล่าสุดของ Project Owner; เป็น carve-out แคบ
  สำหรับ Firebase Phone Auth/SMS จริงกับ local allowlist และ Mock Data เท่านั้น
  โดย DEC-038, PA-2, Deployment และ Production ยังไม่ผ่าน
- DEC-041 เป็น `Approved` จากคำสั่งล่าสุดของ Project Owner และ supersede ข้อห้าม
  Firestore Production เฉพาะการเชื่อม/อ่านเขียน/Seed deterministic Mock Data ใน
  project `durian-smartfarm`; ไม่ supersede ข้อห้ามข้อมูลจริง, public Hosting,
  Field/Controlled Pilot, PA-2, Storage ที่ยังไม่ provision หรือ Production rollout
- DEC-042 เป็น `Approved` จากคำสั่งล่าสุดของ Project Owner และ supersede ข้อห้าม
  Hosting เฉพาะ Limited Phone Auth test ที่ใช้ Mock Data; ไม่อนุญาต Firestore/Storage
  deploy เพิ่มในคำสั่งนี้ และไม่อนุมัติข้อมูลจริง, PA-2, Controlled Pilot หรือ
  operational Production rollout
- DEC-043 เป็น `Approved` สำหรับ Farm Management remediation แบบ
  Local/Mock/Firebase Emulator และ deterministic `SIMULATED/TEST ONLY` เท่านั้น;
  ไม่อนุมัติ Hard delete, ข้อมูลจริง, deployment หรือการขยาย PA-2/Pilot/Production
- DEC-044 เป็น `Approved` สำหรับภาษาไทยใน Excel/Google Sheets ของทะเบียนต้นและ
  backward compatibility กับไฟล์ภาษาอังกฤษเดิม โดยไม่เปลี่ยน Multi-Farm,
  atomic import, real-data หรือ deployment boundary
- DEC-045 เป็น `Approved` สำหรับ Orchard Layout/Shared Target Selector แบบ
  Mock-first Local/Emulator โดยคง Position identity, QR confirmation, Cross-Farm
  denial และข้อห้ามข้อมูลจริง/deployment/Pilot/Production เดิม
- DEC-046 เป็น `Approved` จากคำสั่งล่าสุดของ Project Owner สำหรับ limited
  operational Tree Register data entry เฉพาะ Firebase Production + Farm จริง;
  supersede ข้อห้ามข้อมูลจริงเท่าที่ระบุ แต่ไม่อนุมัติการ Deploy รุ่นนี้,
  รูปจริง/Storage, QR/ป้ายถาวร, PA-2, Controlled Pilot หรือโมดูลอื่น
- DEC-047 เป็น `Approved` จากคำสั่งล่าสุดของ Project Owner สำหรับ Target Selector
  สองมุมมอง หลาย Zone แบบ data-driven และ action menu ครบ 5 Workflow; ไม่ขยาย
  real-data carve-out ของ DEC-046 ไปยัง mutation อื่นและไม่ใช่ deployment approval
- DEC-048 เป็น `Approved` จากคำสั่งล่าสุดของ Project Owner สำหรับ Annual Farm
  Management Cycle แบบ 12 เดือน ค่าเริ่มต้นมิถุนายน–พฤษภาคม ปรับวันเริ่มรายสวนได้
  และ Closed correction-only; อนุมัติเฉพาะ Mock-first Local/Emulator และไม่ขยาย
  deployment/real-data/PA-2/Pilot/Production boundary
- DEC-049 เป็น `Approved` จากคำสั่งล่าสุดของ Project Owner สำหรับรายงานการจัดการ
  สวน 4 รอบและ Management Cost แบบ Mock-first; ค่าแรงถูกบันทึกเป็นต้นทุนบริหาร
  ไม่ใช่ Payroll และผลต่างยอดขาย–ต้นทุนไม่ใช่กำไรบัญชี; ไม่ขยายขอบเขตข้อมูลจริง,
  Firebase Production write/rules, deployment, PA-2, Pilot หรือ Production
- DEC-052 เป็น `Approved` จากคำสั่งล่าสุดของ Project Owner สำหรับการสลับการแสดง
  Row แนวตั้ง/แนวนอนและวงกลมต้นไม้พร้อม TAG; เป็นการเปลี่ยน presentation ที่ต้อง
  คง selection, Position identity, Multi-Farm และ Workflow eligibility เดิม
- DEC-053 เป็น `Approved` จากคำสั่งล่าสุดของ Project Owner ให้ปุ่มกลับของหน้า
  Orchard Layout ไป `/trees`; ไม่เปลี่ยนขอบเขตข้อมูลหรือ Gate
