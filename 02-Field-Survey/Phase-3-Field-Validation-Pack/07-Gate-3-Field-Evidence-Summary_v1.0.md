# สรุปหลักฐานเพื่อปิด Field Validation และเสนอ Gate 3

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.1 |
| สถานะ | Gate 3 Passed by Owner Risk Acceptance — Physical Evidence Deferred, Not Passed |
| เจ้าของเอกสาร | Project Owner |
| วันที่จัดทำ | 2026-08-31 |
| Source of Truth | AGENTS.md v1.9, Owner Review Addendum — Gate 3, Gate 3 Acceptance Checklist, Physical Device Validation Gate |

> แบบนี้ไม่อนุมัติ Gate 3 ผู้จัดทำ Field Validation กรอกได้เฉพาะผลและ Evidence ID
> การปิด blocker และอนุมัติ Gate 3 ต้องเป็นคำตัดสินของ Project Owner

> Owner อนุมัติ Gate 3 เมื่อ 2026-08-31 โดยยอมรับ residual risk และ Deferred
> physical evidence รายการที่ยัง `TBD` ด้านล่างจึงยังไม่ผ่านและต้อง carry forward

## 1. Validation control

| รายการ | ค่า |
|---|---|
| Field Validation ID | `TBD` |
| Approved Pack version | `1.0` |
| Field dates | `TBD` |
| Sanitized Farm reference | `TBD` |
| Tree cohort target/actual | `30` / `TBD` |
| Tag pilot target/actual | `5 TEST ONLY` / `TBD` |
| Android devices required/completed | `≥1` / `TBD` |
| iPhone devices required/completed | `≥1` / `TBD` |
| Evidence manifest version | `TBD` |
| Report preparer/reviewer codes | `TBD` |

## 2. Required evidence register

| Evidence ID | หลักฐานที่ต้องมี | Minimum contents | Status | Storage/reference | Reviewer |
|---|---|---|---|---|---|
| FV-E01 | Owner approval ก่อนใช้ Pack | v1.0, 30 trees, 5 TEST ONLY plates, Android+iPhone | Accepted | Owner Addendum | Project Owner |
| FV-E02 | Data/photo handling approval | storage, access, PII, retention | TBD | | |
| FV-E03 | Topology evidence | north, entrance, Zone/Row, counting arrows, obstacles | TBD | | |
| FV-E04 | Code/Tag manifest | approved format proposal, duplicate/missing check | TBD | | |
| FV-E05 | Tree Survey จริง 30 ต้น | roster, per-tree forms, confidence/evidence completeness | TBD | | |
| FV-E06 | CSV/import evidence | 49 columns, preview, rejects, atomic fail, idempotent retry | TBD | | |
| FV-E07 | ป้ายชั่วคราว `TEST ONLY` 5 ป้าย | fabrication batch, installation, observations, condition | TBD | | |
| FV-E08 | Android test evidence | online/offline and all required scan states | TBD | | |
| FV-E09 | iPhone test evidence | online/offline and all required scan states | TBD | | |
| FV-E10 | Security/identity evidence | Match/Mismatch/Cross-Farm/Unknown/no Tag reuse | TBD | | |
| FV-E11 | Offline/idempotency evidence | cached/uncached, reconnect, no duplicate | TBD | | |
| FV-E12 | Photo/issue/remediation | manifest, issue severity, before/after, retest | TBD | | |
| FV-E13 | Production QR domain decision | owner-controlled domain + redirect ownership | TBD | | |
| FV-E14 | Owner configuration disposition | topology/tag/measurement/device/threshold decisions | TBD | | |

Status ใช้เฉพาะ `TBD`, `Collected`, `Reviewed`, `Accepted`, `Rejected`, `Blocked`
และต้องมี reviewer/evidence reference ก่อนเปลี่ยนเป็น `Reviewed` หรือ `Accepted`

## 3. Gate 3 blocker closure matrix

| Gate 3 blocker | Required evidence | Result summary | Open issue IDs | Owner disposition |
|---|---|---|---|---|
| Organization/Farm Code, Zone/Row, counting direction | FV-E03, FV-E04, FV-E14 | `TBD` | | Approve/Revise/Defer |
| Tree Survey จริง 30 ต้น | FV-E05, FV-E06 | `TBD` | | Approve/Revise/Defer |
| ป้ายชั่วคราว `TEST ONLY` 5 ป้าย | FV-E07, FV-E12 | `TBD` | | Approve/Revise/Defer |
| Android/iPhone Online/Offline | FV-E08, FV-E09, FV-E11 | `TBD` | | Approve/Revise/Defer |
| Match/Mismatch/Unknown/Damaged/Cross-Farm | FV-E08–FV-E12 | `TBD` | | Approve/Revise/Defer |
| Human Tag unique/no reuse | FV-E04, FV-E05, FV-E10 | `TBD` | | Approve/Revise/Defer |
| Production QR domain/redirect | FV-E13 | `TBD` | | Approve/Revise/Defer |
| Critical/High field issues | FV-E12 | `TBD` | | Approve/Revise/Defer |

