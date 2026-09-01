# KDOMS Report Policy — Owner Mockup v0.1

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.1 |
| สถานะ | Proposed Owner Mockup — `SIMULATED/TEST ONLY`; Not Approved; Not Active |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| ขอบเขต | Mockup สำหรับตัดสินใจและตั้งค่า Report/KPI/Export/Retention ในอนาคต |
| Machine-readable fixture | `08-Testing/fixtures/report-policy-owner-mock-v0.1.json` |
| Fixture SHA-256 | `c25d1ede592a316262868a50031b5c13e47fb4a733f5f97918c88d031d30ab5b` |
| Source of Truth | `AGENTS.md`, `01-Requirements/KDOMS_Development_Mock_Data_and_Pilot_Knowledge_v1.0.md`, `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`, `01-Requirements/KDOMS_Report_Catalogue_and_KPI_Definitions_v0.1.md`, `01-Requirements/KDOMS_Role_Access_Matrix_v0.1.md`, `10-Operations/Phase-7-Privacy-Retention-Access-Review_v0.2.md`, `10-Operations/Phase-7-Photo-Data-Governance-Decision-Sheet_v1.0.md`, `00-Project-Management/Decision-Log.md` |

> **คำเตือน:** ค่าทั้งหมดในเอกสารและ fixture นี้เป็นข้อเสนอแบบ deterministic
> `SIMULATED/TEST ONLY` เพื่อให้ Owner เห็นหน้าตาและผลกระทบก่อนตัดสินใจ ไม่มีผลเป็น
> Approval, Active Policy, External PA-1/PA-2, Deployment หรือ Production และห้ามใช้
> กับข้อมูลจริงจนกว่าจะมี Decision/Approval ตาม Gate ที่เกี่ยวข้อง

## 1. วัตถุประสงค์

1. ให้ Owner ทดลองรับค่าแนะนำ แก้ค่า หรือปฏิเสธทีละประเด็นโดยไม่ต้องแก้โค้ด
2. กำหนด Policy แบบมีเวอร์ชันและวันเริ่มใช้ เพื่อให้เปลี่ยนในอนาคตได้โดยไม่เขียนทับ
   รายงานที่ Finalized แล้ว
3. แสดงผลกระทบก่อน Active เช่น จำนวนรายงานที่ติด Warning, สิทธิ์ Export ที่เพิ่มขึ้น
   และพื้นที่จัดเก็บตาม retention
4. แยกค่าธุรกิจที่ Owner เปลี่ยนได้จาก Safety control ที่ห้ามปิด

## 2. หลักการออกแบบให้แก้ไขได้ในอนาคต

- เก็บค่าเป็น `Policy Version` ไม่ฝังค่าคงที่ไว้ในหน้ารายงาน
- โครงสร้างค่าเป็น `Organization default` และอนุญาต `Farm override` เฉพาะช่องที่
  Owner อนุมัติ; รายงาน Portfolio ต้องแสดง Policy version ของแต่ละ Farm
- ทุกการเปลี่ยนต้องมีผู้แก้ เหตุผล before/after, `effectiveFrom` และ Impact preview
- Lifecycle คือ `DRAFT → REVIEW_REQUIRED → APPROVED → ACTIVE → SUPERSEDED`
- ค่าใหม่มีผลกับงวดตาม `effectiveFrom`; รายงาน Finalized เดิมไม่เปลี่ยนย้อนหลัง
- หากต้องแก้รายงานเดิม ให้สร้าง `RESTATED` revision พร้อม `supersedesReportId`
  และเหตุผล ไม่เขียนทับไฟล์หรือ checksum เดิม
- การ Rollback คือสร้าง Policy version ใหม่ที่ใช้ค่าจากเวอร์ชันก่อนหน้า ไม่ย้อนแก้
  Audit history
- การเปลี่ยน Retention, Export หรือ Distribution ต้องมี Data Custodian review เพิ่มเติม
- ใน Pilot/Production หาก Farm ไม่มี timezone ให้ Block การ Finalize; fallback ที่ระบุ
  ด้านล่างใช้กับ Local/Mock เท่านั้น

## 3. ภาพ Mockup หน้าตั้งค่า

