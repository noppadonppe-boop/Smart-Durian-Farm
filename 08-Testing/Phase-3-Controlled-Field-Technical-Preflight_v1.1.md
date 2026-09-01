# Phase 3 Controlled Field Validation — Simulated Mobile Technical Preflight

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.1 |
| สถานะ | Simulation Passed — Physical Validation Deferred/Not Passed; Gate 3 Later Passed by Owner Risk Acceptance |
| เจ้าของเอกสาร | Project Owner |
| วันที่ตรวจ | 2026-08-31 |
| สภาพแวดล้อม | Local / Mock adapter / Firebase Emulator only |
| Source of Truth | `AGENTS.md` v1.8, Field Execution Brief v1.2, Phase 3 Validation Report v1.0, Gate 3 Acceptance Checklist v1.1 |

## 1. คำสั่งและขอบเขตที่ได้รับอนุญาต

Owner อนุญาตเมื่อ 2026-08-31 ให้นำข้อมูลจาก Owner-input Mockup มากรอกเป็นข้อมูล
`SIMULATED/TEST ONLY` และจำลองขั้นตอนเตรียม Android/iPhone, เครือข่าย และ
Controlled Test URL เพื่อทำ Technical Preflight เท่านั้น

การอนุญาตนี้:

- ไม่ใช่การยืนยันว่าค่าจำลองเป็นข้อมูลบุคคล อุปกรณ์ สวน หรือนัดหมายจริง
- ไม่อนุญาตลงพื้นที่ ไม่อนุญาตใช้กล้อง/QR/เครือข่ายจริง และไม่อนุญาต Phase 4
- ไม่เปลี่ยน Gate 3 และไม่ทดแทน Android/iPhone Physical Device Preflight
- ไม่อนุญาต Firebase Production, SMS จริง, credential, public deployment
  หรือการผลิต/พิมพ์ป้ายถาวร

## 2. Simulation setup

| รายการ | ค่าที่ใช้ |
|---|---|
| Field Validation ID | `FV-SIM-001` — simulated |
| Farm reference | `FARM-PILOT-01` — simulated |
| Android profile | Browser viewport override `360×800` |
| iPhone profile | Browser viewport override `390×844` |
| Controlled App | `http://127.0.0.1:5173` — same-host simulation only |
| Data adapter | Mock offline adapter; demo Farm/Tree/Tag เท่านั้น |
| Firebase project | `demo-smart-durian` local Emulator only |
| QR | route/manual input simulation; ไม่ encode หรือพิมพ์ QR |
| Camera | ไม่ขอ permission และไม่ใช้กล้องจริง; ตรวจ fallback ด้วย automated test |

ค่า loopback `127.0.0.1` ใช้กับ Browser Simulation บนเครื่องเดียวกันเท่านั้น
โทรศัพท์จริงจะเข้าถึงไม่ได้และห้ามนำไปใช้เป็น QR base URL สำหรับป้าย

## 3. ผล Android viewport simulation

| Check | ผล | หลักฐานสรุป |
|---|---|---|
| Mock Phone + OTP sign-in | ผ่าน | เข้าบัญชี Owner demo โดยไม่ส่ง SMS จริง |
| Trusted Farm context | ผ่าน | แสดง Farm/role ปัจจุบันและป้าย Mock/ไม่เชื่อม Production |
| Tree Register | ผ่าน | แสดง demo positions 3 รายการและเปิดเส้นทางได้ |
| Responsive layout | ผ่าน | viewport override 360×800; horizontal overflow = 0 |
| Touch targets | ผ่าน | visible control ต่ำสุดประมาณ 45 px |
| Mismatch regression | ผ่าน | expected T001/actual T002 แสดงต่างกันและหยุด target action |
| Cross-Farm QR denial | ผ่าน | ปฏิเสธ QR คนละสวนและไม่เปิดเผย Tag/พันธุ์/ตำแหน่ง |
| Console warning/error | ผ่าน | 0 รายการ |

## 4. ผล iPhone viewport simulation