## 4. Proposed metrics — Owner must approve before Gate use

| Metric | Target proposal | Actual | Sample denominator | Evidence | Owner disposition |
|---|---:|---:|---:|---|---|
| Position/Tag unique | 100% | TBD | TBD | | |
| Tree form completeness | 100% required/conditional fields | TBD | TBD | | |
| Search/find correct position | ≥95% | TBD | TBD | | |
| QR scan within 2 attempts | ≥95% | TBD | TBD | | |
| Mismatch warning + action blocked | 100% | TBD | TBD | | |
| Cross-Farm information disclosure | 0 — Owner required | TBD | TBD | | |
| Offline retry duplicate events | 0 | TBD | TBD | | |
| Tag unsafe/loose/sharp/root/mower conflict | 0 accepted plates | TBD | TBD | | |
| Unassisted workflow completion | `TBD after first run` | TBD | TBD | | |

## 5. Required Owner decisions after evidence review

Owner ตอบ `Approve`, `Revise` หรือ `Defer` พร้อมเหตุผล/เงื่อนไข:

1. Organization Code, Farm Sequence, Zone/Row format และทิศทางนับ
2. กติกาตำแหน่งว่าง ต้นตาย Row แตกแขนง/ขาดช่วง และ no-reuse
3. Tree status/confidence vocabulary และ measurement methods/units
4. Tag material, size, finish, QR size, เสา, ความสูง/ระยะ/ทิศติดตั้ง
5. ความเหมาะสมของ Android/iPhone, camera/manual fallback และข้อความ scan states
6. เกณฑ์ผ่านเชิงตัวเลขและ sample denominator
7. Production QR domain และ redirect ownership
8. การแก้ Critical/High issues ก่อนล็อก configuration
9. ขนาด import สูงสุด 50 records ต่อ atomic batch
10. Gate 3 decision และสิทธิ์เริ่ม Phase 4

## 6. Residual risks that Field Validation does not close automatically

- Phone OTP account recovery เมื่อเปลี่ยน/สูญเสียเบอร์ก่อน Production
- Production retention, backup, privacy, monitoring และ incident response
- JavaScript bundle warning >500 kB และ route code-splitting ก่อน Pilot
- Import มากกว่า 50 records และ resumable/chunk recovery policy
- ความทนทานของป้ายระยะยาวเกินช่วง 2–4 สัปดาห์

รายการเหล่านี้ต้องมี Owner disposition ตาม Gate/Phase ที่เกี่ยวข้อง ห้ามถือว่า
ผ่านโดยอัตโนมัติจาก Field Validation รอบนี้

## 7. Readiness review

- [ ] Evidence FV-E01–FV-E14 ครบและ review ได้
- [ ] Tree cohort actual ครบ 30 ต้นและไม่มีค่าที่แต่งขึ้น
- [ ] Tag pilot actual ครบ 5 ป้าย ทุกป้ายระบุ `TEST ONLY` และไม่มีการผลิตจำนวนมาก
- [ ] Android/iPhone coverage matrix ครบตามที่ Owner อนุมัติ
- [ ] Critical/High issues ปิดหรือมี Owner disposition ที่ยอมรับความเสี่ยงชัดเจน
- [ ] Topology/tag/QR domain/configuration ได้ Owner approval
- [ ] `08-Testing/Gate-3-Acceptance-Checklist.md` มีหลักฐานอ้างอิงครบ
- [x] Owner อนุมัติ Gate 3 ด้วยข้อความชัดเจนและบันทึก risk acceptance/deferral

## 8. Current gate statement

**Gate 3 PASSED — Owner risk acceptance; Physical evidence remains Deferred / Not Passed.**

หลักฐานที่ยังขาดย้ายไป Physical Device Validation Gate ห้ามใช้ Gate 3 decision
อ้างว่า Android/iPhone, field topology, QR, tag หรือ Cross-Farm บนอุปกรณ์จริงผ่าน

| ผู้จัดทำ summary | วันที่ | ผู้ตรวจหลักฐาน | วันที่ | Owner decision/date |
|---|---|---|---|---|
| | 2026-08-31 | | | Gate 3 Passed — Owner risk acceptance |
