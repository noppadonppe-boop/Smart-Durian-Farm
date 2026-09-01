# Physical Device Validation Gate

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.2 |
| สถานะ | REQUIRED — Deferred; Execute During Controlled Pilot and Pass Before Production/Permanent Tags/Scale-up |
| เจ้าของเอกสาร | Project Owner |
| วันที่จัดทำ | 2026-08-31 |
| Source of Truth | Owner Review Addendum — Development Mock Data and Pilot Timing, DEC-027, KDOMS Development/Mock Data/Pilot Knowledge v1.0, Owner Review Addendum — Gate 3, Field Validation Pack v1.0, Phase 3 Technical Preflight v1.1 |

## 1. Gate boundary

Gate นี้แยกจาก Engineering Gate และดำเนินการ **ระหว่าง Controlled Operational
Pilot** หลัง Deploy Pilot Candidate แบบ access-controlled และได้รับ Owner approval
ด้าน environment, real data, privacy, backup/restore, evidence, rollback และ
stop conditions แล้ว

Gate นี้ไม่ block Phase 4–6 แบบ local/emulator/browser หรือ private Staging/Pilot
Candidate ที่ใช้ Mock Data แต่ต้องผ่านก่อนเหตุการณ์ต่อไปนี้:

- Production rollout หรือเปิดใช้งานทั่วไป
- ผลิตป้ายถาวรหรือ encode/พิมพ์ Production QR
- ขยายจำนวนผู้ใช้ สวน หรือต้นนอก cohort ที่ Owner อนุมัติสำหรับ Pilot
- อ้างว่าอุปกรณ์/เครือข่าย/field workflow พร้อมใช้งานจริง

เอกสารนี้ไม่ใช่ authorization ให้ Deploy หรือเริ่ม Controlled Pilot ทันที

## 2. Required device and network evidence

- [ ] Android จริงอย่างน้อย 1 เครื่อง: รุ่น, OS, browser/PWA และ permission
- [ ] iPhone จริงอย่างน้อย 1 เครื่อง: รุ่น, iOS, Safari/PWA และ permission
- [ ] LAN/Hotspot จริงเชื่อม Controlled App/Emulator ตามวิธีที่อนุมัติ
- [ ] Online → Offline → Online และ service-worker/cache behavior บนอุปกรณ์จริง
- [ ] กล้องจริง: permission, autofocus, แสง, มุม, ระยะ, เปียก/เปื้อน/สะท้อน
- [ ] Work photo JPEG/HEIC ถูก re-encode เป็น WebP ≤1,600px/≤5MB บนทั้งสองระบบ
- [ ] Work photo หลัง upload ไม่มี EXIF/GPS/device/author metadata
- [ ] ตัดเครือข่ายก่อ/หลัง upload แล้ว Photo Retry/Orphan Cleanup ไม่ซ้ำและมี audit
- [ ] Match, Mismatch, Unknown, Damaged และ manual fallback บนอุปกรณ์ทั้งสอง
- [ ] Cross-Farm access ถูกปฏิเสธทุกกรณีและไม่เปิดเผย Farm/Tag/Tree/topology
- [ ] duplicate retry/idempotency หลัง reconnect ไม่สร้าง event/report ซ้ำ
- [ ] ไม่มี console error ใน network-denied/offline-critical smoke test

## 3. Physical field evidence carried forward

- [ ] topology, Zone/Row และทิศทางนับมาจากการสำรวจจริงโดยไม่คาดเดา
- [ ] cohort ต้นจริงและ tag/position identity มีหลักฐานตามขอบเขต Owner อนุมัติ
- [ ] ป้ายทดลอง `TEST ONLY` ผ่าน safety/readability/durability review
- [ ] Test-only QR base URL และ redirect ownership ได้รับอนุมัติก่อน encode
- [ ] Evidence storage/access/retention/disposal และ privacy controls พร้อม

รายการนี้ carry forward หลักฐานที่ยังไม่ได้ทำ ไม่ได้ระบุว่า Gate 3 เคยทดสอบผ่าน

## 4. Critical stop and retest

หยุดส่วนที่เกี่ยวข้องทันทีเมื่อพบ Cross-Farm disclosure, wrong-tree action,
duplicate critical event, corrupt history, data leak หรือความเสี่ยงทางกายภาพ
บันทึก original evidence, แก้ไข และทดสอบซ้ำทั้ง affected scenario ก่อนเสนอ Gate

## 5. Gate decision

- [x] **PHYSICAL DEVICE VALIDATION DEFERRED TO CONTROLLED PILOT — NOT PASSED**
- [ ] **PHYSICAL DEVICE VALIDATION PASSED**

Owner ต้องอนุมัติ Passed ด้วยข้อความชัดเจน ห้ามอนุมานจาก automated test,
viewport simulation, Engineering Gate หรือการ Deploy Pilot Candidate
