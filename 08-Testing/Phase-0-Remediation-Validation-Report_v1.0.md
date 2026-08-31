# Phase 0 Remediation Validation Report v1.0

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Proposed — Owner Review Required |
| เจ้าของเอกสาร | Project Owner |
| ผู้ตรวจและจัดทำหลักฐาน | Codex |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | `AGENTS.md`, `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`, `00-Project-Management/Decision-Log.md`, `08-Testing/Gate-0-Acceptance-Checklist.md` |

> รายงานนี้เป็นหลักฐาน Phase 0 Remediation ไม่ใช่การอนุมัติ Gate 0 และไม่ใช่
> ผล Field Validation ข้อมูลสวนและการทดสอบภาคสนามที่ยังไม่มีหลักฐานคงเป็น `TBD`

## 1. Findings resolved แยกตาม Audit item

### A. Governance and decisions

- กำหนดสถานะกลาง `Proposed`, `Open`, `Approved`, `Deferred`, `Blocked`,
  `Superseded` ใน AGENTS และ Decision Log
- ย้ายสถานะ `Confirmed` เดิมเป็น `Proposed` โดยเก็บข้อความว่าเป็น historical
  evidence และไม่ยกระดับเป็น `Approved`
- เพิ่ม metadata ของเอกสาร Phase 0 หลักและเพิ่ม DEC-007 ถึง DEC-018
- Working Proposals ทั้งหมดเป็น `Proposed`; DEC-015 ยัง `Blocked`

### B. Tag and identity consistency

- ใช้ Human Tag namespace เดียวกัน:
  `{organizationCode}-{farmSequence}-{zone}-{row}-{tree}`
- ตัวอย่างกลางคือ `KGL-F01-Z01-R03-T017` โดย `KGL` คือ
  `organizationCode` และ `F01` คือ `farmSequence`
- แยก Human Tag ออกจาก opaque internal IDs ที่ unique ทั้งระบบ
- QR เป็น configurable base URL + `/t/{opaquePositionId}` ไม่ใช่ authorization
  และไม่เก็บข้อมูลที่เปลี่ยนแปลงได้
- Production domain ไม่บล็อก Phase 1 Foundation แต่บล็อกการผลิตป้ายจริงและ
  Phase 3 sign-off จนได้รับอนุมัติ

### C. Role and MVP consistency

- สร้าง Proposed Role/Access Matrix สำหรับ `ORG_OWNER`, `FARM_MANAGER`,
  `AGRONOMIST`, `WORKER`, `SALES_INVENTORY`, `VIEWER`, `AUDITOR`
- แยก `VIEWER` กับ `AUDITOR`; สิทธิ์ตาม Farm ยกเว้น `ORG_OWNER` ซึ่งเป็น
  Organization scope และทุกกรณียึด least privilege
- ทำ Sales MVP ให้ตรงกัน: Harvest/Sales lot, customer reference ขั้นต่ำ,
  ราคา, มัดจำ, รับแล้ว, ค้าง; ไม่รวม accounting/tax/payroll/banking

### D. Gate and pilot terminology

- Phase 0 = Product & Documentation Readiness
- Field Validation Gate = topology, ป้าย 5–10 ป้าย และ Tree Survey 30–50 ต้น
  ก่อนล็อก Phase 3/ผลิตป้ายจริง
- Phase 7 = Operational Application Pilot ด้วยแอปที่ผ่าน Gate 6
- หลักฐานภาคสนามยังอยู่ครบ แต่ไม่ถูกใช้เป็นเงื่อนไขผิดจังหวะของ Gate 0

### E. Tree import template

- CSV มี evidence fields สำหรับ trunk, canopy และ height ครบ value, unit,
  method, measuredAt, measuredBy, confidence/source ตามความเหมาะสม
- Data Dictionary อธิบายครบ 49 columns พร้อม required/conditional/optional,
  type, accepted values, validation และ example
- มีเพียง 1 data row ชนิด `EXAMPLE` และระบุ
  `EXAMPLE ONLY - NOT REAL FIELD DATA`

### F. UX Prototype remediation

- Placeholder ของ manual code เปลี่ยนตาม Farm
- Parser แสดง Farm/Zone/Row/Tree จากรหัสจริง; `T018` ไม่แสดงตำแหน่ง `T017`
- Mismatch แสดง expected/actual และซ่อน action ของงานเดิม
- Farm switch ขณะ offline/pending เตือนก่อนเปลี่ยน ยกเลิกได้ และรักษา pending
  ไว้กับ source Farm
- Worker Report และ Manager Verify/Approve/Request Rework เป็น interactive mock
- รองรับ Light/Dark, action สำคัญประมาณ 44×44 px, Enter และ Escape
- แยก editable source พร้อม export step โดยรักษา Preview เดิม

## 2. Files changed

### Governance และ Source of Truth

