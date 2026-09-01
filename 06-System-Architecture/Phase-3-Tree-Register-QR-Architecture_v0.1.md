# Phase 3 Tree Register, Orchard Layout & QR Architecture v0.4

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.4 |
| สถานะ | Implemented — Operational Tree Register Form Ready; Deployment/Field Configuration Pending |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| Source of Truth | `AGENTS.md`, `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`, `01-Requirements/KDOMS_Orchard_Layout_and_Target_Selection_Knowledge_v0.1.md`, `03-Tree-Data/Tree-Register-Data-Dictionary_v0.1.md`, `04-Tag-and-QR/Tag-and-QR-Standard_v0.1.md`, `00-Project-Management/Owner-Review-Addendum_Tree-Register-Operational-Data-Entry_2026-09-01.md`, `00-Project-Management/Decision-Log.md` (DEC-044–DEC-046) |

## 1. Domain model

```text
Organization
└── Farm
    ├── Tree Tag Index (Tag uniqueness; never deleted/reused)
    ├── Planting Position (opaque globally unique positionId)
    │   ├── Planting Cycle 1
    │   ├── Planting Cycle 2 ...
    │   └── append-only Tree Events / Timeline
    └── Tree Import operation (idempotency evidence)

Global Position Route
└── opaque positionId → Organization/Farm (authorization checked before read)
```

Tag เป็นตัวอ่านของมนุษย์และชี้ตำแหน่งถาวร ส่วน `positionId` เป็น opaque routing
identity การปลูกทดแทนเพิ่ม cycle และปิดรอบเดิมโดยไม่เปลี่ยน Tag

## 2. Firestore layout

```text
positionRoutes/{positionId}
organizations/{organizationId}/farms/{farmId}/
  treePositions/{positionId}
    plantingCycles/{cycleId}
    events/{eventId}
  treeTags/{tagCode}
  treeImports/{idempotencyKey}
```

- `treeTags` สงวน Tag ตลอดอายุข้อมูลและไม่อนุญาต update/delete
- `positionRoutes` ไม่อนุญาต list และอ่านได้เมื่อ Rules ยืนยัน membership ของ
  Farm เป้าหมายเท่านั้น
- Tree Event ไม่อนุญาต update/delete
- การแก้ master data ต้องเพิ่ม Position version และ matching event ใน batch เดียวกัน

## 3. CSV import pipeline

```text
Select/Paste CSV
→ RFC-style parse
→ exact Thai 49-column header หรือ exact legacy English 49-column header
→ normalize Thai header/value เป็น canonical field/value ภายใน
→ per-field + cross-field validation
→ current Organization/Farm check
→ duplicate-in-file check
→ Preview + Reject report
→ existing Tag preflight
→ atomic batch: Position + Cycle + Event + Tag Index + Route + Import record
```

- มี invalid row แม้หนึ่งแถว: UI ไม่เปิดปุ่ม Commit
- ห้ามผสมหัวคอลัมน์ไทยและอังกฤษในไฟล์เดียวกัน; แม่แบบที่ส่งออกใหม่ใช้ภาษาไทย
  ส่วนไฟล์ภาษาอังกฤษรุ่นเดิมยังรองรับเพื่อไม่ให้ workflow เดิมเสียหาย
- Tag เคยใช้แล้ว: ยกเลิกทั้ง batch
- Retry ใช้ deterministic `idempotencyKey` และคืน opaque IDs เดิม
- Phase 3 local flow จำกัด 50 ตำแหน่งต่อครั้ง เพื่อสอดคล้อง Field Validation
  cohort และไม่เกิน Firestore batch limit

## 4. Direct operational form pipeline

```text
Current authorized Farm
→ choose existing Zone/Row OR confirm new Zone/Row + counting direction
→ enter permanent Position sequence and confirm Tag preview
→ enter current Planting Cycle baseline
→ optionally enable complete GPS/trunk/canopy/height evidence groups
→ client domain validation
→ repository transaction/batch
→ Firestore Rules validation + Farm membership
→ Position + Cycle + Event + Tag Index + Route
```

- หน้าจอแบ่งเป็น 3 ส่วน: ตัวตนตำแหน่ง, ข้อมูลต้น/รอบปลูก และข้อมูลสำรวจ
- Status `empty` ปิดและล้างพันธุ์ ปีปลูก แหล่งต้นพันธุ์ และค่าการวัดต้น
- Measurement group เป็น all-or-none; ทุกกลุ่มที่เปิดต้องมีวิธีวัด เวลา ผู้วัด
  confidence และ source เพื่อให้ตรวจย้อนกลับได้
- ค่า `baselineDate` ใช้วันที่ประเทศไทยโดยตรง ไม่แปลงผ่าน UTC ก่อนแสดง
- การแก้ไขและปลูกทดแทนใช้ฟอร์มชุดเดียวกันเพื่อลดกฎ validation ที่ไม่ตรงกัน

### 4.1 Data classification

| Runtime/Farm | `exampleData` | การแสดงผล |
|---|---:|---|
| Mock adapter | `true` | `SIMULATED/TEST ONLY` |
| Firebase Emulator | `true` | `SIMULATED/TEST ONLY` |
| Firebase Production + Farm จำลอง (`isMock=true`) | `true` | Seed/Mock บน Production |
| Firebase Production + Farm จริง (`isMock=false`) | `false` | ข้อมูลทะเบียนต้นภาคสนาม |

