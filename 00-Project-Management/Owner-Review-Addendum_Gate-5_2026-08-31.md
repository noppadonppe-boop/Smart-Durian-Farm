# Owner Review Addendum — Gate 5

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Approved — Gate 5 Passed; Phase 6 Authorized |
| ผู้อนุมัติ | Project Owner |
| วันที่อนุมัติ | 2026-08-31 |
| Source of Truth | Owner instruction in Codex task, `AGENTS.md`, `00-Project-Management/Decision-Log.md`, `08-Testing/Gate-5-Acceptance-Checklist.md`, DEC-027, DEC-028 |

## 1. คำตัดสิน

Owner ส่งข้อความอนุมัติอย่างชัดเจน:

> Gate 5 ผ่าน อนุมัติเริ่ม Phase 6 ตาม Prompt Phase 6

จึงถือว่า Phase 5 ผ่าน Owner Gate และอนุญาต Phase 6 — Dashboard, Offline,
Audit & Security Hardening ตาม Prompt Phase 6 แบบ Mock-first/local/Firebase
Emulator เท่านั้น

## 2. ขอบเขต Phase 6 ที่อนุมัติ

- Farm Dashboard และ Portfolio Dashboard ตามสิทธิ์
- Offline cache/queue และสถานะ Pending/Syncing/Synced/Conflict
- retry-safe/idempotent writes และการตรวจ role ที่ถูกยกเลิกเมื่อ reconnect
- Photo upload recovery และ orphan cleanup policy
- Master-data conflict review พร้อม correction/before-after audit
- Farm-scoped export พร้อม audit และ data minimization
- Firestore/Storage/security, performance, accessibility และ mobile hardening
- ร่าง backup/export/restore procedure และ monitoring plan
- ใช้ Mock Data Pack ที่ versioned, deterministic, resettable และติดป้าย
  `SIMULATED/TEST ONLY`

## 3. ข้อห้ามที่ยังคงเดิม

- ห้าม Firebase Production, billing, public deployment และ Production domain
- ห้าม SMS/เบอร์จริง, credential, service-account key และข้อมูลบุคคล/สวนจริง
- ห้าม Cross-Farm transfer และ AI prediction ที่ไม่มี validated model/data
- ห้ามยกระดับ Browser/Viewport/Emulator เป็น Physical Device/Field evidence
- ห้ามเริ่ม Phase 7 จนกว่า Gate 6 ผ่านและ Owner อนุมัติอย่างชัดเจน

## 4. Residual risks ที่ carry forward

- Physical Device/Field/QR evidence ยัง `Deferred / Not Passed` ตาม DEC-027
- QR base URL ยัง `TBD`; ห้ามผลิตป้ายถาวร
- DEC-026 chemical/treatment approval policy ยัง Open
- Production privacy, retention, backup, account recovery, environment และ
  deployment ยังต้องได้รับ approval แยก
