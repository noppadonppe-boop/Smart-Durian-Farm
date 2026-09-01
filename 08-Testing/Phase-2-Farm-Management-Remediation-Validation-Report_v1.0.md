# Phase 2 Farm Management Remediation Validation Report v1.0

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Engineering Validation Passed — Local/Mock/Firebase Emulator Only |
| เจ้าของเอกสาร | Project Owner |
| วันที่ตรวจ | 2026-09-01 |
| ขอบเขต | Phase 2 Remediation — Farm Profile and Management ตาม DEC-043 |
| Source of Truth | `AGENTS.md`, `01-Requirements/KDOMS_Development_Mock_Data_and_Pilot_Knowledge_v1.0.md`, `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`, `01-Requirements/KDOMS_Farm_Profile_and_Management_Knowledge_v0.1.md`, `00-Project-Management/Phase-2-Farm-Management-Remediation-Prompt_v1.0.md`, `00-Project-Management/Decision-Log.md` (DEC-043) |

## 1. ผลลัพธ์

ดำเนินการ Phase 2 Farm Management Remediation ครบขอบเขตที่อนุมัติสำหรับ
Local/Mock/Firebase Emulator โดยเพิ่มเมนู `เพิ่มเติม → จัดการสวน` สำหรับ
`ORG_OWNER` พร้อมรายการสวน รหัส สถานะ การเพิ่มสวน การแก้ Farm Profile การระงับ
การเปิดใช้งานสวนที่ระงับ และการเก็บถาวรโดยไม่ลบประวัติ

การเพิ่มสวนสร้าง Farm, Owner membership, uniqueness guard, idempotency operation
และ Audit Event ใน Firestore transaction เดียวกัน ส่วน Mock repository ทำ mutation
แบบ atomic ในหน่วยความจำและรองรับ retry ด้วย idempotency key เดิม การแก้ Profile
และการเปลี่ยนสถานะเพิ่ม version และสร้าง Audit before/after ทุกครั้ง

ไม่มีปุ่ม ไม่มี repository method และไม่มี Rules path สำหรับ Hard delete Farm
รวมทั้งไม่รองรับ `ARCHIVED → ACTIVE`

## 2. สิ่งที่ดำเนินการ

### 2.1 Domain และ Repository

- เพิ่ม Farm Profile model, validation, Farm Code derivation และ lifecycle transition
  `ACTIVE ↔ SUSPENDED` และ `ACTIVE/SUSPENDED → ARCHIVED`
- ระบบกำหนด `organizationId`, `farmId`, `farmCode`, timestamps, actor และ Audit
  metadata; แบบฟอร์มไม่รับ internal ID จากผู้ใช้
- ใช้ `farmSequenceGuards` ป้องกัน `farmSequence`/`farmCode` ซ้ำภายใน Organization
  และใช้ `farmOperations` รองรับ idempotent retry
- สร้าง Owner membership พร้อม Farm และ Audit แบบ atomic; หาก transaction ล้มเหลว
  จะไม่เหลือ Farm ที่ไม่มี Owner
- ตรวจ Archive readiness จาก Work Order ที่ยังไม่ `CLOSED` และ Offline operation
  ที่ยังไม่ `SYNCED`; UI แสดงจำนวนและรายการก่อนยืนยันและปิดปุ่มยืนยันเมื่อมี blocker
- ผู้ใช้ที่ไม่ใช่ `ORG_OWNER` อ่าน Profile ได้เฉพาะสวนที่มี membership และไม่มีสิทธิ์
  list ทั้ง Organization หรือ mutation ใด ๆ

### 2.2 UI

- เพิ่มหน้า `จัดการสวน`, `เพิ่มสวน` และ `ข้อมูลสวน`
- แบบฟอร์มแบ่งเป็นข้อมูลหลัก ที่ตั้ง Timezone/ฤดูกาล และหมายเหตุ พร้อม preview
  Farm Code และ validation ตาม Knowledge
