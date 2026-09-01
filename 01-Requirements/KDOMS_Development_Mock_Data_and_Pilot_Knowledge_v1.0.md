# KDOMS Development, Mock Data & Pilot Knowledge v1.0.6

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0.6 |
| สถานะ | Approved — Mock-first + DEC-046 Limited Tree Register Exception |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| ขอบเขต | Development data, engineering validation, Staging/Pilot Candidate, Controlled Pilot และ Production readiness |
| Source of Truth | คำสั่งล่าสุดของ Project Owner, `AGENTS.md`, Owner Addendum Development/Mock/Pilot Timing, `00-Project-Management/Owner-Review-Addendum_Tree-Register-Operational-Data-Entry_2026-09-01.md`, `01-Requirements/KDOMS_Farm_Profile_and_Management_Knowledge_v0.1.md`, `00-Project-Management/Decision-Log.md` (DEC-030, DEC-034, DEC-036, DEC-037, DEC-043, DEC-046), PA-1 Local Rehearsal Report v1.1 |

## 1. คำตัดสินหลัก

การพัฒนา KDOMS ใช้แนวทาง **Mock-first**: สร้างแอปและทดสอบเชิงวิศวกรรมด้วย
ข้อมูลจำลองที่ออกแบบอย่างเป็นระบบก่อน การไม่มีหลักฐานจากอุปกรณ์จริงหรือพื้นที่จริง
ไม่ใช่เหตุผลให้หยุด Phase การพัฒนา

Physical Device/Field Validation ให้ดำเนินการเมื่อแอปมีความครบถ้วนเพียงพอและถูก
Deploy เป็นเวอร์ชันทดลองในสภาพแวดล้อม Controlled Pilot ที่จำกัดสิทธิ์แล้ว จากนั้น
จึงใช้เครื่องจริง เครือข่ายจริง และข้อมูลจริงแบบจำกัดตามที่ Owner อนุมัติ

Physical Device/Field Validation ต้องผ่านก่อน Production rollout, การผลิตป้ายถาวร
หรือการขยายการใช้งานเชิงปฏิบัติการ แต่ไม่ใช่เงื่อนไขก่อนสร้างฟังก์ชัน Phase 4–6

DEC-046 เป็นข้อยกเว้นแบบจำกัดจาก baseline ข้างต้น: Owner อนุมัติให้ Tree Register
สร้าง/แก้ข้อมูลตำแหน่งปลูกภาคสนามจริงได้เฉพาะเมื่อ runtime เป็น Firebase Production
และ Farm ถูก trusted provisioning เป็น `classification=OPERATIONAL`,
`isMock=false` เท่านั้น ข้อยกเว้นนี้ไม่อนุมัติ deployment ของ source รุ่นใหม่,
Storage/รูปจริง, QR/ป้ายถาวร, PA-2, Controlled Pilot หรือข้อมูลจริงในโมดูลอื่น

## 2. ลำดับสภาพแวดล้อมและข้อมูล

| ระยะ | สภาพแวดล้อม | ข้อมูล | หลักฐานที่คาดหวัง |
|---|---|---|---|
| Development | Local, CI, Firebase Emulator, browser simulation | `SIMULATED/TEST ONLY` | unit/component/rules/emulator/E2E, responsive, offline simulation, security denial |
| Staging / Pilot Candidate | Private, access-controlled, แยกจาก Production | Mock/Synthetic เป็นค่าเริ่มต้น | end-to-end integration, deployment readiness, backup/restore rehearsal, observability และ rollback |
| Limited Operational Tree Register (DEC-046) | Firebase Production หลัง source deployment ได้รับอนุมัติแยก | เฉพาะข้อมูลทะเบียนต้นที่จำเป็นใน Farm `OPERATIONAL` | Farm membership, classification consistency, Tag no-reuse, audit, Rules/Cross-Farm denial |
| Controlled Operational Pilot | Pilot deployment ที่ Owner อนุมัติ | ข้อมูลจริงแบบจำกัดและจำเป็นเท่านั้น | Android/iPhone, camera/QR, network transition, field usability, topology/tag และผู้ใช้จริง |
| Production Rollout | Production ที่ผ่าน Gate | ข้อมูลใช้งานจริงตาม policy | monitoring, operations, retention/backup/privacy และ evidence จาก Pilot ที่ผ่าน |

