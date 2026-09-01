# Smart-Durian-Code — Phase Prompts v1.0.2

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0.2 |
| สถานะ | Active Baseline — Mock-first + Limited Operational Tree Register (DEC-046) |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| Source of Truth | `AGENTS.md`, `01-Requirements/KDOMS_Development_Mock_Data_and_Pilot_Knowledge_v1.0.md`, `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`, `00-Project-Management/Owner-Review-Addendum_Tree-Register-Operational-Data-Entry_2026-09-01.md`, `00-Project-Management/Decision-Log.md` (DEC-027, DEC-046) |

ชุด Prompt สำหรับส่งให้ Codex task ชื่อ `Smart-Durian-Code` ทีละ Phase

## วิธีใช้งาน

1. เปิด Codex task `Smart-Durian-Code` โดยใช้ Local Project เดียวกัน:
   `E:\1.0 Project GPT Work\Smart-Durian-Farm`
2. ส่ง **Prompt A — Bootstrap & Gate 0 Audit** ก่อนเสมอ
3. รอให้ Codex รายงานผล แล้วนำรายงานกลับมาให้ ChatGPT Work โครงการนี้ตรวจ
4. เมื่อยอมรับผล ให้ส่งข้อความอนุมัติ Gate และ Prompt ของ Phase ถัดไป
5. ส่งทีละ Prompt ห้ามส่ง Phase 1–7 พร้อมกัน
6. Codex ต้องหยุดรอหลังจบแต่ละ Phase

แนวทางนี้ใช้ Prompt แบบ outcome-first: ระบุผลลัพธ์ เกณฑ์สำเร็จ ข้อจำกัด การตรวจสอบ และเงื่อนไขหยุด โดยให้ Codex เลือกวิธีดำเนินงานที่เหมาะสมภายในขอบเขต

คำศัพท์ Gate ที่ใช้ทั้งชุด:

- Gate 0 = Product & Documentation Readiness
- Engineering Gates 1–6 = ตรวจ implementation ด้วย Mock Data และ
  automated/local/emulator/browser evidence ตามความเสี่ยง
- Phase 7 = เตรียม Pilot Candidate/readiness; Deploy หรือ Controlled Operational
  Pilot ทำได้เฉพาะเมื่อ Owner อนุมัติ External Action ที่เกี่ยวข้อง
- Physical Device/Field Validation ต้องผ่านก่อน Production, permanent tags หรือ
  scale-up แต่ไม่ block Phase การสร้างแอป

---

## Prompt A — Bootstrap & Gate 0 Audit

```text
คุณกำลังทำงานใน Codex task ชื่อ Smart-Durian-Code สำหรับโครงการ
Smart Durian Farm / KDOMS

Working Directory ที่คาดหวังคือ:
E:\1.0 Project GPT Work\Smart-Durian-Farm

ผลลัพธ์ที่ต้องการ:
ตรวจความพร้อมของ Phase 0 และรายงานว่าสามารถเสนอให้เจ้าของอนุมัติ Gate 0
เพื่อเริ่ม Phase 1 ได้หรือไม่ โดยรอบนี้ยังไม่สร้าง Application Code

ก่อนดำเนินการ:
- ตรวจ Working Directory และแสดงไฟล์/โฟลเดอร์ระดับแรก
- ตรวจว่าเป็น Git repository หรือไม่
- อ่าน AGENTS.md ให้ครบ
- อ่าน Source of Truth ตามลำดับที่ AGENTS.md กำหนด
- ตรวจ Phase-0-Plan, Decision-Log และ Gate-0-Acceptance-Checklist
- ตรวจ UX/UI Prototype และเอกสารสถาปัตยกรรมที่มีอยู่

ให้ตรวจและรายงาน:
1. Product vision และ MVP scope ที่เข้าใจ
2. Multi-Farm invariants และ Tree identity invariants
3. เอกสารที่พร้อม เอกสารที่ขาด และข้อขัดแย้งระหว่างเอกสาร
4. Open decisions แยกเป็น Blocker / Can defer / Field validation
5. Gate 0 checklist พร้อมหลักฐานต่อข้อ
6. ข้อเสนอว่า Phase 1 เริ่มได้หรือไม่ และมีเงื่อนไขอะไร
7. แผน Phase 1 ระดับไฟล์/ระบบ โดยยังไม่แก้ไฟล์

ข้อจำกัด:
- ห้ามสร้างหรือแก้ Application Code
- ห้ามสร้าง Firebase project, credentials, billing หรือ deployment
- ห้ามเปลี่ยนสถานะ Gate 0 เอง
- ห้ามสมมติข้อมูลภาคสนามเป็นข้อมูลจริง
- การตรวจเป็น read-only เว้นแต่ต้องแก้เอกสารเล็กน้อยเพื่อรายงานข้อผิดพลาด;
  ถ้าพบกรณีนั้นให้เสนอ patch ก่อนและรออนุมัติ

Success criteria:
- รายงานอ้างอิงไฟล์จริงและระบุหลักฐานชัดเจน
- ไม่มีการเปลี่ยนแปลง Application Code หรือบริการภายนอก
- สรุปคำตัดสินที่เจ้าของต้องให้ก่อน Phase 1 อย่างกระชับ

ให้รายงานเป็นภาษาไทย และจบด้วยหัวข้อ:
- Gate 0 recommendation
- Owner decisions required
- Proposed Phase 1 acceptance criteria

เมื่อรายงานเสร็จ ให้หยุดและรอคำสั่ง ห้ามเริ่ม Phase 1
```

