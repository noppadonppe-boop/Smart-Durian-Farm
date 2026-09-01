# Phase 7 Privacy, Retention & Access Review

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.1 |
| สถานะ | Superseded by v0.2 — Real Data Not Approved |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | DEC-017, DEC-027, DEC-031, Development/Mock Data/Pilot Knowledge v1.0.1, Phase 7 Plan v1.0 |

## 1. Default rule

Pilot Candidate เริ่มด้วย `SIMULATED/TEST ONLY` เท่านั้น ข้อมูลจริงใช้ได้หลัง PA-2
อนุมัติ purpose, minimum fields, access, notice/consent, retention, backup,
evidence, incident และ disposal เป็นรายการ ห้าม commit ข้อมูลจริงกลับ repository

## 2. Proposed minimum Pilot data

| Data class | Purpose | Minimum | Exclude by default | Access | Retention |
|---|---|---|---|---|---|
| Participant | role/account/support | opaque participant code + role | ชื่อเต็ม/เบอร์ใน repo | Owner/Admin `TBD` | `TBD` |
| Farm/site | Farm scope | sanitized Farm reference | ที่อยู่/พิกัดละเอียด | Pilot roles by membership | `TBD` |
| Position/tag | identity validation | opaque ID + approved human code | Production URL | authorized Farm roles | `TBD` |
| Work/report | workflow evidence | target, state, time, material code, note | free-text personal data | Worker/Manager by scope | `TBD` |
| Photos | instruction/BEFORE/AFTER | compressed scoped image + purpose | ใบหน้า/ทะเบียน/EXIF precise GPS | authorized Work/Farm roles | `TBD` |
| Audit/metrics | integrity/usability | actor code, action, time, result | OTP/secret/raw personal data | Owner/Manager/Auditor | `TBD` |
| Backup/export | restore/review | approved Farm-scoped set | public link/unapproved Farm | dual-approved operators | `TBD` |

## 3. Access controls

- Farm membership + role ทุก read/write; signed-in อย่างเดียวไม่พอ
- ผู้ใช้คนเดียวอาจมี role ต่างกันต่อ Farm; ห้ามยืมบัญชีทดสอบ
- Export จำกัด Owner/Manager/Auditor ตาม policy และสร้าง audit event
- Evidence/backup access แยกจาก application role และทบทวนรายวันระหว่าง Pilot
- revoke participant เมื่อออกจาก Pilot และเก็บ evidence ของการ revoke

## 4. Photos and evidence

- JPEG/PNG/WebP ไม่เกิน 5 MB ต่อไฟล์ตาม current application policy
- Work instruction 0–3 รูปเฉพาะ Draft; Worker evidence BEFORE/AFTER รวมไม่เกิน 6
- strip/avoid precise location metadata ตามวิธีที่ Owner อนุมัติก่อน PA-2
- ห้ามถ่ายใบหน้า ป้ายทะเบียน เอกสารส่วนตัว บ้าน/พื้นที่นอก scope โดยไม่จำเป็น
- original evidence เก็บใน approved restricted storage; repository เก็บ template/
  sanitized summary เท่านั้น

## 5. Retention and disposal decisions for PA-2

Owner ต้องระบุ:

- active Pilot retention, post-Pilot review period และ legal/business hold
- ผู้มีอำนาจ extend retention พร้อมเหตุผล/audit
- disposal method สำหรับ database, Storage, backup, export, device cache และ paper
- evidence ว่าลบ/Archive สำเร็จ และวิธีจัดการ participant access หลัง Pilot
- data disposition: delete, retain as approved operational record หรือ migrate

สถานะ: **BLOCKED FOR REAL DATA — ทุกค่า retention/disposal ยัง `TBD`**