Staging/Pilot Candidate deployment, Firebase project, hosting, billing, credentials
และ SMS จริงต้องได้รับอนุมัติแยกตาม Gate การใช้ข้อมูลจริงนอก DEC-046 ยังต้องขอ
อนุมัติแยก เอกสารนี้ไม่ใช่คำสั่ง Deploy หรือเปิดข้อมูลจริงในโมดูลอื่น

## 3. Mock Data Pack ที่ต้องดูแล

Mock Data Pack ต้อง versioned, deterministic, resettable และสร้างซ้ำได้ โดยแต่ละ
scenario มี label ชัดเจนและไม่ปะปนกับข้อมูลจริง อย่างน้อยต้องครอบคลุม:

1. Organization และ Farm อย่างน้อย 2 สวนที่แยกข้อมูลกัน พร้อม Farm Profile
   แบบ deterministic โดยอย่างน้อยมี Active 2, Suspended 1 และ Archived 1 สวน
2. ผู้ใช้ 7 canonical roles และผู้ใช้ที่มี role ต่างกันในแต่ละ Farm
3. Zone, Row, Position, Tree และหลาย `plantingCycle`
4. QR/manual: match, mismatch, unknown, damaged, cached และ wrong-Farm
5. Work Order รายต้น รายแถว รายโซน และ Tree Set พร้อม exception
6. Work Order พร้อมรูปประกอบจากผู้มอบหมาย, Worker Report พร้อมรูปก่อน–หลัง,
   Manager Verification, Care Event และ Disease Incident
7. Pending, Syncing, Synced, Conflict และ retry หลัง reconnect
8. idempotency, duplicate submission, correction event และ audit before/after
9. same-farm allow, revoked-role/member deny, forged payload และ Cross-Farm deny
10. empty, loading, error, large-list และ boundary-value states ที่จำเป็นต่อ UX
11. Farm create/profile update/suspend/reactivate/archive พร้อม Audit, idempotency,
    duplicate Farm Code denial และการหยุด Archive เมื่อมีงานเปิด/Pending

ห้ามใช้ชื่อบุคคล เบอร์โทร พิกัด topology ข้อมูลต้น ภาพ หรือ URL Production จริงใน
repository, fixture หรือ Emulator ค่าเลียนแบบต้องติดป้าย `SIMULATED/TEST ONLY`
และใช้ domain เช่น `example.invalid` เมื่อจำเป็นต้องมี URL ตัวอย่าง

Mock photo ใช้ placeholder หรือไฟล์จำลองที่ไม่มีบุคคล/สวนจริง รูปประกอบใบงานและ
รูปหลักฐานส่งงานต้องทดสอบแยก phase, role, Farm scope, upload failure, retry และ
การไม่ปะปนกัน โดย simulation ไม่ใช่หลักฐานจากกล้องหรือภาคสนามจริง

ก่อนอัปโหลด Work photo ไป non-Mock Storage ต้อง re-encode เป็น WebP,
ด้านยาวไม่เกิน 1,600 px, ขนาดไม่เกิน 5 MB และไม่ส่ง EXIF/GPS หาก
เตรียมภาพไม่ได้ต้อง fail closed หลัง retry แบบจำกัด ความล้มเหลวหรือ object
ที่ยังไม่ผูก Work ต้องสร้าง Photo Recovery/Orphan record แบบ Farm/Work-scoped
และ auditable โดยอัตโนมัติ

