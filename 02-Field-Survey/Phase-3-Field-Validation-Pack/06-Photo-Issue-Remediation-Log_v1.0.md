# แบบบันทึกภาพถ่าย ปัญหา และข้อเสนอแก้ไข

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Approved Template — Controlled Field Validation; Storage Details Pending |
| เจ้าของเอกสาร | Project Owner |
| วันที่จัดทำ | 2026-08-31 |
| Source of Truth | Owner Review Addendum — Phase 3 Field Validation Pack, Scope Knowledge v0.2, Field Validation Pack Index |

> แบบนี้เก็บ reference/metadata ไม่ใช่ไฟล์ภาพจริง ภาพจริงห้าม commit เข้า repository
> จนกว่า Owner อนุมัติสถานที่เก็บ สิทธิ์เข้าถึง retention และการคุ้มครองข้อมูล

## A. Evidence handling control

| รายการ | ค่า Owner-approved |
|---|---|
| Field Validation ID | `TBD` |
| Evidence storage location | `TBD` |
| Authorized roles/codes | `TBD` |
| Naming convention | `TBD` |
| Retention/review date | `TBD` |
| Backup method | `TBD` |
| PII removal/redaction method | `TBD` |
| ผู้ดูแล Evidence | `TBD` |

กฎขั้นต่ำ:

- หลีกเลี่ยงใบหน้า บุคคล บ้าน ทะเบียนรถ เอกสาร และหน้าจอที่มีเบอร์โทร
- ใช้ Farm/Form/Plate/Test reference ID แทนชื่อจริงในชื่อไฟล์
- ไม่เก็บ credential, OTP, token, exact production endpoint หรือข้อมูลที่ไม่จำเป็น
- รักษา original evidence แยกจาก annotated/redacted copy
- การแก้ปัญหาใช้ Issue/Correction record; ห้ามลบ failure เดิม

## B. Photo evidence manifest

| Photo ID | Capture time + timezone | Device ID | Context type | Farm/Form/Plate/Test ref | View/condition | File ref | PII checked | Quality | Linked Issue ID |
|---|---|---|---|---|---|---|---|---|---|
| | | | topology | | | | | | |
| | | | tree-full | | | | | | |
| | | | trunk-base | | | | | | |
| | | | canopy-leaf | | | | | | |
| | | | tag-readable | | | | | | |
| | | | QR-device | | | | | | |
| | | | glare/wet/dirty | | | | | | |
| | | | issue-before | | | | | | |
| | | | remediation-after | | | | | | |

พิมพ์ตารางเพิ่มตามจำนวนภาพ ใช้ `N/A` พร้อมเหตุผลเมื่อไม่มีภาพที่จำเป็น

## C. Issue log

Severity proposal:

- `Critical`: ผิด Farm/Position, เปิดข้อมูลข้ามสวน, Tag↔QR ไม่ตรง, ความปลอดภัย
- `High`: Mismatch ไม่หยุด action, duplicate/no-reuse violation, evidence สูญหาย
- `Medium`: สแกน/อ่านยากซ้ำ ๆ, offline/manual fallback ใช้ไม่ได้ตาม flow
- `Low`: ข้อความ/ตำแหน่ง/ความสะดวกที่ไม่ทำให้ทำผิดต้น

Critical issue ใด ๆ ต้องหยุดการทดสอบส่วนที่เกี่ยวข้อง เก็บ original evidence และ
รายงาน Owner ก่อนกลับมาทดสอบต่อ ห้าม downgrade severity เพื่อให้การทดสอบเดินต่อ

| Issue ID | Found time | Severity | Category | Context ref | Expected | Actual | Reproduce steps | Evidence IDs | Immediate containment |
|---|---|---|---|---|---|---|---|---|---|
| | | | topology/tag/QR/device/data/UX/safety | | | | | | |
| | | | | | | | | |
| | | | | | | | | |

## D. Root cause และข้อเสนอแก้ไข

| Issue ID | Confirmed fact | Assumption to verify | Root cause status | Proposed change | Scope: doc/config/code/hardware | Owner | Risk if changed | Decision |
|---|---|---|---|---|---|---|---|---|
| | | | Open/Confirmed/TBD | | | | | Approve/Revise/Defer |
| | | | | | | | |
| | | | | | | | |

## E. Remediation and retest log

| Issue ID | Change reference | Changed by code | Change time | Retest run ID | Device/network | Expected after fix | Actual | New Evidence IDs | Status |
|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | Open/Passed/Failed/Deferred |
| | | | | | | | | | |
| | | | | | | | | | |

## F. Daily evidence reconciliation

| Date | Forms expected/found | Photos expected/found | Tests expected/found | Issues open/closed | Missing evidence | Reviewer code |
|---|---|---|---|---|---|---|
| | | | | | | |
| | | | | | | |
| | | | | | | |

## G. Release to Gate 3 summary

- [ ] ทุก Form/Plate/Test reference มี Evidence ID ตามข้อกำหนด
- [ ] ทุก Critical/High issue ปิดหรือ Owner disposition ชัดเจน
- [ ] Retest ไม่เขียนทับ/ลบ original failure
- [ ] Sanitized copies ไม่มี PII/secret/credential/real phone/OTP
- [ ] Missing evidence ถูกระบุเป็น blocker ไม่ถูกสรุปว่า Pass
- [ ] Evidence storage/retention ได้รับ Owner approval
