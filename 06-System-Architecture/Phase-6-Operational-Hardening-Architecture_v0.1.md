# Phase 6 Operational Hardening Architecture

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.2 |
| สถานะ | Implemented & Validated — Mock/Local/Firebase Emulator Only |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | AGENTS.md v2.8, Owner Addendum Gate 5, Phase 6 Plan, Development/Mock Data/Pilot Knowledge v1.0.2, DEC-011, DEC-017, DEC-019, DEC-027, DEC-029, DEC-030, DEC-034 |

## 1. Boundary

```text
Responsive React/PWA UI
  → authenticated actor + trusted current Farm
    → OperationalHardeningRepository port
      ├─ deterministic Mock repository
      └─ Firebase repository (Local Emulator only)
        ├─ role-bucket Dashboard views
        ├─ Offline queue + idempotent replay
        ├─ Master Conflict + Photo recovery
        └─ append-only Audit + Farm-scoped Export
```

Phase 6 ไม่สร้าง Production resource, ไม่ deploy, ไม่ใช้ข้อมูลจริง และไม่เริ่ม
Controlled Pilot/Phase 7 การโหลด Firebase adapter และหน้ารองใช้ dynamic import
เพื่อลด initial payload โดย offline runtime ยังถูกเก็บใน PWA cache ทั้งหมด

## 2. Farm/Portfolio Dashboard

- Dashboard ฝั่งที่เชื่อถือได้แยก view ตาม role bucket; client ขอได้เฉพาะบทบาทปัจจุบัน
- Worker view ไม่มียอดขาย; Auditor ไม่เปิด operational Dashboard
- Portfolio ใช้ได้เฉพาะ Organization Owner และอ่านเฉพาะ Farm access ที่ได้รับสิทธิ์
- ไม่มี collection scan หรือ hidden-farm identifier ใน UI
- Dashboard เป็น summary เพื่อการปฏิบัติงาน ไม่ใช่บัญชีหรือ authoritative field evidence

## 3. Offline state machine

```text
PENDING ──reconnect + role recheck──> SYNCED
   │
   └── role downgraded / payload conflict ──> CONFLICT

CONFLICT ── Owner/Manager + reason ──> RESOLVED หรือ ESCALATED
```

- operation เก็บ Organization, Farm, actor, captured role, payload fingerprint และ
  idempotency key ตั้งแต่เวลาบันทึก
- replay ตรวจ membership/farm status/role ใหม่ ห้ามเชื่อ client role เดิม
- key เดิมคืน record/event เดิม ไม่เพิ่ม event ซ้ำ
- การสลับสวนไม่ย้าย pending operation ไปสวนใหม่
- Conflict ห้าม overwrite master data เงียบ ๆ การตัดสินมี reason และ before/after audit

## 4. Work photo preparation and failure recovery

- รับ JPEG/PNG/WebP/HEIC/HEIF ต้นฉบับไม่เกิน 25 MB แล้ว client re-encode เป็น
  WebP ด้านยาวไม่เกิน 1,600 px และไม่เกิน 5 MB
- re-encode จาก pixel เท่านั้นเพื่อไม่ส่ง EXIF/GPS; Firebase adapter fail closed หาก
  การเตรียมภาพไม่สำเร็จ ส่วน simulated fallback มีเฉพาะ Mock
- Work evidence ต้องตรง Work Order, assigned Worker, evidence phase และ
  `uploadSessionId` ต้องตรงชื่อไฟล์
- Work Create/Report retry อัตโนมัติไม่เกิน 3 ครั้งด้วย Photo ID/path เดิม
- หมด retry แล้วสร้าง `FAILED/PARTIAL_ONCE`; object สำเร็จแต่ยังไม่ได้ผูก
  กับ Work สร้าง `ORPHANED/ORPHANED_OBJECT` เข้า Phase 6 Sync Center อัตโนมัติ
- orphan cleanup จำกัด Owner/Manager; client ทุกบทบาทห้าม delete object โดยตรง
- durable offline binary replay และ server-side orphan deletion worker ยังต้องอนุมัติ Pilot architecture;
  ห้ามตีความว่า client record ลบ object จริงแล้ว

## 5. Audit and export

Operational audit เป็น append-only และตอบ actor/action/time/farm/target/reason รวมทั้ง
before/after สำหรับ correction/conflict การอ่านและ export จำกัด Owner/Manager/Auditor
ตาม Farm Export เป็น CSV ขนาดจำกัด มี column allowlist ป้องกัน spreadsheet formula
injection และการสร้าง Export สร้าง audit event ด้วย ไม่มี public URL หรือ Cross-Farm export

## 6. Security controls

| Threat | Control |
|---|---|
| Cross-Farm disclosure | Farm-scoped paths, active membership, role-bucket views, Emulator denial tests |
| Replay หลังถอนสิทธิ์ | re-authorize ทุก reconnect; revoked = deny, downgraded = Conflict |
| Duplicate critical event | deterministic operation/event IDs + transaction/idempotency |
| Silent overwrite | Conflict record + Owner/Manager decision + before/after audit |
| Malicious export cell | prefix formula-shaped values and CSV escaping |
| Unsafe upload/delete | MIME allowlist, 5 MB limit, metadata checks, client delete denied |
| Unknown collection | deny-by-default catch-all Rules |

## 7. Performance and accessibility budget

- Initial JavaScript ไม่เกิน 350,000 bytes
- Initial CSS ไม่เกิน 60,000 bytes
- Total offline runtime ไม่เกิน 1,800,000 bytes
- route และ adapter code splitting; build manifest ถูกตรวจด้วยคำสั่งอัตโนมัติ
- เป้าหมายขั้นต่ำ 320 px, touch target 44 px, keyboard focus, light/dark และไม่มี
  horizontal overflow
- Budget เป็น Engineering baseline; real-device timing ต้องวัดใน Controlled Pilot

## 8. Deferred before Production

- Physical Android/iPhone, camera, field network และ QR evidence
- QR base URL, permanent tag และ production domain
- approved backup destination, encryption/key custody, retention, RPO/RTO
- monitoring vendor, on-call owner และ alert routing
- Production Firebase, billing, credential และ deployment authorization
