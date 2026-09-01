# รายงานตรวจสอบ Excel/Google Sheets ภาษาไทยสำหรับทะเบียนต้น v1.0

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Passed — Focused Validation; Full-suite มี defect อื่นนอกขอบเขตค้างอยู่ |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| ขอบเขต | Tree Register Excel/Google Sheets/CSV Thai import-export UX |
| Source of Truth | `00-Project-Management/Decision-Log.md` (DEC-044), `03-Tree-Data/Tree-Register-Data-Dictionary_v0.1.md`, `06-System-Architecture/Phase-3-Tree-Register-QR-Architecture_v0.1.md` |

## 1. ผลลัพธ์

- แม่แบบ `.xlsx` แสดงหัวคอลัมน์ภาษาไทยครบ 49 คอลัมน์
- ชีต `วิธีใช้`, `ตัวอย่าง` และ `ค่าที่อนุญาต` ใช้ภาษาไทย
- Dropdown ใช้ค่าภาษาไทยสำหรับประเภทข้อมูล ความมั่นใจ ระบบปี สถานะต้น
  ความมั่นใจของค่าที่วัด ประเภทการวัดลำต้น และหน่วยหลัก
- Import ภาษาไทย normalize เป็น canonical field/value ก่อน validation และบันทึก
- ไฟล์ภาษาอังกฤษรุ่นเดิมยังนำเข้าได้; ไฟล์ที่ผสมหัวคอลัมน์ไทย/อังกฤษถูกปฏิเสธ
- กฎ 49 คอลัมน์, Farm scope, Tag validation, atomic import, duplicate และ
  idempotency เดิมไม่เปลี่ยน

## 2. หลักฐานการตรวจ

| การตรวจ | ผล |
|---|---|
| Focused unit/UI tests | Passed 51/51 จาก 3 test files |
| Mock repository atomic import test | Passed 1/1 |
| ESLint เฉพาะไฟล์ที่เปลี่ยน | Passed, 0 warning |
| Static CSV column count | Header 49, example row 49 |
| Workbook structure inspection | 4 sheets; `ทะเบียนตำแหน่ง` A1:AW1 มีหัวภาษาไทย 49 ค่า |
| Workbook formula/error scan | ไม่พบ `#REF!`, `#DIV/0!`, `#VALUE!`, `#NAME?`, `#N/A` |
| Visual render | ตรวจครบ `ทะเบียนตำแหน่ง`, `วิธีใช้`, `ตัวอย่าง`, `ค่าที่อนุญาต`; หัวตารางภาษาไทยอ่านได้และไม่ถูกตัดในช่วงที่ตรวจ |
| Legacy English compatibility | Passed ใน Domain/Spreadsheet tests |

## 3. ข้อจำกัดจาก Working Tree ที่มีอยู่ก่อน

- Full unit suite ผ่าน 187/189 tests; 2 tests ที่ไม่ผ่านอยู่ใน Farm Management
  (`mockPhase2Adapters.test.ts`) และไม่เกี่ยวกับ Tree Register spreadsheet
- TypeScript project check ยังถูก block ด้วย Farm Management implementation ที่
  `FirebasePhase2Repository` ยังไม่ครบ interface และ unused imports ใน
  `mockFoundationAdapters.ts`; focused tests และ lint ของงานนี้ผ่าน
- ไม่แก้ defect Farm Management ดังกล่าวเพื่อรักษาขอบเขตและการเปลี่ยนแปลงของผู้ใช้

## 4. Acceptance criteria

- [x] ผู้ใช้เห็นหัวคอลัมน์ภาษาไทยในไฟล์ที่ดาวน์โหลด
- [x] ค่าตัวเลือกหลักใน Excel/Google Sheets เป็นภาษาไทย
- [x] นำเข้าหัวคอลัมน์และค่าภาษาไทยได้
- [x] รองรับไฟล์ภาษาอังกฤษเดิม
- [x] ไม่ยอมรับไฟล์ที่ผสมหัวคอลัมน์สองภาษา
- [x] กฎข้อมูลเดิมและ Multi-Farm boundary ไม่เปลี่ยน

## 5. Gate และขอบเขตการอนุมัติ

Gate 6 ยังคง Passed งานนี้เป็น UX/compatibility change ภายใต้ Phase 3 capability
เดิม ไม่อนุมัติข้อมูลภาคสนามจริง, Storage, PA-2, Controlled Pilot, permanent QR/tag
หรือ operational Production rollout
