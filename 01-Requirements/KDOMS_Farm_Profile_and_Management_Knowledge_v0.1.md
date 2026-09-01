# KDOMS Farm Profile and Management Knowledge v0.1.1

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.1.1 |
| สถานะ | Approved Development Baseline — Mock Farm Management (DEC-043) + Trusted Operational Farm Boundary (DEC-046) |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| ขอบเขต | Farm Profile, เพิ่ม/แก้ไข/ระงับ/เก็บถาวรสวนแบบจำลอง และการอ่าน Farm ใช้งานจริงที่ trusted-provision ตาม DEC-046 |
| Source of Truth | คำสั่งล่าสุดของ Project Owner, `AGENTS.md`, `01-Requirements/KDOMS_Development_Mock_Data_and_Pilot_Knowledge_v1.0.md`, `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`, `01-Requirements/KDOMS_Codex_Master_Prompt_v1.1.md`, `05-UX-UI/KDOMS_UX_UI_Knowledge_v0.1.md`, `00-Project-Management/Owner-Review-Addendum_Tree-Register-Operational-Data-Entry_2026-09-01.md`, `00-Project-Management/Decision-Log.md` (DEC-043, DEC-046) |

## 1. คำตัดสิน

- เพิ่มเมนู `เพิ่มเติม → จัดการสวน` สำหรับ `ORG_OWNER`
- `ORG_OWNER` เพิ่มและแก้ไข Farm Profile, ระงับ, เปิดใช้งานใหม่ และเก็บถาวรได้
- ผู้ใช้บทบาทอื่นอ่าน Farm Profile ได้เฉพาะสวนที่มี membership แต่ไม่เห็นปุ่มแก้ไข
- ห้าม Hard delete สวน ให้ใช้ `SUSPENDED` หรือ `ARCHIVED` เพื่อรักษาประวัติ
- การเพิ่ม/แก้ไข/เปลี่ยนสถานะต้องสร้าง Audit ที่มีผู้กระทำ เวลา และ before/after
- ปุ่ม `เพิ่มสวน` ใน client ตาม DEC-043 ยังสร้าง Farm จำลอง
  (`classification=SIMULATED/TEST ONLY`, `exampleData=true`) เท่านั้น
- DEC-046 อนุญาตข้อมูลทะเบียนต้นจริงเฉพาะ Farm ที่ trusted-provision เป็น
  `classification=OPERATIONAL` และ `isMock=false`; ห้ามมีปุ่ม client สำหรับเปลี่ยน
  Farm จำลองเป็น Farm ใช้งานจริง และการแก้ Profile ต้องคง classification เดิม
- ขอบเขตนี้ไม่อนุมัติ Deploy, Firebase resource เพิ่ม, Storage, PA-2,
  Controlled Pilot หรือ Operational Production rollout

## 2. หน้าจอขั้นต่ำ

1. `เพิ่มเติม → จัดการสวน` แสดงรายชื่อ รหัส และสถานะของสวนใน Organization
2. `เพิ่มสวน` แสดงแบบฟอร์มสั้นและ preview รหัสสวน
3. `ข้อมูลสวน` แสดง/แก้ไข Farm Profile ตามสิทธิ์
4. `ระงับสวน` หยุดการเขียนข้อมูลปฏิบัติการ แต่ยังอ่านประวัติได้
5. `เก็บถาวรสวน` แสดงจำนวนงานเปิดและรายการค้างส่งก่อนยืนยัน
6. ไม่มีปุ่ม `ลบสวนถาวร`

Farm Switcher ใช้สำหรับสลับสวนที่มีสิทธิ์ ไม่ใช่หน้าจัดการสวน

## 3. ข้อมูล Farm Profile

สัญลักษณ์: `R` บังคับ, `O` ไม่บังคับ, `S` ระบบสร้าง/ควบคุม

