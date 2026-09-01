# Phase 3 Validation Report v1.1

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.1 |
| สถานะ | Implementation Passed — Excel/Google Sheets File Import Enhancement Passed; Gate 3 Passed; Physical Validation Deferred |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| Source of Truth | `AGENTS.md`, `01-Requirements/KDOMS_Development_Mock_Data_and_Pilot_Knowledge_v1.0.md`, `00-Project-Management/Owner-Review-Addendum_Gate-3_2026-08-31.md`, `00-Project-Management/Phase-3-Plan.md`, `08-Testing/Gate-3-Acceptance-Checklist.md` |

## 1. ผลลัพธ์ที่ทำเสร็จ

Phase 3 — Tree Register & QR ดำเนินการครบขอบเขต local/emulator-only:

- Tree domain ตั้งแต่ Zone/Row/Position/Cycle พร้อม permanent Tag invariant
- Tree list/search/filter, detail, cycle history และ append-only timeline
- Create/edit/archive/replacement ตาม role แบบ conservative
- Excel Template พร้อมชีตคำแนะนำ/ตัวอย่าง/ค่าที่อนุญาต เปิดใน Microsoft Excel
  หรือ Google Sheets และนำกลับเข้าเป็น `.xlsx`/`.csv`
- Spreadsheet preview/validation/reject/duplicate/50-row limit/idempotent atomic import
- configurable QR payload และ route resolver ที่ตรวจ Farm membership
- Camera entry point + native detector เมื่อรองรับ พร้อม Manual fallback
- Match/Mismatch/Unknown/Access Denied/Damaged/Offline Cached UX
- Firestore Rules และ Repository tests สำหรับ Tree/Cycle/Tag/Route/Import

## 2. ไฟล์สำคัญที่สร้างหรือแก้ไข

เอกสารใหม่:

- `00-Project-Management/Owner-Review-Addendum_Gate-2_2026-08-31.md`
- `00-Project-Management/Phase-3-Plan.md`
- `06-System-Architecture/Phase-3-Tree-Register-QR-Architecture_v0.1.md`
- `08-Testing/Gate-3-Acceptance-Checklist.md`
- `08-Testing/Phase-3-Validation-Report_v1.0.md`

Application หลัก:

- `src/domain/treeRegister.ts` และ tests
- `src/adapters/mock/mockTreeRegisterRepository.ts`
- `src/infrastructure/firebase/firebaseTreeRegisterRepository.ts`
- `src/pages/TreesPage.tsx`, `TreeDetailPage.tsx`, `TreeCreatePage.tsx`
- `src/pages/TreeImportPage.tsx`, `ScanPage.tsx`, `QrRoutePage.tsx`
- `src/services/treeRegisterSpreadsheet.ts` และ tests
- `firestore.rules` และ `src/security/firebaseTreeRegister.emulator.test.ts`
- Phase 3 demo tree seed และ Emulator seed step

## 3. Validation evidence

| การตรวจ | ผล |
|---|---|
| ESLint | ผ่าน ไม่มี warning |
| TypeScript strict | ผ่าน |
| Current unit/component regression | 21 files, 178 tests ผ่าน |
| Current Firebase Emulator regression | 8 files, 49 tests ผ่าน |
| Production build | ผ่าน |
| Offline runtime dependency scan | ผ่าน 7 local build files |
| Tag/QR parser | valid/invalid/base URL/opaque route ผ่าน |
| Excel/CSV | สร้าง/อ่าน `.xlsx`, Google Sheets-style numeric date, 49 columns, EXAMPLE reject, invalid, >50 rows, duplicate, wrong Farm, retry ผ่าน |
| Tree invariants | replace/history/archive/no Tag reuse ผ่าน |
| Rules | same-farm allow, cross-farm deny, worker/forged deny ผ่าน |
| Browser mobile | 360×800, scrollWidth = clientWidth (345px), ปุ่มใหม่สูง 45–47px ผ่าน |
| Browser desktop | 1280×800, sidebar/bottom-nav breakpoint ผ่าน |
| Browser/component scenarios | list/detail, Template action, Excel upload/Preview, cycle history, mismatch, cross-farm, offline และ retry ผ่าน |
| Browser console | warning/error 0 |
| Secret/Production scan | ไม่พบ credential, service-account key หรือ Production endpoint |

