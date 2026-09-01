# Annual Farm Management Cycle Architecture v0.1

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.1 |
| สถานะ | Approved Development Architecture — Mock/Emulator Only (DEC-048) |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| Source of Truth | `01-Requirements/KDOMS_Annual_Farm_Management_Cycle_Knowledge_v0.1.md`, `00-Project-Management/Annual-Farm-Management-Cycle-Implementation-Prompt_v1.0.md`, `00-Project-Management/Decision-Log.md` (DEC-048) |

## 1. Boundary

```text
React/PWA
  → trusted Authenticated actor + current Farm
    → AnnualCycleRepository
      ├── MockAnnualCycleRepository
      └── FirebaseAnnualCycleRepository (Local Emulator only)
        ├── annualCycles
        ├── annualPlanItems
        ├── annualCycleCorrections
        ├── annualCycleGuards
        ├── annualCycleOperations
        └── annualCycleAuditEvents
```

Firebase Production runtime ต้องไม่เขียน Annual Cycle จาก approval นี้ ใช้ข้อมูล
จำลองในเครื่องหรือปิด mutation แบบ fail-closed จนได้รับ deployment/data approval แยก

## 2. Conceptual Firestore model

```text
organizations/{organizationId}/farms/{farmId}/
├── annualCycles/{annualCycleId}
├── annualPlanItems/{planItemId}
├── annualCycleCorrections/{correctionId}
├── annualCycleGuards/current
├── annualCycleOperations/{scopedIdempotencyKey}
└── annualCycleAuditEvents/{eventId}
```

ทุก record มี `organizationId`, `farmId`, opaque ID, `version`, actor/server time
และ `exampleData=true` ใน Mock/Emulator

## 3. Date model

- `periodStart`: ISO date inclusive
- `periodEndExclusive`: ISO date exclusive ที่ derive จาก periodStart + 1 calendar year
- query ใช้ Farm timezone และ `[start,end)`
- UI derive วันสิ้นสุด inclusive โดยลบหนึ่งวันเพื่อแสดง 31 พฤษภาคม
- periods ใน Farm เดียวกันห้าม overlap
- leap-day ใช้ calendar-safe year addition

## 4. Trusted mutation rules

- list/read: Farm membership ตาม status/role เดิม
- create/update/transition/correction: Owner; Plan mutation อาจให้ Manager ตาม policy
- `organizationId`, `farmId`, actor และ `exampleData` มาจาก trusted context
- operation key scope ด้วย actor + Organization + Farm
- one Active/Closing ใช้ transaction และ `annualCycleGuards/current`; Rules ตรวจ
  `getAfter()` สำหรับ `ACTIVE/CLOSING`, ห้ามสลับ/ลบ guard แยกเดี่ยว และบังคับผูก
  การลบ guard กับ transition เป็น `CLOSED` ใน atomic write
- Cycle/Plan/Correction/Audit/Operation เขียนเป็น transaction/batch เดียวเมื่อเกี่ยวข้อง
- delete ปฏิเสธ; correction append-only และ Rules ผูก before/after snapshot กับ
  revision ของ Cycle ก่อนและหลัง atomic write

## 5. Integration

- Phase2 Context ถือ Cycle list และ selected Cycle ต่อ current Farm
- Farm switch ล้าง/โหลด Cycle selection ใหม่
- Year Switcher เลือกเฉพาะ Cycle ที่ repository คืนให้ Farm ปัจจุบัน
- Crop Cycle เก็บ `annualCycleId`; repository ตรวจ Cycle Farm/status ก่อนสร้าง
- หาก runtime เป็น Firebase Production แต่ Annual repository ยังเป็น Mock ให้
  `createCropCycle` fail closed ด้วย `ANNUAL_CYCLE_LINKAGE_UNAVAILABLE` ก่อน write
- Fruit/Harvest/Sales สืบทอด Annual Cycle ผ่าน Crop Cycle
- Work/Disease/Inventory integration ขยายแบบ explicit reference ไม่ใช้ Human Code
- Annual summary รวมเฉพาะ source record ที่ resolve Farm/Cycle ได้ พร้อม quality flags

## 6. Closed-cycle correction

```text
Original Cycle revision N (immutable after close)
  → Correction event (reason + before/after + actor/time)
    → Restated Cycle revision N+1
      └── supersedesRevisionId → revision N
```

ห้าม update Original close snapshot; duplicate idempotency key คืน Correction เดิม

Correction-only ใน DEC-048 ใช้กับ Cycle header/closed summary หลังปิดรอบ ส่วน
Plan Item ใหม่ระหว่าง Active/Closing เป็น append-only planning adjustment ตามสิทธิ์
และ audit; เมื่อ Cycle เป็น Closed แล้ว Plan mutation ทุกชนิดถูกปฏิเสธ

## 7. Security tests

- same-Farm authorized read/write
- Cross-Farm read/write/forged IDs denied
- Viewer/Worker operational mutation denied
- second Active/Closing and overlap denied
- closed normal update denied; Owner Correction allowed and audited
- forged guard delete/switch และ standalone Correction ที่ไม่แก้ Cycle ถูกปฏิเสธ
- Correction ที่ไม่มี/mismatch Audit และ Plan/Crop ที่อ้าง Cycle ซึ่งถูกปิดใน
  final state ของ atomic write ถูกปฏิเสธ
- duplicate operation no duplicate Cycle/Plan/Correction/Audit
- Firebase Production/no approval path fail closed

ข้อจำกัด Mock-first: overlap ใช้ validation จาก Farm-scoped repository snapshot
และ transaction path ของแอป; การป้องกัน forged concurrent overlap ที่ระดับ
Rules อย่างสมบูรณ์ต้องออกแบบ trusted server/timeline guard เพิ่มก่อนขอ Production
approval จึงยังไม่อ้างว่า Production-ready จากงานนี้

## 8. Deployment status

Architecture นี้อนุมัติเฉพาะ Local/Mock/Firebase Emulator implementation/test
ไม่อนุมัติ Firestore Rules deployment, Production data, External PA-1, PA-2,
Controlled Pilot, real device/field evidence หรือ Production rollout
