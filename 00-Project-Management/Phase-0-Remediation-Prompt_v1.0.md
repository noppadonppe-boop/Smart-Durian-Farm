# Phase 0 Remediation Prompt v1.0

ใช้ส่งให้ Codex task `Smart-Durian-Code` หลังรายงาน Phase 0 Audit ฉบับ No-Go

## Owner review position

รายการต่อไปนี้เป็น **Working Proposal** เพื่อทำเอกสารให้สอดคล้องและเตรียมเสนอ Gate 0 ใหม่ ยังไม่ถือเป็น `Approved` จนกว่าเจ้าของโครงการจะยืนยัน:

1. Product display name: `Smart Durian Farm`; technical name: `KDOMS`
2. Tag namespace: `{organizationCode}-{farmSequence}-{zone}-{row}-{tree}` เช่น `KGL-F01-Z01-R03-T017`; internal records ใช้ globally unique opaque ID
3. Canonical roles: `ORG_OWNER`, `FARM_MANAGER`, `AGRONOMIST`, `WORKER`, `SALES_INVENTORY`, `VIEWER`, `AUDITOR`
4. Sales MVP: harvest/sales lot, customer reference ขั้นต่ำ, ราคา มัดจำ รับแล้ว ค้าง; ไม่รวมบัญชี/ภาษี
5. QR: configurable permanent route `/t/{opaquePositionId}`; production domain ต้องอนุมัติก่อนผลิตป้ายจริง แต่ไม่บล็อก Phase 1 foundation
6. Offline: append-oriented events + idempotency; master-data conflict review โดย Farm Manager และ escalate ถึง Org Owner; correction event แทน silent overwrite
7. Data policy baseline: least privilege, data minimization, farm-scoped export with audit, archive-before-delete และห้ามข้อมูลจริง/production จนกว่า retention/backup/privacy จะอนุมัติ
8. Gate distinction: Phase 0 = product/document/field-validation plan; Field Validation = ตรวจ topology/tag/data ก่อนล็อก Phase 3; Phase 7 = operational application pilot

---

## Prompt ที่ส่งให้ Codex

