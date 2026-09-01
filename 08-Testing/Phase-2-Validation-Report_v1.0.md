# Phase 2 Validation Report v1.0

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Gate 2 Passed — Owner Approved 2026-08-31 |
| เจ้าของเอกสาร | Project Owner |
| วันที่ตรวจ | 2026-08-31 |
| Source of Truth | `AGENTS.md`, `00-Project-Management/Owner-Review-Addendum_Gate-1_2026-08-31.md`, `00-Project-Management/Smart-Durian-Code_Phase_Prompts_v1.0.md` |

## 1. ผลลัพธ์

Phase 2 Multi-Farm & Access Control ดำเนินการครบขอบเขต local/emulator-only:

- Phone OTP Emulator flow และ test-number allowlist
- Organization/Farm membership, role รายสวน และ Farm Switcher
- loading/no farm/access denied/suspended/archived UI
- pending scope protection และ authorized deep link
- Owner-only role/revoke/restore พร้อม atomic Audit Event
- Firestore/Storage Rules แบบ deny-by-default
- Mock/Emulator seed 4 บัญชีทดสอบและ 4 สวนตัวอย่าง

ยังไม่สร้าง Tree Register, QR resolver/camera, Work Order, Production Firebase,
SMS จริง, billing, credentials, deployment หรือข้อมูลสวนจริง

## 2. Automated validation

คำสั่ง `pnpm validate` ผ่านทั้งหมด:

| การตรวจ | ผล |
|---|---|
| ESLint | ผ่าน ไม่มี warning |
| TypeScript strict | ผ่าน |
| Unit/component/network-denied | 5 files, 19 tests ผ่าน |
| Production build | ผ่าน |
| External runtime scan | ผ่าน 7 local build files |
| Emulator suite | 3 files, 14 tests ผ่าน |

Emulator suite ครอบคลุม:

- Authentication Emulator Phone OTP request/verification โดยไม่ส่ง SMS จริง
- same-farm allow และ cross-farm Firestore/Storage deny
- forged `farmId`, forged Storage metadata และ unauthorized role deny
- revoked membership, role downgrade และ user role ต่างกันรายสวน
- Archived Farm read allow / write deny
- atomic matching Audit Event และ missing-audit denial
- Firebase repository collection-group query และ membership change ผ่าน Rules จริง

## 3. Browser validation

ตรวจ Web App จริงใน Local Browser:

| Scenario | ผล |
|---|---|
| 320×736 | `scrollWidth == clientWidth` ไม่มี horizontal overflow |
| 1280×800 | Sidebar แสดง, bottom nav ซ่อน, ไม่มี horizontal overflow |
| Touch targets | ไม่พบ button/link ที่มองเห็นและเล็กกว่า 44px |
| OTP mock flow | ผ่าน |
| Farm Switcher | แสดงเฉพาะ membership และ role รายสวนผ่าน |
| Pending switch | เตือนและเก็บรายการเดิมที่ `DEMO-F01` หลังไป `DEMO-F02` |
| Unauthorized deep link | ปฏิเสธและไม่โหลดข้อมูลสวนเป้าหมาย |
| Archived state | แสดง read-only และการเขียนถูกระงับ |
| Console | warning/error = 0 |

## 4. Security findings

ไม่พบ cross-farm data leak, forged-scope bypass หรือ privileged decision ที่เชื่อ
client payload เพียงอย่างเดียว รายละเอียด threat notes อยู่ที่
`06-System-Architecture/Phase-2-Threat-Model_v0.1.md`

## 5. Remaining risks and decisions

- Account recovery เมื่อเปลี่ยน/สูญเสียเบอร์ยังไม่กำหนดก่อน Production
- `FARM_MANAGER` invitation/role policy ยังใช้ baseline จำกัดที่สุด
- Organization bootstrap/invitation ต้องมี trusted backend
- Offline revocation UX และ stale cache hardening อยู่ Phase 6
- Image compression/retention/orphan cleanup ยังไม่อนุมัติ
- Build ผ่านแต่ main JS chunk 893.36 kB (gzip 267.73 kB) มี performance warning
- Git มีการเปลี่ยนแปลง Gate 1 เดิมของผู้ใช้และ Phase 2 รอบนี้ โดยยังไม่ commit

## 6. Gate 2 recommendation

**Gate 2 Passed — Owner Approved**

Project Owner อนุมัติเมื่อ 2026-08-31 ด้วยข้อความ
`Gate 2 ผ่าน อนุมัติเริ่ม Phase 3 ตาม Prompt Phase 3` ตาม
`00-Project-Management/Owner-Review-Addendum_Gate-2_2026-08-31.md`
