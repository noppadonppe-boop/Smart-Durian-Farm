# Smart Durian Farm Web App — Firebase Live

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 2.0.0 |
| สถานะ | Production Go-Live ตาม DEC-051 |
| Firebase project | `durian-smartfarm` |
| Data root | `durian-smartfarm/root` |
| วันที่ปรับปรุง | 2026-09-04 |

Web App ใช้ Firebase Authentication, Cloud Firestore และ Firebase Storage ของ
project `durian-smartfarm` โดยตรงทุก browser build ไม่มี data runtime สำรองในเครื่อง
ส่วน Mock adapter คงอยู่เฉพาะ unit/component test และไม่สามารถถูกเลือกใน build ที่
นำไปใช้งานได้

## เริ่มระบบ

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

ค่าจริงของ Firebase Web App อยู่ในไฟล์ `.env` ที่ถูก Git ignore โดยใช้
`.env.example` เป็นแม่แบบ Production build จะบังคับ `firebase-live` แม้มีค่า
`VITE_DATA_ADAPTER` เก่าค้างอยู่

## เข้าสู่ระบบโดยผู้ดูแล

หน้า Login มีปุ่ม **เข้าสู่ระบบโดยผู้ดูแล (Firebase Live)** ซึ่งใช้ Google Sign-In
ของ Firebase จริง ปุ่มนี้แสดงใน hosted build ด้วย ไม่ได้จำกัดเฉพาะเครื่องพัฒนา

สิทธิ์ Seed/System Admin เชื่อถือได้จากอย่างใดอย่างหนึ่งเท่านั้น:

- UID ตรงกับ `seedOwnerUid` ที่ root; หรือ
- Firebase custom claim `masterAdmin=true`

ข้อความ Role จาก client ไม่สามารถยกระดับสิทธิ์ได้ หากต้องอนุมัติ UID ใหม่ ให้ตรวจ
UID จากหน้า Firebase Live / Seed แล้วใช้ Admin credential รันแบบ Dry run ก่อน:

```powershell
pnpm admin:grant -- --uid <firebase-auth-uid>
pnpm admin:grant -- --uid <firebase-auth-uid> --confirm-production-admin
```

ผู้ใช้ต้องออกจากระบบแล้วเข้าใหม่เพื่อรับ ID token ที่มี claim ล่าสุด

## ปุ่ม Seed อยู่ที่ไหน

ผู้ดูแลเปิดได้จากเมนูด้านซ้าย **Firebase Live / Seed**, เมนูเพิ่มเติม หรือ URL
`/firebase-admin` มีสองการทำงานที่แยกกันชัดเจน:

1. **Seed พื้นที่ใช้งานจริงเข้า Firebase Live** — สร้าง root, Organization,
   Organization Owner, Farm, Farm Owner membership และ Audit แบบ `OPERATIONAL`
   จากค่าที่ผู้ดูแลกรอก ไม่สร้างจำนวนต้น งาน โรค ผลผลิต ยอดขาย หรือต้นทุนปลอม
2. **Seed Mock 8 โมดูลเข้า Firebase Live** — นำ deterministic test pack ไปไว้ใน
   สวน DEMO เพื่อทดสอบทุกโมดูล ข้อมูลนี้อยู่ใน Firebase Live จริงแต่ยังเป็น
   `SIMULATED/TEST ONLY` และไม่ปะปนกับสวนจริง

เมื่อสร้างสวนจริงสำเร็จ ระบบเลือกสวนนั้นเป็นสวนปัจจุบันและแสดงแถบ
`Firebase Live · ข้อมูล Operational` โดยไม่มีป้ายข้อมูลจำลอง

## โมดูลที่เขียน Firebase Live

- Farm/Profile/Membership และ Owner-only financial access
- Tree Register, Planting Cycle, Tag route และการเลือกตำแหน่ง
- Work Order, Care Event, Disease Incident และ Human Review
- Crop/Fruit/Harvest/Sales/Inventory
- Annual Farm Management Cycle และ Management Reporting/Cost
- Dashboard, Portfolio, Queue/Conflict, Audit และ Export
- Disease Analysis candidate finding ซึ่งยังต้องผ่าน Agronomist review และไม่สร้าง
  diagnosis/treatment/คำแนะนำสารเคมีอัตโนมัติ

ทุกข้อมูลเชิงปฏิบัติการอยู่ภายใต้ `Organization → Farm` และ Firestore Rules ยัง
บังคับ Cross-Farm denial ข้อมูลการเงินเปิดเฉพาะ trusted Organization Owner

## Storage

`VITE_FIREBASE_STORAGE_READY=true` ใช้ได้เมื่อ Storage bucket ถูก provision และ
Storage Rules ถูก deploy แล้วเท่านั้น หากยังเป็น `false` ชุด Seed ทดสอบจะข้ามรูป
placeholder และหน้าผู้ดูแลจะแสดงสถานะตรงไปตรงมา

## Seed ผ่าน Admin SDK

ไฟล์ Mock Data แยกจาก `src/` อยู่ใน `scripts/seed-data/` และยังรันผ่าน CLI ได้:

```powershell
pnpm seed:production -- --owner-uid <firebase-owner-uid>
pnpm seed:production -- --owner-uid <firebase-owner-uid> --confirm-production --confirm-production-seed
```

รายละเอียดอยู่ที่ [scripts/PRODUCTION-SEED.md](scripts/PRODUCTION-SEED.md)

## ตรวจสอบและ Deploy

```powershell
pnpm validate
pnpm deploy:firebase-live
```

`deploy:firebase-live` build แล้ว deploy Firestore Rules/Indexes และ Hosting ไปยัง
`durian-smartfarm.web.app` ส่วน Storage แยกคำสั่งเพื่อไม่ให้ deploy ก่อน bucket พร้อม:

```powershell
pnpm deploy:firebase-storage
```

การทดสอบใน `pnpm test` ใช้ deterministic fixtures ในหน่วยความจำเท่านั้นและไม่เขียน
Firebase project จริง
