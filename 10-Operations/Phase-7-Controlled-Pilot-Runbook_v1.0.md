# Phase 7 Controlled Operational Pilot Runbook

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.3 |
| สถานะ | Draft — Execution HOLD Pending PA-1 and PA-2 |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | Phase 7 Plan v1.5, Pilot Impact & Approval Pack v1.5, Owner Mockup Input Pack v1.0, Physical Device Validation Gate v1.2, Work Photo Physical Device Protocol v1.1, Privacy Review v0.3, Governance Decision Sheet v1.0, DEC-027, DEC-031, DEC-034, DEC-036 |

## 1. Pilot boundary

- สวนทดลอง 1 แห่ง reference จริง `TBD`
- 30 Planting Positions จริงและป้ายชั่วคราว `TEST ONLY` 5 ป้าย
- Android จริงอย่างน้อย 1 และ iPhone จริงอย่างน้อย 1
- ใช้ participant เท่าที่จำเป็น; mapping ชื่อ/ติดต่อเก็บนอก repository
- ไม่ขยาย 600 ต้น ไม่ผลิตป้ายถาวร และไม่เปิด Production

## 2. Roles และผู้รับผิดชอบ

| Responsibility | Required code | สิทธิ์/หน้าที่ |
|---|---|---|
| Pilot owner / GO-NO-GO | `TBD` | อนุมัติเริ่ม หยุด กลับมาเริ่ม และปิด Pilot |
| Field lead / safety | `TBD` | briefing, site safety, physical stop |
| Deployment owner | `TBD` | deploy Candidate ที่อนุมัติเท่านั้น |
| Rollback owner | `TBD` | revoke access/rollback ตาม trigger |
| Incident commander | `TBD` | classify, contain, notify, preserve evidence |
| Data/privacy custodian | `TBD` | access, retention, export, disposal |
| Backup/restore operator | `TBD` | backup/restore ภายใต้ dual approval |
| Backup/restore approver | `TBD` | อนุมัติแยกจาก operator และตรวจ manifest |
| Lifecycle/deletion operator + approver | `TBD / TBD` | ต้องเป็นคนละรหัส; เปิด ENFORCE ตาม approval เท่านั้น |
| Encryption/recovery key custodian | `TBD` | rotation, revoke และ emergency recovery audit |
| Owner/Manager/Worker testers | `TBD` | ทำ scenario ตาม role โดยไม่ยืมบัญชี |

ทุก code ต้อง map ถึงผู้รับผิดชอบจริงในทะเบียนนอก repository ก่อน PA-2

ชุด code จำลองสำหรับ dry-run อยู่ใน Owner Mockup Input Pack v1.0 การกรอก mock
ครบไม่ทำให้ checklist ด้านล่างผ่าน และห้ามใช้ code จำลองเป็นผู้รับผิดชอบจริง

## 3. Entry gates

### PA-1 — ก่อนสร้าง/Deploy Pilot Candidate

- [ ] environment, resource, region, cost ceiling และ billing decision Approved
- [ ] Candidate ID/source/checksum frozen และ rollback owner พร้อม
- [ ] private access, test accounts, monitoring และ backup target Approved
- [ ] destination, region, key custody, operator/approver และ RPO/RTO Approved
- [ ] full suite + deploy smoke + Cross-Farm denial ผ่านด้วย Mock data

### PA-2 — ก่อนข้อมูลจริง/อุปกรณ์จริง/ลงพื้นที่

- [ ] site/cohort/topology/participants/device matrix มาจาก Owner/ผู้สำรวจจริง
- [ ] purpose/minimum data, notice/consent, access/retention/disposal Approved
- [ ] Data Custodian, orphan grace, photo export และ lifecycle `ENFORCE` Approved
- [ ] test-only QR URL/redirect ownership Approved หรือ QR coverage ระบุ Blocked
- [ ] evidence storage, incident contact, rollback, safety/weather rule พร้อม
- [ ] Field Lead และ Owner ให้ข้อความ GO พร้อมวันเวลา

## 4. Data modes

| Mode | ใช้เมื่อ | ข้อมูล | ข้อห้าม |
|---|---|---|---|
| M0 Mock Candidate | หลัง PA-1 ก่อน PA-2 | `SIMULATED/TEST ONLY` | ห้าม real photo/name/phone/topology |
| M1 Controlled Pilot | หลัง PA-2 | ข้อมูลจริงขั้นต่ำเฉพาะ cohort | ห้าม commit/reseed Dev, ห้ามขยาย scope |
| M2 Production | หลัง PA-3 เท่านั้น | ตาม Production policy | ห้ามใช้ใน Phase 7 โดยอนุมาน |

## 5. Preflight sequence

