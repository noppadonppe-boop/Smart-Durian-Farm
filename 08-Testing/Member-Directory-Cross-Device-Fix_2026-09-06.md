# ผลแก้ไขรายชื่อสมาชิกระหว่างอุปกรณ์

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| วันที่ | 2026-09-06 |
| เจ้าของ | Project Owner |
| สถานะ | Local validation ผ่าน; Owner ยืนยัน commit และ deploy แล้ว; Firebase Hosting deployment สำเร็จ |
| Source | คำขอ Owner ตรวจแก้สมาชิกมือถือ/iPad, AGENTS.md v5.7, DEC-051, DEC-056, DEC-058 |

## ข้อค้นพบและแผนแก้ไข

- `MembersPage` โหลดรายชื่อครั้งเดียว ไม่มีการอัปเดตเมื่อสมาชิกเปลี่ยนจากอีกเครื่อง
- Repository เดิมใช้ `getDocs` ซึ่งสามารถคืนข้อมูลแคชเมื่อเซิร์ฟเวอร์เข้าถึงไม่ได้
- `UserManagementPage` ใช้แถวความสูง 36px แม้แปลงเป็นการ์ดบนหน้าจอเล็ก และยอดรวมนับรวมรายการซ้ำที่ซ่อนอยู่
- ข้อค้นพบยืนยันจาก source และข้อมูลจำลอง ไม่ได้ตรวจจำนวนสมาชิกจริงบนมือถือ/iPad ของ Owner

## สิ่งที่เปลี่ยนและเกณฑ์ผ่าน

1. สมาชิกในสวนอ่านจากเซิร์ฟเวอร์โดยตรง อัปเดตเมื่อ focus/visible/online ทุก 30 วินาทีขณะมองเห็น และผ่านปุ่มอัปเดตสมาชิก
2. แสดงจำนวนทั้งหมด/ใช้งาน/ยกเลิกสิทธิ์และเวลาอัปเดต หากอ่านไม่ได้ต้องแจ้งว่าข้อมูลอาจไม่เป็นปัจจุบัน
3. ป้องกันผลอ่านเก่าจากสวนก่อนหน้าทับสวนปัจจุบัน ยกเลิก listeners/timer เมื่อออกหน้า และไม่โหลดรายชื่อเมื่อไม่มีสิทธิ์จัดการ
4. หน้าผู้ดูแลแสดงจำนวนตรงแถวที่แสดง แยกจำนวนรายการซ่อน และแจ้งสถานะแคช/เซิร์ฟเวอร์/ข้อผิดพลาดทั้งโปรไฟล์และคำขอ พร้อมปุ่มอัปเดตรายชื่อ
5. การ์ดหน้าจอเล็กสูงตามเนื้อหา แสดงรายละเอียดและ actions ครบ คงแถวคำขอสีแดง
6. ไม่มีการแก้/ลบสมาชิกจริง เปลี่ยนสิทธิ์ หรือเปลี่ยน Firebase Rules

## ผลตรวจสอบ

- Unit/component ที่เกี่ยวข้อง 5 ไฟล์ 14 tests ผ่าน: MembersPage, UserManagementPage, ProfilePage, PendingTaskBadge และ FirebasePhase2Repository parsing
- ครอบคลุม cache → server, สมาชิกใหม่, refresh failure/recovery, focus/poll/manual, รายการซ้ำ, คำขอไม่มีโปรไฟล์, delayed result หลังเปลี่ยนสวน และ cleanup
- TypeScript, ESLint ของไฟล์แก้ไข และ Firebase Live production build ผ่าน; build ยังมีคำเตือน chunk ขนาดเกิน 500kB
- Chromium ตรวจ markup ที่สร้างจาก component fixtures และ CSS จริงที่ความกว้าง 360/390/768/820/1024/1180/1440px; หน้าผู้ดูแลมีจำนวนแถวเท่ากัน ไม่มี horizontal overflow และไม่มีการตัดเซลล์หรือ actions
- Fixtures เป็น SIMULATED/TEST ONLY; ภาพและเครื่องมือตรวจชั่วคราวอยู่ใน ignored `07-Source-Code/web-app/outputs/`
- WebKit ไม่พร้อมใช้งานในเครื่องนี้; ไม่อ้างว่าผ่าน Safari/iPad หรืออุปกรณ์จริง

## สถานะส่งขึ้นใช้งาน

การ Deploy ครั้งแรกถูก automatic approval review ปฏิเสธก่อนรันคำสั่ง ต่อมา Owner ยืนยันโดยตรงว่า “ยืนยัน commit and deploy” เมื่อ 2026-09-06 จึงอนุมัติให้ commit และ Deploy รุ่นแก้ไขนี้เฉพาะ Hosting ของ `durian-smartfarm` โดยคงข้อมูลสมาชิกและ Rules เดิม

Deploy สำเร็จไปยัง https://durian-smartfarm.web.app ด้วย `--only hosting --project durian-smartfarm` และ Firebase CLI ยืนยัน release complete ตรวจ HTTP 200 และ SHA256 ตรงกับ build ในเครื่องครบ 5 ไฟล์: `index.html`, `sw.js`, MembersPage JS, UserManagementPage JS และ CSS การตรวจนี้ยืนยันการส่งไฟล์รุ่นใหม่ ไม่ใช่ผลทดสอบข้อมูลสมาชิกจริงบนอุปกรณ์ Owner

DEC-051 ยังคงเป็น baseline Go-Live เดิม; งานนี้ไม่เปลี่ยน Gate หรือยกระดับหลักฐาน physical validation
