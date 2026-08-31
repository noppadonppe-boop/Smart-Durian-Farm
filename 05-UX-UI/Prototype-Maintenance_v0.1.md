# Prototype Maintenance v0.1

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.1 |
| สถานะ | Proposed — Owner Review Required |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | `05-UX-UI/KDOMS_UX_UI_Knowledge_v0.1.md`, `00-Project-Management/Decision-Log.md` |

## 1. ไฟล์และหน้าที่

- `kdoms-mobile-ux-prototype-source.html` คือต้นฉบับ UX Prototype ที่อ่านและ
  แก้ไขได้โดยตรง
- `kdoms-mobile-ux-preview.html` คือไฟล์เปิดดูเดิมซึ่งฝังต้นฉบับแบบ escaped
  `srcdoc` เพื่อรักษารูปแบบการแสดงผลเดิม
- `export-kdoms-mobile-ux-preview.ps1` ทำเฉพาะการ encode ต้นฉบับกลับเข้า
  Preview wrapper ไม่สร้าง Application Code และไม่เชื่อม Firebase

ข้อมูล ชื่อสวน รหัสต้น ผลงาน และรูปภาพทั้งหมดในต้นแบบเป็นข้อมูลจำลอง

## 2. ขั้นตอนแก้ไขและ export

1. แก้เฉพาะ `kdoms-mobile-ux-prototype-source.html`
2. เปิดต้นฉบับผ่าน local HTTP server และตรวจ flow ที่ต้องการ
3. รันจาก Working Directory:

   `powershell -ExecutionPolicy Bypass -File 05-UX-UI/export-kdoms-mobile-ux-preview.ps1`

4. เปิด `kdoms-mobile-ux-preview.html` ผ่าน local HTTP server และตรวจซ้ำ
5. ยืนยันว่า source และ preview ให้ผลเหมือนกันก่อนเสนอ Owner Review

สคริปต์จะปฏิเสธ path นอก `05-UX-UI` และไม่สร้างไฟล์ Preview ใหม่หาก wrapper
เดิมหายไป เพื่อหลีกเลี่ยงการเขียนทับไฟล์ผิดเป้าหมาย

## 3. Validation ก่อนส่งมอบ

- ความกว้าง viewport 320 px และ 736 px
- Light mode และ Dark mode
- ไม่มี horizontal overflow หรือส่วนควบคุมล้นกรอบ
- Touch target ของ action สำคัญประมาณ 44×44 px ขึ้นไป
- Farm switch online และ offline/pending แบบ cancel/confirm
- Scan ถูกต้น, mismatch และ manual code `T018`
- Worker Report → Manager Verify → Approve/Request Rework
- Keyboard: Enter สำหรับ manual code และ Escape สำหรับปิด overlay
- ไม่มี console warning/error ที่เกิดจากต้นแบบ

## 4. Acceptance criteria

- ต้นฉบับเปิดดูและโต้ตอบได้โดยไม่พึ่ง Application backend
- Export แล้ว Preview เดิมยังเปิดดูและมี behavior ตรงกับต้นฉบับ
- ไม่มีข้อมูลจริง, credential, external API หรือ production resource
- การเปลี่ยนแปลงยังอยู่ในขอบเขต Phase 0 UX Prototype
