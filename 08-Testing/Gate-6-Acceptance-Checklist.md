# Gate 6 Acceptance Checklist — Operational Hardening & Pilot Readiness

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.1 |
| สถานะ | APPROVED — Gate 6 Passed; Phase 7 Authorized; Production Not Authorized |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | Owner Addendum Gate 5, Owner Addendum Gate 6, Phase 6 Plan v1.1, Phase 6 Architecture v0.1, Phase 6 Validation Report v1.0, AGENTS.md v2.6, DEC-011, DEC-017, DEC-019, DEC-027, DEC-029, DEC-030, DEC-031 |

## A. Dashboard และ Multi-Farm

- [x] Farm Dashboard แสดง tree health, disease, work, fruit, harvest, inventory และ sales ตาม role
- [x] Worker view ไม่เปิดยอดขาย; Auditor ไม่เปิด operational Dashboard
- [x] Portfolio จำกัด Organization Owner และรวมเฉพาะ Farm membership ที่ได้รับสิทธิ์
- [x] hidden/unauthorized Farm identifier ไม่ปรากฏใน UI หรือผลรวม
- [x] Cross-Farm read ถูกปฏิเสธใน Emulator tests

## B. Offline, Idempotency และ Conflict

- [x] แสดง `PENDING`, `SYNCING`, `SYNCED`, `CONFLICT`
- [x] operation คง Organization/Farm/actor/idempotency scope เดิมเมื่อสลับสวน
- [x] retry/duplicate key ไม่เพิ่ม operation หรือ audit event ซ้ำ
- [x] role downgrade ก่อน reconnect เปลี่ยนเป็น Conflict โดยไม่สร้าง result event
- [x] revoked membership ถูกปฏิเสธก่อน replay
- [x] Master Conflict จำกัด Owner/Manager พร้อม reason, before/after และ audit

## C. Photo, Audit และ Export

- [x] failed/partial photo retry ได้และสร้าง audit
- [x] orphan cleanup จำกัด Owner/Manager; client delete ถูกปฏิเสธทุกบทบาท
- [x] Storage รับเฉพาะ JPEG/PNG/WebP ≤5 MB พร้อม Farm/actor metadata
- [x] Operational Audit ตอบ actor/action/time/farm/target/reason
- [x] Export จำกัด Owner/Manager/Auditor, Farm-scoped, minimal columns และมี audit
- [x] CSV escaping และ spreadsheet formula protection ผ่าน tests

## D. Security และ Privacy

- [x] Firestore/Storage deny-by-default และ Rules tests ผ่าน
- [x] Cross-Farm disclosure, duplicate critical event และ silent overwrite = 0
- [x] ไม่มี credential, service-account key, Production URL หรือข้อมูลจริง
- [x] Mock Data Pack v1.0.0 มี `SIMULATED/TEST ONLY`, versioned, deterministic และ resettable
- [x] dependency audit: high/critical = 0; moderate = 2 เฉพาะ dev-only `firebase-tools` transitive dependencies และบันทึก residual risk แล้ว

## E. Quality, Offline runtime และ Operations

- [x] ESLint, TypeScript strict, unit/component และ Emulator suites ผ่าน
- [x] PWA build และ offline runtime scan ผ่าน; ไม่มี external runtime CDN
- [x] Initial JS 326,981/350,000 bytes; CSS 40,504/60,000 bytes
- [x] Total offline runtime 1,267,211/1,800,000 bytes
- [x] Browser 320px/390×844, Light/Dark, latency simulation และ touch target ≥44px ผ่าน
- [x] horizontal overflow และ console warning/error = 0 หลังแก้ไข
- [x] Backup/Export/Restore draft และ Monitoring/Incident draft จัดทำแล้ว

## F. Deferred / Not Passed

- [x] ระบุชัดว่า Physical Device/Field/Camera/QR evidence ยัง `Deferred / Not Passed`
- [x] QR base URL, permanent tags, Production Firebase, billing, domain, credential,
  real SMS/phone/data และ public deployment ยังไม่ได้รับอนุมัติ
- [x] DEC-026, account recovery, privacy/retention, backup destination/RPO/RTO,
  monitoring contacts และ Controlled Pilot plan ยังต้องตัดสินก่อนใช้งานจริง

## G. Owner decision

- [x] **Gate 6 ผ่านและ Owner อนุมัติ Phase 7 ด้วยข้อความชัดเจน**

Owner decision:

**GATE 6 PASSED → PHASE 7 AUTHORIZED**

Owner อนุมัติเมื่อ 2026-08-31 ด้วยข้อความ:

```text
Gate 6 ผ่าน อนุมัติเริ่ม Phase 7 — Operational Application Pilot
ยังไม่อนุมัติ Production deployment จนกว่าจะตรวจ Pilot plan และรายการผลกระทบ
```

การอนุมัตินี้อนุญาตให้เริ่มจัดทำ Phase 7 แต่ยังไม่อนุญาต Production deployment
และยังไม่อนุญาต External Pilot Action จนกว่า Owner จะตรวจ Pilot plan, ผลกระทบ,
ค่าใช้จ่าย และรายการ resource ที่ขออนุมัติแยก
