# Field Execution Brief — Controlled Phase 3 Field Validation

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.3 |
| สถานะ | Gate 3 Closed by Owner Risk Acceptance — Physical Field/Device Validation Deferred, Not Passed |
| เจ้าของเอกสาร | Project Owner |
| วันที่จัดทำ | 2026-08-31 |
| Source of Truth | `00-Project-Management/Owner-Review-Addendum_Phase-3-Field-Validation-Pack_2026-08-31.md`, `00-Project-Management/Owner-Review-Addendum_Gate-3_2026-08-31.md`, Field Validation Pack v1.0, `AGENTS.md` v1.9, `08-Testing/Physical-Device-Validation-Gate_v1.0.md` |

> เอกสารนี้เป็น Hold Point ก่อนลงพื้นที่ ห้ามเริ่ม Field Validation จนกว่าช่อง
> Required Owner Input และ Pre-departure release จะครบ การกรอกข้อมูลจริงต้องมาจาก
> Owner/ผู้สำรวจเท่านั้น Codex ไม่เติมค่าหรือคาดเดา

> **Owner simulation authorization 2026-08-31:** Owner อนุญาตให้นำข้อมูลจาก
> Mockup มากรอกอัตโนมัติ และจำลองการเตรียม Android/iPhone, เครือข่าย และ Test URL
> เพื่อทำ Technical Preflight เท่านั้น ทุกค่าด้านล่างที่ระบุ `SIMULATED` หรือ
> `TEST ONLY` ไม่ใช่ข้อมูลภาคสนามจริง ไม่อนุญาตลงพื้นที่ และห้ามนำไปใช้เป็น
> Physical Device/QR Field Validation evidence

> **Owner Gate 3 decision 2026-08-31:** Owner ยอมรับ residual risk และ Deferred
> Physical Device/Field evidence เพื่ออนุญาต Phase 4 แบบ local/emulator-only
> เอกสารนี้ยังคง `NO-GO` สำหรับการลงพื้นที่และไม่ถือว่า physical evidence ผ่าน

## 1. ขอบเขตที่ Owner อนุมัติแล้ว

| รายการ | Approved control |
|---|---|
| พื้นที่ | สวนทดลอง 1 แห่ง; reference จริง `TBD` |
| Tree cohort | ต้นจริง 30 ต้น |
| Tag pilot | ป้ายชั่วคราว 5 ป้าย ทุกป้ายระบุ `TEST ONLY` |
| Device minimum | Android ≥1 และ iPhone ≥1 |
| Evidence | Checklist + CSV + Device Test Script + Photo/Issue Log |
| Data rule | สำรวจจริงเท่านั้น; unknown/estimated ต้องมาจากการสังเกตจริง ระบุ method/confidence และห้ามเดา |
| Cross-Farm | ต้อง deny ทุกกรณี; allow ครั้งใดเป็น Critical |
| QR base URL | `TBD`; ห้าม encode/พิมพ์ URL ที่ไม่ได้อนุมัติ |
| Critical issue | หยุดส่วนที่เกี่ยวข้อง เก็บหลักฐาน และรายงาน Owner |
| Gate | Gate 3 Passed by Owner risk acceptance; Phase 4 local/emulator-only authorized |

## 2. Simulated Owner Input — ใช้ทดสอบเท่านั้น

### A. ผู้รับผิดชอบ

| Responsibility | Person/reference code | Backup code | Confirmed |
|---|---|---|---|
| Field lead | `FV-LEAD-01 — SIMULATED` | `FV-LEAD-02 — SIMULATED` | [x] Simulation only |
| Technical support | `TECH-01 — SIMULATED` | `TECH-02 — SIMULATED` | [x] Simulation only |
| ผู้มีอำนาจ GO | `OWNER-01 — SIMULATED` | N/A | [x] Simulation only |
| ผู้มีอำนาจ NO-GO | `SAFETY-01 — SIMULATED` | N/A | [x] Simulation only |
| Site safety/coordinator | `SAFETY-01 — SIMULATED` | `SAFETY-02 — SIMULATED` | [x] Simulation only |
| Topology/Zone/Row recorder | `TOPOLOGY-01 — SIMULATED` | `FV-LEAD-01 — SIMULATED` | [x] Simulation only |
| Tree survey/data collector | `SURVEY-01 — SIMULATED` | `SURVEY-02 — SIMULATED` | [x] Simulation only |
| Tag/installation lead | `TAG-LEAD-01 — SIMULATED` | `TECH-02 — SIMULATED` | [x] Simulation only |
| Android tester | `ANDROID-TESTER-01 — SIMULATED` | `TECH-01 — SIMULATED` | [x] Simulation only |
| iPhone tester | `IPHONE-TESTER-01 — SIMULATED` | `TECH-01 — SIMULATED` | [x] Simulation only |
| Data quality reviewer | `DATA-REVIEW-01 — SIMULATED` | `OWNER-01 — SIMULATED` | [x] Simulation only |
| Photo/evidence custodian | `EVIDENCE-01 — SIMULATED` | `DATA-REVIEW-01 — SIMULATED` | [x] Simulation only |
| Critical escalation แบบไม่เปิดเผยข้อมูลส่วนตัว | `CONTROLLED-FV-GROUP — SIMULATED` | N/A | [x] Simulation only |

