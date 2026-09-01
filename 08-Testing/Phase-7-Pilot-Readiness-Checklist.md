# Phase 7 Pilot Readiness Checklist

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 2.2 |
| สถานะ | Clean Local Candidate Frozen; External PA-1 Remains NO-GO/BLOCKED; No Deployment |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| Source of Truth | Owner Addendum Gate 6, Phase 7 Plan v2.3, External PA-1 Owner Review Decision v1.3, Pilot Impact & Approval Pack v2.1, Candidate Manifest v1.0, Local Pilot Readiness Report v1.5, Source Stabilization Inventory v1.2, Governance Decision Sheet v1.4, DEC-031, DEC-034, DEC-035, DEC-036, DEC-037, DEC-038, DEC-048, DEC-049, DEC-050 |

## A. Authorization and boundary

- [x] Gate 6 Passed และ Phase 7 Authorized ตาม DEC-031
- [x] Production deployment, public launch, real SMS/data และ permanent tags ไม่ได้รับอนุมัติ
- [x] PA-1, PA-2 และ PA-3 แยกกันชัดเจน
- [x] External Pilot Action ทั้งหมดยังคง HOLD
- [x] PA-1 Local/Browser/Firebase Emulator rehearsal ด้วย Mock Data อนุมัติตาม DEC-037

## B. Planning package

- [x] Phase 7 Plan และ stage/hold points
- [x] Impact/cost/resource register และ exact PA-1 approval text
- [x] Pilot Candidate Manifest และ freeze checklist
- [x] Controlled Pilot Runbook พร้อม roles/data modes/scenarios/stop rules
- [x] Owner/Manager/Worker Training Guide
- [x] Privacy/Retention/Access Review
- [x] Support/Incident/Rollback Plan
- [x] Backup/Export/Restore Drill
- [x] Work Photo Physical Device Protocol + empty evidence template
- [x] Retention/backup/export recommended baseline พร้อม PA-2 decision points
- [x] Photo Data Governance Decision Sheet ครบ roles/destination/region/key custody/RPO/RTO โดย actual value ยัง `TBD`
- [x] Durable Queue/Lifecycle Architecture และ server worker `DRY_RUN/ENFORCE` boundary
- [x] Evidence, Metrics, Defect/Retest CSV templates และ Go/No-Go Report template
- [x] Owner Mockup Input Pack + deterministic/resettable JSON ครบ PA-1/PA-2
- [x] ค่า Mock ทั้งหมดติดป้าย `SIMULATED/TEST ONLY` และไม่เปลี่ยน approval จริง
- [x] Validator ตรวจ schema, approval boundary, cohort, device, QR และ photo policy ซ้ำได้
- [x] PA-1 Mock Dry-run ผ่านและมี Owner Actual Input Form แยกจากค่าจำลอง
- [x] Owner-directed Mock Substitute แมป PA-1 ครบ 22 ช่องและตรวจ SHA-256 ซ้ำได้
- [x] แบบฟอร์ม Owner input กรอกครบด้วยค่า `SIMULATED/TEST ONLY` โดยไม่เปลี่ยน approval

## C. Local Candidate readiness

- [x] Candidate `KDOMS-PC-SIM-20260901-05` frozen จาก clean source commit สำหรับ Local Rehearsal เท่านั้น
- [x] ESLint และ TypeScript strict ผ่าน
- [x] Unit/component suite ผ่าน 229/229 ใน 29 test files
- [x] Firebase Emulator/security/integration suite ผ่าน 69/69 ใน 9 test files;
  Cross-Farm allow/disclosure = 0
- [x] Deterministic seed ผ่าน 161 records ใน 7 modules และ 4 Farm Profiles
- [x] Work photo resize/compress/metadata policy และ automatic Retry/Orphan ผ่าน local/emulator
- [x] Durable queue/checkpoint/replay และ metadata-only Retry block ผ่าน; local desktop
  IndexedDB interruption/reload/retry/commit/cleanup ผ่าน ส่วน Android/iPhone WP-09/WP-11 ยังเปิด
- [x] Lifecycle worker core: dry-run, approval separation, reference check, retention และ Cross-Farm stop ผ่าน local
- [x] HEIC fail-closed พร้อม JPEG/approved on-device conversion guidance ผ่าน unit test
- [x] Mock-only build/PWA/offline runtime/performance budget ผ่าน; precache 82 entries
- [x] Initial JavaScript 349,617/350,000 bytes, Initial CSS 56,497/60,000 bytes
  และ total offline runtime 1,730,235/1,800,000 bytes ผ่าน
