# Smart Durian Farm (KDOMS)

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.3 |
| สถานะ | Phase 1 Complete — Gate 1 Owner Review Pending |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | `AGENTS.md`, `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`, `00-Project-Management/Decision-Log.md` |

ระบบบริหารจัดการสวนทุเรียนแบบหลายสวน (Multi-Farm) ตั้งแต่ทะเบียนต้น การดูแล งานคนสวน โรค ปุ๋ย–ยา ผลผลิต การเก็บเกี่ยว จนถึงการขาย

## สถานะโครงการ

- ระยะปัจจุบัน: **Phase 1 Foundation เสร็จ — รอ Gate 1**
- Gate 0: **APPROVED เมื่อ 2026-08-31**
- Gate 1: **NOT APPROVED — รอ Owner Review และ DEC-010**
- Application code: **Foundation shell พร้อมและผ่าน local validation**
- Firebase production: **ยังไม่สร้างหรือเชื่อมต่อ**

## Source of Truth

ให้อ่านเอกสารตามลำดับนี้ก่อนดำเนินงาน:

1. `AGENTS.md` — กติกาการทำงานของ Codex ในโครงการ
2. `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md` — ขอบเขตผลิตภัณฑ์ล่าสุด
3. `01-Requirements/KDOMS_Codex_Master_Prompt_v1.1.md` — แนวทางพัฒนาระยะยาว
4. `01-Requirements/KDOMS_Role_Access_Matrix_v0.1.md` — Working Proposal ของ 7 roles
5. `04-Tag-and-QR/Tag-and-QR-Standard_v0.1.md` — มาตรฐานรหัสและป้าย
6. `05-UX-UI/KDOMS_UX_UI_Knowledge_v0.1.md` — หลัก UX/UI
7. `03-Tree-Data/Tree-Register-Data-Dictionary_v0.1.md` — Data Dictionary สำหรับ Tree import
8. `00-Project-Management/Phase-0-Plan.md` — แผนและ Gate 0
9. `00-Project-Management/Smart-Durian-Code_Phase_Prompts_v1.0.md` — Prompt ส่งให้ Codex ทีละ Phase
10. `00-Project-Management/Phase-0-Remediation-Prompt_v1.0.md` — Prompt แก้ประเด็น No-Go ก่อนเสนอ Gate 0 ใหม่
11. `00-Project-Management/Owner-Review-Addendum_Gate-0_2026-08-31.md` — มติ Owner ที่อนุมัติ Gate 0
12. `06-System-Architecture/Phase-1-Foundation-Architecture_v0.1.md` — boundary ที่สร้างใน Phase 1
13. `08-Testing/Gate-1-Acceptance-Checklist.md` — หลักฐานเสนอ Gate 1

หากเอกสารขัดกัน ให้ใช้เอกสาร Scope Knowledge เวอร์ชันล่าสุด และบันทึกประเด็นไว้ใน Decision Log ก่อนแก้ไขเอกสารอื่น

## โครงสร้างโฟลเดอร์

```text
00-Project-Management   แผนงาน การตัดสินใจ และ Gate
01-Requirements         Scope, Master Prompt และข้อกำหนด
02-Field-Survey         แบบสำรวจสวนและข้อมูลภาคสนาม
03-Tree-Data            แบบข้อมูลทะเบียนต้นและไฟล์นำเข้า
04-Tag-and-QR           มาตรฐานรหัส ป้าย และ QR
05-UX-UI                UX/UI Knowledge และตัวอย่างหน้าจอ
06-System-Architecture  ข้อกำหนดสถาปัตยกรรมระดับแนวคิด
07-Source-Code          Phase 1 Web App Foundation
08-Testing              เกณฑ์ทดสอบและ Acceptance
09-Deployment           แผนสภาพแวดล้อมและการเผยแพร่
10-Operations           คู่มือใช้งานและดูแลระบบ
11-References           แหล่งอ้างอิง
99-Archive              เอกสารที่เลิกใช้แล้ว
```

## ขั้นตอนถัดไป

1. Owner ตัดสิน `DEC-010` Sign-in method ก่อนเริ่ม Authentication ใน Phase 2
2. Owner ตรวจ `08-Testing/Gate-1-Acceptance-Checklist.md` และอนุมัติ Gate 1
3. ห้ามเริ่ม Phase 2 จนกว่าจะมีข้อความอนุมัติ Gate 1 ชัดเจน
4. ทำ Field Validation topology/ป้าย 5–10 ป้าย/ต้น 30–50 ต้นก่อนล็อก Phase 3
5. ทำ Phase 7 Operational Application Pilot ด้วยแอปที่ผ่าน Gate 6
