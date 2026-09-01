# Phase 5 Commercial Traceability Architecture

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.1 |
| สถานะ | Implemented & Validated — Local/Emulator Only |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | AGENTS.md v2.2, Phase 5 Plan v1.1, Scope Knowledge v0.2.1, Prompt Phase 5, DEC-012, DEC-013, DEC-017, DEC-027, DEC-028 |

## 1. Boundary

```text
React mobile UI
  → trusted current Farm + authenticated actor
    → CommercialTraceabilityRepository port
      ├─ MockCommercialTraceabilityRepository
      └─ FirebaseCommercialTraceabilityRepository (Local Emulator only)
        → Farm-scoped Firestore records
        → append-only Commercial Audit + idempotency operations
```

ทุก mutation รับ actor, trusted Farm context และ idempotency key Repository และ
Security Rules ตรวจ scope ใหม่ ห้ามเชื่อถือ `farmId`, role หรือ customer data จาก form

## 2. Data flow

```text
Tree/Zone
  → Crop Cycle (stage)
    → Fruit Observation (measured/estimated/unknown)
      → Harvest Lot (quantity/weight/grade)
        → Sales Lot allocation (partial allowed)

Inventory Item → Inventory Lot → Movement
  └─ reference → Work Order / Care Event / Purchase / Count Correction
```

Crop Cycle เป็นฤดู/รุ่นผลผลิต ไม่ใช่ Planting Cycle การเปลี่ยน stage เดินหน้าทีละขั้น
และ Fruit Observation ทุก record ต้องอ้าง Crop Cycle

## 3. Firestore conceptual model

```text
organizations/{organizationId}/farms/{farmId}/
├─ cropCycles/{cropCycleId}
├─ fruitObservations/{observationId}
├─ harvestLots/{harvestLotId}
├─ salesLots/{salesLotId}
├─ inventoryItems/{itemId}
├─ inventoryMovements/{movementId}
├─ inventoryBalances/{lotId}
├─ commercialOperations/{scopedIdempotencyKey}
└─ commercialAuditEvents/{eventId}
```

ทุก record มี opaque ID, organizationId/farmId, `exampleData=true`, actor, version
และ timestamp สำหรับ Emulator Phase 5 ไม่มี Cross-Farm collection/transfer path

## 4. Calculation and consistency

- Monetary value ปัด 2 ตำแหน่ง; quantity/weight ปัด 3 ตำแหน่ง
- `gross = weightKg × unitPriceBahtPerKg`
- `outstanding = gross - deposit - received`; ยอดรับรวมเกิน gross ถูก deny
- Sales allocation รวมต้องเท่ากับ Sales weight และห้ามเกิน Harvest weight ที่เหลือ
- Inventory movement ใช้ base unit เดียว; conversion ที่ไม่มี definition ถูก deny
- Receipt/Issue รับ positive quantity; Adjustment ใช้ signed delta
- transaction ตรวจ Inventory balance หลัง movement ต้องไม่ติดลบ
- duplicate idempotency key คืน record เดิมและไม่เพิ่ม movement/audit ซ้ำ
- important correction/archive ใช้ event/audit ไม่แก้ประวัติแบบเงียบ ๆ

## 5. Role policy

| Capability | Allowed roles |
|---|---|
| Read commercial summary | ORG_OWNER, FARM_MANAGER, AGRONOMIST, SALES_INVENTORY, VIEWER, AUDITOR |
| Crop/Fruit write | ORG_OWNER, FARM_MANAGER, AGRONOMIST |
| Harvest/Sales/receipt/issue | ORG_OWNER, FARM_MANAGER, SALES_INVENTORY |
| Sales correction/Stock adjustment/Archive | ORG_OWNER, FARM_MANAGER |
| Commercial audit | ORG_OWNER, FARM_MANAGER, AUDITOR |
| Commercial access | WORKER denied |

Policy นี้ใช้ least privilege ระหว่างรอรายละเอียด final approval policy และไม่เพิ่ม
สิทธิ์จาก client payload

## 6. Customer and accounting boundary

- Customer เก็บเฉพาะ reference code; ปฏิเสธอีเมล/หมายเลขโทรศัพท์ใน form
- ไม่มีชื่อ ที่อยู่ บัญชีธนาคาร ภาษี เงินเดือน หรือข้อมูลชำระเงินจริง
- Direct cost summary แสดงเฉพาะ movement ที่มี unit cost และบอกจำนวน unknown
- Summary ไม่ใช่ ledger/accounting และไม่มี cross-farm financial transfer

## 7. Offline/idempotency/audit

- operation key scope ด้วย actor + Organization + Farm
- Event/movement เป็น append-oriented และห้าม delete
- Sales/Harvest และ Inventory balance ใช้ Firestore transaction ใน Emulator
- UI แสดง Mock/offline state; Phase 6 จะ harden queue/conflict/performance ต่อเมื่ออนุมัติ
- Production offline/physical-device evidence ยัง Deferred ตาม DEC-027

## 8. Security validation

- Rules deny Worker commercial reads และ deny write สำหรับ Viewer/Auditor
- `SALES_INVENTORY` ทำ Harvest/Sales/Receipt/Issue ได้เฉพาะ Farm membership
- Sales correction/Adjustment จำกัด Owner/Manager
- Cross-Farm Harvest allocation และ reads ถูกปฏิเสธ
- Inventory balance หลัง transaction ห้ามติดลบ
- unknown collection และ delete ถูก deny by default