ก่อน Pilot ต้องมี Durable binary queue ที่คง source Blob และ Work/Report draft
ใน IndexedDB ตาม `organizationId + farmId + actorUserId` เพื่อ Retry ต่อหลังปิดหรือ
reload แอปได้ ใช้ commit idempotency key เดิม, checkpoint รูปที่อัปโหลดแล้ว และลบ
Queue เมื่อ commit สำเร็จ/logout/หมดอายุไม่เกิน 7 วัน ห้ามเปลี่ยน recovery เป็น
`UPLOADED` จาก metadata อย่างเดียวโดยไม่มี binary upload และ Work re-link จริง

Candidate `KDOMS-PC-SIM-20260831-02` ผ่าน local desktop browser rehearsal แบบ
upload interruption → Reload → IndexedDB batch ยังอยู่ → Retry upload/re-link/commit
→ Queue cleanup แล้ว หลักฐานนี้ยืนยัน local browser implementation เท่านั้น ไม่แทน
Android/iPhone close/background/PWA resume/quota และไม่ใช่ Physical Device evidence

การลบ Orphan และบังคับ retention จริงเป็นหน้าที่ server-side lifecycle worker
ที่ต้องตรวจ Work reference, Farm scope, approved cutoff, separation of duties และ
disposal audit ก่อนลบ Client ทำได้เฉพาะ queue/retry และ request/status; ห้ามใช้
client clock หรือ client role เป็น authority สำหรับ lifecycle deletion

HEIC/HEIF ต้องทดสอบกับ iPhone model/OS/browser/PWA ที่ Owner เลือกจริง หาก native
decode/re-encode ไม่ได้ ให้ fail closed และใช้ fallback ตามลำดับ: ตั้งกล้องเป็น
Most Compatible/JPEG แล้วถ่ายใหม่ หรือใช้ตัวแปลงบนอุปกรณ์ที่ผ่าน security/privacy/
metadata test ห้ามอัปโหลด HEIC ต้นฉบับหรือใช้ cloud converter ที่ไม่ได้อนุมัติ

## 4. Engineering Gate กับ Pilot Gate

### Engineering/Phase Gate

ใช้ตัดสินคุณภาพของสิ่งที่สร้างในแต่ละ Phase จาก automated/local/emulator/browser
evidence, security invariants, build quality และเอกสารที่เกี่ยวข้อง Phase ถัดไปยังต้อง
รอ Owner อนุมัติ Gate ตามลำดับ แต่ไม่ต้องรออุปกรณ์หรือภาคสนามจริง

### Pilot Readiness

หลังฟังก์ชันในขอบเขต Pilot ครบและ Engineering Gates ที่กำหนดผ่าน ให้จัดเตรียม
Pilot Candidate และขออนุมัติ environment, ผู้เข้าร่วม, cohort, real-data controls,
test-only QR/tag, rollback และ stop conditions ก่อนเริ่ม Controlled Pilot

### Production Readiness

ก่อน Production rollout หรือขยายใช้งาน ต้องมีหลักฐาน Physical Device/Field
Validation ที่ผ่าน แก้ defect จาก Pilot แล้ว และได้รับ Owner approval ชัดเจน

## 5. การใช้ข้อมูลจริงใน Controlled Pilot

ก่อนรับข้อมูลจริง ต้องอนุมัติอย่างน้อย:

- วัตถุประสงค์และข้อมูลขั้นต่ำที่จำเป็น
- ผู้มีสิทธิ์เข้าถึงและ Farm boundary
- consent/notice เมื่อมีข้อมูลบุคคลหรือภาพที่ระบุตัวบุคคลได้
- retention, backup, restore, export และ disposal
- Data Custodian, Backup/Lifecycle operator กับ independent approver,
  destination, region และ encryption/key custody
- วิธีแยก Pilot จาก Development/Mock Data
- rollback, incident response และวิธีแก้/ย้ายข้อมูลหลัง Pilot
- evidence storage และการไม่ commit ข้อมูลจริงกลับเข้า repository

### 5.1 Limited Operational Tree Register ตาม DEC-046

ก่อนเริ่มกรอกข้อมูลทะเบียนต้นจริง ต้องมีครบอย่างน้อย:

