# Firebase Live Seed

ระบบมี Seed สองประเภทและห้ามนำมาปะปนกัน

## 1. Operational bootstrap จากหน้าเว็บ

ผู้ดูแลเปิดเมนู **Firebase Live / Seed** หรือ `/firebase-admin` แล้วกด
**Seed พื้นที่ใช้งานจริงเข้า Firebase Live** ระบบสร้างเฉพาะ root, Organization,
Owner membership, Farm และ Audit จากค่าที่ผู้ดูแลกรอก โดยกำหนด
`classification=OPERATIONAL` และ `exampleData=false`

Operational bootstrap ไม่สร้างข้อเท็จจริงภาคสนามให้เอง ข้อมูลต้น งาน โรค ผลผลิต
ยอดขาย ต้นทุน และรายงานต้องกรอกจากโมดูลที่เกี่ยวข้อง

## 2. Deterministic test seed

ปุ่ม **Seed Mock 8 โมดูลเข้า Firebase Live** และสคริปต์
`seed-production.mjs` ใช้ข้อมูลใน `scripts/seed-data/` เพื่อทดสอบ workflow
ข้อมูลอยู่ใน Firebase project `durian-smartfarm` จริง แต่คง
`classification=SIMULATED/TEST ONLY` และ `exampleData=true` ทุก document

การเชื่อม Firebase Live ไม่ได้เปลี่ยนข้อมูลสังเคราะห์ให้เป็นข้อมูลจริง ชุดนี้ใช้
Organization/Farm DEMO แยกจาก Operational Farm และ Seeder หน้าเว็บจะข้ามรูป
placeholder เมื่อ Storage ยังไม่พร้อม

### Dry run ผ่าน Admin SDK

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\secure\durian-smartfarm-admin.json'
pnpm seed:production -- --owner-uid <firebase-owner-uid>
```

### เขียนชุดทดสอบจริง

```powershell
pnpm seed:production -- --owner-uid <firebase-owner-uid> --confirm-production --confirm-production-seed
```

เลือกโมดูลด้วย `--module foundation|annual-cycles|trees|work|commercial|management-reporting|operations|disease-analysis|all`
สคริปต์ตรวจ project ID และต้องยืนยันสองชั้นก่อนเขียน

## สิทธิ์ผู้ดูแล

ปุ่ม Seed ในเว็บอนุญาตเฉพาะ Firebase user ที่ UID ตรงกับ root `seedOwnerUid`
หรือมี custom claim `masterAdmin=true` ผู้ใช้ทั่วไปและ Role ที่ส่งมาจาก client
ไม่สามารถ Seed หรือสร้าง Organization ได้