- `AGENTS.md`
- `README.md`
- `00-Project-Management/Decision-Log.md`
- `00-Project-Management/Phase-0-Plan.md`
- `00-Project-Management/Smart-Durian-Code_Phase_Prompts_v1.0.md`
- `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`
- `01-Requirements/KDOMS_Codex_Master_Prompt_v1.1.md`
- `01-Requirements/KDOMS_Role_Access_Matrix_v0.1.md` — สร้างใหม่
- `06-System-Architecture/Architecture-Baseline_v0.1.md`

### Field, Tree, Tag และ UX

- `02-Field-Survey/Field-Survey-Template_v0.1.md`
- `03-Tree-Data/tree-register-import-template.csv`
- `03-Tree-Data/Tree-Register-Data-Dictionary_v0.1.md` — สร้างใหม่
- `04-Tag-and-QR/Tag-and-QR-Standard_v0.1.md`
- `05-UX-UI/KDOMS_UX_UI_Knowledge_v0.1.md`
- `05-UX-UI/kdoms-mobile-ux-preview.html`
- `05-UX-UI/kdoms-mobile-ux-prototype-source.html` — สร้างใหม่
- `05-UX-UI/export-kdoms-mobile-ux-preview.ps1` — สร้างใหม่สำหรับ export Prototype เท่านั้น
- `05-UX-UI/Prototype-Maintenance_v0.1.md` — สร้างใหม่

### Gate evidence

- `08-Testing/Gate-0-Acceptance-Checklist.md`
- `08-Testing/Phase-0-Remediation-Validation-Report_v1.0.md` — สร้างใหม่

ไม่มี Application Code, Git repository, Firebase resource, credential หรือ
deployment ถูกสร้างหรือแก้ไข

## 3. Validation evidence

### Workspace และไฟล์

- Working Directory ตรงกับ `E:\1.0 Project GPT Work\Smart-Durian-Farm`
- พบโครงสร้าง `00` ถึง `11` และ `99-Archive` ตามแผน
- `.git` ไม่มีอยู่ และ `git rev-parse` ยืนยันว่าไม่ใช่ Git repository
- ไม่พบ `package.json`, Vite config, TypeScript/React source, Firebase config,
  environment/credential file ใน repository
- Local Markdown link targets ที่ตรวจพบมีอยู่ครบ
- Metadata check ของเอกสาร Phase 0 หลักผ่าน: version, status, owner,
  updated date และ Source of Truth

### Terminology และ decision state

- ไม่พบ legacy tag sample ที่ขัดกับ `KGL-F01-Z01-R03-T017`
- ไม่พบการรวม `VIEWER` กับ `AUDITOR` เป็น role เดียว และไม่พบชื่อ role แบบรวม
  Sales กับ Inventory ที่ขัดกับ `SALES_INVENTORY`
- คำ `Confirmed` ที่เหลืออยู่เป็นคำอธิบาย historical evidence เท่านั้น
- Phase 7 references ใช้ `Operational Application Pilot`
- Decision rows: Proposed/Open/Deferred/Blocked เท่านั้น; ไม่มี Working Proposal
  ใดถูกเปลี่ยนเป็น Approved
- Checklist มี checked box เพียง `NOT APPROVED YET`; `APPROVED` ยังไม่ถูกเลือก

### CSV และ Data Dictionary

- CSV parse สำเร็จ
- Header = 49 columns; Example data row = 49 columns
- Data rows = 1; `recordType=EXAMPLE`
- Data Dictionary = 49 column definitions
- Missing/extra/duplicate column = 0/0/0
- Example Tag = `KGL-F01-Z01-R03-T017`
- Example note = `EXAMPLE ONLY - NOT REAL FIELD DATA`

### Prototype responsive/theme

- Browser viewport 320×844 px: Preview iframe content 273 px;
  `scrollWidth=clientWidth=273`, ไม่มี horizontal overflow
- Browser viewport 736×900 px: content 689 px, device 430 px;
  `scrollWidth=clientWidth=689`, ไม่มี horizontal overflow
- Light: device background `rgb(244, 247, 243)`, text `rgb(23, 32, 25)`
- Dark: device background `rgb(16, 23, 18)`, text `rgb(237, 245, 239)`
- ตรวจ visual clipping ใน Light/Dark และตรวจ geometry ของ input/select/button
  บน Worker Report ที่ 320 px: ไม่พบ element ล้นกรอบ
- Touch target audit ทุกหน้าหลัก/overlay ที่ 320 px ผ่านหลังแก้ปุ่ม
  `ดูทั้งหมด` เป็นประมาณ 61.9×44 px

### Prototype interactions

- Farm switch online: `KGL-F01` → `KGL-F02`, role เปลี่ยนเป็นผู้จัดการ
- Offline/pending switch: warning แสดง source `KGL-F02`, target `KGL-F01`,
  pending 2; Cancel คง Farm/pending เดิม; Confirm เปลี่ยน Farm และข้อความยืนยันว่า
  pending ยังคงอยู่ที่ `KGL-F02`
- Correct scan: `KGL-F01-Z01-R03-T017`, action เปิดข้อมูลต้นแสดงได้
- Manual mismatch ด้วย Enter: actual `KGL-F01-Z01-R03-T018`, expected
  `KGL-F01-Z01-R03-T017`, action งานเดิมถูกซ่อน