- ผู้ใช้ทั่วไปเข้าจาก `เพิ่มเติม → ข้อมูลสวน` เพื่อดู Profile ของสวนปัจจุบันแบบ
  read-only; ไม่เห็น action ของ Owner
- สวน `SUSPENDED` และ `ARCHIVED` ยังคงอ่าน Profile/ประวัติได้ แต่ flow ปฏิบัติการ
  ถูกบังคับเป็น read-only ตาม Rules และ permission เดิม
- รองรับหน้าจอเริ่มต้นที่ 320px ตาม responsive style ของแอป

### 2.3 Mock Data Pack

ปรับ Mock Data Pack เดิมให้มี Farm Profile 4 สวนแบบ deterministic และ resettable:

| Farm Code | สถานะ | การจำแนก |
|---|---|---|
| `DEMO-F01` | `ACTIVE` | `SIMULATED/TEST ONLY` |
| `DEMO-F02` | `ACTIVE` | `SIMULATED/TEST ONLY` |
| `DEMO-F03` | `SUSPENDED` | `SIMULATED/TEST ONLY` |
| `DEMO-F04` | `ARCHIVED` | `SIMULATED/TEST ONLY` |

ค่าที่ไม่มีหลักฐานใช้ `TBD` และ Farm Profile ทุก record เป็น `exampleData: true`;
ไม่มีข้อมูล ภาพ พิกัด หรือบุคคลจริง

## 3. Acceptance validation

| เกณฑ์ | หลักฐาน | ผล |
|---|---|---|
| Owner เพิ่มสวนและได้ Owner membership | Mock/Repository Emulator tests ตรวจ Farm + membership + Audit ใน operation เดียว | ผ่าน |
| Retry key เดิมไม่สร้างสวนซ้ำ | Unit และ Repository Emulator tests ตรวจ `wasRetry` และ Farm ID เดิม | ผ่าน |
| Sequence/Code ซ้ำถูกปฏิเสธ | uniqueness guard และ duplicate tests | ผ่าน |
| แก้ Profile พร้อม version/Audit before-after | Domain, Mock และ Emulator repository tests | ผ่าน |
| Suspend/Reactivate เฉพาะ transition ที่อนุมัติ | Domain, UI และ Emulator tests | ผ่าน |
| Suspended/Archived เขียน operational data ไม่ได้ | Firebase Emulator Rules tests | ผ่าน |
| Archive ที่มีงานเปิด/Pending ถูกหยุด | Mock และ Emulator repository tests พร้อมรายการ blocker | ผ่าน |
| ผู้ใช้บทบาทอื่น/forged mutation ถูกปฏิเสธ | Component และ Rules tests | ผ่าน |
| Cross-Farm read/write ไม่มี membership ถูกปฏิเสธ | Firebase Emulator Rules/Repository tests | ผ่าน |
| ไม่มี Hard delete path | Contract scan, UI test และ Rules delete denial test | ผ่าน |
| Mock 4 สวน reset แล้วได้ผลเดิม | Full mock seed verification | ผ่าน |

ไม่พบ Cross-Farm disclosure, Farm ซ้ำ, Farm ที่ไม่มี Owner, ประวัติ Farm สูญหาย
หรือข้อมูลจริงระหว่างการตรวจสอบ

## 4. Automated validation

| การตรวจ | ผล |
|---|---|
| `pnpm typecheck` | ผ่าน — TypeScript strict |
| `pnpm lint` | ผ่าน — ไม่มี warning |
| `pnpm test` | ผ่าน 23 files, 199 tests |
| `pnpm build` | ผ่าน — Production build/PWA artifacts สร้างสำเร็จใน local workspace |
| `pnpm test:emulator` | ผ่าน 8 files, 57 tests บน Auth/Firestore/Storage Emulator |
| `pnpm test:seed:emulator` | ผ่าน — ตรวจ 137 deterministic records ใน 6 modules |