### ข้อความอนุมัติหลังตรวจ Prompt A

ใช้เมื่อเจ้าของและ ChatGPT Work ตรวจรายงานแล้วเห็นชอบจริง:

```text
Gate 0 ผ่าน อนุมัติเริ่ม Phase 1 ตาม Prompt Phase 1
การอนุมัตินี้ครอบคลุมเฉพาะ local development และ Firebase Emulator
ไม่อนุมัติ Firebase production, billing, public deployment หรือข้อมูลสวนจริง
```

---

## Prompt Phase 1 — Foundation & Developer Experience

```text
Phase: 1 — Foundation

ผลลัพธ์ที่ต้องการ:
สร้างฐาน Web App ที่รันและทดสอบได้สำหรับ Smart Durian Farm โดยยังไม่มี
business feature เต็มรูปแบบ และยังไม่เชื่อม Firebase production

อ่านก่อนทำงาน:
- AGENTS.md
- 01-Requirements/KDOMS_Scope_Knowledge_v0.2.md
- 01-Requirements/KDOMS_Codex_Master_Prompt_v1.1.md
- 05-UX-UI/KDOMS_UX_UI_Knowledge_v0.1.md
- 06-System-Architecture/Architecture-Baseline_v0.1.md
- 00-Project-Management/Decision-Log.md

In scope:
- ตรวจสภาพ repository และ initialize Git เฉพาะเมื่อยังไม่มี โดยไม่ลบไฟล์เดิม
- สร้าง Vite + React + TypeScript strict ภายใน 07-Source-Code/web-app
- เลือก package manager หนึ่งตัวและใช้ lockfile เดียว
- วางโครงสร้าง routes/layout สำหรับ Home, Work, Scan, Trees และ More
- สร้าง mobile-first design foundation จาก UX/UI Knowledge และ Prototype
- ทำหน้า shell ด้วย mock data ที่ระบุชัดว่าเป็นข้อมูลจำลอง
- เตรียม environment contract ด้วย .env.example โดยไม่มี secret
- เตรียม Firebase Emulator configuration และ adapter boundary;
  ยังไม่สร้าง production project
- เพิ่ม lint, typecheck, unit/component test, build และ smoke-test workflow
- เพิ่ม README สำหรับการติดตั้ง รัน ทดสอบ และ emulator

Out of scope:
- Authentication จริงและ Multi-Farm permissions เต็มรูปแบบ
- Firestore production, billing, public deployment
- Tree CRUD, QR camera, Work Order, Disease, Inventory, Sales
- ข้อมูลสวนจริง

Success criteria:
- ติดตั้ง dependency ใหม่จาก clean checkout ได้
- dev server เปิดได้
- lint, typecheck, tests และ production build ผ่าน
- navigation หลักทำงานที่ความกว้าง 320px ขึ้นไป
- ไม่มี secret หรือ service-account key
- UX shell แสดง Farm context และ Offline/Sync placeholder อย่างชัดเจน
- มี architectural note อธิบาย boundaries ที่ Phase ต่อไปจะเติม

Validation:
- รันคำสั่ง lint, typecheck, test และ build ที่ project กำหนด
- ตรวจหน้าหลักในอย่างน้อย 320px และ desktop
- ตรวจ console/runtime errors
- ตรวจ git diff และไฟล์ที่สร้างทั้งหมด

Stop rules:
- หากต้องเลือกสิ่งที่กระทบ architecture ระยะยาวและเอกสารยังไม่ตัดสินใจ
  ให้เลือกทางที่ย้อนกลับง่าย ระบุ assumption และเดินหน้าต่อได้
- หากต้องใช้ credentials, billing หรือ production resource ให้หยุดและรายงาน
- ห้ามเริ่ม Phase 2

รายงานภาษาไทย:
1. ผลลัพธ์
2. โครงสร้างที่สร้าง
3. คำสั่งตรวจสอบและผล
4. Assumptions/risks
5. Gate 1 checklist และ recommendation

เมื่อเสร็จ ให้หยุดรออนุมัติ Gate 1
```