ใช้รหัสใน repository; ชื่อ/เบอร์จริงเก็บนอก repository ตามวิธีที่ Owner อนุมัติ

### B. วันและสถานที่

| Field | Owner-provided value |
|---|---|
| Field Validation ID | `FV-SIM-001 — SIMULATED` |
| Sanitized trial-farm reference | `FARM-PILOT-01 — SIMULATED` |
| Test date | `2026-09-05 — SIMULATED; ไม่ใช่นัดหมายจริง` |
| Start/end time + timezone | `08:00–12:00 Asia/Bangkok — SIMULATED` |
| Backup date | `2026-09-06 — SIMULATED` |
| Meeting/entry point reference | `SIMULATED-ENTRY-REF-01`; ไม่มีสถานที่จริง |
| Site permission confirmed by | `OWNER-01 — SIMULATED; physical confirmation pending` |
| Weather/safety cancellation rule | หยุดเมื่อฝนหนัก ฟ้าผ่า น้ำท่วม พื้นลื่น หรือสภาพไม่ปลอดภัย — `SIMULATED` |
| Emergency/stop communication path | `CONTROLLED-FV-GROUP — SIMULATED` |

### C. อุปกรณ์

| Device | ID | Model | OS/version | Browser/PWA/version | Camera checked | Power/storage checked |
|---|---|---|---|---|---|---|
| Android 1 | `ANDROID-TEST-01` | Browser-emulated viewport | `SIMULATED` | Chromium-compatible simulation | [x] Fallback simulated | [x] N/A simulation |
| Android เพิ่มเติม | N/A | | | | N/A | N/A |
| iPhone 1 | `IPHONE-TEST-01` | Browser-emulated viewport | `SIMULATED` | iPhone-size viewport simulation | [x] Fallback simulated | [x] N/A simulation |
| iPhone เพิ่มเติม | N/A | | | | N/A | N/A |
| อุปกรณ์สำรอง | `SIM-DEVICE-BACKUP-01` | Responsive browser viewport | `SIMULATED` | Controlled local browser | [x] Simulation | [x] N/A simulation |

> ตารางนี้ยืนยันเฉพาะ Browser/Viewport Simulation ไม่ได้ยืนยันฮาร์ดแวร์ กล้อง
> ระบบปฏิบัติการ แบตเตอรี่ พื้นที่จัดเก็บ หรือเครือข่ายของโทรศัพท์จริง

### D. Controlled App และ Test environment

| Field | Required value |
|---|---|
| เครื่องที่เปิด Web App/Emulator | `FIELD-LAPTOP-01 — SIMULATED local host` |
| วิธีเชื่อมต่อภายในพื้นที่ | `Local loopback — SIMULATION ONLY`; ยังไม่ยืนยัน LAN/Hotspot จริง |
| ผู้รับผิดชอบเปิดระบบ | `TECH-01 — SIMULATED` |
| Controlled app/test URL | `http://127.0.0.1:5173 — SIMULATION ONLY`; ห้ามใช้กับโทรศัพท์/QR จริง |
| Firebase Emulator host/access method | Local loopback: Auth 9099, Firestore 8080, Storage 9199 — `SIMULATED` |
| Test account references; no real phone/OTP | Demo accounts จาก local seed เท่านั้น; ห้ามบันทึก OTP |
| Same-Farm membership matrix | `OWNER-01/FARM-PILOT-01 — SIMULATED` |
| Cross-Farm negative-test account/position refs | `FARM-PILOT-01 → FARM-PILOT-02 expected DENY — SIMULATED` |
| Manual-code fallback refs | Demo Position/Tag refs จาก Phase 3 seed |
| Surveyor/source code scheme | `SURVEY-01`, `TOPOLOGY-01` — `SIMULATED` |
| Sanitized summary destination | `08-Testing/Phase-3-Controlled-Field-Technical-Preflight_v1.1.md` |
| Preflight จาก Android/iPhone | Browser/Viewport simulation authorized; physical device test ยัง `BLOCKED` |

### E. การวัด