```text
ดำเนินการ Phase 0 Remediation สำหรับ Smart Durian Farm / KDOMS

บริบท:
Phase 0 Audit ล่าสุดให้ผล No-Go และพบข้อขัดแย้งในเอกสาร, data template
และ UX Prototype งานนี้อนุญาตให้แก้เฉพาะเอกสาร Phase 0, data template
และ UX Prototype เท่านั้น ยังไม่อนุญาต Application Code หรือ Phase 1

Working Directory:
E:\1.0 Project GPT Work\Smart-Durian-Farm

# Goal

แก้ข้อขัดแย้งและข้อบกพร่องที่ตรวจพบให้ Source of Truth สอดคล้องกัน
สร้างหลักฐานตรวจสอบที่พร้อมให้เจ้าของตัดสิน Gate 0 รอบใหม่
โดยไม่สร้าง Vite/React app, Git repository, Firebase resource หรือ deployment

# Working proposals

ใช้รายการต่อไปนี้เป็น Working Proposal เท่านั้น ห้ามบันทึกเป็น Approved:

1. Product display name = Smart Durian Farm; technical name = KDOMS
2. Human-readable Tag namespace =
   {organizationCode}-{farmSequence}-{zone}-{row}-{tree}
   ตัวอย่าง KGL-F01-Z01-R03-T017
   internal Organization/Farm/Position IDs ต้องเป็น globally unique opaque IDs
3. Canonical roles = ORG_OWNER, FARM_MANAGER, AGRONOMIST, WORKER,
   SALES_INVENTORY, VIEWER, AUDITOR
4. Sales MVP = Harvest/Sales lot, customer reference ขั้นต่ำ, ราคา, มัดจำ,
   รับแล้ว, ค้าง; ไม่รวม accounting/tax/payroll/banking
5. QR route = /t/{opaquePositionId} ภายใต้ configurable base URL
   production domain ต้องอนุมัติก่อนผลิตป้ายจริง แต่ไม่บล็อก Phase 1 foundation
6. Offline = append-oriented events + idempotency; master-data conflict review
   โดย FARM_MANAGER และ escalate ถึง ORG_OWNER; correction event แทน silent overwrite
7. Data policy baseline = least privilege, data minimization, farm-scoped export
   with audit, archive-before-delete; ห้าม real/production data จนกว่า retention,
   backup และ privacy policy จะได้รับอนุมัติ
8. แยก Gate/Pilot เป็น:
   - Phase 0 Product & Documentation Readiness
   - Field Validation Gate ก่อนล็อก Phase 3 และก่อนผลิตป้ายจริง
   - Phase 7 Operational Application Pilot ด้วยแอปและผู้ใช้จริง

# Required changes

## A. Governance and decisions

- แก้ AGENTS.md และ Decision-Log ให้ใช้สถานะชุดเดียวกัน:
  Proposed, Open, Approved, Deferred, Blocked, Superseded
- อธิบายว่า Confirmed เดิมเป็น historical evidence ไม่เท่ากับ formal Approved;
  migrate รายการเดิมอย่างรักษาความหมายและห้ามยกระดับเป็น Approved เอง
- เพิ่ม metadata ที่ขาด: version, status, owner, updated date และ Source of Truth
  ให้เอกสาร Phase 0 หลักตาม Definition of Done
- เพิ่ม decision records สำหรับ Working Proposals ข้างต้นเป็น Proposed
- DEC-015 ต้องยัง Blocked จนกว่าเจ้าของอนุมัติ Gate 0

## B. Tag and identity consistency

- ทำ Scope, Master Prompt, Tag Standard, Architecture และ Phase Prompts
  ให้ใช้ความหมายเดียวกัน:
  organizationCode=KGL, farmSequence=F01 และ human tag ตาม format ข้างต้น
- ระบุชัดว่าความ unique ภายในระบบมาจาก opaque internal IDs;
  human-readable tag ต้อง unique ตาม organization/farm namespace
- QR ไม่ใช่ authorization และไม่เก็บข้อมูลที่เปลี่ยนแปลงได้
- Production domain ไม่ใช่ Gate 0 blocker สำหรับ Foundation แต่เป็น blocker
  ก่อนผลิต physical tags/Phase 3 sign-off

## C. Role and MVP consistency

- สร้าง canonical Role/Access Matrix ฉบับ Proposed สำหรับ 7 roles
- แยก VIEWER กับ AUDITOR และเพิ่ม SALES_INVENTORY ให้ตรงทุกเอกสาร
- ใช้ least privilege และ farm-scoped role; ORG_OWNER เป็น organization scope
- ทำ Sales/customer/payment boundary ให้ตรงกันทุก Source of Truth

## D. Gate and pilot terminology

- ปรับ Phase-0 Plan, Gate-0 Checklist, Master Prompt และ Phase Prompts
  ให้แยก 3 ระดับตาม Working Proposal
- Gate 0 ต้องวัด product/document readiness และ approved plan
- Field Validation results ของ topology, ป้าย 5–10 ป้าย และต้น 30–50 ต้น
  ต้องเสร็จก่อนล็อก Tree/Tag implementation และก่อนผลิตป้ายจริง
- Phase 7 ต้องเรียก Operational Application Pilot และใช้แอปที่ผ่าน Gate 6
- ห้ามลดคุณภาพหรือเอาหลักฐานภาคสนามออก เพียงย้าย Gate ให้ตรงจังหวะ

## E. Tree import template

- ปรับ CSV ให้ Measurement ทุกกลุ่มมี value, unit, method, measuredAt,
  measuredBy และ confidence/source ตามความเหมาะสม
- ครอบคลุม trunk, canopy และ height อย่างสอดคล้องกับ Scope data rules
- เก็บแถว Example เพียงแถวเดียวและระบุว่าไม่ใช่ข้อมูลจริง
- เพิ่ม data dictionary อธิบายทุก column, required/optional, type,
  accepted values, validation และ example
- ตรวจจำนวน header/column และ parse CSV จริง

## F. UX Prototype remediation

แก้ 05-UX-UI/kdoms-mobile-ux-preview.html โดยรักษารูปลักษณ์เดิม:

- manual-code placeholder เปลี่ยนตาม Farm ปัจจุบัน
- parse code ที่กรอกและแสดง Farm/Zone/Row/Tree ตาม code จริง;
  ห้ามแสดง T018 แต่ location 017
- mismatch แสดง expected กับ actual และไม่มี action ทำงานเดิม
- เมื่อ Offline หรือมี Pending operations การสลับสวนต้องมีคำเตือนก่อนเปลี่ยน;
  ยกเลิกได้ และ pending item ต้องคง farm scope เดิม
- ทำปุ่ม “เริ่มงานและถ่ายภาพ” ให้สาธิต Worker Report flow ได้
- เพิ่ม Manager Verify / Request Rework flow แบบ interactive mock
- action สำคัญมี touch target ประมาณ 44x44px และใช้ได้ที่ 320px
- ข้อมูลทุกชุดยังระบุว่าเป็นข้อมูลจำลอง
- ถ้าไฟล์ generated/escaped จนดูแลยาก ให้สร้าง editable prototype source
  และ documented render/export step โดยรักษาไฟล์เปิดดูเดิม

# Validation

- ตรวจ links/path และคำศัพท์ใน Source of Truth
- ค้นหา role/tag/pilot terminology เก่าที่ขัดกันและรายงานผล
- parse CSV พร้อมตรวจ header/data-column count
- ตรวจ Prototype ที่ 320px และ 736px ทั้ง light/dark
- ทดสอบ interactions:
  Farm switch online, Farm switch offline/pending cancel+confirm,
  correct scan, mismatch scan, manual T018, Worker Report,
  Manager Verify และ Request Rework
- ตรวจ horizontal overflow, clipping, console warning/error และ keyboard controls
- รายงานไฟล์ที่เปลี่ยนและ exact validation results

# Success criteria

- Source of Truth ไม่มีข้อขัดแย้งเรื่อง Tag namespace, roles, decision statuses
  และชนิดของ Pilot/Gate
- Working Proposals ถูกบันทึกเป็น Proposed ไม่ใช่ Approved
- CSV สอดคล้องกับ measurement evidence rule และ parse ได้
- UX defects จาก Audit ถูกแก้และ flow Scan → Report → Verify ทำงานใน Prototype
- DEC-015 และ Gate 0 ยังคง Blocked/Not Approved
- ไม่มี Application Code, Git init, Firebase, credentials หรือ deployment

# Stop rules

- หากพบประเด็นที่ต้องใช้คำตัดสินเจ้าของนอก Working Proposals ให้บันทึก Open
  และเดินหน้าส่วนที่ไม่ถูกบล็อก
- ห้ามเปลี่ยน Working Proposal เป็น Approved
- ห้ามเริ่ม Phase 1
- เมื่อแก้และตรวจเสร็จ ให้หยุดรอ owner review

# Final report

รายงานภาษาไทยโดยมี:
1. Findings resolved แยกตาม Audit item
2. Files changed
3. Validation evidence
4. Remaining Open/Blocked decisions
5. Owner approval checklist แบบตอบได้ทีละข้อ
6. Gate 0 recommendation โดยห้ามอนุมัติแทนเจ้าของ
```