### ข้อความอนุมัติ Gate 1

```text
Gate 1 ผ่าน อนุมัติเริ่ม Phase 2 ตาม Prompt Phase 2
ยังอนุญาตเฉพาะ local development และ Firebase Emulator
```

---

## Prompt Phase 2 — Multi-Farm, Authentication & Authorization

```text
Phase: 2 — Multi-Farm & Access Control

ผลลัพธ์ที่ต้องการ:
สร้าง Organization/Farm membership, Farm Switcher และ authorization ที่ป้องกัน
ข้อมูลรั่วข้ามสวน โดยพิสูจน์ด้วย Firebase Emulator tests

อ่าน AGENTS.md และ Source of Truth ทั้งหมดที่เกี่ยวกับ Multi-Farm, security,
offline และ UX ก่อนแก้ไฟล์

In scope:
- Authentication flow บน emulator ด้วยวิธี sign-in ที่ Decision Log อนุมัติ
- Organization, Farm, organization membership และ farm membership model
- Roles baseline: `ORG_OWNER`, `FARM_MANAGER`, `AGRONOMIST`, `WORKER`,
  `SALES_INVENTORY`, `VIEWER`, `AUDITOR` ตาม Proposed Role/Access Matrix
- Farm Switcher แสดงเฉพาะสวนที่ผู้ใช้มีสิทธิ์
- ป้องกัน pending/draft ไม่ให้เปลี่ยน farm scope เมื่อสลับสวน
- Firestore/Storage Rules แบบ deny-by-default
- seed/demo accounts และข้อมูลจำลองแยกอย่างน้อย 2 สวน
- emulator tests: same-farm allow, cross-farm deny, forged farmId deny,
  revoked membership deny, role downgrade และ archived farm behavior
- UI states: loading, no farm, access denied, suspended/archived farm
- audit event สำหรับการเปลี่ยน membership/role ที่อยู่ในขอบเขต

Out of scope:
- Production authentication/configuration
- Tree registry และ business modules ของ Phase 3–5
- Cross-farm transfer/copy
- Portfolio analytics เต็มรูปแบบ

Success criteria:
- ผู้ใช้สวน A อ่านหรือเขียนสวน B ไม่ได้ แม้แก้ client payload
- ผู้ใช้คนเดียวมี role ต่างกันในแต่ละสวนได้
- Worker ไม่เห็น admin action
- Farm context ปรากฏบนทุกหน้าที่สร้างข้อมูล
- rules tests, lint, typecheck, tests และ build ผ่าน
- ไม่มี privileged decision ที่เชื่อถือ client เพียงอย่างเดียว

Validation:
- รัน emulator security test suite และบันทึกผลกรณี allow/deny
- ทดสอบสลับผู้ใช้/สลับสวนและ deep link
- ตรวจ UI ที่ 320px และ desktop
- ตรวจ git diff และ threat notes

Stop rules:
- หาก Role Matrix ยังไม่อนุมัติ ให้ implement baseline ที่จำกัดสิทธิ์ที่สุด
  บันทึกข้อสันนิษฐาน และอย่าเปิดสิทธิ์กว้างเพื่อความสะดวก
- ห้ามใช้ production credentials หรือเริ่ม Phase 3

รายงานภาษาไทยพร้อม Gate 2 checklist แล้วหยุดรออนุมัติ
```

