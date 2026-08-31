# Smart Durian Farm Web App — Phase 1 Foundation

ฐาน Web App แบบ local/emulator-first สำหรับ Smart Durian Farm / KDOMS
ตาม Gate 0 ที่ Owner อนุมัติเมื่อ 2026-08-31

สถานะ: Phase 1 implementation และ validation เสร็จแล้ว รอ Owner อนุมัติ Gate 1

## ขอบเขตปัจจุบัน

- Vite + React + TypeScript strict
- Routes: Home, Work, Scan, Trees, More และ `/t/{opaquePositionId}` shell
- Mobile-first shell, design tokens, mock farm context และ offline/sync placeholder
- Firebase Local Emulator configuration และ adapter boundary
- PWA build ที่ใช้ local runtime assets
- Lint, typecheck, unit/component tests, build และ offline smoke checks

ยังไม่มี Authentication จริง, permissions, business CRUD, QR camera, production
Firebase, credentials, deployment หรือข้อมูลสวนจริง ห้ามเริ่ม Phase 2 ก่อน Gate 1

## Requirements

- Node.js 24 ขึ้นไป
- pnpm 11.19.0
- Java 21 สำหรับ Firebase Local Emulator

## ติดตั้งและรัน

```powershell
cd 07-Source-Code/web-app
Copy-Item .env.example .env.local
pnpm install --frozen-lockfile
pnpm dev
```

`.env.example` มีเฉพาะ demo/local identifiers ไม่ใช่ credential

## ตรวจสอบ

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm smoke:offline
pnpm emulators:smoke
```

หรือรันชุดหลักด้วย `pnpm validate`

## Firebase Local Emulator

```powershell
pnpm emulators
```

- Project ID บังคับเป็น `demo-smart-durian`
- Ports: Auth 9099, Firestore 8080, Storage 9199
- Firestore/Storage Rules เริ่มต้นแบบ deny-by-default
- App ไม่เปิด Firebase adapter อัตโนมัติ ค่าเริ่มต้นคือ `VITE_DATA_ADAPTER=mock`
- หากต้องตรวจ boundary ในภายหลัง ใช้ `VITE_DATA_ADAPTER=firebase-emulator`

ห้ามเปลี่ยน project ID เป็น production หรือเพิ่ม service-account key ใน repository

## Architecture boundaries

- `src/adapters/contracts.ts`: ports ที่ UI/application layer ใช้
- `src/adapters/mock`: mock implementation สำหรับ Phase 1
- `src/infrastructure/firebase/firebaseClient.ts`: lazy emulator-only client factory
- `src/config/environment.ts`: environment contract และ safe defaults
- `src/domain`: shared domain primitives ที่ยังไม่มี business behavior
- `src/app` และ `src/pages`: route/layout shell

Phase 2 จะเพิ่ม Authentication, Organization/Farm membership, Role enforcement
และ cross-farm denial tests หลัง Owner อนุมัติ Gate 1 เท่านั้น

## Offline-critical runtime rule

- ไม่มี external font, script, style หรือ runtime CDN
- `networkDenied.test.tsx` ปฏิเสธ `fetch` และยืนยันว่า shell ยังโต้ตอบได้โดยไม่มี
  console error
- `scripts/check-no-external-runtime.mjs` ตรวจ production output เพื่อป้องกัน
  external `src`/`href`, CSS URL และ runtime request
- Browser smoke test ต้องตรวจ console และ responsive ก่อนเสนอ Gate 1

ผลตรวจล่าสุดอยู่ที่ `../../08-Testing/Phase-1-Validation-Report_v1.0.md`
