# แผนทดลองป้ายและ QR จำนวน 5–10 ป้าย

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Approved Plan — 5 Temporary TEST ONLY Plates; QR Payload Blocked by TBD URL |
| เจ้าของเอกสาร | Project Owner |
| วันที่จัดทำ | 2026-08-31 |
| Source of Truth | DEC-006, DEC-007, DEC-008, DEC-022, Owner Review Addendum — Phase 3 Field Validation Pack |

> Owner อนุมัติป้ายทดลองชั่วคราว 5 ป้ายเท่านั้น ทุกป้ายต้องระบุ `TEST ONLY`
> ยังไม่อนุมัติป้ายถาวร/ผลิตจำนวนมาก และ QR base URL ยัง `TBD`

## 1. วัตถุประสงค์

- ตรวจ Human Tag ตรงตำแหน่งและไม่ซ้ำ
- ตรวจ QR payload/opaque `positionId` ตรง manifest โดย QR ไม่เป็น authorization
- ตรวจการอ่านด้วยตาและสแกนด้วย Android/iPhone ในสภาพจริง
- ตรวจวัสดุ ผิว ความแข็งแรง จุดติดตั้ง และผลกระทบต่อราก/ตัดหญ้า
- สร้างปัญหา/ข้อเสนอแก้ไขที่ตรวจย้อนกลับได้ก่อนล็อก configuration

## 2. Preconditions — ต้องครบก่อนสั่งทำตัวอย่าง

- [x] Owner อนุมัติ Pack v1.0 และป้ายชั่วคราว 5 ป้าย
- [ ] Owner อนุมัติ Field Validation site/farm reference
- [ ] Topology/Zone/Row/ทิศทางนับมี draft evidence และยังไม่ล็อกถาวร
- [ ] Owner อนุมัติ QR base URL และ redirect ownership สำหรับการทดสอบ
- [ ] ทุกป้ายมี `TEST ONLY`; ห้ามทำให้เข้าใจว่าเป็น production/approved topology
- [ ] Tag/QR manifest ผ่าน duplicate/missing/mismatch check
- [ ] Opaque `positionId` เป็นข้อมูลทดสอบที่ควบคุมได้และไม่เปิดเผยข้อมูลเปลี่ยนแปลง
- [ ] ผู้ผลิต/ผู้พิมพ์ได้รับเฉพาะ manifest ที่จำเป็น ไม่มี credential/PII
- [ ] มีแผนเก็บ/ทำลายป้ายตัวอย่างถ้า configuration ถูกเปลี่ยนหรือ reject

QR base URL ปัจจุบันยัง `TBD`: อนุญาตเตรียมป้ายชั่วคราวพร้อมข้อความ
`TEST ONLY` และพื้นที่ QR เปล่า/mockup เท่านั้น ห้าม encode URL ที่ไม่ได้อนุมัติ
และห้ามถือว่าผ่าน QR Field Validation

## 3. Pilot configuration proposal — รอ Owner เลือก

| รายการ | ข้อเสนอจากมาตรฐาน | ค่า Pilot ที่อนุมัติ | ผลจริง |
|---|---|---|---|
| จำนวนป้าย | 5–10 | `5` | |
| วัสดุ | อะลูมิเนียม 1–1.5 มม. | `TBD` | |
| ขนาด | 10 × 15 ซม. | `TBD` | |
| งานพิมพ์ | UV พื้นขาว/ดำ หรือเลเซอร์ contrast สูง | `TBD` | |
| ผิว | ด้าน กัน UV/น้ำ ลดสะท้อน | `TBD` | |
| Human Tag height | ประมาณ 20–25 มม. | `TBD` | |
| QR size | 5×5 หรือ 6×6 ซม. | `TBD` | |
| Error correction | Q หรือ H | `TBD` | |
| เสา/ตัวยึด | แยกจากลำต้น ทน UV/สนิม | `TBD` | |
| ความสูงหน้าป้าย | ข้อเสนอ 1.20–1.40 ม. | `TBD` | |
| ระยะจากลำต้น | ข้อเสนอ 50–80 ซม. | `TBD` | |
| ทิศหน้าป้าย | เข้าทางเดิน ด้านเดียวกันใน Row | `TBD` | |
| ระยะเวลาทดลอง | ข้อเสนอ 2–4 สัปดาห์ | `TBD` | |

## 4. Sample selection matrix

เลือกตามสภาพที่มีอยู่จริงเท่านั้น ห้ามสร้างสภาพเสี่ยงเพื่อให้ครบช่อง

| Pilot Plate ID | Position Form ID | Proposed Tag (`TBD`) | Exposure: sun/shade | wet/soil/spray risk | path/mower risk | QR payload ref | Include reason |
|---|---|---|---|---|---|---|---|
| PLATE-01 | | | | | | | |
| PLATE-02 | | | | | | | |
| PLATE-03 | | | | | | | |
| PLATE-04 | | | | | | | |
| PLATE-05 | | | | | | | |
| PLATE-06 | ไม่อนุญาตรอบนี้ | | | | | | |
| PLATE-07 | ไม่อนุญาตรอบนี้ | | | | | | |
| PLATE-08 | ไม่อนุญาตรอบนี้ | | | | | | |
| PLATE-09 | ไม่อนุญาตรอบนี้ | | | | | | |
| PLATE-10 | ไม่อนุญาตรอบนี้ | | | | | | |