### ข้อความอนุมัติ Gate 2

```text
Gate 2 ผ่าน อนุมัติเริ่ม Phase 3 ตาม Prompt Phase 3
```

---

## Prompt Phase 3 — Farm Topology, Tree Register, Tag & QR

```text
Phase: 3 — Tree Register & QR

ผลลัพธ์ที่ต้องการ:
สร้างทะเบียนต้นแบบ Multi-Farm ตั้งแต่ Zone/Row/Planting Position/Planting Cycle
พร้อม Tag generation, import validation และ QR confirmation workflow

อ่าน AGENTS.md, Scope Knowledge, Tag-and-QR Standard, Tree import template,
Field Survey Template และ UX/UI Knowledge ก่อนทำงาน

In scope:
- Zone, Row, Planting Position และ Planting Cycle domain model
- invariant: Tag ระบุตำแหน่งถาวร; ต้นปลูกทดแทนเพิ่ม plantingCycle
- internal Organization/Farm/Position IDs เป็น globally unique opaque IDs
- Tree list/search/filter, detail และ timeline
- create/edit/archive ตาม role และ audit policy
- CSV import: preview, validation, duplicate detection, reject report และ idempotency
- Tag parser/generator รูปแบบ
  `{organizationCode}-{farmSequence}-{zone}-{row}-{tree}` เช่น
  `KGL-F01-Z01-R03-T017` หรือ format ที่ Approved แล้ว
- QR payload abstraction ใช้ configurable base URL + `/t/{opaquePositionId}`
  และไม่เก็บข้อมูลเปลี่ยนแปลงได้
- QR scan flow และ manual-code fallback
- match/mismatch/unknown/damaged/offline-cached states
- ป้องกัน scan ข้ามสวนหรือเปิดข้อมูลเกินสิทธิ์
- mock/seed data ที่ระบุเป็นข้อมูลจำลอง

Out of scope:
- ผลิตป้ายจริงหรือใช้ production domain หากยังไม่อนุมัติ
- Work Orders, treatment, harvest, sales และ inventory
- การใช้ GPS เป็นตัวตนหลัก

Success criteria:
- Human Tag ไม่ซ้ำภายใน Organization/Farm namespace, opaque position ID
  unique ทั้งระบบ และ Tag ไม่ถูก reuse
- ต้นตาย/ปลูกใหม่ไม่ทำลายประวัติตำแหน่ง
- import ผิดรูปแบบไม่สร้าง partial/corrupt records
- scan ผิดต้นหรือผิดสวนถูกปฏิเสธอย่างชัดเจน
- QR/manual entry ใช้งานได้บนมือถือ
- unit, component, rules, import และ end-to-end critical tests ผ่าน
- lint, typecheck และ build ผ่าน

Validation:
- ทดสอบ tag parsing/generation edge cases
- ทดสอบ duplicate CSV, invalid row และ retry
- ทดสอบ cross-farm tree/QR access
- ทดสอบ responsive 320px และ camera/manual fallback

Stop rules:
- ใช้ QR domain แบบ configurable placeholder จนกว่าเจ้าของอนุมัติโดเมนจริง
- ค่า topology/tag/physical ที่ยังไม่ยืนยันเป็น `TBD` และไม่ block configurable
  Tree/Tag implementation ด้วย Mock Data
- ห้ามผลิต QR/ป้ายถาวรหรือเริ่ม Phase 4 โดยไม่มี Gate 3 approval

รายงานภาษาไทยพร้อม Gate 3 checklist แล้วหยุดรออนุมัติ
```

