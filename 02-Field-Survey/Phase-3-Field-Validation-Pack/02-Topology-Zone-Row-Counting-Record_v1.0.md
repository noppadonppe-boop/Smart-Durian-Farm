# แบบบันทึก Topology, Zone, Row และทิศทางการนับต้น

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Approved Template — Controlled Field Validation Only |
| เจ้าของเอกสาร | Project Owner |
| วันที่จัดทำ | 2026-08-31 |
| Source of Truth | Owner Review Addendum — Phase 3 Field Validation Pack, Scope Knowledge v0.2, Tag and QR Standard v0.1 |

> แบบนี้ใช้เก็บข้อเท็จจริงที่ผู้สำรวจเห็นจริง ยังไม่ทำให้ topology/tag configuration
> เป็น Approved ค่า code ทุกช่องเป็น `TBD` จน Owner ตรวจหลักฐานและอนุมัติ

## A. Survey metadata

| รายการ | ค่าที่สำรวจ |
|---|---|
| Field Validation ID | |
| Farm reference | |
| Survey date/time + timezone | |
| Surveyor IDs | |
| Map/sketch Evidence ID | |
| North reference method | |
| Weather/ground/light | |
| Network: ดี/อ่อน/ไม่มี | |
| Notes | |

## B. ขอบเขตและจุดอ้างอิง

| รายการ | ผลสำรวจ/หลักฐาน |
|---|---|
| จุดเข้าสวน/จุดเริ่มสำรวจ | |
| จุดอ้างอิงถาวรที่ไม่ใช่ข้อมูลบุคคล | |
| ขอบเขตที่สำรวจและส่วนที่ยังไม่สำรวจ | |
| ทางเข้า–ออกฉุกเฉิน | |
| ทางเดินหลัก/รอง | |
| พื้นลาดชัน น้ำขัง ราก เครื่องจักร หรือสิ่งกีดขวาง | |
| วิธีระบุทิศเหนือและความมั่นใจ | |
| Evidence IDs | |

## C. แผนผังร่าง

วาดทิศเหนือ ทางเข้า ขอบเขต Zone, Row, ลูกศรทิศทางนับ ทางเดิน และอุปสรรค

```text
┌──────────────────────────────────────────────────────────────────────┐
│ N ↑                                                                  │
│                                                                      │
│                                                                      │
│                                                                      │
│                                                                      │
│                                                                      │
│                                                                      │
│                                                                      │
│ ทางเข้า/จุดเริ่ม: ____________________                               │
└──────────────────────────────────────────────────────────────────────┘
```

## D. Zone proposal record

> หมายเลขแถวในตารางเป็นลำดับแบบฟอร์ม ไม่ใช่จำนวน Zone จริง

| ลำดับ | Proposed Zone code (`TBD`) | ขอบเขตที่สังเกต | จุดเข้า | เหตุผลแบ่ง Zone | Evidence ID | Owner disposition |
|---:|---|---|---|---|---|---|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |
| 5 | | | | | | |
| 6 | | | | | | |
| 7 | | | | | | |
| 8 | | | | | | |
| 9 | | | | | | |
| 10 | | | | | | |

## E. Row and counting-direction record

> พิมพ์หน้านี้เพิ่มตามจำนวน Row จริง ห้ามคาดเดาแถวที่ไม่ได้เดินตรวจ

| Field | Observation/Proposal |
|---|---|
| Form Row ID | |
| Zone reference | |
| Proposed rowCode (`TBD`) | |
| จุดเริ่ม Row | |
| จุดสิ้นสุด Row | |
| แนว Row/azimuth โดยประมาณ + method | |
| ทิศทางนับต้นพร้อมลูกศร | |
| เหตุผลเลือกทิศทางนับ | |
| จำนวน Planting Positions ที่เดินยืนยันจริง | |
| ช่องว่าง/ต้นตาย/ตำแหน่งไม่มีต้น | |
| Row แตกแขนง/ขาดช่วง/ข้ามทางเดิน | |
| ป้ายหัว Row ที่มีอยู่ | |
| อุปสรรคการเดิน/สแกน | |
| Evidence IDs | |
| Confidence: confirmed/estimated/unknown | |

วาด Row และลูกศรทิศทางนับ:

```text
จุดเริ่ม  ○──○──○──○──○  จุดสิ้นสุด
ทิศทางนับ:  → / ← / TBD
หมายเหตุช่องว่างหรือจุดหัก: __________________________________________
```

## F. Counting consistency walk-through

ให้ผู้ใช้ภาคสนามอย่างน้อยสองรหัสผู้ทดสอบเริ่มจากจุดเดียวกันโดยไม่บอกคำตอบกัน

| Test run ID | Tester code | Zone/Row | จุดเริ่มที่เลือก | ทิศทางที่เลือก | ตำแหน่งที่สรุปตรงกัน/ทั้งหมด | ต้องช่วยหรือไม่ | Issue ID |
|---|---|---|---|---|---:|---|---|
| | | | | | | | |
| | | | | | | | |
| | | | | | | | |
| | | | | | | | |

## G. Topology reconciliation

| ประเด็น | ข้อเสนอจากภาคสนาม | หลักฐาน | ผลกระทบต่อ Tag/CSV/App | Owner: Approve/Revise/Defer |
|---|---|---|---|---|
| Organization Code | `TBD` | | | |
| Farm Sequence | `TBD` | | | |
| Zone format | `TBD` | | | |
| Row format | `TBD` | | | |
| Tree sequence padding | `TBD` | | | |
| จุดเริ่มและทิศทางนับ | `TBD` | | | |
| กติกาช่องว่าง/ตำแหน่งไม่มีต้น | `TBD` | | | |
| กติกา Row แตกแขนง/ขาดช่วง | `TBD` | | | |

## H. Acceptance evidence

- [ ] ทุก Zone/Row ที่เสนอเดินตรวจจริงและมี Evidence ID
- [ ] คนสองคนตีความจุดเริ่ม/ทิศทางนับได้ตรงกัน หรือมี Issue/Remediation
- [ ] ตำแหน่งว่าง/ต้นตายยังคงเป็น Planting Position และไม่ทำลาย sequence
- [ ] GPS ไม่ถูกใช้แทน Farm + Zone + Row + Position + QR
- [ ] ไม่มี code ถูกประกาศถาวรก่อน Owner disposition
- [ ] sanitized topology summary พร้อมแนบ Gate 3 evidence