- Farm ที่ trusted provisioning เป็น `classification=OPERATIONAL` และ
  `exampleData=false`; หน้าเพิ่มสวนตาม DEC-043 ยังคงสร้าง Farm จำลอง
- Organization/Farm membership ของ Owner/Manager ที่ตรวจได้
- Farm Code, Zone, Row, ลำดับตำแหน่ง และทิศทางการนับที่ Owner ตรวจแล้ว;
  ค่าไม่ทราบใช้ `TBD` และห้ามสร้างข้อเท็จจริงแทน
- UI แสดงบริบทสวนและสถานะ “ข้อมูลทะเบียนต้นภาคสนาม” อย่างชัดเจน
- Position, Planting Cycle, Event, Tag index และ Route มี classification ตรงกัน
- รูปจริง/Storage และ QR/ป้ายถาวรยังปิดไว้จนมี approval แยก

## 6. สิ่งที่ยังถือว่า Deferred

- รุ่น/OS/browser ของ Android และ iPhone จริง
- camera permission, autofocus, แสง, ระยะ และการสะท้อนของ QR
- LAN/Hotspot และ Online → Offline → Online จริง
- topology, Zone/Row, ทิศทางนับ, tag placement และข้อมูลต้นจริงที่ Owner ยังไม่
  ให้/ยืนยัน; DEC-046 อนุญาตบันทึกเฉพาะค่าที่ตรวจแล้ว ไม่ทำให้ค่า `TBD` เป็น Passed
- usability ของผู้ใช้จริงและวิธีทำงานภาคสนาม
- Production QR domain, permanent tag และการขยายจำนวนต้น

รายการ Deferred ไม่ block การเขียนแอป แต่ต้องไม่ถูกอ้างว่า `Passed`

## 7. Stop conditions

หยุดส่วนที่เกี่ยวข้อง เก็บหลักฐาน แก้ไข และทดสอบซ้ำเมื่อพบ Cross-Farm disclosure,
wrong-tree action, duplicate critical event, corrupt history, secret/credential leak,
ข้อมูลจริงเข้า repository/Emulator โดยไม่ได้รับอนุมัติ หรือความเสี่ยงทางกายภาพ

## 8. Acceptance criteria ของ Knowledge นี้

- แผน Phase ไม่ใช้ Physical/Field evidence เป็นตัวบล็อกการสร้างฟังก์ชัน
- ทุก Development test ใช้ Mock Data Pack ที่ระบุว่าเป็นข้อมูลจำลอง
- ไม่มีผล simulation ถูกยกระดับเป็น physical/field evidence
- Controlled Pilot เกิดหลัง Pilot Candidate deployment และมี approval boundary
- Physical/Field Validation ผ่านก่อน Production/permanent tags/scale-up
- การแก้ timing ไม่ข้าม Owner approval ของ Engineering Gate หรือ deployment
- การอัปโหลดรูปจริงต้องมีนโยบาย retention/backup/export ที่ Owner อนุมัติ
  และมี Android/iPhone evidence ก่อนอ้างว่า Physical Device Validation ผ่าน
- Durable binary queue ต้องผ่าน close/reload/resume, TTL/logout cleanup,
  no-duplicate และ Cross-Farm denial บน Android/iPhone
- server lifecycle worker ใช้ `DRY_RUN` ก่อนเสมอ และเปิด `ENFORCE` ได้เมื่อ
  PA-1/PA-2 อนุมัติ retention, orphan grace, RPO/RTO, roles, resource และ key custody
- Farm Profile Mockup ต้อง reset ได้ ติดป้าย `SIMULATED/TEST ONLY` และไม่มี
  Hard delete; การใช้ข้อมูลสวนจริงยังต้องรอ approval ด้าน environment/real data
- Operational Tree Register ต้อง fail closed: `exampleData=false` ใช้ได้เฉพาะ
  Firebase Production + Farm `OPERATIONAL`; Mock/Emulator/Farm จำลองต้องเป็น
  `exampleData=true` และห้ามเปลี่ยน classification ด้วย client payload
