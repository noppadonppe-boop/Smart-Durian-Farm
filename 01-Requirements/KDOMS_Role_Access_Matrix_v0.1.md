# KDOMS Role/Access Matrix v0.1.2

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.1.2 |
| สถานะ | Approved Baseline — Owner-only Financial Data clarified by DEC-050 |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| Source of Truth | `AGENTS.md`, `KDOMS_Scope_Knowledge_v0.2.md`, `KDOMS_Farm_Profile_and_Management_Knowledge_v0.1.md`, `00-Project-Management/Owner-Review-Addendum_Owner-Only-Financial-Access_2026-09-01.md`, `00-Project-Management/Decision-Log.md` (DEC-009, DEC-043, DEC-050) |

> Canonical roles และ least-privilege baseline ผ่าน Owner Review แล้ว รายการที่มี
> `*` ยังคงต้องมี policy รายละเอียดก่อนขยายสิทธิ์

## 1. Scope rules

- `ORG_OWNER` เป็น organization-scoped แต่ยังอ่าน/เขียนเฉพาะ Organization
  ที่ได้รับ membership
- `FARM_MANAGER`, `AGRONOMIST`, `WORKER`, `SALES_INVENTORY` และ `VIEWER`
  เป็น farm-scoped
- `AUDITOR` อาจได้รับ assignment ระดับ Organization หรือ Farm แบบ read-only
- ผู้ใช้คนเดียวอาจมี role ต่างกันในแต่ละ Farm
- Deny by default; ไม่มี role ใดอาศัย client payload เพื่อยกระดับสิทธิ์
- Portfolio แสดงเฉพาะ Farm ที่ membership/assignment อนุญาต
- Financial Data ใช้ trusted Organization membership `ACTIVE` + `isOwner=true`;
  ชื่อ Role `ORG_OWNER` เพียงอย่างเดียวไม่ให้สิทธิ์

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
| Organization/Farm profile | M | R | R | R* | R | R | R* |
| Membership/role | M | W* | — | — | — | — | R* |
| Zone/Row/Position master | M | M | R/W* | R* | R* | R | R |
| Planting Cycle/Tree master | M | M | W* | R* | R* | R | R |
| สร้าง/มอบหมาย Work Order | M | M | W* | — | — | R | R |
| รับ/ทำ/รายงานงาน | R/A | A/W | A/W | W | W* | R | R |
| Disease diagnosis/treatment | R/A* | A* | M/A | W อาการ | — | R | R |
| Inventory movement | R/A* | A/W* | R/W* | W* ตามงาน | M | R | R |
| Harvest/Sales lot เชิงปฏิบัติการ (ไม่มีข้อมูลการเงิน) | R/A* | A/W* | R | — | M | R | R |
| Inventory operational quantity/status (ไม่มีต้นทุน) | R | A/W* | R* | W* ตามงาน | M | R | R* |
| ราคา/ยอดขาย/รับเงิน/ค้าง/ลูกค้าอ้างอิง | M | — | — | — | — | — | — |
| ต้นทุนวัสดุ/แผนต้นทุน/ค่าแรง/ค่าใช้จ่าย | M | — | — | — | — | — | — |
| Financial Dashboard/Report/Drill-down/Export/Audit | M | — | — | — | — | — | — |
| Audit timeline | R | R* | R* | R* ของตน | R* | — | R |
| Export | M/A | A* Farm | — | — | W* ตาม policy | — | W ตาม assignment |
| Conflict review | A escalation | M/A | W* ให้ข้อมูล | W* ให้ข้อมูล | W* ให้ข้อมูล | — | R |

`*` ต้องนิยาม policy รายละเอียดก่อน implementation และใช้สิทธิ์ที่จำกัดที่สุด
ระหว่างที่ยังไม่มีการอนุมัติ

## 4. Security acceptance criteria

- Same-farm allow เฉพาะ action ที่ Matrix อนุญาต
- Cross-farm read/write/export ถูกปฏิเสธ
- Forged `organizationId`, `farmId`, role หรือ human tag ไม่เพิ่มสิทธิ์
- Forged `ORG_OWNER` role หรือ Client flag ไม่เปิด Financial Data หาก trusted
  Organization membership ไม่ใช่ Owner
- Revoked membership และ role downgrade มีผลตาม trusted policy
- `VIEWER` ไม่มี export/audit โดยอัตโนมัติ และ `AUDITOR` ไม่มี write
- การเปลี่ยน membership/role และ export สำคัญสร้าง audit event

## 5. Owner decisions required

- การขยายสิทธิ์แก้ Farm Profile จาก `ORG_OWNER` ไปยัง `FARM_MANAGER`
- ขอบเขตที่ `FARM_MANAGER` เชิญ/เปลี่ยน role ได้
- ผู้อนุมัติการรักษา สารเคมี และ stock adjustment เชิงปฏิบัติการ; Sales financial
  correction เป็น Owner-only ตาม DEC-050
- ขอบเขต export ของ `FARM_MANAGER`, `SALES_INVENTORY` และ `AUDITOR`
- Assignment ของ `AUDITOR` ระดับ Organization หรือ Farm
