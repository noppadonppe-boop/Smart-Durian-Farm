# Test Script — Android และ iPhone สำหรับ Phase 3 Field Validation

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Approved Script — Controlled Field Validation; Device Details Pending |
| เจ้าของเอกสาร | Project Owner |
| วันที่จัดทำ | 2026-08-31 |
| Source of Truth | Owner Review Addendum — Phase 3 Field Validation Pack, UX/UI Knowledge v0.1, Phase 3 Validation Report v1.0 |

> ใช้เฉพาะ test account/phone/OTP กับ Firebase Emulator หรือสภาพแวดล้อมทดสอบ
> ที่ Owner อนุมัติ ห้าม SMS จริง เบอร์จริง production domain หรือ production data

Owner กำหนดขั้นต่ำ Android 1 เครื่องและ iPhone 1 เครื่อง รุ่น/OS/browser จริงยัง
`TBD` และต้องระบุใน Field Execution Brief ก่อนเริ่มทดสอบ

## 1. Test run metadata

| Field | Android run | iPhone run |
|---|---|---|
| Field Validation ID | | |
| Test run ID | | |
| Device ID | | |
| Model | | |
| OS/version | | |
| Browser/version | | |
| Browser tab / installed PWA | | |
| Camera permission state | | |
| Screen brightness | | |
| Network: Online/Offline/weak | | |
| Last sync/cache time | | |
| Tester code | | |
| Start/end time + timezone | | |

## 2. Common preconditions

- [ ] Device/browser อยู่ใน matrix ที่ Owner อนุมัติ
- [ ] ใช้ test account และ OTP ของ Firebase Authentication Emulator เท่านั้น
- [ ] Tester มี membership เฉพาะ test Farm ที่กำหนด
- [ ] มี Match target, Mismatch target, Unknown code และ Damaged sample ที่ควบคุมได้
- [ ] ป้ายทุกใบเชื่อม Manifest/Plate ID และไม่มีข้อมูลบุคคล
- [ ] Cache state ระบุชัดว่า position ใดมี/ไม่มี cache ก่อนตัด network
- [ ] เปิดบันทึก Test run, attempts, elapsed time, screenshot/photo และ Issue ID
- [ ] Mismatch race-condition regression อยู่ใน test รอบนี้
- [ ] Cross-Farm expected result = deny ทุกกรณี; allow ครั้งใดเป็น Critical stop

## 3. การบันทึกผลต่อ Test Case

สำหรับทุก Test Case บันทึก:

| Run ID | Device | Network | Test ID | Plate/Position ref | Attempts | Elapsed sec | Actual result | Pass/Fail/Blocked | Evidence/Issue ID |
|---|---|---|---|---|---:|---:|---|---|---|
| | | | | | | | | | |

พิมพ์ตารางเพิ่มตามจำนวนรอบ ห้ามสรุป Pass หากไม่มี Evidence ID

## 4. Test cases — ต้องรันทั้ง Android และ iPhone

### FV-DEV-01 — Camera/manual readiness

- **Network:** Online
- **Steps:** เปิด Scan → อ่านคำอธิบายสิทธิ์ → อนุญาต/ปฏิเสธตามรอบ → ตรวจ fallback

**Expected:** ขอสิทธิ์เมื่อผู้ใช้กดเท่านั้น, ปฏิเสธสิทธิ์แล้ว manual entry ยังใช้ได้,
ไม่มีการอัปโหลดวิดีโอ และไม่มี console/runtime error ที่ผู้ใช้เห็น

### FV-DEV-02 — Online Match

- **Network:** Online
- **Steps:** เลือก expected Position → สแกนป้ายเดียวกัน → ตรวจ Farm/Zone/Row/Position

**Expected:** แสดง `Match`, expected = actual, Farm context ถูกต้อง และ action
ที่มีสิทธิ์ผูกกับ Position ที่สแกนจริง

### FV-DEV-03 — Online Mismatch

- **Network:** Online
- **Steps:** เลือก Position A → สแกนป้าย Position B

**Expected:** แสดง `Mismatch`, expected/actual ชัด, ไม่เปิด action ของ A และไม่
บันทึก B แทน A

### FV-DEV-04 — Mismatch race-condition regression

- **Network:** Online
- **Steps:** เปลี่ยน expected A → C แล้วสแกน B ทันทีตามจังหวะใช้งานจริง

**Expected:** expected แสดง C และ actual แสดง B เสมอ ไม่มี state เก่าของ A และ
ไม่มี action ของ target เดิม หากผลไม่คงที่ให้ Fail และผูก Issue ID

### FV-DEV-05 — Online Unknown

- **Network:** Online
- **Steps:** สแกน/กรอกรหัส test ที่ไม่อยู่ใน current Farm manifest

**Expected:** แสดง `Unknown` โดยไม่สร้าง Position/Tag และไม่เดาข้อมูลจาก cache อื่น

### FV-DEV-06 — Cross-Farm/unauthorized route

- **Network:** Online
- **Steps:** ใช้ test account Farm A เปิด QR ของ Farm B

**Expected:** Access Denied/ข้อความที่ไม่เปิดเผย Tag, variety, topology หรือ existence
ของ Farm B และไม่มี action เขียนข้อมูล

### FV-DEV-07 — Damaged Tag