| Check | ผล | หลักฐานสรุป |
|---|---|---|
| Responsive layout | ผ่าน | viewport override 390×844; horizontal overflow = 0 |
| Touch targets | ผ่าน | visible control ต่ำสุด 44 px |
| Correct scan | ผ่าน | expected/actual ตรงกันและเปิดเฉพาะตำแหน่งที่ยืนยันแล้ว |
| Unknown manual input | ผ่าน | แสดง `ไม่พบตำแหน่ง` โดยไม่เปลี่ยน target |
| Manual fallback | ผ่าน | รับ Opaque ID/Human Tag input โดยไม่พึ่งกล้อง |
| Console warning/error | ผ่าน | 0 รายการ |

หมายเหตุ: การทดสอบนี้ใช้ Browser engine ของ Controlled in-app environment กับ
ขนาดหน้าจอที่กำหนด ไม่ใช่ Safari บน iOS หรือ Chrome บน Android จริง จึงยืนยันได้
เฉพาะ responsive UI และ application flow ไม่ยืนยัน browser-engine/hardware behavior

## 5. Automated/local validation ที่รันซ้ำ

| Check | ผล |
|---|---|
| ESLint | ผ่าน; warning = 0 |
| TypeScript strict/typecheck | ผ่าน |
| Unit/component/network-denied | 6 files, 35/35 tests ผ่าน |
| Production build/PWA | ผ่าน; precache 8 entries |
| Offline runtime scan | ผ่าน 7 local build files |
| Firebase Emulator security/integration | 4 files, 19/19 tests ผ่าน |
| Cross-Farm automated denial | ผ่านใน emulator/security suite |
| Camera-unavailable fallback | ผ่านใน component test โดยไม่ขอใช้กล้องจริง |

Build ยังคงมี warning: JavaScript chunk 970.72 kB ก่อน gzip (283.31 kB gzip)
เกิน 500 kB เป็น residual performance risk แต่ไม่ทำให้ simulation test ล้มเหลว

## 6. สิ่งที่ simulation นี้ยังยืนยันไม่ได้

- รุ่นเครื่อง Android/iPhone, OS, Chrome/Safari และ PWA version จริง
- กล้องจริง, autofocus, แสงกลางแจ้ง, ป้ายเปียก/เปื้อน/สะท้อน และระยะสแกน
- LAN/Hotspot จริงระหว่างโทรศัพท์กับ Controlled App/Firebase Emulator
- Offline/online transition และ service-worker cache บนโทรศัพท์จริง
- แบตเตอรี่ พื้นที่จัดเก็บ ความร้อน และสิทธิ์กล้องของอุปกรณ์จริง
- Test-only QR base URL ที่โทรศัพท์จริงเข้าถึงได้
- ที่เก็บหลักฐานจริง access/retention/disposal และ safety/site controls จริง

## 7. Readiness decision

**CONDITIONAL GO — สำหรับ Browser/Viewport Simulation เท่านั้น**

Simulation ที่ Owner อนุญาตผ่านตามขอบเขต Responsive UI, manual scan states,
Cross-Farm denial และ automated/local checks จึงปิดงานจำลองรอบนี้ได้

**NO-GO — สำหรับ Physical Android/iPhone Preflight และการลงพื้นที่**

ก่อนเปลี่ยน Physical Device status ต้องใช้ Android และ iPhone จริง เชื่อมกับ
Controlled network/Test URL ที่อนุมัติ ทดสอบกล้อง/QR/online/offline และบันทึก
หลักฐานโดยไม่เปิดเผยข้อมูลส่วนตัว จากนั้นต้องกลับมาขอ Owner อนุมัติ GO อีกครั้ง

ผล ณ เวลาทดสอบเป็น Gate 3 Blocked ต่อมา Owner อนุมัติ Gate 3 และ Phase 4
local/emulator-only เมื่อ 2026-08-31 โดย Deferred physical evidence ไป
`Physical-Device-Validation-Gate_v1.0.md`; Physical Device/Field ยังคง Not Passed
