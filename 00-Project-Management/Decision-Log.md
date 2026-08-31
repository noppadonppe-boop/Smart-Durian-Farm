# Decision Log

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.2 |
| สถานะ | Approved — Gate 0 Passed |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | `AGENTS.md`, `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`, `00-Project-Management/Owner-Review-Addendum_Gate-0_2026-08-31.md` |

> Owner อนุมัติ Gate 0 เมื่อ 2026-08-31 รายการที่ระบุด้านล่างจึงเปลี่ยนเป็น
> `Approved` ตาม Owner Review Addendum; รายการ `Open` และ `Deferred` คงเดิม

| ID | เรื่อง | สถานะ | ข้อสรุปปัจจุบัน | แหล่งที่มา/ขั้นตอนต่อไป |
|---|---|---|---|---|
| DEC-001 | รูปแบบผลิตภัณฑ์ | Approved | Responsive Web App / PWA | Project Owner, Gate 0 Review, 2026-08-31 |
| DEC-002 | Technology baseline | Approved | Vite + React + TypeScript + Firebase; local/emulator-first | Project Owner, Gate 0 Review, 2026-08-31; ห้าม production/billing/deployment |
| DEC-003 | Multi-Farm | Approved | Organization มีหลาย Farm; ข้อมูลปฏิบัติการและสิทธิ์แยกตาม Farm | Project Owner, Gate 0 Review, 2026-08-31 |
| DEC-004 | Tree identity | Approved | Human Tag ระบุตำแหน่งถาวร; ปลูกทดแทนเพิ่ม `plantingCycle`; internal IDs เป็น opaque และ unique ทั้งระบบ | Project Owner, Gate 0 Review, 2026-08-31 |
| DEC-005 | ขนาดกลุ่มตรวจภาคสนาม | Approved | Field Validation ใช้ป้าย 5–10 ป้ายและต้น 30–50 ต้นก่อนล็อก Phase 3; Phase 7 เป็น Operational Application Pilot | Project Owner, Gate 0 Review, 2026-08-31; ผลภาคสนามยัง `TBD` |
| DEC-006 | Tag material | Approved | อะลูมิเนียม 10×15 ซม. พิมพ์ UV/เลเซอร์ เคลือบด้าน ติดเสาแยก เป็นข้อเสนอสำหรับทดสอบ 5–10 ป้ายเท่านั้น | Project Owner, Gate 0 Review, 2026-08-31; ยังไม่อนุมัติผลิตจำนวนมาก |
| DEC-007 | Human-readable Tag namespace | Approved | `{organizationCode}-{farmSequence}-{zone}-{row}-{tree}`; ตัวอย่าง `KGL-F01-Z01-R03-T017` โดย `KGL` คือ organizationCode และ `F01` คือ farmSequence | Project Owner, Gate 0 Review, 2026-08-31; รหัสภาคสนามจริงยัง `TBD` |
| DEC-008 | QR route และ production domain | Approved | Configurable base URL + `/t/{opaquePositionId}`; QR ไม่ใช่ authorization | Project Owner, Gate 0 Review, 2026-08-31; production domain เลื่อนไปก่อนผลิตป้ายจริง/Phase 3 sign-off |
| DEC-009 | Canonical roles | Approved | `ORG_OWNER`, `FARM_MANAGER`, `AGRONOMIST`, `WORKER`, `SALES_INVENTORY`, `VIEWER`, `AUDITOR` และ Role/Access Matrix แบบ least privilege | Project Owner, Gate 0 Review, 2026-08-31 |
| DEC-010 | Sign-in method | Open | เบอร์โทร, อีเมล หรือบัญชีเชิญ | เจ้าของเลือกก่อนล็อก Authentication ใน Phase 2 |
| DEC-011 | Offline conflict policy | Approved | Append-oriented events + idempotency; master-data conflict ให้ `FARM_MANAGER` review และ escalate ถึง `ORG_OWNER`; ใช้ correction event | Project Owner, Gate 0 Review, 2026-08-31 |
| DEC-012 | Sales MVP boundary | Approved | Harvest/Sales lot, customer reference ขั้นต่ำ, ราคา, มัดจำ, รับแล้ว, ค้าง; ไม่รวม accounting/tax/payroll/banking | Project Owner, Gate 0 Review, 2026-08-31 |
| DEC-013 | Cross-farm transfer | Deferred | ไม่รวมการโอนต้น สต็อก เงิน หรือประวัติระหว่างสวนใน MVP | พิจารณาหลัง Operational Application Pilot |
| DEC-014 | Product display name | Approved | Display name `Smart Durian Farm`; technical name `KDOMS` | Project Owner, Gate 0 Review, 2026-08-31 |
| DEC-015 | Phase 1 start | Approved | Gate 0 ผ่าน อนุมัติเริ่ม Phase 1 Foundation | Project Owner, Gate 0 Review, 2026-08-31; ห้ามเริ่ม Phase 2 ก่อน Gate 1 |
| DEC-016 | Internal identifiers | Approved | `organizationId`, `farmId`, `positionId` และ record IDs เป็น globally unique opaque IDs; ห้ามเชื่อถือ human code เป็น authorization | Project Owner, Gate 0 Review, 2026-08-31 |
| DEC-017 | Data policy baseline | Approved | Least privilege, data minimization, farm-scoped export with audit, archive-before-delete; ห้าม real/production data จนกว่า retention/backup/privacy จะ Approved | Project Owner, Gate 0 Review, 2026-08-31 |
| DEC-018 | Gate/Pilot terminology | Approved | Gate 0 = Product & Documentation Readiness; Field Validation Gate = ก่อนล็อก Phase 3/ผลิตป้าย; Phase 7 = Operational Application Pilot | Project Owner, Gate 0 Review, 2026-08-31 |
| DEC-019 | Offline-critical runtime dependency | Approved | แอปจริงต้องไม่พึ่ง external runtime CDN สำหรับ offline-critical flow และ network-denied smoke test ต้องไม่มี console error | Project Owner, Gate 0 Review, 2026-08-31; Gate 1 action |

## สถานะมาตรฐาน

- `Proposed`: Working Proposal ที่ยังต้องได้รับการอนุมัติ
- `Open`: ยังไม่มีข้อเสนอเดียวที่พร้อมตัดสิน หรือยังต้องการข้อมูลเพิ่ม
- `Approved`: เจ้าของโครงการอนุมัติอย่างชัดเจนและมีหลักฐานอ้างอิง
- `Deferred`: ตั้งใจเลื่อนไปยัง Gate/Phase ที่ระบุ
- `Blocked`: เงื่อนไขที่ป้องกันการเริ่มงานหรือผ่าน Gate
- `Superseded`: ถูกแทนที่ด้วย Decision อื่นโดยยังเก็บประวัติไว้

สถานะ `Confirmed` เดิมเป็น historical evidence เท่านั้น ไม่เท่ากับ formal
`Approved` รายการ DEC-001 ถึง DEC-005 จึงถูกย้ายเป็น `Proposed` โดยรักษา
ข้อสรุปเดิมและเพิ่มขั้นตอน Owner formal approval

## Acceptance criteria

- ไม่มีสถานะนอกชุดมาตรฐานในรายการ Decision
- Working Proposal เปลี่ยนเป็น `Approved` ได้เฉพาะเมื่อ Owner อนุมัติและมีหลักฐาน
- การเปลี่ยนเป็น `Approved` ต้องมีแหล่งอ้างอิง ผู้อนุมัติ และวันที่
- DEC-015 เป็น `Approved` จากข้อความอนุมัติ Gate 0 เมื่อ 2026-08-31