ขีดฆ่า Plate ID ที่เกินจำนวนที่ Owner อนุมัติ

## 5. Manifest QA ก่อนติดตั้ง

| Check | วิธี | Evidence ID | ผล/Issue |
|---|---|---|---|
| Human Tag unique | เทียบทั้ง pilot + reserved manifest | | |
| Code format | uppercase A–Z/0–9/hyphen และ padding | | |
| Tag ↔ topology | Farm/Zone/Row/Position ตรง draft evidence | | |
| QR route | `{approvedBaseUrl}/t/{opaquePositionId}` | | |
| Tag ↔ QR | เปิด test resolver แล้วได้ Position เดียวกัน | | |
| QR privacy | ไม่มีชื่อ เบอร์ โรค ยา หรือข้อมูลเปลี่ยนแปลง | | |
| Cross-Farm | ผู้ไม่มี membership อ่านข้อมูลไม่ได้ | | |
| Print quality | quiet zone/contrast/no logo overlay | | |

## 6. Installation record — หนึ่งแถวต่อป้าย

| Plate ID | Installed time | Installer code | Height cm | Tree distance cm | Facing direction/method | Root/mower clearance | Photo IDs | Issue ID |
|---|---|---|---:|---:|---|---|---|---|
| PLATE-01 | | | | | | | | |
| PLATE-02 | | | | | | | | |
| PLATE-03 | | | | | | | | |
| PLATE-04 | | | | | | | | |
| PLATE-05 | | | | | | | | |
| PLATE-06 | ไม่อนุญาตรอบนี้ | | | | | | | |
| PLATE-07 | ไม่อนุญาตรอบนี้ | | | | | | | |
| PLATE-08 | ไม่อนุญาตรอบนี้ | | | | | | | |
| PLATE-09 | ไม่อนุญาตรอบนี้ | | | | | | | |
| PLATE-10 | ไม่อนุญาตรอบนี้ | | | | | | | |

## 7. Observation schedule proposal

Owner อนุมัติจุดตรวจ: [ ] Day 0  [ ] Day 7  [ ] Day 14  [ ] Day 28  [ ] อื่น: ______

| Plate ID | Checkpoint | Human code readable | Android scan attempts/time | iPhone scan attempts/time | glare/wet/dirty | plate/post condition | Photo/Issue IDs |
|---|---|---|---|---|---|---|---|
| | | | | | | | |
| | | | | | | | |
| | | | | | | | |
| | | | | | | | |

พิมพ์ตารางเพิ่มให้ครบทุก Plate × Checkpoint

## 8. Proposed acceptance criteria — Owner ต้องอนุมัติก่อนใช้เป็น Gate

| เกณฑ์ข้อเสนอ | เป้าหมายข้อเสนอ | ผลจริง | Owner disposition |
|---|---:|---:|---|
| Human Tag ไม่ซ้ำและตรง QR/Position | 100% | | |
| QR สแกนสำเร็จภายใน 2 ครั้ง | ≥95% ของ test runs | | |
| Match แสดง Farm/Zone/Row/Position ถูกต้อง | 100% | | |
| Mismatch หยุด action เดิมและแสดง expected/actual | 100% | | |
| Cross-Farm ไม่เปิดเผยข้อมูล | 100% | | |
| ป้ายไม่มีขอบคม/หลวม/รบกวนรากหรือเครื่องตัดหญ้า | 100% | | |
| อ่านรหัสได้ในสภาพแสงที่ทดสอบ | `TBD` | | |
| ทนเปียก/เปื้อนหลังทำความสะอาดตามวิธีอนุมัติ | `TBD` | | |

## 9. Stop/reject rules

- หยุดทันทีเมื่อ Human Tag ไม่ตรง QR/Position หรือพบ duplicate
- หยุดเมื่อ URL/domain ไม่ใช่ค่าที่ Owner อนุมัติหรือเปิดข้อมูลเกินสิทธิ์
- Cross-Farm access สำเร็จแม้หนึ่งครั้งให้จัดเป็น Critical และหยุดส่วนที่เกี่ยวข้อง
- ถอน/คลุมป้ายที่ผิดเพื่อป้องกันผู้ใช้สแกนต่อ
- หยุดการติดตั้งเมื่อกระทบราก ทางเดิน เครื่องตัดหญ้า หรือมีขอบคม/เสาไม่มั่นคง
- เก็บหลักฐาน before/after และ correction; ห้ามแก้ manifest แบบเงียบ ๆ
- ป้ายที่ reject ห้ามนำกลับไปใช้กับตำแหน่งอื่น

## 10. Pilot conclusion

| Decision item | Result/Evidence | Recommendation | Owner: Approve/Revise/Defer |
|---|---|---|---|
| Material/finish | | | |
| Size/contrast/QR size | | | |
| Post/installation | | | |
| QR base URL/redirect | | | |
| Tag namespace/topology | | | |
| Production quantity | **Not authorized by this Pack** | | |
