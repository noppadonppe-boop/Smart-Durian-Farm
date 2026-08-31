# Gate 0 Acceptance Checklist

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.3 |
| สถานะ | Approved — Gate 0 Passed |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | `00-Project-Management/Phase-0-Plan.md`, `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`, `00-Project-Management/Decision-Log.md`, `00-Project-Management/Owner-Review-Addendum_Gate-0_2026-08-31.md` |

> Gate 0 วัด Product & Documentation Readiness ไม่ใช่ผล Operational Pilot
> Owner ตรวจและอนุมัติ Gate 0 เมื่อ 2026-08-31 การทำเครื่องหมายด้านล่างคือ
> Owner approval ของ readiness/plan ไม่ใช่ผล Field Validation

| หมวด | เกณฑ์ | หลักฐาน | สถานะ |
|---|---|---|---|
| Vision | เจ้าของยืนยัน Product statement และผู้ใช้หลัก | Scope review note | ☑ Owner Approved |
| Naming | ยืนยัน Product name และหลัก Organization Code/Farm Sequence | Decision Log | ☑ Owner Approved; code จริงยัง TBD |
| Multi-Farm | ยืนยัน isolation, opaque IDs, roles และ Farm Switcher behavior | Scope + Role Matrix | ☑ Owner Approved |
| MVP | ยืนยัน In scope / Out of scope | Scope sign-off | ☑ Owner Approved |
| Field Validation Plan | แผน topology, ป้าย 5–10 ป้าย และ Tree Survey 30–50 ต้นพร้อมใช้ก่อนล็อก Phase 3 | Field Survey Template + Phase 0 Plan | ☑ Owner Approved; ผลยัง TBD |
| Tree data | ยืนยัน Data Dictionary, units, method, measuredAt/by, confidence/source และ CSV parse | Data Dictionary + `Phase-0-Remediation-Validation-Report_v1.0.md` | ☑ Owner Approved |
| Tag | ยืนยัน human namespace และ opaque identity boundary | Tag Standard + Decision Log | ☑ Owner Approved |
| QR | ยืนยัน configurable route `/t/{opaquePositionId}`, redirect และ authorization boundary | Decision + Prototype test | ☑ Owner Approved; domain deferred |
| Workflow | Prototype ทำ Scan → Worker Report → Manager Verify/Rework ได้ | `Phase-0-Remediation-Validation-Report_v1.0.md` | ☑ Owner Approved |
| Mismatch | Prototypeแสดง expected/actual จาก code จริงและไม่มี action งานเดิม | `Phase-0-Remediation-Validation-Report_v1.0.md` | ☑ Owner Approved |
| Offline | ยืนยัน pending/sync/conflict proposal และสลับสวนแบบ cancel/confirm | Decision + `Phase-0-Remediation-Validation-Report_v1.0.md` | ☑ Owner Approved; Gate 1 action DEC-019 |
| Security | ยืนยัน Role/Access Matrix และ cross-farm cases | Security review | ☑ Owner Approved for least-privilege baseline |
| Data policy | ยืนยัน least privilege, minimization, farm-scoped audited export และ archive-before-delete | Decision Log | ☑ Owner Approved |
| UX | เจ้าของตรวจ UX Preview; แผนทดสอบผู้ใช้จริงอยู่ใน Field Validation/Phase 7 | Owner review note + test plan | ☑ Owner Approved with residual issue |
| Technical | ยืนยัน Vite/React/TypeScript/Firebase baseline | Architecture review | ☑ Owner Approved local/emulator-first |
| Gate distinction | ยืนยัน Gate 0, Field Validation Gate และ Phase 7 Operational Application Pilot | Phase 0 Plan + Decision Log | ☑ Owner Approved |
| Blockers | ไม่มี Blocked decision ที่ป้องกัน Foundation | Decision Log | ☑ DEC-015 Approved |

## Gate decision

- [x] **APPROVED — Gate 0 ผ่าน อนุมัติเริ่ม Phase 1 Foundation**
- [ ] **NOT APPROVED YET — ยังอยู่ Phase 0**

- ผู้อนุมัติ: `Project Owner`
- วันที่: `2026-08-31`
หมายเหตุ: อนุมัติเฉพาะ Phase 1 Foundation แบบ local/emulator-first;
Field Validation results ยังต้องทำก่อนล็อก Phase 3 และข้อจำกัด production คงเดิม

Gate 1 action: แอปจริงต้องไม่พึ่ง external runtime CDN สำหรับ offline-critical
flow และ network-denied smoke test ต้องไม่มี console error

## Field Validation evidence ที่ยังต้องทำภายหลัง Gate 0

- Field topology/map และรหัสจริง
- ป้าย 5–10 ป้ายพร้อมผลแดด/เปียก/อุปกรณ์จริง
- Tree Survey 30–50 แถวตาม Data Dictionary
- ผู้ใช้จริงทดสอบการค้นหา/สแกน/รายงานและ offline scenario

รายการนี้ไม่ใช่เหตุผลลดคุณภาพหรือยกเลิกหลักฐาน แต่เป็น Gate แยกก่อน Phase 3
