# Phase 2 Multi-Farm & Access Architecture v0.1

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.1 |
| สถานะ | Implemented — Local/Emulator Only |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | `AGENTS.md`, `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`, `01-Requirements/KDOMS_Role_Access_Matrix_v0.1.md`, `00-Project-Management/Owner-Review-Addendum_Gate-1_2026-08-31.md` |

## 1. Runtime boundary

```text
React UI
  → Phase2Provider
    → PhoneOtpGateway
      → Mock adapter หรือ Firebase Authentication Emulator
    → Phase2Repository
      → Mock repository หรือ Firestore Emulator
        → Firestore / Storage Security Rules
```

ระบบไม่มี Production adapter ค่า `firebase-emulator` ถูกยอมรับเฉพาะ Project ID
`demo-smart-durian` และ host แบบ loopback เท่านั้น ค่าอื่นถูกปฏิเสธก่อนสร้าง client

## 2. Emulator data paths

```text
organizations/{organizationId}
  members/{userId}
  farms/{farmId}
    members/{userId}
    secureRecords/{recordId}
    auditEvents/{auditEventId}

Storage:
organizations/{organizationId}/farms/{farmId}/files/{fileName}
```

`secureRecords` เป็น record ทดสอบขอบเขต Security Rules ไม่ใช่ schema ของ Tree,
Work หรือ business module และห้ามนำไปตีความเป็นข้อมูลสวนจริง

## 3. Membership model

### Organization membership

- `organizationId`, `userId`, `status`, `isOwner`
- Organization bootstrap/owner assignment เขียนจาก client ไม่ได้
- ผู้ใช้ต้องมี Organization membership สถานะ `ACTIVE` ก่อน Farm membership มีผล

### Farm membership

- `membershipType = FARM`, `organizationId`, `farmId`, `userId`
- `role`, `status`, `version`, `auditEventId`, `updatedAt`
- `displayName` และ `maskedPhone` เป็นข้อความแสดงผล ไม่ใช่ security boundary
- role และ status ถูกอ่านจากเอกสารปัจจุบันทุกครั้ง ไม่เชื่อ client cache/payload

## 4. Authorization baseline

| ความสามารถ Phase 2 | สิทธิ์ |
|---|---|
| อ่านข้อมูล Farm | สมาชิก Active ของ Organization และ Farm |
| เขียน record ทดสอบเมื่อ Farm Active | `ORG_OWNER`, `FARM_MANAGER`, `AGRONOMIST`, `WORKER`, `SALES_INVENTORY` |
| อ่าน Audit | `ORG_OWNER`, `FARM_MANAGER`, `AUDITOR` |
| เปลี่ยน role/revoke/restore | `ORG_OWNER` เท่านั้น |
| เขียนข้อมูลเมื่อ Suspended/Archived | ปฏิเสธทุก role |
| Hard delete | ปฏิเสธ |
| Invitation/Organization bootstrap | ปฏิเสธจนมี trusted backend |

การเปลี่ยน membership ต้องเป็น atomic batch ที่เพิ่ม `version` และสร้าง Audit Event
ซึ่ง `before/after`, target, actor และ version ตรงกับเอกสารก่อนและหลัง batch
ห้ามแก้ membership ของบัญชีที่กำลังใช้งานเพื่อลดความเสี่ยง self-lockout

## 5. Farm Switcher and deep links

- รายการสวนมาจาก collection-group query ที่บังคับ `membershipType = FARM`,
  `userId = request.auth.uid` และ `status = ACTIVE`
- Farm Switcher ไม่รับรายการสวนจาก client payload ภายนอก
- Deep link `/farms/{farmId}` ตรวจว่ามีรายการใน authorized membership ก่อน
- pending operation เก็บ `organizationId` และ `farmId` ตั้งแต่สร้างและไม่แก้เมื่อสลับสวน
- Farm Suspended/Archived เปิดดูได้แต่ UI และ Rules ปิดการเขียน

## 6. Phone OTP boundary

- DEC-010 ใช้ Phone + SMS OTP
- Phase 2 allowlist เฉพาะหมายเลขตัวอย่างใน `phase2-demo-seed.json`
- Mock ใช้ OTP คงที่เฉพาะ unit/browser test
- Firebase Emulator ใช้ OTP ที่ Emulator สร้างและแสดงใน local terminal
- ไม่มี API สำหรับ Production Auth, SMS provider, billing หรือ real phone number

## 7. Storage boundary

- Path ผูก Organization/Farm
- อ่านได้เมื่อ membership ยัง Active รวมถึง Farm Archived
- upload ได้เมื่อ Farm Active และ role เขียนได้
- metadata ต้องตรง path และ `uploadedBy == request.auth.uid`
- จำกัดไฟล์รูปต่ำกว่า 5 MiB; update/delete ยังปฏิเสธใน Phase 2
- Compression, retention และ orphan cleanup ต้องตัดสินก่อนเปิด image feature จริง

## 8. Acceptance evidence

หลักฐานอยู่ใน `08-Testing/Phase-2-Validation-Report_v1.0.md` และ
`08-Testing/Gate-2-Acceptance-Checklist.md`