ผล seed เฉพาะ foundation ที่เกี่ยวข้องกับงานนี้: Farm 4, Farm sequence guard 4,
Farm Audit Event 6, Farm membership 9 และ classification เป็น
`SIMULATED/TEST ONLY` ทั้งชุด

Firebase CLI ไม่สามารถอ่าน remote MOTD ระหว่างการเริ่ม Emulator เนื่องจาก network
แต่เป็น non-fatal warning; Emulator และ test script จบด้วย exit code 0 ไม่มีการเรียก
Production project

## 5. ไฟล์หลักที่สร้างหรือแก้ไข

- Domain/contracts: `src/domain/farm.ts`, `src/adapters/contracts.ts`
- Mock/Firebase repository: `src/adapters/mock/mockFoundationAdapters.ts`,
  `src/infrastructure/firebase/firebasePhase2Repository.ts`
- UI/context/routes: `src/app/Phase2Context.tsx`, `src/app/router.tsx`,
  `src/pages/MorePage.tsx`, `src/pages/FarmManagementPage.tsx`,
  `src/pages/FarmCreatePage.tsx`, `src/pages/FarmProfilePage.tsx`,
  `src/components/FarmProfileForm.tsx`, `src/styles/global.css`
- Security/data: `firestore.rules`, `src/demo/phase2-demo-seed.json`,
  `scripts/mock-seed/modules.mjs`
- Tests: Farm domain, form/menu/page, Mock repository และ Firebase Emulator
  Rules/Repository test files
- Compatibility cleanup: ปรับ asynchronous assertion ใน `src/app/App.test.tsx`
  และ lifecycle ของหน้า Orchard Layout ให้ผ่าน lint โดยหน้า route ถูก remount ตาม
  Farm ID เดิม

Repository มีการเปลี่ยนแปลงเดิมของผู้ใช้จำนวนมากก่อนเริ่มงาน รอบนี้ไม่ reset,
ลบ หรือเขียนทับการเปลี่ยนแปลงที่ไม่เกี่ยวข้อง

## 6. ข้อจำกัดและความเสี่ยงคงเหลือ

- ผลนี้เป็น Engineering Validation ด้วย Mock/Local/Emulator เท่านั้น ไม่ใช่หลักฐาน
  Physical Device, Field, PA-2, Controlled Pilot หรือ Production
- Archive readiness ในขอบเขตนี้ทำผ่าน repository ที่อ่าน Work/Pending จริงก่อน
  status transaction; ก่อน Operational Production ควรยืนยันรูปแบบ trusted backend
  หรือ server-maintained blocker aggregate เพื่อปิด race จาก concurrent writer
- ไม่มีการเปิดสวนที่ Archive แล้วกลับมาใช้ ไม่มี Hard delete และไม่มี Cross-Farm
  transfer/copy ตามขอบเขตที่อนุมัติ
- ไม่มีการสร้าง Storage/resource/billing ใหม่ ไม่มีการใช้ข้อมูลจริง และไม่มีการ
  Deploy Firebase Production หรือ Hosting

## 7. สถานะ Gate และขั้นตอนอนุมัติถัดไป

งาน Remediation ตาม DEC-043 ผ่าน Engineering Validation ในขอบเขตที่อนุมัติแล้ว
แต่ไม่เปลี่ยนสถานะ Gate เดิมและไม่ถือเป็น External Pilot Action approval

- Gate ปัจจุบัน: Gate 6 Passed; Phase 7 อยู่ในขอบเขต readiness ตามเอกสารโครงการ
- External PA-1 ส่วนที่ DEC-038 ระบุยังคง `NO-GO/BLOCKED`
- PA-2, Controlled Pilot, Field work และ Operational Production rollout ยังไม่อนุมัติ
- ขั้นตอนถัดไปที่ต้องขออนุมัติแยก: trusted archive enforcement สำหรับ environment
  จริง และ Owner review ก่อน Deploy/Pilot/Production ใด ๆ
