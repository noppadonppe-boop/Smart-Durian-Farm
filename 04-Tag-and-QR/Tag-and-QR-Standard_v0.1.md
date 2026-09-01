# Tag and QR Standard v0.1.2

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.1.2 |
| สถานะ | Approved Digital Identity Baseline (DEC-046) — Physical Specification Still Proposed |
| เจ้าของเอกสาร | Project Owner |
| ขอบเขต | Multi-Farm tree-position identification |
| วันที่ปรับปรุง | 2026-09-01 |
| Source of Truth | `01-Requirements/KDOMS_Development_Mock_Data_and_Pilot_Knowledge_v1.0.md`, `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`, `00-Project-Management/Owner-Review-Addendum_Tree-Register-Operational-Data-Entry_2026-09-01.md`, `00-Project-Management/Decision-Log.md` (DEC-046) |

## 1. หลักการ

ระบบระบุต้นใช้ 4 ชั้นร่วมกัน:

1. ป้ายใหญ่ประจำ Farm/Zone
2. ป้ายหัว Row และทิศทางนับ
3. ป้ายถาวรทุก Planting Position
4. QR เพื่อเปิดข้อมูลและยืนยันตำแหน่ง

GPS ใช้พาไปบริเวณใกล้เคียง ไม่ใช้ยืนยันต้นเพียงอย่างเดียว

## 2. Tag code

รูปแบบเสนอ:

```text
{organizationCode}-{farmSequence}-{zone}-{row}-{tree}
KGL-F01-Z01-R03-T017
```

| ส่วน | รูปแบบ | ความหมาย |
|---|---|---|
| Organization | `KGL` | Human-readable organizationCode |
| Farm | `F01` | farmSequence ถาวรภายใน Organization |
| Zone | `Z01` | พื้นที่ย่อยในสวน |
| Row | `R03` | แถวที่ 3 |
| Tree | `T017` | ตำแหน่งที่ 17 ในแถว |

กฎ:

- ใช้ A–Z, 0–9 และ hyphen เท่านั้น
- ตัวพิมพ์ใหญ่ทั้งหมด
- ห้ามช่องว่างและอักขระภาษาไทยใน machine identifier
- Padding ด้วยเลขศูนย์ให้เรียงลำดับได้
- Human-readable Tag Code ต้องไม่ซ้ำภายใน Organization/Farm namespace
- `organizationId`, `farmId` และ `positionId` ภายในระบบใช้ globally unique
  opaque IDs; Tag Code ไม่ใช่ authorization หรือ primary security boundary
- ห้ามเปลี่ยนหรือ reuse หลังผลิตป้าย
- Tag code อ้าง Planting Position; `plantingCycle` เก็บในฐานข้อมูล ไม่พิมพ์เป็นส่วนถาวรของรหัส
- หากโครงสร้าง Zone/Row จริงไม่เหมาะกับสวน ต้องตัดสินใจก่อนผลิตป้ายทั้งหมด

### 2.1 การลงทะเบียน Tag Code สำหรับใช้งานจริงตาม DEC-046

- อนุญาตให้สร้างตัวตน Planting Position และ Tag Code ในทะเบียนต้นจริงได้เฉพาะ
  Firebase Production + Farm `OPERATIONAL` (`isMock=false`) ที่จัดเตรียมโดย
  trusted process และ Owner ยืนยัน Farm, Zone, Row, ลำดับตำแหน่ง และทิศทางนับแล้ว
- หน้าจอต้องแสดง Tag preview พร้อมสรุป Farm + Zone + Row + Position ให้ผู้ใช้ยืนยัน
  ก่อนบันทึก เพราะรหัสตำแหน่งเป็นตัวตนถาวรและห้ามนำกลับไปใช้กับตำแหน่งอื่น
- หาก topology ส่วนใดยังไม่ยืนยัน ให้เก็บเป็น `TBD` และห้ามสร้างตัวตนถาวรจาก
  ค่าที่คาดเดาหรือค่าตัวอย่าง
