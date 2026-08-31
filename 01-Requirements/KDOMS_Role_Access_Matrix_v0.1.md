# KDOMS Role/Access Matrix v0.1

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.1 |
| สถานะ | Proposed — Owner Review Required |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | `AGENTS.md`, `KDOMS_Scope_Knowledge_v0.2.md`, `00-Project-Management/Decision-Log.md` |

> Working Proposal เท่านั้น ยังไม่ใช่ `Approved` permissions หรือ Security Rules

## 1. Scope rules

- `ORG_OWNER` เป็น organization-scoped แต่ยังอ่าน/เขียนเฉพาะ Organization
  ที่ได้รับ membership
- `FARM_MANAGER`, `AGRONOMIST`, `WORKER`, `SALES_INVENTORY` และ `VIEWER`
  เป็น farm-scoped
- `AUDITOR` อาจได้รับ assignment ระดับ Organization หรือ Farm แบบ read-only
- ผู้ใช้คนเดียวอาจมี role ต่างกันในแต่ละ Farm
- Deny by default; ไม่มี role ใดอาศัย client payload เพื่อยกระดับสิทธิ์
- Portfolio แสดงเฉพาะ Farm ที่ membership/assignment อนุญาต

## 2. Canonical roles

| Role | เป้าหมาย | สิทธิ์เริ่มต้นแบบ least privilege |
|---|---|---|
| `ORG_OWNER` | กำกับองค์กรและสวน | จัดการ Farm/membership, ดู portfolio, อนุมัติ escalation และ export ตาม policy |
| `FARM_MANAGER` | บริหารงานรายสวน | จัดการ master data/งาน, ตรวจรับ, review conflict และ export เฉพาะ Farm ตาม policy |
| `AGRONOMIST` | ดูแลสุขภาพและการรักษา | อ่านทะเบียนต้น, วินิจฉัย, เสนอ/อนุมัติการรักษาตาม policy, สร้างงานที่เกี่ยวข้อง |
| `WORKER` | ปฏิบัติงานภาคสนาม | อ่านข้อมูลเท่าที่งานต้องใช้, รับ/ทำ/รายงานงาน, บันทึกอาการ; ไม่แก้ master data |
| `SALES_INVENTORY` | ดูแลล็อตขายและวัสดุ | จัดการ Inventory/Harvest/Sales ตาม Farm และ policy; อ่าน traceability ที่จำเป็น |
| `VIEWER` | อ่านข้อมูลธุรกิจ | Read-only ตาม Farm; ไม่มี audit/export หรือ admin โดยอัตโนมัติ |
| `AUDITOR` | ตรวจสอบย้อนหลัง | Read-only audit/export ตาม assignment; ไม่แก้ข้อมูลปฏิบัติการ |

## 3. Proposed access matrix

สัญลักษณ์: `M` จัดการ, `A` อนุมัติ/ตรวจรับ, `W` เขียนในขอบเขตงาน,
`R` อ่าน, `R*` อ่านเฉพาะที่จำเป็น/ได้รับ assignment, `—` ปฏิเสธ

| ความสามารถ | ORG_OWNER | FARM_MANAGER | AGRONOMIST | WORKER | SALES_INVENTORY | VIEWER | AUDITOR |
|---|---:|---:|---:|---:|---:|---:|---:|
| Organization/Farm profile | M | R/W Farm | R | R* | R | R | R* |
| Membership/role | M | W* | — | — | — | — | R* |
| Zone/Row/Position master | M | M | R/W* | R* | R* | R | R |
| Planting Cycle/Tree master | M | M | W* | R* | R* | R | R |
| สร้าง/มอบหมาย Work Order | M | M | W* | — | — | R | R |
| รับ/ทำ/รายงานงาน | R/A | A/W | A/W | W | W* | R | R |
| Disease diagnosis/treatment | R/A* | A* | M/A | W อาการ | — | R | R |
| Inventory movement | R/A* | A/W* | R/W* | W* ตามงาน | M | R | R |
| Harvest/Sales lot | R/A* | A/W* | R | — | M | R | R |
| Audit timeline | R | R* | R* | R* ของตน | R* | — | R |
| Export | M/A | A* Farm | — | — | W* ตาม policy | — | W ตาม assignment |
| Conflict review | A escalation | M/A | W* ให้ข้อมูล | W* ให้ข้อมูล | W* ให้ข้อมูล | — | R |

`*` ต้องนิยาม policy รายละเอียดก่อน implementation และใช้สิทธิ์ที่จำกัดที่สุด
ระหว่างที่ยังไม่มีการอนุมัติ

## 4. Security acceptance criteria

- Same-farm allow เฉพาะ action ที่ Matrix อนุญาต
- Cross-farm read/write/export ถูกปฏิเสธ
- Forged `organizationId`, `farmId`, role หรือ human tag ไม่เพิ่มสิทธิ์
- Revoked membership และ role downgrade มีผลตาม trusted policy
- `VIEWER` ไม่มี export/audit โดยอัตโนมัติ และ `AUDITOR` ไม่มี write
- การเปลี่ยน membership/role และ export สำคัญสร้าง audit event

## 5. Owner decisions required

- ขอบเขตที่ `FARM_MANAGER` เชิญ/เปลี่ยน role ได้
- ผู้อนุมัติการรักษา สารเคมี stock adjustment และ sales correction
- ขอบเขต export ของ `FARM_MANAGER`, `SALES_INVENTORY` และ `AUDITOR`
- Assignment ของ `AUDITOR` ระดับ Organization หรือ Farm