```text
รายงานและนโยบาย                         [SIMULATED/TEST ONLY]
Policy: KDOMS-REPORT-POLICY-SIM-001 v0.1.0     Status: DRAFT
Scope: Organization default  [เลือก Farm override ▾]

[รอบเวลา] [KPI Threshold] [Fruit] [Payment] [Export] [Retention]

วันเริ่มสัปดาห์       [วันจันทร์ ▾]     เวลาเริ่ม [00:00]
Weekly cutoff         [36] ชั่วโมงหลังปิดงวด
Monthly cutoff        [72] ชั่วโมงหลังปิดงวด
Mock timezone fallback[Asia/Bangkok ▾]

ผลกระทบจากค่าที่แก้
- รายงานจำลองที่เปลี่ยนสถานะ: 4
- Farm override ที่ได้รับผล: 2
- Export permission เพิ่ม/ลด: +0 / -0
- Retention estimate: SIMULATED/TEST ONLY

[บันทึก Draft] [ดู Impact preview] [ส่งให้ตรวจ] [Activate หลังอนุมัติ]
```

ปุ่ม `Activate` ต้องใช้ได้เมื่อมี Approval reference, ผู้มีสิทธิ์อนุมัติ และวันที่เริ่มใช้
ครบเท่านั้น ใน Local/Mock ปุ่มนี้ต้องจำลองผลและไม่ทำให้ Policy จริง Active

## 4. สรุป Recommended Mock Policy

| ประเด็น | ค่าแนะนำสำหรับ Mock | เหตุผลหลัก | Owner แก้ได้ในอนาคต |
|---|---|---|:---:|
| วันเริ่มสัปดาห์ | จันทร์ `00:00` ตาม Farm timezone | สอดคล้องรอบงานปฏิบัติการทั่วไปและช่วงแบบ `[start,end)` | ✓ |
| Weekly cutoff | 36 ชั่วโมงหลังจบงวด | เปิดเวลาให้ Sync/Correction หลังวันหยุด โดยไม่รอเกิน 2 วัน | ✓ |
| Monthly cutoff | 72 ชั่วโมงหลังจบเดือน | ให้เวลา Reconcile Sales, Inventory และ Audit | ✓ |
| Timezone fallback | Local/Mock ใช้ `Asia/Bangkok`; Pilot/Production ไม่มี timezone = Block Finalize | Mock ทำซ้ำได้ แต่ไม่ซ่อน master data ที่ขาดในระบบจริง | ✓ เฉพาะค่าที่อนุมัติ |
| KPI threshold | Warning/Critical แยกกันตามตารางข้อ 6 | ปรับความไวได้โดยไม่เปลี่ยนสูตร KPI | ✓ เฉพาะ operational threshold |
| Fruit roll-up | ระดับเดียวต่อ Zone; Tree ใช้เมื่อ coverage 100% มิฉะนั้น Zone; overlap = ไม่รวม | ป้องกัน double count และการผสมคุณภาพข้อมูล | ✓ |
| Dropped fruit | ผลร่วงเพิ่มในช่วงนับตั้งแต่ Observation ก่อนหน้า | ทำให้รวมรายเดือนได้เมื่อช่วงเวลาไม่ทับซ้อน | ✓ |
| Payment Event | Append-only event; Correction ด้วย Reversal + Replacement | Audit ได้และไม่แก้ยอดย้อนหลังแบบเงียบ ๆ | ✓ เฉพาะ type/policy ที่ไม่ลด Audit |
| Export | Least privilege ตามบทบาท; CSV default; ไม่มี public link | ลดข้อมูลเกินจำเป็นและตรวจย้อนหลังได้ | ✓ ภายใต้ Safety control |
| Retention/Distribution | Draft 30 วัน, Finalized summary/manifest 365 วัน, ad-hoc export 7 วัน, link 24 ชม., in-app only | เริ่มจากการกระจายข้อมูลต่ำและอายุสั้น | ✓ พร้อม Custodian review |

## 5. รอบเวลา, cutoff และ timezone

### 5.1 ค่าที่เสนอ

- สัปดาห์: วันจันทร์ `00:00:00` ถึงวันจันทร์ถัดไป `00:00:00`
- เดือน: วันที่ 1 `00:00:00` ถึงวันที่ 1 ของเดือนถัดไป `00:00:00`
- Weekly cutoff: `periodEnd + 36 ชั่วโมง`
- Monthly cutoff: `periodEnd + 72 ชั่วโมง`
- Event หลัง cutoff: `LATE_DATA_PENDING_REVIEW`
- การยอมรับ Late data: สร้าง Report revision ใหม่เท่านั้น
- Timezone หลัก: `Farm.timezone`
- Local/Mock fallback: `Asia/Bangkok`
- Pilot/Production เมื่อไม่มี timezone: `BLOCK_FINALIZATION`