- [x] Browser responsive ผ่าน 320px, Android 360×800 และ iPhone 390×844;
  Light/Dark, touch target, Offline UX และ console error = 0
- [x] Historical Candidate `...-01` ถูกเก็บเป็นหลักฐานเดิมและ superseded
- [x] Candidate `KDOMS-PC-SIM-20260831-02` เก็บเป็น historical local evidence;
  source drift เดิมถูก remediated ด้วย Candidate ใหม่ แต่ External decision ไม่เปลี่ยน
- [x] Candidate `KDOMS-PC-SIM-20260901-04` เก็บเป็น historical local evidence;
  Candidate `...-05` supersede หลังรวม DEC-050 และแก้ mobile overflow
- [x] Dependency audit high/critical = 0; moderate 2 dev-only บันทึกแล้ว
- [x] ไม่พบ credential/ข้อมูลจริงใน commit; production/local phone allowlist อยู่เฉพาะ
  ignored `.env` และไม่อยู่ใน Candidate
- [x] File inventory จำแนก Intended/Generated/Local-only/Ambiguous ครบ; Ambiguous = 0
- [x] Source/build/lock SHA-256 และ clean source commit บันทึกตรวจย้อนกลับได้
- [x] `git diff --check` ผ่าน

## D. PA-1 — Pilot environment/deployment

- [x] External PA-1 Owner Decision = `NO-GO/BLOCKED` บันทึกเป็น DEC-038
- [x] Owner-selected Mock Substitute กรอกครบสำหรับ local/document rehearsal
- [x] Local Candidate freeze/build/test rehearsal ได้รับอนุมัติตาม DEC-037
- [x] Full PA-1 Local/Emulator rehearsal ผ่านหลัง remediation
- [ ] environment/resource/region เลือกครบ
- [ ] billing/cost ceiling/usage owner อนุมัติ
- [ ] deployment/rollback owner และ Candidate ID อนุมัติ
- [ ] private access/Auth/monitoring/backup controls อนุมัติ
- [ ] Lifecycle scheduler/service identity และ Dry-run → Enforce approval อนุมัติ
- [x] Owner ส่ง PA-1 Local/Emulator approval text ชัดเจนตาม DEC-037
- [ ] Owner ส่ง External PA-1 approval พร้อมค่าที่ใช้งานได้จริง

## E. PA-2 — Real device/data/field execution

- [ ] participant/site/cohort/device matrix จริงครบ
- [ ] privacy/notice/consent/access/retention/disposal อนุมัติ
- [ ] Owner รับ/แก้ค่า 90/180/365/30/7 วัน, orphan grace, RPO 24h, RTO 8h และระบุ Data Custodian
- [ ] Backup/Lifecycle operator กับ independent approver, destination/region/key custody ครบ
- [ ] evidence storage, incident contacts, safety และ schedule พร้อม
- [ ] Test-only QR base URL/redirect ownership อนุมัติหรือ coverage ระบุ Blocked
- [ ] Field Lead + Owner ให้ GO

## F. Pilot success and PA-3

- [ ] Position/Tag resolve 100%
- [ ] Wrong-tree/wrong-Farm warning/block 100%
- [ ] duplicate critical event = 0 และ Cross-Farm disclosure = 0
- [ ] Android/iPhone + camera/QR + Online/Offline/Reconnect evidence ครบ
- [ ] Android/iPhone Work Photo WP-01–WP-11 ผ่าน, HEIC native/fallback มี evidence และ EXIF/GPS field count = 0
- [ ] backup/export/restore ผ่าน approved criteria
- [ ] blocker ปิดหรือมี accepted risk ที่ Owner ระบุ
- [ ] Final Pilot Report มี GO/CONDITIONAL GO/NO-GO
- [ ] Owner อนุมัติ PA-3 ก่อน Production/permanent tags/scale-up

Current decision: **SOURCE STABILIZED; LOCAL CANDIDATE FROZEN — EXTERNAL PA-1
NO-GO/BLOCKED; NO DEPLOYMENT, NO REAL DATA, NO FIELD EXECUTION**
