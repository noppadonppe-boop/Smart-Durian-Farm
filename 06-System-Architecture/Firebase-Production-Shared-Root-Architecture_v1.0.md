# Firebase Production Shared Root Architecture

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Implemented — Firestore Production / Deterministic Mock Test |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| Source of Truth | AGENTS.md v3.6, DEC-003, DEC-010, DEC-027, DEC-040 และ DEC-041 |

## 1. ขอบเขต

Web App ใช้ Firebase project `durian-smartfarm` เป็น runtime ปกติและไม่เรียก
Firebase Emulator จากคำสั่ง `pnpm dev` ข้อมูลเริ่มต้นที่อนุญาตยังเป็น deterministic
Mock Data ติดป้าย `SIMULATED/TEST ONLY`; ไม่มีข้อมูลหรือภาพภาคสนามจริง

## 2. โครงสร้าง Firestore

```text
durian-smartfarm (collection)
└── root (document)
    ├── positionRoutes
    └── organizations
        └── {organizationId}
            ├── members
            └── farms
                └── {farmId}
                    ├── members
                    ├── treePositions / treeTags
                    ├── workOrders / careEvents / diseaseIncidents
                    ├── cropCycles / fruitObservations / harvestLots / salesLots
                    ├── inventoryItems / inventoryMovements / inventoryBalances
                    ├── dashboardViews / offlineOperations / masterConflicts
                    ├── photoRecoveries / exportOperations
                    ├── diseaseAnalysisSessions
                    └── audit collections
```

ข้อมูลปฏิบัติการไม่มี path ตาม User ผู้ใช้ทุกคนอ้าง shared root เดียวกัน แต่ทุก
document เชิงปฏิบัติการยังมีหรือสืบทอด `organizationId` และ `farmId` ผู้ใช้หรือ
anonymous identity ในอนาคตจะไม่สร้าง data folder ใหม่; การอ่าน/เขียนต้องผ่าน
membership ของ Farm และ Security Rules เช่นเดิม

## 3. Authentication และ Seed Owner

- Sign-in หลักเป็น Firebase Phone Auth ตาม DEC-010/040
- ผู้ใช้ Phone Auth คนแรกที่สร้าง `root` เป็น `seedOwnerUid`
- Seed ซ้ำได้แบบ upsert และไม่ลบ document อื่น
- Seed write ทุก record มี `seedBatchId = KDOMS-PRODUCTION-MOCK-V1` และ
  `exampleData = true`
- Anonymous และผู้ใช้ทั่วไปไม่สามารถอ้างสิทธิ์ Seed/Admin

## 4. ปุ่ม Seed

ปุ่มอยู่ในหน้าหลัก และแสดงในหน้า No-Farm สำหรับ bootstrap ครั้งแรก ผู้ใช้ต้องพิมพ์
`durian-smartfarm` และยอมรับว่าเป็น `SIMULATED/TEST ONLY` ก่อนเริ่ม Seed
Seeder แยกเป็น 6 โมดูล: Foundation, Trees, Work/Care/Disease, Commercial,
Operations และ Disease Analysis

## 5. Storage

Firebase Web config มี bucket name แต่ Firebase Storage ของ project ยังไม่ผ่าน
ขั้นตอน provision ใน Console การ Deploy Storage Rules จึงถูก Firebase ปฏิเสธ
Production Seeder ตั้ง `VITE_FIREBASE_STORAGE_READY=false` และข้าม placeholder
จำลอง 3 ไฟล์เพื่อให้ Firestore Seed ส่วนอื่นทำงานได้โดยไม่เกิดข้อมูลครึ่งชุด

เมื่อ Owner เปิด Storage แล้ว ต้อง Deploy `storage.rules`, ตรวจ region/governance/
retention และเปลี่ยนค่าเป็น `true` ก่อนทดสอบรูป ห้ามใช้ภาพจริงก่อน PA-2/approval

## 6. Acceptance Criteria

- runtime ปกติใช้ `firebase-live` และ project id ตรง `durian-smartfarm`
- ทุก Firestore repository เริ่มจาก `durian-smartfarm/root`
- ไม่มี User folder สำหรับ operational data
- Cross-Farm read/write ถูก Rules ปฏิเสธ
- ปุ่ม Seed ใช้ได้เฉพาะ Firebase Phone identity และข้อมูลทุก record เป็น Mock
- หน้า loading/error แสดงข้อความและปุ่มลองใหม่แทนจอขาว
- Storage failure ไม่ทำให้ Firestore Seed ทั้งชุดล้มแบบเงียบ