| Field | Req. | ผู้กรอก/แหล่งที่มา | กติกา |
|---|:---:|---|---|
| `organizationId` | S | Organization ปัจจุบัน | opaque ID; ห้ามแก้จาก client payload |
| `farmId` | S | ระบบ | globally unique opaque ID; ห้ามใช้ Farm Code เป็น ID |
| `farmName` | R | Owner | ชื่อที่ผู้ใช้เห็น ความยาว 2–100 ตัวอักษร |
| `farmSequence` | R | Owner | `F` + เลขอย่างน้อย 2 หลัก เช่น `F01`; unique ภายใน Organization และแก้ไม่ได้หลังสร้าง |
| `farmCode` | S | ระบบ | `{organizationCode}-{farmSequence}` เช่น `DEMO-F01`; ใช้อ่านง่าย ไม่ใช่ authorization |
| `province` | O | Owner | จังหวัด; ใช้ `TBD` ได้เมื่อยังไม่ยืนยัน |
| `district` | O | Owner | อำเภอ/เขต; ใช้ `TBD` ได้ |
| `subdistrict` | O | Owner | ตำบล/แขวง; ใช้ `TBD` ได้ |
| `locationNote` | O | Owner | คำอธิบายพื้นที่แบบสั้น; ห้าม secret/ข้อมูลส่วนบุคคลเกินจำเป็น |
| `timezone` | R | Owner | IANA timezone; Mock เริ่มที่ `Asia/Bangkok` |
| `seasonStartMonth` | O | Owner | 1–12; ต้องกรอกคู่กับ `seasonEndMonth` |
| `seasonEndMonth` | O | Owner | 1–12; เป็นข้อมูลวางแผน ไม่แทน Crop Cycle จริง |
| `seasonNote` | O | Owner | คำอธิบายฤดูกาลแบบสั้น; ค่าไม่ทราบใช้ `TBD` |
| `status` | S/R | ระบบ/Owner | สร้างใหม่เป็น `ACTIVE`; เปลี่ยนเป็น `SUSPENDED` หรือ `ARCHIVED` ตาม flow |
| `notes` | O | Owner | หมายเหตุทั่วไปไม่เกิน 500 ตัวอักษร |
| `version` | S | ระบบ | เริ่ม 1 และเพิ่มทุก mutation |
| `createdAt`, `updatedAt` | S | trusted server time | ห้ามใช้เวลา client เป็น authority |
| `createdBy`, `updatedBy` | S | ผู้ใช้ที่ผ่าน Auth | ใช้ User ID ที่ตรวจสิทธิ์แล้ว |
| `classification` | S | trusted provisioning | `SIMULATED/TEST ONLY` สำหรับ Mock/Emulator/ปุ่มเพิ่มสวน; `OPERATIONAL` ได้เฉพาะ trusted process ตาม DEC-046 |
| `exampleData` / `isMock` | S | trusted provisioning | Mock เป็น `true`; Farm ใช้งานจริงเป็น `false`; client แก้ไม่ได้ |

ห้ามเก็บพิกัดละเอียด รูปสวน หรือข้อมูลบุคคลจริงใน Mock Data Pack

## 4. กฎการสร้างและแก้ไข

### เพิ่มสวน

- ปุ่ม `เพิ่มสวน` ในแอปสร้างได้เฉพาะ Farm จำลองและต้องติดป้าย
  `SIMULATED/TEST ONLY`; การสร้าง Farm `OPERATIONAL` อยู่นอก client flow ปัจจุบัน
- ตรวจว่า `farmSequence` และ `farmCode` ไม่ซ้ำภายใน Organization ด้วย trusted
  transaction/uniqueness guard; client pre-check อย่างเดียวไม่เพียงพอ
- สร้าง Farm, membership ของ Owner และ Audit Event ใน transaction/batch เดียวกัน
- หากขั้นตอนหนึ่งล้มเหลวต้องไม่เหลือ Farm ที่ไม่มี Owner membership
- Retry ด้วย idempotency key เดิมต้องไม่สร้างสวนซ้ำ

### แก้ไขสวน

- แก้ได้เฉพาะข้อมูล Profile ที่อนุญาต
- `organizationId`, `farmId`, `farmSequence`, `farmCode`, `createdAt` และ
  `createdBy` เปลี่ยนไม่ได้
- `classification` และ `exampleData`/`isMock` เปลี่ยนไม่ได้จาก Profile payload;
  repository ต้องอ่านและคงค่า Farm `OPERATIONAL` ที่ trusted-provision ไว้
- ทุกการแก้ไขเพิ่ม `version` และสร้าง Audit before/after
- การแก้ Location/Season ไม่เปลี่ยน Zone/Row/Tree/Crop Cycle ที่มีอยู่โดยอัตโนมัติ

### ระงับและเปิดใช้งานใหม่

- `ACTIVE → SUSPENDED` และ `SUSPENDED → ACTIVE` ทำได้โดย `ORG_OWNER`
- สวนที่ระงับอ่านได้ตาม membership แต่ห้ามสร้าง/แก้ข้อมูลปฏิบัติการ
- UI ต้องอธิบายว่างานเปิดยังอยู่และไม่ถูกปิดอัตโนมัติ

### เก็บถาวร

- `ACTIVE` หรือ `SUSPENDED → ARCHIVED` ทำได้หลังยืนยันผลกระทบ
- หากมี Work Order ที่ยังเปิดหรือ Offline/Pending operation ให้หยุด Archive
  และแนะนำให้จัดการรายการเหล่านั้นก่อน
