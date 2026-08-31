# AGENTS.md — Smart Durian Farm / KDOMS

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.3 |
| สถานะ | Phase 1 Complete — Gate 1 Owner Review Pending |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`, `00-Project-Management/Decision-Log.md`, `00-Project-Management/Owner-Review-Addendum_Gate-0_2026-08-31.md` |

## 1. เป้าหมาย

สร้างระบบบริหารจัดการสวนทุเรียนแบบ Multi-Farm ที่ข้อมูลของแต่ละสวนแยกจากกันอย่างชัดเจน ต้นทุเรียนทุกต้นมีตัวตนถาวรผ่านรหัสตำแหน่งและ QR และมีประวัติตลอดวงจรตั้งแต่ดูแลจนถึงขาย

## 2. ระยะที่อนุญาตในปัจจุบัน

- Gate 0 ผ่านเมื่อ 2026-08-31 และ Phase 1 Foundation ดำเนินการเสร็จแล้ว;
  สถานะปัจจุบันคือ **รอ Owner Review สำหรับ Gate 1**
- อนุญาต Local Git repository, Vite + React + TypeScript ภายใน
  `07-Source-Code/web-app`, mock data, Firebase Local Emulator และการตรวจ
  lint/typecheck/test/build/local responsive
- ห้าม Firebase production, billing, public deployment, production domain,
  credentials/service-account key และข้อมูลสวนจริง
- ห้ามเริ่ม Phase 2 จนกว่า Owner จะอนุมัติ Gate 1 ด้วยข้อความชัดเจน
- ระหว่างรอ Gate 1 อนุญาตเฉพาะการตรวจสอบหรือแก้ข้อบกพร่องของ Phase 1
  ภายในขอบเขตเดิม ห้ามเพิ่ม Phase 2 feature
- แอปจริงต้องไม่พึ่ง external runtime CDN สำหรับ offline-critical flow และ
  network-denied smoke test ต้องไม่มี console error ก่อนเสนอ Gate 1

## 3. เอกสารที่ต้องอ่านก่อนทำงาน

1. `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`
2. `01-Requirements/KDOMS_Codex_Master_Prompt_v1.1.md`
3. `04-Tag-and-QR/Tag-and-QR-Standard_v0.1.md`
4. `05-UX-UI/KDOMS_UX_UI_Knowledge_v0.1.md`
5. `00-Project-Management/Decision-Log.md`

ลำดับอำนาจเมื่อข้อมูลขัดกัน:

1. คำสั่งล่าสุดของเจ้าของโครงการ
2. Scope Knowledge เวอร์ชันล่าสุด
3. Decision Log ที่มีสถานะ Approved
4. Master Prompt
5. เอกสารประกอบอื่น

สถานะมาตรฐานของ Decision Log คือ `Proposed`, `Open`, `Approved`, `Deferred`,
`Blocked` และ `Superseded` เท่านั้น สถานะ `Confirmed` ที่เคยใช้เป็นหลักฐานเชิง
ประวัติ ไม่เท่ากับการอนุมัติอย่างเป็นทางการ และห้ามยกระดับเป็น `Approved`
โดยไม่มีข้อความยืนยันจากเจ้าของโครงการ

## 4. กติกาการทำงาน

- รายงานและเขียนเอกสารหลักเป็นภาษาไทย ใช้คำอังกฤษกำกับเมื่อช่วยลดความกำกวม
- ก่อนแก้ไข ให้ตรวจ Working Directory, สถานะไฟล์ และเอกสาร Source of Truth
- เปลี่ยนแปลงครั้งละขอบเขตเล็กและตรวจสอบผลทุกครั้ง
- อย่าสร้างข้อเท็จจริงภาคสนาม เช่น จำนวนแถว พิกัด พันธุ์ หรือปีปลูก หากยังไม่มีหลักฐาน ให้ทำเครื่องหมาย `TBD`
- แยก `ข้อยืนยัน`, `ข้อเสนอ`, `ข้อสันนิษฐาน` และ `คำถามที่ต้องตัดสินใจ` ให้ชัดเจน
- รักษาไฟล์ของผู้ใช้และการเปลี่ยนแปลงที่ไม่เกี่ยวข้อง
- ห้ามลบหรือเขียนทับข้อมูลสำคัญโดยไม่มีการอนุมัติ
- ทุก Phase ต้องมีแผน เกณฑ์ผ่าน Gate ผลทดสอบ และสรุปสิ่งที่เปลี่ยน

## 5. กฎโดเมนที่ห้ามละเมิด

### Multi-Farm

- โครงสร้างหลักคือ `Organization → Farm → Farm-scoped data`
- ทุกข้อมูลเชิงปฏิบัติการต้องมี `organizationId` และ `farmId` หรืออยู่ภายใต้เส้นทางที่บังคับขอบเขตดังกล่าว
- สิทธิ์ของผู้ใช้ในสวนหนึ่งต้องไม่เปิดเผยข้อมูลอีกสวนหนึ่ง
- ผู้ใช้คนเดียวอาจมีบทบาทต่างกันในแต่ละสวน
- Dashboard รวมหลายสวนแสดงได้เฉพาะข้อมูลที่ผู้ใช้มีสิทธิ์
- การย้ายต้น วัสดุ หรือธุรกรรมระหว่างสวนอยู่นอก MVP จนกว่าจะอนุมัติเพิ่ม

### Tree identity

- ป้ายประจำตำแหน่งปลูกเป็นรหัสถาวรและไม่ถูกนำกลับไปใช้กับตำแหน่งอื่น
- Human-readable Tag Code ใช้รูปแบบข้อเสนอ
  `{organizationCode}-{farmSequence}-{zone}-{row}-{tree}` เช่น
  `KGL-F01-Z01-R03-T017` และต้องไม่ซ้ำภายใน namespace ของ Organization/Farm
- `organizationId`, `farmId` และ `positionId` ภายในระบบเป็น globally unique
  opaque IDs; Human-readable code ไม่ใช่ primary security boundary
- ต้นที่ปลูกทดแทนใช้ตำแหน่งเดิม แต่เพิ่ม `plantingCycle`
- QR ใช้ configurable permanent route `/t/{opaquePositionId}` ไม่เก็บข้อมูลโรค
  ยา หรือข้อมูลที่เปลี่ยนแปลงได้ และไม่ใช้แทน authorization
- GPS ใช้นำทางคร่าว ๆ ไม่ใช้ยืนยันต้นเพียงอย่างเดียว
- การยืนยันงานรายต้นใช้ Farm + Zone + Row + Position + QR

### Audit and offline

- เหตุการณ์สำคัญต้องมีผู้กระทำ เวลา สวน ต้นหรือกลุ่มเป้าหมาย และหลักฐานที่เกี่ยวข้อง
- งานภาคสนามต้องรองรับสัญญาณไม่เสถียรและแสดงสถานะ Pending/Syncing/Synced/Conflict
- การส่งข้อมูลซ้ำต้องออกแบบให้ idempotent
- ห้ามแก้ประวัติแบบเงียบ ๆ; ใช้ correction event หรือเก็บ before/after ใน audit log

## 6. คุณภาพและความปลอดภัย

- ใช้ TypeScript strict mode เมื่อเริ่มเขียนแอป
- Validation ต้องมีทั้งฝั่งผู้ใช้และฝั่งที่เชื่อถือได้
- Firebase Security Rules ต้องมี emulator tests โดยเฉพาะ Cross-Farm denial
- ห้ามเก็บ secret, service-account key หรือข้อมูลส่วนบุคคลจริงไว้ใน repository
- ใช้ข้อมูลจำลองในตัวอย่าง UX และการทดสอบ
- รูปภาพต้องมีนโยบายขนาดไฟล์ การบีบอัด และสิทธิ์เข้าถึงก่อนใช้จริง

## 7. Definition of Done สำหรับงานเอกสาร

- ระบุเวอร์ชัน สถานะ เจ้าของ และวันที่ปรับปรุง
- เชื่อมโยงกับ Source of Truth ที่เกี่ยวข้อง
- ไม่มีค่าภาคสนามที่แต่งขึ้นโดยไม่ระบุว่าเป็นตัวอย่าง
- มี Acceptance Criteria หรือคำถามที่ต้องตัดสินใจ
- ตรวจคำศัพท์ รหัส Farm/Tree และขอบเขต Multi-Farm ให้สอดคล้องกัน
- อัปเดต Decision Log เมื่อมีการตัดสินใจใหม่

## 8. รูปแบบรายงานเมื่อจบงาน

รายงานสั้น ๆ เป็นภาษาไทยโดยระบุ:

1. ผลลัพธ์ที่ทำเสร็จ
2. ไฟล์ที่สร้างหรือแก้ไข
3. การตรวจสอบที่ทำ
4. ความเสี่ยงหรือคำถามที่ยังเปิด
5. Gate ปัจจุบันและขั้นตอนที่ต้องขออนุมัติต่อไป