### Operational addendum หลัง Gate 3 — DEC-046

ข้อความนี้ใช้กับงานแก้ไข Tree Register หลัง Phase 3 และมีอำนาจเหนือข้อจำกัด
Mock-only เดิมเฉพาะส่วนที่ระบุ:

```text
Owner อนุมัติให้ source รองรับการเพิ่ม/แก้ข้อมูลทะเบียนต้นใช้งานจริง โดย:
- ข้อมูลจริงสร้างได้เฉพาะ Firebase Production + Farm ที่ trusted-provision เป็น
  classification=OPERATIONAL และ isMock=false
- Mock adapter, Emulator และ Farm จำลองต้องคง SIMULATED/TEST ONLY และ
  exampleData=true
- หน้าเพิ่มตำแหน่งปลูกแบ่ง 3 ส่วน: ตำแหน่งและรหัส, ข้อมูลต้นและรอบปลูก,
  ข้อมูลสำรวจเริ่มต้น
- ต้องยืนยัน Farm/Zone/Row/ลำดับตำแหน่ง/ทิศทางและ Tag preview ก่อนบันทึก
- สถานะไม่มีต้นต้องไม่สร้างข้อมูลต้นหรือข้อมูลสำรวจที่ขัดแย้งกัน
- ใช้ audit, idempotency, membership, Farm scope และ classification แบบ fail-closed
- รูปจริง, QR/ป้ายถาวร, external pilot, resource เพิ่ม และ deployment ไม่รวมอยู่ใน
  การอนุมัตินี้ ต้องขออนุมัติแยก

ให้ทดสอบด้วย Mock/Emulator/browser evidence ต่อไป ห้ามนำข้อมูลจริงมาใส่ test fixture
หรือ repository
```

### ข้อความอนุมัติ Gate 3

```text
Gate 3 ผ่าน อนุมัติเริ่ม Phase 4 ตาม Prompt Phase 4
```

---

## Prompt Phase 4 — Work Orders, Tree Care & Disease

```text
Phase: 4 — Work, Care & Disease

ผลลัพธ์ที่ต้องการ:
สร้าง workflow สั่งงานคนสวน ทำงานถูกต้น รายงานหลักฐาน ตรวจรับ และติดตามโรค
โดยรองรับงานรายต้นและงานรายกลุ่ม

อ่าน AGENTS.md, Scope Knowledge, UX/UI Knowledge และ implementation ที่มีอยู่
ก่อนแก้ไฟล์

In scope:
- Work Order states: Draft, Assigned, Accepted, In progress, Submitted,
  Verified/Rejected/Rework และ Closed
- งานเป้าหมายระดับต้น แถว โซน หรือชุดต้น
- Worker My Work, accept/start/pause/report/submit
- QR confirmation สำหรับงานรายต้น
- group completion พร้อม per-tree exception
- before/after photos ด้วย mock/local emulator storage policy
- actual material/quantity/unit และ notes
- Manager verification, reject/rework reason และ audit
- Care Events: fertilizer, chemical, water, pruning, inspection
- Disease Incident: symptom, severity, suspected/confirmed diagnosis,
  treatment, follow-up และ outcome
- แยก observed symptom ออกจาก diagnosis
- notification/in-app queue สำหรับงานเร่งด่วนและ follow-up

Out of scope:
- AI diagnosis อัตโนมัติ
- คำแนะนำสารเคมีแทนผู้เชี่ยวชาญหรือฉลาก
- Production notification provider
- Fruit/harvest/sales/inventory เต็มรูปแบบ

Success criteria:
- Worker ทำ flow งานรายต้นตั้งแต่รับงานถึงส่งตรวจได้
- scan mismatch ไม่ complete งานเดิม
- งานกลุ่มเก็บ success/exception รายต้นได้
- rejected/rework มีเหตุผลและ audit trail
- การส่ง event ซ้ำไม่สร้างรายการซ้ำ
- role/rules tests, state-transition tests, UI tests และ build ผ่าน
- mobile flow ใช้ได้ที่ 320px

Validation:
- ทดสอบทุก allowed/forbidden state transition
- ทดสอบ cross-farm, wrong-tree, duplicate-submit และ photo partial failure
- ทดสอบสิทธิ์ `ORG_OWNER`/`FARM_MANAGER`/`AGRONOMIST`/`WORKER`
- ตรวจ UX ด้วย scenario จาก Field Survey Template

Stop rules:
- หาก approval policy เรื่องยา/รักษายังไม่อนุมัติ ให้ใช้ conservative workflow
  และบันทึก pending decision
- ห้ามเริ่ม Phase 5

รายงานภาษาไทยพร้อม Gate 4 checklist แล้วหยุดรออนุมัติ
```