- การลงทะเบียน Tag Code ในฐานข้อมูล **ไม่เท่ากับ** การอนุมัติ QR payload จริง,
  Production QR domain, การพิมพ์ QR, การผลิตป้ายถาวร หรือการติดตั้งภาคสนาม
- Mock/Emulator/Farm จำลองยังต้องสร้าง Tag/Position แบบ `SIMULATED/TEST ONLY`
  และ `exampleData=true` เท่านั้น

## 3. QR payload

รูปแบบเป้าหมาย:

```text
{configurableBaseUrl}/t/{opaquePositionId}
```

ข้อกำหนด:

- Production ใช้ HTTPS และโดเมนที่เจ้าของควบคุมระยะยาว
- URL ต้อง redirect/migrate ได้โดยไม่เปลี่ยนป้าย
- ไม่ใส่โรค ยา ชื่อคน เบอร์โทร หรือข้อมูลที่เปลี่ยนแปลงได้ใน QR
- ไม่ให้ QR เพียงอย่างเดียวเป็น authorization; ระบบตรวจสิทธิ์หลังเปิดลิงก์
- แนะนำ Error Correction `Q` หรือ `H` สำหรับป้ายภาคสนาม
- พื้นดำบนขาว มี quiet zone ครบ และไม่ใส่โลโก้ทับ code ใน Pilot
- QR Preview ใช้ configurable placeholder ได้ใน Phase 1 Foundation
- ระหว่าง Development ใช้ configurable placeholder/mock route เท่านั้น
- Test-only QR base URL ต้องได้รับ `Approved` ก่อน Controlled Pilot ที่ใช้ QR จริง
- Production domain และ redirect ownership ต้องได้รับ `Approved` ก่อนผลิตป้ายถาวร
  หรือ Production rollout ไม่ใช่ตัว block การสร้าง Phase 3–6
- QR ใน UX Preview เป็นข้อมูลจำลอง

## 4. Physical sign specification

สเปกสำหรับทดลอง:

| รายการ | ข้อเสนอ |
|---|---|
| วัสดุ | อะลูมิเนียมหนา 1–1.5 มม. |
| ขนาด | 10 × 15 ซม. |
| งานพิมพ์ | UV พื้นขาว/ดำ หรือเลเซอร์ที่มี contrast สูง |
| ผิว | ด้าน กัน UV และน้ำ ลดแสงสะท้อน |
| รหัสตัวใหญ่ | สูงประมาณ 20–25 มม. อ่านจากทางเดิน |
| QR | 5 × 5 หรือ 6 × 6 ซม. |
| ขอบ | ลบมุม ไม่คม |
| ยึด | รู 2–4 จุด นอต/รีเวตสเตนเลส |
| อายุเป้าหมาย | อย่างน้อย 5 ปี หลังผ่าน Pilot |

ตัวอย่างหน้าป้าย:

```text
SMART DURIAN FARM
สวน: KGL-F01

Z01 · R03 · T017
KGL-F01-Z01-R03-T017

[ QR 6 × 6 ซม. ]
สแกนเพื่อยืนยันต้น/รายงานงาน
```

พันธุ์และปีปลูกไม่ควรเป็นข้อมูลหลักบนป้ายถาวรหากมีโอกาสเปลี่ยนเมื่อปลูกทดแทน อาจแสดงผ่านแถบ/สติกเกอร์รองที่เปลี่ยนได้

## 5. Installation

- ติดบนเสาแยกจากลำต้น ห้ามตอกตะปูหรือรัดลวดกับต้น
- เสาไฟเบอร์กลาส เหล็กชุบกัลวาไนซ์ HDPE หรือวัสดุทน UV
- ความสูงหน้าป้ายประมาณ 1.20–1.40 ม. จากพื้น
- ระยะจากลำต้นเสนอ 50–80 ซม. โดยหลบรากหลักและแนวเครื่องตัดหญ้า
- หน้าป้ายหันเข้าทางเดินและวางด้านเดียวกันทุกแถว
- มีป้ายทิศทางนับที่หัวแถว; หากแถวสลับทิศ ต้องแสดงชัดเจน