- Archive ไม่ลบ Tree, Work, Care, Disease, Crop, Harvest, Sale, Inventory หรือ Audit
- ยังไม่อนุมัติการเปิด Farm ที่ Archive แล้วกลับมาใช้งาน หรือ Hard delete

## 5. Deterministic Mockup v1.0

ข้อมูลต่อไปนี้เป็นตัวอย่างสำหรับเรียนรู้เท่านั้น ไม่ใช่ข้อมูลสวนจริง

| Farm | ชื่อ | Location Mock | Timezone | Season Mock | สถานะ |
|---|---|---|---|---|---|
| `DEMO-F01` | สวนสาธิตเหนือ — ข้อมูลจำลอง | จังหวัดตัวอย่างเหนือ / อำเภอตัวอย่างหนึ่ง / ตำบลตัวอย่างหนึ่ง | `Asia/Bangkok` | เดือน 1–7 · `SIMULATED/TEST ONLY` | `ACTIVE` |
| `DEMO-F02` | สวนสาธิตใต้ — ข้อมูลจำลอง | จังหวัดตัวอย่างใต้ / อำเภอตัวอย่างสอง / ตำบลตัวอย่างสอง | `Asia/Bangkok` | เดือน 4–11 · `SIMULATED/TEST ONLY` | `ACTIVE` |
| `DEMO-F03` | สวนสาธิตระงับ — ข้อมูลจำลอง | `TBD` | `Asia/Bangkok` | `TBD` | `SUSPENDED` |
| `DEMO-F04` | สวนสาธิตเก็บถาวร — ข้อมูลจำลอง | `TBD` | `Asia/Bangkok` | `TBD` | `ARCHIVED` |

Mockup ต้องมี stable ID, reset ได้ และคงสถานการณ์อย่างน้อย Active 2 สวน,
Suspended 1 สวน และ Archived 1 สวน

## 6. Checklist เตรียม Farm ใช้งานจริงสำหรับ DEC-046

ก่อนกรอกทะเบียนต้นจริง ต้องจัดเตรียม Farm นอก client flow และยืนยันรายการต่อไปนี้:

- [ ] ชื่อสวนที่ต้องการแสดง
- [ ] ลำดับสวน `Fxx` ที่ไม่ซ้ำภายใน Organization
- [ ] จังหวัด/อำเภอ/ตำบล หรือเลือกคง `TBD`
- [ ] Timezone ที่ยืนยันแล้ว
- [ ] เดือนเริ่ม/สิ้นสุดฤดูกาล หรือคง `TBD`
- [ ] ตรวจว่างาน/ข้อมูลเดิมต้องอยู่สวนใด ห้ามโอนข้ามสวนโดยคาดเดา
- [ ] ตรวจ privacy, retention, backup และสิทธิ์ก่อนนำข้อมูลจริงเข้า Pilot/Production
- [ ] trusted-provision `classification=OPERATIONAL` และ `isMock=false`
- [ ] ยืนยัน Owner/Farm membership และ Farm เป็น `ACTIVE`
- [ ] ยืนยัน Zone/Row/ลำดับตำแหน่ง/ทิศทางที่จะใช้สร้าง Tag ถาวร

ข้อมูลจริงต้องเก็บนอก repository ข้ออนุมัติ DEC-046 ครอบคลุม metadata ขั้นต่ำที่
จำเป็นต่อ trusted-provision Farm และทะเบียนต้นใน Firebase Production + Farm
`OPERATIONAL`; การสร้าง/เปลี่ยน classification จาก client, รูป, โมดูลอื่น และการ
Deploy ยังต้องเป็นไปตาม approval ที่เกี่ยวข้อง

## 7. Acceptance criteria

- Owner เห็นเมนูจัดการสวนและผู้ไม่มีสิทธิ์ไม่เห็น action แก้ไข
- Owner เพิ่มสวนจากแบบฟอร์มขั้นต่ำได้โดยไม่ต้องกรอก internal ID
- รหัสสวนถูก derive และปฏิเสธ sequence/code ซ้ำ
- Profile แก้ไขได้พร้อม Audit before/after และ version เพิ่ม
- Suspended/Archived อ่านได้แต่เขียนข้อมูลปฏิบัติการไม่ได้
- Archive ที่มีงานเปิดหรือ Pending ถูกหยุดอย่างชัดเจน
- ไม่มี client/UI/Rules path สำหรับ Hard delete Farm
- Cross-Farm และ forged Organization/Farm payload ถูกปฏิเสธ
- Mockup ทั้ง 4 สวน reset ได้และติดป้าย `SIMULATED/TEST ONLY`
- Farm `OPERATIONAL` ที่ trusted-provision อ่านได้เป็น `isMock=false` และการแก้
  Profile ไม่เปลี่ยนกลับเป็น Mock หรือเปิดทางให้ client สลับ classification