### ข้อความอนุมัติ Gate 4

```text
Gate 4 ผ่าน อนุมัติเริ่ม Phase 5 ตาม Prompt Phase 5
```

---

## Prompt Phase 5 — Fruit, Harvest, Sales & Inventory

```text
Phase: 5 — Production & Commercial Traceability

ผลลัพธ์ที่ต้องการ:
เชื่อม Crop Cycle และจำนวนผลจากต้น/โซนไปยัง Harvest Lot, Sales Lot
และการใช้ Inventory ต่อสวน โดยไม่กลายเป็นระบบบัญชีเต็มรูปแบบ

In scope:
- Crop Cycle และ stages: flowering, early, mid-season, pre-sale, harvested
- Fruit Observation พร้อม count method, stage, observed/dropped count,
  confidence note, unit, time และ actor
- Harvest plan/lot: source trees/zones, quantity, weight, grade และ traceability
- Sales lot: customer reference, quantity/weight, price, deposit,
  received, outstanding และ status ตาม scope ที่อนุมัติ
- customer reference ใช้ข้อมูลขั้นต่ำ; ไม่รวม accounting, tax, payroll หรือ banking
- Inventory item/lot/unit/expiry
- receipt, issue, adjustment พร้อม reason/reference
- เชื่อม inventory usage กับ Work/Care Event
- low-stock/expiry alerts
- direct-cost summary เท่าที่ข้อมูลรองรับ
- farm-scoped rules, validation, audit และ export ตามสิทธิ์

Out of scope:
- บัญชี ภาษี ธนาคาร เงินเดือน หรือ e-commerce
- Cross-farm inventory/financial transfer
- การคาดเดาผลผลิต/รายได้โดยไม่แสดงฐานข้อมูลและข้อจำกัด

Success criteria:
- Fruit Observation ทุก record มี Crop Cycle และ stage
- trace จาก Tree/Zone → Crop Cycle → Harvest Lot → Sales Lot ได้
- inventory movement ทุก record มี quantity, unit และ reason/reference
- cross-farm access/transfer ถูกปฏิเสธ
- adjustment และยอดขายสำคัญมี audit
- calculation/unit tests, rules tests, UI tests, build ผ่าน
- รายงานแยก measured/estimated/unknown ชัดเจน

Validation:
- ทดสอบหน่วย/การปัดเศษ/ยอดคงเหลือ/negative stock policy
- ทดสอบ partial lot, correction, duplicate submit และ archived records
- ทดสอบสิทธิ์ `SALES_INVENTORY` และ cross-farm denial
- ตรวจ responsive forms บนมือถือ

Stop rules:
- หาก sales approval หรือ customer-data scope ยังไม่อนุมัติ ให้ใช้ข้อมูลขั้นต่ำ
  และไม่เก็บข้อมูลส่วนบุคคลเกินจำเป็น
- ห้ามเริ่ม Phase 6

รายงานภาษาไทยพร้อม Gate 5 checklist แล้วหยุดรออนุมัติ
```

### ข้อความอนุมัติ Gate 5

```text
Gate 5 ผ่าน อนุมัติเริ่ม Phase 6 ตาม Prompt Phase 6
```

---

## Prompt Phase 6 — Dashboard, Offline, Audit & Security Hardening