ค่าระยะทั้งหมดต้องยืนยันจาก Pilot และสภาพสวนจริง

## 6. Temporary status marker

ป้ายถาวรไม่เปลี่ยนสีตามงาน ให้ใช้คลิป/แถบสีชั่วคราวแยกต่างหาก:

| สี | ตัวอักษร | ความหมาย |
|---|---|---|
| แดง | `!` | ปัญหาเร่งด่วน |
| ส้ม | `FOLLOW` | รอติดตามหลังรักษา |
| เหลือง | `WATCH` | เฝ้าระวัง |
| น้ำเงิน | `W/F` | งานน้ำ/ปุ๋ย |
| ม่วง | `PRUNE` | งานตัดแต่ง |
| เขียว | `OK` | ตรวจ/ทำเสร็จแล้ว |
| ดำ | `STOP` | ห้ามดำเนินการ/ตำแหน่งพักใช้ |

สีต้องใช้ร่วมกับตัวอักษรหรือสัญลักษณ์และวันที่ ห้ามใช้สีอย่างเดียว

## 7. Scan behavior

เมื่อสแกน:

1. Parse identifier และ resolve ปลายทาง
2. ตรวจ sign-in และ Farm membership
3. แสดง Farm, Zone, Row, Tree code และรูปอ้างอิง
4. ถ้ามาจาก Work Order ให้เปรียบเทียบ target
5. ถ้าตรง ให้แสดง action ตามสิทธิ์
6. ถ้าไม่ตรง ให้แสดง “ป้ายนี้ไม่ตรงกับงาน” พร้อมรหัสจริง ห้าม auto-complete งานเดิม
7. ถ้า offline และไม่มี cache ให้แสดงข้อจำกัดและให้บันทึกรหัสเพื่อ retry อย่างปลอดภัย
8. มีทางเลือกกรอกรหัสด้วยมือและแจ้งป้ายชำรุด

## 8. Production QA

ก่อนรับป้ายจากผู้ผลิต:

- export manifest ของ tag code และ QR payload
- ตรวจ duplicate/missing sequence
- สแกนทุกป้ายอย่างน้อยหนึ่งครั้ง
- สุ่มสแกนกลางแดดจากอุปกรณ์จริง
- ตรวจ human-readable code ตรงกับ QR payload
- บันทึก batch, supplier, production date และ QA result

ระหว่าง Controlled Pilot ให้ทดสอบป้าย `TEST ONLY` จำนวนจำกัดตามขอบเขตที่ Owner
อนุมัติและบันทึกผลเพื่อ Owner Review ใน Decision Log ต้องผ่านก่อนผลิตป้ายถาวรหรือ
ผลิตจำนวนมาก ระยะเวลา 2–4 สัปดาห์ยังเป็นข้อเสนอ ไม่ใช่ข้อเท็จจริงภาคสนาม

## 9. Gate terminology

- Engineering Phases/Gates ใช้ Mock Data และ configurable QR/tag implementation
- DEC-046 เป็นข้อยกเว้นจำกัดสำหรับข้อมูลตัวตนตำแหน่ง/ทะเบียนต้นใน Farm
  `OPERATIONAL`; ไม่เปลี่ยน Gate ของ QR, ป้ายถาวร หรือ Physical/Field evidence
- Pilot Candidate ต้อง Deploy แบบ access-controlled หลัง Owner อนุมัติ environment
- Controlled Operational Pilot ตรวจ topology, ป้าย `TEST ONLY`, QR และความ
  เหมาะสมของรหัสจริงด้วยอุปกรณ์/เครือข่ายจริง
- Physical/Field evidence ต้องผ่านก่อน Production rollout, permanent tags หรือ
  scale-up แต่ไม่ block การสร้างแอป

ข้อกำหนดด้านวัสดุ/ขนาด/การติดตั้งยังเป็น `Proposed` จนกว่า Owner จะอนุมัติ
ห้ามผลิตป้ายจริงจากค่าตัวอย่าง `KGL-F01-Z01-R03-T017`