ตัวอย่างจำลอง: สัปดาห์ 2026-08-24 00:00 ถึง 2026-08-31 00:00 มี Weekly cutoff
วันที่ 2026-09-01 12:00 ตาม Farm timezone ตัวอย่างนี้เป็น `SIMULATED/TEST ONLY`
และไม่ใช่ปฏิทินปฏิบัติการจริง

### 5.2 ช่องที่ Owner แก้ได้

`weekStartsOn`, `weekStartLocalTime`, `weeklyCutoffDelayHours`,
`monthlyCutoffDelayHours`, `mockFallbackTimeZone` และ late-data action ที่อยู่ใน
ตัวเลือกซึ่งรองรับ Audit/Revision

## 6. KPI threshold ที่เสนอ

Threshold เปลี่ยนสี/สถานะ Review เท่านั้น ไม่เปลี่ยนสูตร ตัวตั้ง ตัวหาร หรือข้อมูลต้นทาง

| KPI | Warning | Critical | หมายเหตุ |
|---|---:|---:|---|
| Overdue work rate | ≥ 10% | ≥ 20% | denominator 0 = N/A |
| Rework rate | ≥ 10% | ≥ 20% | แสดงจำนวนประกอบเสมอ |
| Follow-up overdue | ≥ 1 | ≥ 3 | เรียง Critical/High ก่อน |
| Pending queue age | ≥ 0.5 ชม. = Support review | ≥ 24 ชม. | 0.5 ชม. สอดคล้อง Mock support trigger |
| Open Conflict | ≥ 1 | ≥ 3 | ห้ามซ่อนด้วยการ Sync ซ้ำ |
| Unknown-value share | ≥ 10% | ≥ 20% | Unknown ไม่เท่ากับ 0 |
| Audit completeness | < 100% | < 98% | ยิ่งต่ำยิ่งรุนแรง |
| Open photo recovery | ≥ 1 | ≥ 3 | Binary recovery ต้องมี payload จริง |
| Inventory expiry | ≤ 30 วัน | ≤ 7 วัน | แยก lot/unit |
| Upcoming work window | 7 วัน | — | Window filter ไม่ใช่ severity |
| ตัวอย่างขั้นต่ำสำหรับ P90 | 20 รายการ | — | ต่ำกว่านี้แสดง `INSUFFICIENT_SAMPLE` |
| Estimated-value share | Information only | — | ไม่ให้สี Good/Bad จน Owner กำหนด |

Safety threshold ต่อไปนี้ต้อง Critical เมื่อพบอย่างน้อย 1 ครั้งและ Owner ห้ามปรับให้
ผ่อนคลาย: Cross-Farm disclosure, Wrong-Tree action, duplicate critical event,
traceability gap และ restore mismatch

## 7. Fruit scope roll-up

แนะนำ `EXCLUSIVE_LEVEL_PER_ZONE`:

1. เลือก Observation ล่าสุดต่อ exact scope key และ stage เดียวกัน
2. ถ้า Tree-level ของ Zone ครบ 100% จึงรวม Tree-level
3. ถ้าไม่ครบ ให้ใช้ Zone-level ที่ไม่ทับซ้อน
4. ถ้าไม่มีระดับที่ครบหรือมี overlap ให้แสดงรายละเอียดแยกและสถานะ
   `AGGREGATE_BLOCKED_OVERLAP` ห้ามเดายอดรวม
5. แยก `MEASURED`, `ESTIMATED`, `UNKNOWN`; ห้ามบวก Unknown เป็นศูนย์
6. Farm roll-up รวมได้เฉพาะ Zone ที่ mutually exclusive และใช้หน่วยเดียวกัน

ค่าที่ Owner แก้ได้ ได้แก่ source priority, coverage threshold, overlap action และ
quality mix action แต่ค่าที่ทำให้ double count หรือซ่อน Unknown ต้องไม่ผ่าน validation

## 8. ความหมายของ dropped fruit

แนะนำให้ `droppedCount` หมายถึง **จำนวนผลที่ร่วงเพิ่มในช่วงตั้งแต่ Observation ก่อนหน้า
ถึง Observation ปัจจุบัน** (`INTERVAL_DELTA_SINCE_PREVIOUS_OBSERVATION`) ไม่ใช่ยอดสะสม
และไม่ใช่ค่าคงเหลือ ณ เวลาถ่ายภาพ