```text
Phase: 6 — Hardening & Operational Visibility

ผลลัพธ์ที่ต้องการ:
ทำให้ MVP ใช้งานภาคสนามได้อย่างเชื่อถือได้ในสัญญาณไม่เสถียร
มี Dashboard ตามสิทธิ์ Audit ที่ตรวจสอบได้ และ security/performance พร้อม Pilot

In scope:
- Farm Dashboard: tree health, urgent disease, overdue/upcoming work,
  fruit estimate, harvest, inventory warnings และ sales summary
- Portfolio Dashboard เฉพาะ `ORG_OWNER` และเฉพาะสวนที่มีสิทธิ์
- offline cache/queue, Pending/Syncing/Synced/Conflict states
- idempotency key และ retry-safe writes
- photo upload recovery และ orphan cleanup policy
- correction event / before-after audit สำหรับข้อมูลสำคัญ
- conflict review สำหรับ master data
- export ตาม role พร้อม audit
- security rules/functions/storage hardening
- performance, accessibility และ mobile outdoor usability pass
- backup/export/restore draft procedure และ monitoring plan

Out of scope:
- Production deployment หรือข้อมูลจริงก่อน Gate 6
- Cross-farm transfers
- AI prediction ที่ยังไม่มี validated model/data

Success criteria:
- offline report sync แล้วไม่ซ้ำ
- pending operation ไม่เปลี่ยน farm scope เมื่อสลับสวน
- conflict ไม่ถูกกลบแบบเงียบ ๆ
- Portfolio ไม่รวมสวนที่ไม่มีสิทธิ์
- audit ตอบได้ว่าใครทำอะไร เมื่อใด ในสวนใด
- security suite, offline E2E, accessibility, performance budget และ build ผ่าน
- ไม่มี high-severity finding ที่ยังไม่จัดการหรือบันทึก exception

Validation:
- จำลอง network offline/online, retry, duplicate และ partial upload
- ทดสอบ revoked role ขณะ offline และหลัง reconnect
- ทดสอบ dashboard authorization และ aggregate leakage
- ตรวจหน้าหลักที่ 320px, slow network และ dark/light mode
- ทำ dependency/security review โดยไม่เปลี่ยน production state

Stop rules:
- หากต้องสร้าง production resource, billing, domain หรือ deploy ให้หยุดและขออนุมัติ
- ห้ามเริ่ม Phase 7

รายงานภาษาไทยพร้อม Gate 6 checklist, residual risks และ Pilot readiness
แล้วหยุดรออนุมัติ
```

### ข้อความอนุมัติ Gate 6

```text
Gate 6 ผ่าน อนุมัติเริ่ม Phase 7 — Operational Application Pilot
ยังไม่อนุมัติ Production deployment จนกว่าจะตรวจ Pilot plan และรายการผลกระทบ
```

---

## Prompt Phase 7 — Operational Application Pilot, Deployment & Operations