1. ยืนยัน Candidate ID, environment banner, Mock/Real mode และเวลา
2. ตรวจ participant/device/account matrix โดยไม่บันทึก OTP/secret
3. ทดสอบ revoke/rollback, monitoring และ evidence capture
4. Android/iPhone เปิด Candidate, install/update PWA และตรวจ permission
5. ทดสอบ Online → Offline → Online, cache และ last-sync โดยไม่ใช้ข้อมูลจริงก่อน GO
6. ทดสอบ Cross-Farm negative account; allow 1 ครั้ง = Critical stop
7. ตรวจป้าย `TEST ONLY`, human code, QR manifest และ safety ก่อนติดตั้ง
8. ตรวจ Work photo policy: WebP/≤1,600px/≤5MB, EXIF/GPS removal,
   IndexedDB Queue/Photo Retry/Orphan access, HEIC fallback และ approved
   retention/export baseline
9. รัน Photo lifecycle worker แบบ `DRY_RUN`; reconcile Work reference และ
   disposal preview ก่อนพิจารณา `ENFORCE`

## 6. Required scenario order

| ID | Scenario | Expected | Evidence |
|---|---|---|---|
| PILOT-01 | Sign-in + Farm context | เห็นเฉพาะ Farm/role ที่อนุมัติ | run + screenshot/log |
| PILOT-02 | Find 30 positions | opaque ID/Tag resolve ถูก 100% | cohort reconciliation |
| PILOT-03 | QR Match | Farm/Zone/Row/Position ตรง manifest | attempts/time/device |
| PILOT-04 | Mismatch/Wrong-Farm | block 100%, ไม่เปิดเผย Farm อื่น | negative evidence |
| PILOT-05 | Unknown/Damaged/manual | ไม่เดาข้อมูล; fallback ใช้ได้ | issue/evidence ID |
| PILOT-06 | Worker task online | ดู reference, ถ่าย BEFORE/AFTER; WebP/ขนาด/EXIF-GPS ผ่าน | audit + metadata evidence |
| PILOT-07 | Worker photo interruption | ตัด network ก่อน/หลัง object upload แล้วปิด/reload | Durable batch + Retry/Orphan record + original failure |
| PILOT-08 | Reconnect/retry/cleanup | binary ยังอยู่, Photo ID/path/key เดิม, no duplicate, server cleanup audit | count/reconciliation |
| PILOT-09 | Manager verify/rework | สิทธิ์และ before/after audit ถูกต้อง | audit evidence |
| PILOT-10 | Dashboard/Portfolio | role-adapted, no hidden aggregate | access evidence |
| PILOT-11 | Farm export | minimal Farm-scoped columns + audit | export manifest |
| PILOT-12 | Backup/restore drill | counts/checksums/access reconcile | drill report |
| PILOT-13 | HEIC native/fallback | ทดสอบ iPhone รุ่นจริง; native WebP หรือ approved JPEG/on-device fallback | device evidence + EXIF/GPS=0 |
| PILOT-14 | Lifecycle dry-run/enforce | DRY_RUN ก่อน; ENFORCE เฉพาะ approval ครบ | disposal manifest + dual approval |

หาก PA-2 ไม่อนุมัติ QR URL ให้ PILOT-03 เฉพาะ manual/human-code และสรุป QR
coverage เป็น `BLOCKED`; ห้ามสรุป Physical QR Gate ผ่าน

## 7. Evidence and metrics rules

- ทุก run ใช้ unique Evidence ID และอ้าง Candidate/Device/Scenario/Farm ref
- เก็บ expected, actual, attempts, elapsed time, network, assistance และ Issue ID
- เก็บ original failure; retest เป็นแถวใหม่และ link original Issue ID
- ไม่เก็บ OTP, secret, เบอร์โทร,ใบหน้า,ป้ายทะเบียน หรือพิกัดละเอียดใน repository
- ใช้ CSV templates ใน `08-Testing`; evidence binary จริงเก็บใน approved storage
- ผลทดสอบภาพใช้ `Phase-7-Work-Photo-Device-Evidence_v1.0.csv`; รูปจริงห้าม commit

## 8. Daily control

```text
Brief → Confirm GO → Execute approved scenarios → Reconcile evidence/metrics
→ Review incidents/defects → Owner decides continue/hold/stop → Backup/close access
```

ทุกวันต้อง reconcile participant, device, position/tag, work/report/audit, queue,
export และ evidence counts ก่อนเริ่มวันถัดไป

## 9. Critical stop

หยุดทันทีเมื่อ data leak/Cross-Farm allow, wrong-tree action, duplicate critical
event, corrupt history, restore mismatch, unauthorized real data, secret exposure
หรือความเสี่ยงทางกายภาพ จากนั้น preserve evidence → contain → notify Owner →
rollback/revoke ตามอนุมัติ → fix/retest ก่อน resume

## 10. Exit

- scenario/coverage/metrics ครบตาม PA-2 และไม่มี blocker เปิด
- Physical Device Validation Gate มี Owner decision ชัดเจน
- backup/export/restore และ privacy/access/retention ผ่าน review
- Final Pilot Report สรุป `GO`, `CONDITIONAL GO` หรือ `NO-GO`
- หยุดรอ PA-3; ห้าม Production/permanent tags/600-tree scale-up อัตโนมัติ