Required fields:

- `dropCountSemantics`
- `observationWindowStart`
- `observationWindowEnd`
- `previousObservationId`
- `droppedCount` เป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป หรือ `null` เมื่อไม่ทราบ

Monthly total รวมเฉพาะช่วงที่ผ่าน validation และไม่ทับซ้อน Record เดิมที่ไม่มี semantics
ให้เป็น `UNCLASSIFIED` และไม่นำเข้าผลรวม ไม่แปลงเป็น 0 หาก Owner เลือกความหมายอื่น
ในอนาคต ต้องเริ่มใช้ด้วย Policy version ใหม่และมี migration/reclassification plan

## 9. Payment Event model

แนะนำ `APPEND_ONLY_PAYMENT_EVENTS` สำหรับบันทึกเชิงปฏิบัติการ ไม่ใช่บัญชีแยกประเภท
เอกสารภาษี ระบบธนาคาร หรือการรับรองเงินสด

Event type เริ่มต้น:

- `DEPOSIT_RECORDED`
- `PAYMENT_RECORDED`
- `REFUND_RECORDED`
- `REVERSAL`

Required fields: `paymentEventId`, `organizationId`, `farmId`, `salesLotId`,
`eventType`, `amountBaht`, `occurredAt`, `recordedAt`, `actorUserId`,
`paymentReference` และ `idempotencyKey`

กติกา:

- สกุลเงินเริ่มต้น THB และ `amountBaht` ต้องไม่ติดลบ
- Event ที่ Post แล้วแก้หรือลบไม่ได้
- Correction ใช้ `REVERSAL` อ้าง Event เดิม แล้วสร้าง Replacement event
- ห้ามเก็บเลขบัญชี ข้อมูลบัตร secret หรือข้อมูลธนาคารใน reference
- Monthly cash receipt ใช้ได้เมื่อ model นี้ได้รับอนุมัติและ implement/test แล้วเท่านั้น

## 10. สิทธิ์ Export ที่เสนอ

| บทบาท | สิทธิ์เริ่มต้นที่เสนอ |
|---|---|
| `ORG_OWNER` | Authorized Farm summary/detail และ Portfolio summary |
| `FARM_MANAGER` | Current Farm summary/detail |
| `AGRONOMIST` | ไม่มี Export โดย default; อ่านตาม Farm scope |
| `WORKER` | ไม่มี Export |
| `SALES_INVENTORY` | Current Farm commercial summary; detail ต้อง Manager approve |
| `VIEWER` | ไม่มี Export |
| `AUDITOR` | Assigned-scope Audit และ Data Quality เท่านั้น |

Controls บังคับ:

- ตรวจสิทธิ์ใหม่ ณ เวลาดาวน์โหลด ไม่ยึดสิทธิ์ตอนสร้างไฟล์
- CSV เป็น default, ใช้ column allowlist และป้องกัน spreadsheet formula injection
- ทุก Export มี actor, Farm/report scope, row count, checksum, expiry และ Audit event
- ไม่รวม binary photo โดย default
- Bulk photo/evidence export ต้อง Owner + Data Custodian dual approval
- ห้าม public link และห้าม Cross-Farm data นอก Portfolio manifest ที่ได้รับสิทธิ์

## 11. Retention และ distribution ที่เสนอ

| Artifact/ช่องทาง | ค่า Mock ที่เสนอ |
|---|---:|
| Draft report | 30 วัน |
| Finalized summary + manifest | 365 วัน |
| Ad-hoc detail export package | 7 วัน |
| Download link | 24 ชั่วโมง |
| Local device cache | ไม่เกิน 7 วัน |
| Default distribution | In-app only |
| Scheduled distribution | ปิด |
| Email/chat attachment | ปิด |
| Public URL | ปิด |
| External destination/region/key custody | `TBD_NOT_APPROVED` |

Business/legal hold ต้อง Owner + Data Custodian อนุมัติและมีเหตุผล/วันทบทวน การลบ
จริงต้องใช้ trusted server-side process พร้อม Audit; Local/Mock แสดงได้เพียง simulation
หรือ `DRY_RUN` ตามขอบเขตที่อนุมัติ

## 12. ช่องที่แก้ได้กับ Safety control ที่ล็อก

