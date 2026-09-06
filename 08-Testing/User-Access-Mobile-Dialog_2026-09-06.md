# แก้ปุ่มแก้ไขสิทธิ์บนมือถือ

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| เจ้าของ | Project Owner |
| วันที่ | 2026-09-06 |
| สถานะ | ทดสอบและ Deploy Hosting สำเร็จ |
| Source | Owner แจ้งปุ่มแก้ไขสิทธิ์บนมือถือไม่ active, DEC-051/057/058 |

## ข้อค้นพบ

ปุ่มเดิมเปิด section ด้านบนของตารางโดยไม่มี scroll/focus จึงเปิดนอก viewport เมื่อผู้ใช้เลื่อนลงมา บัญชีที่ไม่มี APPROVED Access Request จะรายงานข้อผิดพลาดที่ด้านบนเช่นกัน ไม่ใช่การพิสูจน์ว่าบัญชีของ Owner ขาดคำขอ เพราะไม่ได้อ่านข้อมูลสมาชิกจริง

## การแก้ไขและเกณฑ์ผ่าน

- เปิด editor ด้วย native modal dialog ที่อยู่ภายใน viewport พร้อม focus และ backdrop
- ยกเลิกผ่านปุ่ม/ESC ได้ แต่คงป้องกันการปิดระหว่างบันทึก
- ข้อผิดพลาดการบันทึกอยู่ภายใน dialog; กรณีไม่มี APPROVED request ให้ focus/scroll ไปข้อความเหตุผล
- เพิ่ม touch target ปุ่มตารางจอเล็กเป็นอย่างน้อย 44px และปรับ form ให้ไม่ล้นหน้าจอ
- คงเงื่อนไข approved request, ACTIVE farm, backend authorization และ confirmation เดิม ไม่ได้แก้สิทธิ์จริงจากการทดสอบ

## ผลทดสอบและส่งขึ้นใช้งาน

- UserManagementPage component tests 6 รายการผ่าน รวมเปิด/ปิด modal และ focus ข้อผิดพลาด
- ESLint, TypeScript และ Firebase Live build ผ่าน (คำเตือน chunk ใหญ่เดิมยังมี)
- Chromium ใช้ component-rendered fixtures SIMULATED/TEST ONLY: dialog อยู่ใน viewport หลังเลื่อนหน้า เลือก Role ได้และ hit testing ผ่านที่ 360×800, 390×844, 820×1180
- ตาราง regression 7 ความกว้างผ่าน ไม่มี clipping หรือ horizontal overflow
- Native dialog/browser geometry เป็นการจำลองบน Chromium ไม่ใช่ physical Safari/iPad evidence
- Firebase Hosting `durian-smartfarm` release complete; HTTP 200/SHA256 ของ index, service worker และ member bundles ตรงกับ build
- ไม่มีการแก้ Firestore Rules หรือข้อมูลสมาชิกจริง; commit/deploy เป็นการแก้ต่อเนื่องจากการอนุมัติในงานนี้
