# Tag and QR Standard v0.1

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.1 |
| สถานะ | Proposed — Field Validation Review |
| เจ้าของเอกสาร | Project Owner |
| ขอบเขต | Multi-Farm tree-position identification |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`, `00-Project-Management/Decision-Log.md` |

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
- Production domain ไม่ใช่ Gate 0 blocker แต่ต้องได้รับ `Approved` ก่อน
  Field Validation ที่ใช้ QR จริง, ก่อนผลิตป้ายจริง และก่อน Phase 3 sign-off
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

ก่อนผลิตจำนวนมากและก่อน Phase 3 sign-off ให้ผ่าน Field Validation 5–10 ป้าย
เป็นเวลาเสนอ 2–4 สัปดาห์ และบันทึกผลเพื่อ Owner Review ใน Decision Log

## 9. Gate terminology

- Gate 0 ตรวจ Product/Documentation Readiness และ Field Validation Plan
- Field Validation Gate ตรวจ topology, ป้าย 5–10 ป้าย และความเหมาะสมของรหัสจริง
- Phase 7 เป็น Operational Application Pilot ด้วยแอปที่ผ่าน Gate 6

รายการนี้ยังเป็น `Proposed` จนกว่า Owner จะอนุมัติ ห้ามผลิตป้ายจริงจากค่า
ตัวอย่าง `KGL-F01-Z01-R03-T017`