| แก้ได้ผ่าน Policy version | ล็อกและห้ามปิด |
|---|---|
| วัน/เวลาเริ่มสัปดาห์และ cutoff | Cross-Farm deny |
| Mock timezone fallback | Wrong-Tree stop |
| Operational KPI thresholds | ไม่แก้ประวัติแบบเงียบ ๆ |
| Fruit roll-up/drop semantics | Correction/Audit แบบ append-only |
| Payment event types ภายใต้ append-only model | ไม่มี public Export link |
| Role export grants ภายใน least privilege | ตรวจสิทธิ์ใหม่ก่อน Download |
| Retention/distribution พร้อม Custodian review | ห้ามข้อมูลจริงใน Local/Mock |
| Organization default/Farm override ที่อนุมัติ | ห้าม External/Production action หากยังไม่ผ่าน Gate |

ระบบต้อง Reject Policy version ที่พยายามลบ locked control แม้ผู้แก้จะเป็น Owner

## 13. Owner decision worksheet

Owner เลือก `ACCEPT`, `CHANGE` หรือ `REJECT` ทีละแถว แล้วระบุเหตุผล การเลือกในเอกสาร
Mockup ยังไม่เป็น Approval จนกว่าจะมี Decision reference ที่ชัดเจน

| Decision ID | เรื่อง | Mock recommendation | Owner decision | Owner value/reason | Custodian review |
|---|---|---|---|---|---|
| `RPD-01` | Week start/weekly cutoff/monthly cutoff | Mon 00:00 / 36h / 72h | `TBD` | `TBD` | N/A |
| `RPD-02` | Timezone fallback | Mock Bangkok; real missing = Block | `TBD` | `TBD` | N/A |
| `RPD-03` | KPI thresholds | ตามข้อ 6 | `TBD` | `TBD` | N/A |
| `RPD-04` | Fruit scope roll-up | Exclusive level per Zone | `TBD` | `TBD` | N/A |
| `RPD-05` | Dropped fruit semantics | Interval delta | `TBD` | `TBD` | N/A |
| `RPD-06` | Payment Event | Append-only + reversal | `TBD` | `TBD` | ตาม data/accounting scope |
| `RPD-07` | Export role grants | ตามข้อ 10 | `TBD` | `TBD` | Required |
| `RPD-08` | Retention/distribution | ตามข้อ 11 | `TBD` | `TBD` | Required |

## 14. Acceptance criteria และ Mock test

- [ ] Fixture โหลดซ้ำได้ด้วย deterministic seed และแสดง `SIMULATED/TEST ONLY`
- [ ] Owner แก้ Draft ได้โดยไม่กระทบ Active policy หรือ Finalized report
- [ ] Impact preview เปรียบเทียบ before/after และระบุ Farm/report ที่ได้รับผล
- [ ] Policy ที่ไม่มี reason, effectiveFrom หรือ Approval reference Active ไม่ได้
- [ ] Farm timezone หายแล้ว Pilot/Production Finalize ไม่ได้
- [ ] Fruit overlap หรือ coverage ไม่ครบไม่เกิด double count
- [ ] Dropped fruit ที่ไม่ระบุ semantics แสดง Unclassified ไม่ใช่ 0
- [ ] Payment correction สร้าง Reversal + Replacement และมี Audit ครบ
- [ ] Role ถูก revoke ก่อน Download แล้ว Export ถูก deny
- [ ] Cross-Farm, public link และการปิด locked safety control ถูก deny
- [ ] Retention/Export/Distribution เปลี่ยนโดยไม่มี Custodian review แล้ว Active ไม่ได้
- [ ] Report เดิมคง Policy version/checksum; Restatement สร้าง revision ใหม่

## 15. สถานะ Gate และสิ่งที่ต้องอนุมัติต่อไป

- Gate 6: **Passed**
- PA-1 Local/Emulator: **Passed**
- External PA-1: **NO-GO/BLOCKED**
- PA-2, Controlled Pilot, Deployment และ Production: **Not Approved**

ขั้นต่อไปคือ Owner Review `RPD-01`–`RPD-08`, Data Custodian review ในหัวข้อที่กำหนด
และบันทึก Decision/Approval แยกก่อน implementation หรือ Activation การยอมรับ Mockup
ไม่อนุญาต external resource, billing, credential, real data, device/field work,
deployment หรือ Production โดยอัตโนมัติ