- **Network:** Online
- **Steps:** ใช้ sample ที่ Owner อนุมัติให้จำลองความเสียหายโดยไม่สร้างอันตราย →
ลองสแกน → ใช้ manual entry → กดรายงานป้ายชำรุด

**Expected:** Manual fallback ใช้ได้, รายงานผูก Farm/Position/Plate ID, ไม่แก้ Tree
master และสร้าง audit/evidence ตามสิทธิ์

### FV-DEV-08 — Offline Cached Match

- **Network:** เริ่ม Online เพื่อเตรียม cache แล้วตัด Offline
- **Steps:** ยืนยัน last sync → ปิด network → สแกน Position ที่ cache ไว้

**Expected:** แสดง `Offline Cached`, บอกว่าข้อมูลอาจไม่ล่าสุดและเวลา sync,
Farm/Position ถูกต้อง ไม่เรียก external runtime CDN และไม่มี console error

### FV-DEV-09 — Offline Cached Mismatch

- **Network:** Offline
- **Steps:** มี expected A ใน cache → สแกน B ที่อยู่ใน cache

**Expected:** แสดง Mismatch expected/actual ถูกต้อง ห้ามทำ action ของ A และไม่
เปลี่ยน Farm scope ของ pending item

### FV-DEV-10 — Offline Uncached/Unknown

- **Network:** Offline
- **Steps:** สแกน opaque ID/Tag ที่ไม่อยู่ใน cache

**Expected:** อธิบายว่าต้องออนไลน์/รอ retry, ไม่แสดงข้อมูลต้นอื่น และไม่ระบุว่า
เป็น Unknown จริงหากยัง resolve ไม่ได้

### FV-DEV-11 — Offline Damaged + manual entry

- **Network:** Offline
- **Steps:** สแกนไม่ได้ → กรอกรหัสด้วยมือ → บันทึกรายงานป้ายเสียแบบ pending

**Expected:** แสดง `บันทึกในเครื่องแล้ว` ไม่ใช้คำว่า `สำเร็จ`, pending item มี
immutable Farm scope และ operation/idempotency ID

### FV-DEV-12 — Reconnect and idempotent sync

- **Network:** Offline → Online
- **Steps:** จาก FV-DEV-11 เปิด network → retry ซ้ำด้วย operation ID เดิม

**Expected:** Pending → Syncing → Synced, สร้างเหตุการณ์เดียว, last sync อัปเดต,
ไม่เกิด duplicate หรือ conflict เงียบ ๆ

### FV-DEV-13 — Glare/angle/distance

- **Network:** Online และ Offline Cached ตามที่ปลอดภัย
- **Steps:** สแกนจากระยะ/มุม/แดด/เงาที่บันทึกได้ โดยไม่คาดเดาค่า

**Expected:** บันทึก attempts/time/condition จริง หากเกินเกณฑ์ข้อเสนอให้ Fail หรือ
Blocked ไม่เลือกเฉพาะรอบที่ผ่าน

### FV-DEV-14 — Wet/dirty then recovery

- **Network:** Online
- **Steps:** ใช้สภาพเปียก/เปื้อนตามธรรมชาติหรือวิธีที่ Owner อนุมัติ → สแกน →
ทำความสะอาดตามวิธีอนุมัติ → retest

**Expected:** มี before/after evidence, ป้าย/พิมพ์ไม่เสียหาย และไม่ลบ failure รอบแรก

## 5. Coverage matrix

ทำเครื่องหมายเฉพาะเมื่อมี Test run + Evidence ID

| State | Android Online | Android Offline | iPhone Online | iPhone Offline |
|---|---|---|---|---|
| Match | [ ] | [ ] | [ ] | [ ] |
| Mismatch | [ ] | [ ] | [ ] | [ ] |
| Unknown/Uncached | [ ] | [ ] | [ ] | [ ] |
| Damaged + manual | [ ] | [ ] | [ ] | [ ] |
| Cross-Farm deny | [ ] | N/A/เหตุผล: ____ | [ ] | N/A/เหตุผล: ____ |
| Reconnect/idempotent sync | N/A | [ ] | N/A | [ ] |
| Race-condition regression | [ ] | [ ] | [ ] | [ ] |

## 6. Proposed usability metrics — รอ Owner อนุมัติ

| Metric | Target proposal | Android result | iPhone result | Owner disposition |
|---|---:|---:|---:|---|
| QR success within 2 attempts | ≥95% test runs | | | |
| Mismatch blocked correctly | 100% | | | |
| Unknown/uncached ไม่แสดงต้นอื่น | 100% | | | |
| Offline retry duplicates | 0 | | | |
| Manual fallback completion | `TBD` | | | |
| Unassisted completion | กำหนดหลังรอบแรก | | | |

## 7. Test completion review

- [ ] Coverage matrix ครบตาม Device/Network ที่ Owner อนุมัติ
- [ ] ทุก Fail/Blocked มี Issue ID และ remediation owner
- [ ] Race-condition regression ผ่านทั้งสอง platform
- [ ] Browser/app console warning/error ได้บันทึก ไม่ตัดออกจากรายงาน
- [ ] ไม่มี SMS/เบอร์จริง production endpoint หรือ credential ใน evidence
- [ ] Retest เชื่อม original Issue ID และไม่เขียนทับหลักฐานเดิม
- [ ] Critical issue หยุด test area ที่เกี่ยวข้องและรายงาน Owner พร้อม evidence