Browser validation ทำให้พบและแก้ race condition ในปุ่ม “จำลองสแกนผิดต้น”:
resolver เดิมอาจอ่าน expected state เก่าหลังเปลี่ยน selection จึงแก้ให้ส่ง expected
position เข้า resolver โดยตรง และตรวจซ้ำแล้ว Mismatch แสดง expected/actual ถูกต้อง
พร้อมไม่แสดง action เปิด target เดิม

## 4. Security and data-integrity evidence

- Position identity fields และ Tag เปลี่ยนไม่ได้หลังสร้าง
- Tag Index และ Position Route ไม่อนุญาต update/delete
- Cycle replacement ปิดรอบเดิมและเพิ่มรอบใหม่ใน atomic batch
- Tree master write อนุญาตเฉพาะ Owner/Manager ของ Farm ที่ active
- QR route ข้าม Farm ตอบ Access Denied โดยไม่เปิดเผย Tag/variety/topology
- Import ผิดรูปแบบไม่เปิด Commit; existing Tag ยกเลิกทั้ง batch
- ไฟล์ Excel จำกัด compressed 2 MB, expanded 8 MB และ 64 ZIP entries ก่อนอ่าน
- Parser อ่านเฉพาะค่าของเซลล์ ไม่ประมวลผลสูตร และเลือกชีต `ทะเบียนตำแหน่ง`
- Retry ด้วย key เดิมไม่สร้าง Position/Cycle/Event ซ้ำ
- ข้อมูล demo ทุก record มี `exampleData=true` และใช้ opaque IDs จำลอง

## 5. Remaining blockers and risks

### Deferred physical evidence — Not passed

Field Validation ยังไม่มีหลักฐานจริง:

- topology/รหัสสวน/Zone/Row/ทิศทางนับ = `TBD`
- ป้ายทดลอง 5–10 ป้าย = `TBD`
- Tree Survey 30–50 ต้น = `TBD`
- Android/iPhone กลางแดด/เปียก/เปื้อน = `TBD`
- Production QR domain = ยังไม่อนุมัติ

รายการนี้ไม่ได้ทดสอบผ่านและถูก carry forward ไป Physical Device Validation Gate
ตาม Owner Addendum Gate 3

### Residual risks

- Native `BarcodeDetector` support ต่างกันตาม Browser; Manual fallback พร้อมแล้ว
- Build JavaScript chunk ประมาณ 971 kB ก่อน gzip และมี warning >500 kB;
  ต้องทำ route code-splitting ก่อน Pilot
- Import มากกว่า 50 records ต้องมี chunk manifest/recovery policy ภายหลัง
- ไม่เชื่อม Google Sheets API; ผู้ใช้ต้องดาวน์โหลดชีตเป็น `.xlsx` หรือ `.csv`
- `.xls` รุ่นเก่าไม่รองรับและต้อง Save As เป็น `.xlsx`
- Account recovery ของ Phone OTP ยังเป็น production blocker เดิม
- Production retention/backup/privacy/monitoring ยังไม่ได้อนุมัติ

## 6. Gate 3 recommendation

**Gate 3 PASSED — Phase 4 local/emulator-only authorized**

Owner ยอมรับ residual risk และ Deferred Android/iPhone, camera, QR, LAN/Hotspot,
Online/Offline และ Cross-Farm บนอุปกรณ์จริงไป Gate แยกก่อน Pre-Production,
Operational Pilot, field use หรือ Production ห้ามอ้างว่ารายการเหล่านี้ผ่าน

## 7. Git status

- เก็บการแก้ไข Gate 1/Gate 2 และ Phase 2 เดิมไว้ครบ
- งาน Phase 3 ยังไม่ commit ตามคำสั่ง Owner
- ไม่มี deployment หรือการเปลี่ยน Production state
