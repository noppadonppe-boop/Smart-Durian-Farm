# รายงานการตรวจสอบ Annual Farm Management Cycle v1.0

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | PASS WITH CONDITIONS — Local/Mock/Firebase Emulator/Browser ตามขอบเขต DEC-048 |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| ขอบเขต | Mock-first; ไม่ใช่ Deployment, Controlled Pilot หรือ Production approval |

## 1. Source of Truth

- `01-Requirements/KDOMS_Annual_Farm_Management_Cycle_Knowledge_v0.1.md`
- `00-Project-Management/Decision-Log.md` — DEC-048
- `06-System-Architecture/Annual-Farm-Management-Cycle-Architecture_v0.1.md`
- `.agents/skills/kdoms-development-knowledge/SKILL.md`

## 2. ผลลัพธ์ที่ตรวจแล้ว

1. ค่าเริ่มต้นของรอบปีคือ 1 มิถุนายนถึง 31 พฤษภาคม โดยเก็บช่วงเวลาแบบ
   `[periodStart, periodEndExclusive)` และรองรับวันเริ่มเฉพาะสวนโดย Owner
2. Annual Cycle แยกตาม `organizationId + farmId` และตัวสลับสวนจะโหลดเฉพาะรอบของ
   สวนที่เปิดอยู่
3. แผนงานใช้ระดับ `FARM` และ `ZONE` เป็นหลัก; `TREE_SET` เป็นข้อยกเว้นที่ต้องระบุ
   ตำแหน่งต้นอย่างชัดเจน
4. สถานะรองรับ `DRAFT → PLANNED → ACTIVE → CLOSING → CLOSED`; รอบ `CLOSED`
   ห้ามแก้ปกติและแก้ได้ผ่าน Correction ที่มีเหตุผล, before/after, revision และ audit
5. Crop Cycle อ้าง `annualCycleId` ที่อยู่สวนเดียวกันและไม่ใช่รอบปิด โดยหนึ่ง
   Annual Cycle รองรับ Crop Cycle หลายรายการ
6. กฎ Firestore Emulator ปฏิเสธ Cross-Farm, จำกัดสิทธิ์ตามบทบาท, ใช้
   `annualCycleGuards/current` ป้องกัน Active/Closing พร้อมกันมากกว่าหนึ่งรอบ และ
   ผูกการแก้รอบที่เริ่มแล้วกับ Correction + immutable Audit ใน atomic write
7. Mixed Mock Annual/Firebase Production Crop ถูก fail closed ก่อน write ด้วย
   `ANNUAL_CYCLE_LINKAGE_UNAVAILABLE`

## 3. หลักฐานการตรวจ

| การตรวจ | ผล |
|---|---|
| Annual domain/repository/component tests | ผ่าน 3 files, 13 tests |
| Full unit/component regression | ผ่าน 29 files, 229 tests |
| TypeScript strict typecheck | ผ่าน |
| Firebase Emulator security/regression | ผ่าน 9 files, 67 tests; รวม forged guard delete/switch, standalone correction, final-state Plan linkage และ mixed-mode zero-write denial |
| Deterministic emulator seed | ผ่าน 148 records, 7 modules; Annual 4 cycles/3 plans/1 correction/1 audit/2 guards |
| Mock production build | ผ่าน |
| Performance budget | ผ่าน: Initial JS 348,801/350,000; CSS 56,239/60,000; Offline runtime 1,718,980/1,800,000 bytes |
| Offline external-runtime scan | ผ่าน 82 local build files |
| ESLint เฉพาะไฟล์ Annual และ integration ที่เกี่ยวข้อง | ผ่าน |
| Browser responsive 320×800 | ผ่าน; ไม่มี horizontal overflow (`scrollWidth == clientWidth == 305`) |
| Browser Farm/Annual selector | ผ่าน; สวนเหนือ 2026-06-01–2027-05-31 และสวนใต้ custom 2026-07-15–2027-07-14 |
| Browser closed-cycle history | ผ่าน; แสดง Correction Revision 1 → 2 และไม่แสดงคำสั่งแก้ปกติ |
| ESLint ทั้ง repository | ผ่าน (`--max-warnings=0`) |

## 4. หมายเหตุการทดสอบร่วมกับงานอื่นใน Working Tree

Working Tree มีงาน DEC-049 Management Reporting เกิดขึ้นพร้อมกัน จึงรักษาไฟล์และ
การเปลี่ยนแปลงส่วนนั้นไว้โดยไม่ย้อนทับ เมื่อรันกับสถานะล่าสุด ESLint ทั้ง repository
และ full unit/component regression ผ่านทั้งหมด 229 tests

## 5. ผล Independent Review โดย ChatGPT Work

ChatGPT Work ตรวจ review packet แบบ read-only รอบแรกและพบ P1 สองรายการ จากนั้น
ดำเนินการดังนี้:

1. ชี้แจงจากคำสั่ง Owner ต้นฉบับว่า Correction-only ครอบคลุม Cycle header และ
   closed summary หลังปิดรอบ; Plan ใหม่ระหว่าง Active/Closing เป็น append-only ตาม
   สิทธิ์ และ Closed Plan mutation ถูกปฏิเสธ
2. แก้ P1 ที่ยืนยันได้จริงเรื่อง Mixed Mock Annual → Firebase Production Crop ให้
   fail closed ก่อน write
3. เพิ่ม final-state `getAfter/existsAfter` สำหรับ Plan/Crop และผูก Cycle +
   Correction + immutable Audit ใน atomic write พร้อม adversarial tests

ผล re-review สุดท้ายคือ **PASS WITH CONDITIONS สำหรับ Local/Mock/Firebase Emulator**
และไม่พบ definite defect คงเหลือ เงื่อนไขที่ยังต้อง harden/เก็บหลักฐานเพิ่ม ได้แก่:

- Rules-level date/leap/date-only/timezone และ direct forged-date tests
- Zone/Position target existence, same-Farm และ duplicate/mixed target denial
- Idempotency request fingerprint, immutable operation และ concurrent retry tests
- Mobile end-to-end workflow, stale Farm switch, double-submit และ touch/keyboard usability
- trusted-server overlap/timeline guard และ adversarial concurrency ก่อน Production

## 6. ความเสี่ยงคงเหลือและ Gate

- การตรวจช่วงรอบซ้อนกันครบทุกกรณีใน Firebase repository ยังอาศัย transaction query
  ของ client ประกอบกับ active guard; ก่อน Production ต้องย้าย invariants สำคัญไปยัง
  trusted server/timeline guard และเพิ่ม concurrency/adversarial tests
- topology จริง, ข้อมูลภาคสนามจริง, Physical Device/Field evidence และ Production
  data migration ยังไม่อยู่ในขอบเขต
- ไม่มีการ Deploy Firebase/Hosting/Storage และไม่มี External Pilot Action จากงานนี้
- Gate ปัจจุบันยังเป็น **Gate 6 Passed; External PA-1 = NO-GO/BLOCKED** ตาม DEC-038

## 7. Acceptance Result

**PASS WITH CONDITIONS สำหรับ Local/Mock/Firebase Emulator ตาม DEC-048** โดยต้องคงป้าย
`SIMULATED/TEST ONLY` และต้องขอ Owner approval แยกก่อน Deployment, Controlled Pilot,
ข้อมูลจริงนอกขอบเขตที่อนุญาต หรือ Production rollout
