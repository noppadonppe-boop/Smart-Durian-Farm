# Gate 1 Acceptance Checklist

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Ready for Owner Review — Not Approved |
| เจ้าของ Gate | Project Owner |
| วันที่ตรวจล่าสุด | 2026-08-31 |
| Source of Truth | `AGENTS.md`, `00-Project-Management/Smart-Durian-Code_Phase_Prompts_v1.0.md`, `00-Project-Management/Decision-Log.md`, `06-System-Architecture/Phase-1-Foundation-Architecture_v0.1.md` |

> Checklist นี้บันทึกผลตรวจเชิงเทคนิคของ Phase 1 เท่านั้น การทำเครื่องหมาย
> `ผ่าน` ไม่ใช่การอนุมัติ Gate 1 และไม่อนุญาตให้เริ่ม Phase 2

| หมวด | เกณฑ์ | หลักฐาน | ผล |
|---|---|---|---|
| Repository | เป็น Local Git repository โดยไม่ลบไฟล์เดิม | `.git`, branch `main`, `git status` | ผ่าน |
| Stack | Vite + React + TypeScript strict อยู่ใน `07-Source-Code/web-app` | `package.json`, `tsconfig.app.json` | ผ่าน |
| Dependency | ใช้ pnpm และ lockfile เดียว; frozen offline install ได้ | `pnpm-lock.yaml`, `pnpm install --frozen-lockfile --offline` | ผ่าน |
| Routes | Home, Work, Scan, Trees, More และ `/t/:positionId` shell ทำงาน | Browser route smoke | ผ่าน |
| Mobile | ที่ viewport 320px ไม่มี horizontal overflow; bottom navigation แสดง | Browser metrics: `scrollWidth = clientWidth`; touch target ที่ตรวจ ≥ 44px | ผ่าน |
| Desktop | ที่ viewport 1280px ไม่มี horizontal overflow; side navigation แสดง | Browser responsive smoke | ผ่าน |
| UX foundation | แสดง Farm context, mock-data warning และ Offline/Sync placeholder | Browser interaction smoke | ผ่าน |
| Mock-only | ไม่มีข้อมูลสวนจริงหรือ business CRUD | Mock adapter และหน้า placeholder | ผ่าน |
| Environment | มี `.env.example` โดยไม่มี secret; ค่าเริ่มต้นใช้ mock/demo project | `.env.example`, environment tests | ผ่าน |
| Emulator | Auth, Firestore, Storage Local Emulator เริ่มและตอบ local ports | `pnpm emulators:smoke`: 9099, 8080, 9199 | ผ่าน |
| Security baseline | Firestore/Storage Rules เริ่มแบบ deny-by-default | `firestore.rules`, `storage.rules` | ผ่าน |
| Quality | lint, typecheck, 5 tests, production build ผ่าน | `pnpm validate` | ผ่าน |
| Offline-critical | ไม่มี external runtime CDN; network-denied interaction ไม่มี fetch/console error | build scan 7 files, `networkDenied.test.tsx`, browser console `[]` | ผ่าน |
| Documentation | README และ architectural boundary note พร้อม | Web app README, Phase 1 Foundation Architecture | ผ่าน |
| Scope guard | ไม่มี production Firebase, billing, deployment, credential, real data หรือ Phase 2 feature | File/scope review และ secret scan | ผ่าน |

## Gate decision

- [x] **TECHNICAL READINESS — Phase 1 ผ่านเกณฑ์ที่ตรวจได้**
- [ ] **OWNER APPROVED — Gate 1 ผ่าน อนุมัติเริ่ม Phase 2**
- [x] **PHASE 2 NOT STARTED**

- ผู้อนุมัติ: `รอ Project Owner`
- วันที่อนุมัติ: `TBD`

## Owner decision required before Phase 2

- `DEC-010` Sign-in method: เลือกเบอร์โทร, อีเมล หรือบัญชีเชิญ
- ยืนยันข้อความอนุมัติ Gate 1 อย่างชัดเจนหลังตัดสิน `DEC-010`

## Gate 1 recommendation

แนะนำให้ **อนุมัติ Gate 1 หลัง Owner ปิด DEC-010** เนื่องจากหลักฐานทางเทคนิค
ของ Phase 1 ผ่านครบ แต่ Gate 1 ยังไม่เปลี่ยนเป็น Approved จนกว่าจะมีคำสั่ง Owner
