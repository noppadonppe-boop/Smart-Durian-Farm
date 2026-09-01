# Phase 1 Foundation Architecture v0.1

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.1 |
| สถานะ | Implemented — Gate 1 Passed |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | `AGENTS.md`, `00-Project-Management/Decision-Log.md`, `06-System-Architecture/Architecture-Baseline_v0.1.md` |

## 1. Foundation shape

```text
React route/layout shell
  → Foundation adapter contracts
    → Mock adapter (active in Phase 1)
    → Firebase Emulator client factory (explicit opt-in, inactive by default)
```

UI ห้าม import Firebase client โดยตรง ข้อมูลเริ่มต้นมาจาก mock adapter ที่ระบุ
ชัดว่าเป็นข้อมูลจำลอง จึงไม่มี backend/runtime network dependency ใน critical shell

## 2. Route boundaries

- `/` Home foundation readiness
- `/work` Work placeholder; business flow รอ Phase 4
- `/scan` Scan placeholder; camera/resolver รอ Phase 3 และ Field Validation
- `/trees` Tree placeholder; register รอ Phase 3
- `/more` architecture and authorization boundary summary
- `/t/:positionId` permanent QR route shell; ไม่ resolve หรือ authorize ใน Phase 1

## 3. Firebase boundary

- `VITE_DATA_ADAPTER=mock` เป็นค่าเริ่มต้น
- Firebase client ถูกสร้างเมื่อเรียก factory และระบุ
  `VITE_DATA_ADAPTER=firebase-emulator` เท่านั้น
- Project ID เริ่มต้น `demo-smart-durian`; emulator ports เป็น local loopback
- Firestore และ Storage Rules เป็น deny-by-default
- ไม่มี production project, credential, billing หรือ deployment configuration

## 4. Offline/PWA boundary

- Vite PWA build precache HTML, JS, CSS, SVG และ web manifest จาก local bundle
- ไม่มี external runtime CDN ใน app source/build output
- network-denied component smoke ปิด `fetch`, ตรวจ interaction และ console error
- production-output smoke scan ปฏิเสธ external runtime source/href/import/fetch

## 5. Phase 2 boundary

Phase 1 ยังไม่ได้ทำ Authentication จริง, membership, Farm Switcher, role enforcement,
Firestore schema หรือ Security Rules ตาม role ภายหลัง Phase 1 เสร็จ Owner อนุมัติ
DEC-010 เป็น Phone + SMS OTP และอนุมัติ Gate 1 แล้ว จึงเริ่มงานเหล่านี้ใน Phase 2
ได้เฉพาะ local/Firebase Emulator ตาม Prompt Phase 2

## 6. Gate 1 acceptance

- clean install ด้วย pnpm lockfile เดียว
- dev server และ production preview เปิดได้
- lint, typecheck, test, build และ offline smoke ผ่าน
- Firebase Local Emulator Auth/Firestore/Storage เริ่มและตอบบน local ports ได้
- mobile 320 px และ desktop ไม่มี horizontal overflow
- navigation, Farm context, mock-data warning และ offline/sync placeholder ทำงาน
- console warning/error = 0 ใน browser/network-denied checks
- ไม่มี secret, service-account key, production resource หรือ Phase 2 feature