Repository และ Rules บังคับให้ Position, Cycle, Event, Tag Index และ Route ใน
transaction เดียวกันมีชนิดข้อมูลตรงกัน ห้ามเปลี่ยนข้อมูลจำลองเป็นข้อมูลจริงด้วย
client payload หรือย้าย record ข้าม Farm ส่วน Farm จริงต้องมาจาก trusted
provisioning/activation; หน้าเพิ่มสวนตาม DEC-043 ยังคงสร้าง Farm จำลอง

## 5. QR resolution

1. QR payload ใช้ `VITE_QR_BASE_URL` + `/t/{opaquePositionId}`
2. ตรวจรูปแบบ base URL และ opaque ID ฝั่ง client
3. อ่าน `positionRoutes/{positionId}` ผ่าน Rules
4. Rules ตรวจ active membership ของ Farm เป้าหมาย
5. อ่าน Position/Cycle/Timeline เฉพาะเมื่ออนุญาต

Unknown QR และ unauthorized QR อาจตอบแบบไม่เปิดเผยข้อมูลใน Emulator เพื่อไม่ให้
ใช้ resolver ตรวจว่าตำแหน่งของสวนอื่นมีอยู่หรือไม่ Manual Tag ของ Farm ปัจจุบัน
ยังแยก unknown state ได้

## 6. Structural Orchard Layout and selection

`DERIVED-STRUCTURAL-V1` สร้าง presentation model จาก Position ที่ query ภายใต้
Farm ปัจจุบันเท่านั้น โดย sort `Zone → Row → treeSequence` ไม่เพิ่ม identity ใหม่:

```text
TreeRepository.listTreePositions(currentFarm)
→ reject mixed Organization/Farm payload
→ group Zone
→ sort Row left-to-right
→ sort Position top-to-bottom
→ render plan/list
→ selected opaque positionIds
→ destination form revalidates against current Farm
```

- Layout coordinate และ visual order ไม่เป็น authorization
- Shared selector รองรับ `SINGLE`, `MULTIPLE`, `ROW`, `ZONE`
- Cross-Zone Work Tree Set ใช้ `positionIds` snapshot และ `zoneCodes` summary
- Archived/empty eligibility ถูกกำหนดตาม Workflow โดย identity เดิมยังคงอยู่
- Navigation state ใช้ prefill เท่านั้นและ fail closed เมื่อ Farm/Position ไม่ตรง
- QR confirmation ของงานรายต้นทำหลัง selection ตาม Work Workflow เดิม

## 7. Scan UX

- ขอสิทธิ์กล้องเฉพาะเมื่อผู้ใช้กด และไม่อัปโหลดวิดีโอ
- ใช้ native `BarcodeDetector` เมื่อ Browser รองรับ
- ถ้า permission/decoder ไม่พร้อม ให้ Manual Tag/URL/opaque ID fallback
- แสดง Match, Mismatch, Unknown, Access Denied, Damaged และ Offline Cached
- Mismatch แสดง expected/actual และไม่เปิด action ของ target เดิม

## 8. Security boundaries

- Deny-by-default; Farm path และ trusted membership เป็น authorization
- Client role/Tag/Farm payload ไม่ยกระดับสิทธิ์
- Worker อ่านทะเบียนและรายงานป้ายชำรุด แต่ไม่แก้ Tree master
- Identity fields ของ Position เปลี่ยนไม่ได้หลังสร้าง
- Archive ไม่ลบ Tag index, route, cycles หรือ events
- Limited real Tree Register data อนุญาตตาม DEC-046 เฉพาะ Firebase Production
  + Farm จริง; deployment, Storage/รูปจริง และ QR production ยังอยู่นอกขอบเขต

## 9. Residual risks

1. Field topology/Zone/Row/ทิศทางนับยัง `TBD`
2. Production QR domain ยังไม่อนุมัติ
3. กล้องและการสแกนในแดด/ป้ายจริงต้องตรวจ Android/iPhone ใน Field Validation
4. Source รุ่น operational form ยังไม่ได้ Deploy; hosted version เดิมยังไม่ควรถูก
   อ้างว่าเปิดใช้งานฟอร์มนี้แล้ว
5. Firebase Storage/นโยบายรูปจริงยังไม่พร้อม จึงแสดงช่องรูปเป็น Deferred
6. Batch import มากกว่า 50 records ต้องออกแบบ chunk manifest + resumable policy ภายหลัง

## 10. Acceptance criteria

- Tag uniqueness และ no-reuse ถูกบังคับทั้ง repository และ Rules
- Cross-Farm Position/QR ถูกปฏิเสธ
- Planting Cycle replacement เก็บประวัติรอบเดิม
- Import invalid/duplicate/retry ไม่สร้าง corrupt หรือ duplicate records
- Mobile manual fallback ใช้งานได้ที่ 320px
- แปลนและ Shared Target Selector ไม่ render Position ข้าม Farm และเรียง Row/Tree
  ตาม DEC-045 พร้อม list fallback
- ฟอร์มเพิ่ม/แก้ไข/ปลูกทดแทนใช้ validation ชุดเดียวกันและเก็บ measurement evidence
  ที่ import หรือกรอกผ่านหน้าจอได้จริง
- Mock/Emulator/Farm จำลองสร้างได้เฉพาะ `exampleData=true` และ operational record
  สร้างได้เฉพาะ Firebase Production + Farm จริง