| Field | Owner-provided value |
|---|---|
| รายการที่วัด | UI/flow readiness เท่านั้น — `SIMULATED`; ไม่มีค่าต้นไม้จริง |
| หน่วยที่อนุมัติ | `N/A — simulation`; physical measurement unit ยังต้องยืนยัน |
| เครื่องมือวัด | Responsive browser viewport และ automated test suite — `SIMULATED` |
| ผู้ตรวจทานข้อมูล | `DATA-REVIEW-01 — SIMULATED` |

### F. หลักฐานและความเป็นส่วนตัว

| Field | Owner-provided value |
|---|---|
| Evidence repository/path | `08-Testing/Phase-3-Controlled-Field-Technical-Preflight_v1.1.md — SIMULATED` |
| ผู้มีสิทธิ์เข้าถึง | `OWNER-01`, `TECH-01 — SIMULATED` |
| ระยะเวลาเก็บ | `SIMULATED — เก็บถึง Owner review รอบถัดไป`; physical retention ยังต้องยืนยัน |
| ผู้รับผิดชอบลบหรือ Archive | `EVIDENCE-01 — SIMULATED` |
| ห้ามเก็บใบหน้า ป้ายทะเบียน เบอร์โทร และพิกัดละเอียด | **ยืนยันแล้ว** |

ค่าจำลองข้างต้นใช้กับรายงาน technical simulation ที่ไม่มีภาพ/ข้อมูลภาคสนามเท่านั้น
storage, access, retention และ disposal สำหรับหลักฐานจริงยังเป็น blocker ก่อนลงพื้นที่

### G. Test QR

| Field | Current control |
|---|---|
| Test-only QR base URL | `http://127.0.0.1:5173 — SIMULATION ONLY`; **PHYSICAL QR COVERAGE BLOCKED** |
| Plate scope | PLATE-01–05 เท่านั้นและต้องระบุ `TEST ONLY` ตาม Owner Addendum |
| Permanent plate | **ห้ามพิมพ์/ผลิต** ตาม Owner Addendum |

URL loopback ใช้เปิด Browser Simulation บนเครื่องเดียวกันเท่านั้น โทรศัพท์จริงจะ
เข้าถึง URL นี้ไม่ได้ ห้าม encode หรือพิมพ์ QR จนกว่า Owner จะให้ test-only base URL
ที่โทรศัพท์จริงเข้าถึงได้และอนุมัติแยกต่างหาก

### H. ความปลอดภัย

| Field | Owner-provided value |
|---|---|
| ยกเลิกเมื่อฝนหนัก/ฟ้าผ่า/น้ำท่วม/พื้นลื่นหรือไม่ปลอดภัย | ยืนยันใน Simulation; physical acknowledgment pending |
| ผู้ตรวจสภาพพื้นที่ | `SAFETY-01 — SIMULATED` |
| เวลาตัดสิน GO/NO-GO | `07:30 Asia/Bangkok — SIMULATED` |
| วิธีช่วยเหลือฉุกเฉิน | `CONTROLLED-FV-GROUP — SIMULATED`; รายละเอียดจริงเก็บนอก repository และยังต้องยืนยัน |

## 3. วัสดุและเอกสารที่จะเตรียมหลังปิด TBD

- [ ] Checklist 1 ชุดและสำเนาสำรอง
- [ ] Topology/Zone/Row forms และแผนผังร่าง
- [ ] Cohort roster + แบบหนึ่ง Planting Position 30 ชุด
- [ ] CSV เปล่า 49 คอลัมน์เวอร์ชันเดียวกับ Pack
- [ ] ป้ายชั่วคราว 5 ป้าย พร้อม `TEST ONLY`; Plate IDs 01–05
- [ ] QR area เว้นว่างจน test-only base URL Approved
- [ ] Android/iPhone Test Script และผลทดสอบเปล่า
- [ ] Photo/Issue/Remediation Log
- [ ] อุปกรณ์วัดตาม method/unit ที่ Owner ระบุ
- [ ] อุปกรณ์ความปลอดภัย พลังงานสำรอง และซองกันน้ำตาม site condition

## 4. ลำดับการทำงานแบบย่อ

1. **Go/No-Go briefing:** ตรวจคน วัน อุปกรณ์ สภาพพื้นที่ Evidence storage และ Hold
2. **Topology walk:** เก็บข้อเท็จจริง Zone/Row/ทิศทางนับก่อนเสนอ code
3. **Tree survey:** สำรวจ 30 Planting Positions จากของจริงพร้อม confidence/evidence
4. **Temporary tag pilot:** ติดป้าย `TEST ONLY` 5 ป้ายตาม safety/site approval
5. **Device tests:** Android/iPhone Online/Offline และทุก scan state ที่ทำได้
6. **Cross-Farm negative tests:** ต้อง deny ทุกกรณี; allow = Critical stop
7. **Daily reconciliation:** Forms/CSV/Photos/Test runs/Issues ต้องนับตรงกัน
8. **Owner report:** ส่ง sanitized summary, Evidence IDs, blockers และ remediation