```text
Phase: 7 — Operational Application Pilot, Rollout & Operations

ผลลัพธ์ที่ต้องการ:
เตรียม access-controlled Pilot Candidate จากแอปที่ผ่าน Gate 6 แล้วดำเนิน
Controlled Operational Pilot เพื่อเก็บ Physical Device/Field evidence ด้วย cohort
ที่ Owner อนุมัติ รวบรวมหลักฐาน แก้ปัญหา และเสนอ Go/No-Go ก่อน Production,
permanent tags หรือ scale-up

ข้อสำคัญ:
ก่อนทำ action ภายนอก เช่น สร้าง Firebase production, billing, domain,
public deployment, ส่งข้อความ หรือใช้ข้อมูลจริง ต้องเสนอแผน ผลกระทบ ค่าใช้จ่าย
และขออนุมัติแยกอย่างชัดเจน

In scope:
- Operational Pilot runbook, users, roles, devices, demo/real-data boundary และ support plan
- กำหนด/สำรวจ cohort, topology และป้าย `TEST ONLY` ระหว่าง Pilot โดยห้ามคาดเดา
  และต้องได้รับ Owner approval ก่อนลงพื้นที่หรือรับข้อมูลจริง
- Android/iPhone, camera/QR, LAN/Hotspot, Online/Offline, wrong-Farm denial และ
  idempotent reconnect evidence บนอุปกรณ์จริง
- training guide สำหรับ Owner/Manager/Worker
- backup, export, restore drill และ incident contacts
- privacy/retention/access review
- usability scenarios: find tree, scan, wrong scan, complete task,
  offline sync และ manager verify
- เก็บ metrics: find accuracy, scan success, time-on-task, sync failures,
  duplicate events, user assistance และ defects
- แก้ defect ที่อยู่ใน scope พร้อม regression tests
- rollout recommendation สำหรับประมาณ 600 ต้น

Out of scope:
- ขยายเต็มสวนก่อน Pilot sign-off
- เปลี่ยน scope ใหญ่หรือเพิ่ม module ใหม่ระหว่าง Pilot
- Production resource ใด ๆ ที่ยังไม่ได้อนุมัติเป็นรายการ

Success criteria:
- ตำแหน่ง Operational Pilot resolve opaque ID/Tag ถูกต้อง 100%
- wrong-tree scan ถูกเตือน 100% ของ scenario ทดสอบ
- offline retry ไม่สร้าง duplicate event
- ไม่มี cross-farm data leak
- backup/export/restore procedure ผ่านการตรวจ
- blocker defects ปิดหรือมี accepted risk
- Pilot report มี evidence และ Go/No-Go recommendation
- Physical Device/Field Validation Gate ผ่านก่อนเสนอ Production/permanent tags/
  scale-up; การ Deploy Pilot Candidate เพียงอย่างเดียวไม่นับว่าผ่าน

Validation:
- รัน full automated suite และ production-like smoke test ใน environment ที่อนุมัติ
- ตรวจ security, accessibility, performance และ data integrity
- เปรียบเทียบ Pilot results กับ Gate criteria โดยไม่ปรับเกณฑ์ย้อนหลัง

Stop rules:
- หากพบ data leak, corrupt history, duplicate critical event หรือ restore failure
  ให้หยุด rollout และรายงานเป็น blocker
- ห้ามขยาย 600 ต้นหรือ public launch โดยไม่มีข้อความอนุมัติ Go-Live

รายงานภาษาไทย:
1. Pilot scope และผู้เข้าร่วม
2. Metrics และหลักฐาน
3. Defects/fixes/remaining risks
4. Security/privacy/backup result
5. Go / Conditional Go / No-Go recommendation
6. Exact approvals required for production and full rollout

เมื่อเสร็จ ให้หยุดรอ Go-Live approval
```

### ข้อความอนุมัติ Go-Live

ข้อความนี้ต้องปรับตามรายการ resource, ค่าใช้จ่าย, environment และผล
Operational Application Pilot จริง
ไม่ควรอนุมัติแบบกว้างล่วงหน้า

```text
อนุมัติ Go-Live ตามรายการที่ระบุใน Pilot Report เวอร์ชัน [ระบุ]
เฉพาะ resource และ environment ต่อไปนี้: [ระบุ]
งบประมาณ/ค่าใช้จ่ายที่อนุมัติ: [ระบุ]
ผู้รับผิดชอบและ rollback owner: [ระบุ]
```

---

## Prompt สำหรับแก้ไขงานภายใน Phase เดิม

ใช้เมื่อ Codex รายงานว่ามีข้อผิดพลาดหรือ Gate ยังไม่ผ่าน:

```text
ดำเนินการแก้ไขภายใน Phase [ระบุ] เท่านั้น

ปัญหาที่ต้องแก้:
[วางรายการจากรายงานตรวจทาน]

ผลลัพธ์ที่ต้องการ:
[ระบุพฤติกรรมที่ถูกต้องและตรวจสอบได้]

Acceptance criteria:
[วางเกณฑ์]

ให้รักษา Source of Truth, Multi-Farm isolation, Tree identity,
auditability, offline/idempotency และ mobile usability

แก้เฉพาะไฟล์ที่จำเป็น รัน targeted tests และ full checks ที่เกี่ยวข้อง
รายงาน root cause, files changed, validation results และ remaining risk

ห้ามเริ่ม Phase ถัดไป เมื่อเสร็จให้หยุดรอการตรวจรับ
```
