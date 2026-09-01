# Owner-only Financial Access Validation Report v1.0

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Passed — Local/Mock/Firebase Emulator Engineering Validation |
| วันที่ | 2026-09-01 |
| Decision | DEC-050 |
| ขอบเขต | Owner-only Financial Data; ไม่มี Deployment/Migration Production |

## 1. ผลลัพธ์

ระบบแยกข้อมูลปฏิบัติการออกจากข้อมูลการเงิน และให้สิทธิ์ Financial Data เฉพาะผู้ที่
มี trusted Organization membership สถานะ `ACTIVE` และ `isOwner=true` เท่านั้น
ทุก Non-owner Role ถูกปฏิเสธจาก Domain/Repository และ Firestore Rules แม้ Client
อ้าง Role `ORG_OWNER`

## 2. Boundary ที่ตรวจ

- Sales operational lot แยกจาก `salesFinancials`
- Inventory quantity movement แยกจาก `inventoryMovementFinancials`
- Annual plan operational item แยกจาก `annualPlanFinancials`
- Operational dashboard แยกจาก `financialDashboardViews`
- Operational audit แยกจาก Financial audit
- Management labor cost, operating expense, report, KPI, Drill-down และ CSV เป็น
  Owner-only
- Non-owner query ใช้ `dataClass=OPERATIONAL` และไม่โหลด Financial collection
- Legacy mixed document อ่านได้เฉพาะ Owner; Non-owner ถูกปฏิเสธแบบ Fail closed
- UI ซ่อนเมนู ช่องกรอก ตัวเลข และ action การเงิน พร้อมตรวจสิทธิ์ซ้ำก่อน render

## 3. หลักฐานทดสอบ

| การตรวจ | ผล |
|---|---|
| `pnpm lint` | Passed — 0 errors/warnings |
| `pnpm typecheck` | Passed |
| `pnpm test` | Passed — 29 files, 229 tests |
| `pnpm test:emulator` | Passed — 9 files, 69 tests |
| `pnpm test:seed:emulator` | Passed — 161 deterministic records, 7 modules |
| `pnpm build` | Passed |
| `pnpm performance:budget` | Passed |
| `pnpm smoke:offline` | Passed — 82 local build files |

Firebase Emulator test ครอบคลุม Owner allow, Non-owner deny ทุก Canonical Role,
forged `ORG_OWNER`, Cross-Farm boundary, direct Financial collection access และ
legacy mixed-document denial

## 4. ข้อจำกัดและงานก่อน Production

1. Source/Rules รุ่นนี้ยังไม่ได้ Deploy และไม่ได้ย้ายเอกสาร Production เดิม
2. ก่อน Deployment ต้องทำ inventory ของเอกสารที่มี Financial fields ปะปน วางแผน
   backup, dry-run migration, reconciliation, rollback และ Owner approval แยก
3. ระหว่างที่ยังไม่ Migration ให้คง Fail-closed behavior; ห้ามคลาย Rules เพื่อให้
   Non-owner อ่านเอกสารเก่า
4. ต้องทดสอบ session revocation/role downgrade ใน environment ที่อนุมัติ และยืนยัน
   ว่า cache/offline persistence ถูกล้างตาม data-governance policy
5. Production financial data, accounting/tax/payroll, PA-2, Controlled Pilot และ
   Production rollout ยังไม่ได้รับอนุมัติ