- Escape ปิด Scan overlay ได้
- Worker Report: result `ดีขึ้น`, quantity `250 ลิตร`, material/ภาพจำลองถูกส่ง
  ไป Manager Verify และมีสถานะ `รอตรวจ`
- Manager Approve แสดง `อนุมัติรายงานแล้ว`
- Request Rework บังคับเหตุผล; เมื่อกรอกแล้วแสดงเหตุผลในผลลัพธ์
- Offline Report เพิ่ม pending จาก 2 เป็น 3, ปิด verify ระหว่างรอซิงก์;
  เมื่อกลับ online สถานะเป็น `ซิงก์แล้ว`/`รอตรวจ` และเปิด verify อีกครั้ง
- Console หลัง enable log, reload และทดสอบ manual mismatch: warning/error = 0
- Editable source เปิดได้โดยตรงและ correct-scan flow ผ่าน
- SHA-256 ของ editable source และ decoded Preview payload ตรงกันแบบ exact match

## 4. Remaining Open/Blocked decisions

### Blocked

- `DEC-015` Phase 1 start = `Blocked` จนกว่า Owner จะอนุมัติ Gate 0 ด้วยข้อความ
  ชัดเจน

### Open

- `DEC-010` วิธี sign-in: เบอร์โทร, อีเมล หรือบัญชีเชิญ; ตัดสินใจก่อนล็อก
  Authentication ใน Phase 2 ได้ ไม่บล็อก Phase 1 Foundation

### Deferred / Can defer

- `DEC-013` Cross-farm transfer อยู่นอก MVP
- Production domain/redirect ปลายทางจริง ตัดสินใจก่อนผลิตป้ายจริง/Phase 3 sign-off
- Retention period, backup cadence และ privacy detail ตัดสินใจก่อนใช้ข้อมูลจริง
- Role Matrix cells ที่มี `*` ต้องล็อกก่อน implementation ของ action นั้น
- หน่วย/วิธีวัด, vocabulary, measuredBy/source reference ตัดสินใจก่อน Field Validation

### Field validation ที่ยังไม่ใช่ข้อเท็จจริง

- Topology/Zone/Row/ทิศทางนับจริง = `TBD`
- Organization Code/Farm Sequence จริง = `TBD`
- ผลทดสอบป้าย 5–10 ป้าย = `TBD`
- Tree Survey 30–50 ต้น = `TBD`
- ผลทดสอบผู้ใช้/อุปกรณ์/สัญญาณจริง = `TBD`

## 5. Owner approval checklist แบบตอบได้ทีละข้อ

Owner ตอบแต่ละข้อได้ด้วย `Approve`, `Revise` หรือ `Defer` พร้อมหมายเหตุ:

1. `DEC-014` — Display name `Smart Durian Farm`; technical name `KDOMS`
2. `DEC-007`/`DEC-016` — Human Tag namespace และ opaque internal IDs
3. `DEC-009` — Canonical roles 7 บทบาทและ Proposed Role/Access Matrix
4. `DEC-012` — Sales MVP boundary และรายการ out of scope
5. `DEC-008` — QR route `/t/{opaquePositionId}` และ production-domain timing
6. `DEC-011` — Offline/idempotency/conflict/correction policy
7. `DEC-017` — Data policy baseline และข้อห้าม real/production data
8. `DEC-018`/`DEC-005` — Gate distinction และ Field Validation cohort
9. `DEC-001` — Responsive Web App/PWA product form
10. `DEC-002` — Vite + React + TypeScript + Firebase local/emulator-first baseline
11. `DEC-003` — Organization → Farm isolation และ farm-scoped roles/data
12. `DEC-004` — Permanent Planting Position + `plantingCycle` identity rule
13. `DEC-006` — Proposed tag material สำหรับนำไปทดสอบ 5–10 ป้าย
14. Gate decision — หากข้อที่จำเป็นได้รับอนุมัติ ให้ Owner บันทึกข้อความ
    `Gate 0 ผ่าน อนุมัติเริ่ม Phase 1` และปลด DEC-015 เอง

## 6. Gate 0 recommendation

**Recommendation: Ready for Owner Gate 0 Decision — แนะนำให้ Owner พิจารณา
อนุมัติแบบ Go สำหรับ Phase 1 Foundation เมื่อยืนยันรายการจำเป็นด้านบนและลงข้อความ
อนุมัติอย่างชัดเจน**

เหตุผล: remediation และหลักฐานเอกสาร/data/prototype ผ่านการตรวจที่กำหนด ไม่พบ
technical remediation blocker อื่นสำหรับ Foundation ส่วน Open/Field Validation ที่เหลือ
มีจังหวะตัดสินก่อน Phase 2, ก่อนล็อก Phase 3 หรือก่อน production อย่างชัดเจน

สถานะจริงขณะออกเอกสารยังเป็น **Gate 0 NOT APPROVED**, `DEC-015` ยัง
**Blocked** และห้ามเริ่ม Phase 1 จนกว่า Owner จะตัดสิน