ถ้า QR base URL ยัง `TBD` ในวันทดสอบ ให้ทำเฉพาะ human-readable tag, manual-code,
device readiness และ mockup evidence ที่ไม่ encode URL พร้อมบันทึก QR coverage เป็น
`Blocked — QR base URL TBD`; ห้ามสรุปว่า QR Field Validation ผ่าน

## 5. Critical stop conditions

- Cross-Farm access สำเร็จหรือเปิดเผย Farm/Tag/topology ที่ไม่มีสิทธิ์
- Human Tag ซ้ำ หรือ Human Tag ↔ Position/QR ไม่ตรง
- Mismatch ยังเปิด action ของ target เดิมหรือ expected/actual ผิด
- ข้อมูล/ภาพ/credential/OTP/เบอร์จริงรั่วออกนอก evidence boundary
- ป้าย/เสา/พื้นที่ทดสอบเสี่ยงต่อคน ต้น ราก ทางเดิน หรือเครื่องจักร
- Data corruption, partial import หรือ idempotent retry สร้างข้อมูลซ้ำ

เมื่อเกิดเหตุ: **หยุดส่วนที่เกี่ยวข้อง → ป้องกันผลกระทบ → เก็บ original evidence
→ เปิด Critical Issue ID → แจ้ง Field Lead และ Owner → รอคำสั่งก่อน retest**

## 6. Release decisions

### 6.1 Simulated technical release

- [x] Mock role/reference codes ครบและระบุ `SIMULATED`
- [x] Browser viewport simulation: Android 360×800 และ iPhone 390×844
- [x] Mock Controlled App/Test URL ใช้ loopback บนเครื่องเดียวกันเท่านั้น
- [x] Correct/Mismatch/Unknown/manual fallback simulation ผ่าน
- [x] Cross-Farm denial ผ่าน browser และ emulator tests
- [x] Automated/local validation 35 tests + 19 emulator tests ผ่าน
- [x] ไม่มี QR encoded, ไม่มี permission กล้อง และไม่มีข้อมูล/เบอร์จริง

### 6.2 Physical pre-departure release — DEFERRED / NOT PASSED

- [ ] ผู้รับผิดชอบจริงและช่องทาง Critical escalation ครบ
- [ ] วัน เวลา สวนอ้างอิง site permission และ safety rule จริงครบ
- [ ] Android/iPhone จริง รุ่น/OS/browser และ test environment พร้อม
- [ ] Evidence storage/access/retention สำหรับข้อมูลจริงพร้อม
- [ ] Physical measurement methods/units พร้อม
- [ ] Cross-Farm negative-test matrix บนอุปกรณ์จริงพร้อมและ expected = deny ทุกกรณี
- [ ] ป้ายชั่วคราว 5 ป้ายมี `TEST ONLY`
- [ ] Test URL ที่โทรศัพท์จริงเข้าถึงได้ Approved หรือ QR tests ยังคง `Blocked`
- [ ] Field Lead ตัวจริงระบุ **GO** ด้านล่าง

| Decision | Field lead code | Date/time | Owner acknowledgment/reference |
|---|---|---|---|
| **DEFERRED / NOT PASSED — PHYSICAL FIELD NO-GO** | `TBD — real field lead` | 2026-08-31 | Owner Addendum Gate 3; Phase 4 local-only |

Simulated Mobile Technical Preflight ผ่านตาม
`08-Testing/Phase-3-Controlled-Field-Technical-Preflight_v1.1.md` แต่ไม่ทดแทน
Android/iPhone Physical Device Preflight และไม่เปลี่ยน Field Execution เป็น GO
การทดสอบจริงย้ายไป `Physical-Device-Validation-Gate_v1.0.md`

## 7. หลักฐานจริงที่ยังต้องได้รับก่อนลงพื้นที่

1. ตัวตน/รหัสอ้างอิงจริงของผู้รับผิดชอบที่เก็บ mapping ไว้นอก repository
2. กำหนดการ site permission และ safety acknowledgment จริง
3. ผล Preflight จาก Android/iPhone จริงพร้อมรุ่น OS browser/PWA
4. Controlled LAN/Hotspot และ Test URL ที่โทรศัพท์จริงเข้าถึงได้
5. วิธีวัด/หน่วย ที่เก็บหลักฐาน access/retention/disposal สำหรับข้อมูลจริง
6. Test-only QR base URL ที่อนุมัติ หากต้องการปลด Physical QR coverage
7. ข้อความ GO จาก Field Lead และ Owner หลังตรวจหลักฐานจริง

ข้อมูลจำลองในเอกสารนี้ห้ามนำไปแทนรายการข้างต้น
