# รายงานตรวจ Owner-selected PA-1 Mock Substitute

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | **PASSED — Owner Input Populated from Mock; PA-1 NOT APPROVED** |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| ขอบเขต | ตรวจการแมปข้อมูลใน repository เท่านั้น; no deployment/external action |
| Source of Truth | `AGENTS.md` v2.9, Development Mock Data & Pilot Knowledge v1.0.2, DEC-027, DEC-031, DEC-035, Owner Mockup Input Pack v1.0, PA-1 Owner Actual Input Form v1.1 |

## 1. คำสั่ง Owner ที่นำมาปฏิบัติ

Owner สั่งให้นำค่าจำลองจาก Mockup Data มากรอกช่องค่าจริงของแบบฟอร์ม PA-1
ระบบจึงบันทึกเป็น **Owner-directed Mock Substitute** เพื่อให้กรอกครบโดยไม่อ้างว่า
เป็น resource, ค่าใช้จ่าย, URL, ผู้รับผิดชอบ หรือ Candidate ภายนอกที่มีอยู่จริง

## 2. หลักฐานที่ตรวจ

| รายการ | ค่า |
|---|---|
| Mock source | `09-Deployment/phase7-owner-mockup-input-v1.0.json` |
| Mock SHA-256 | `6BB326C87D3DEE8C3B8B16C21E945FE78A15FE8F3866D8C1AF8898ED7B10606B` |
| Owner selection record | `09-Deployment/phase7-pa1-owner-selected-mock-substitute-v1.0.json` |
| Selection SHA-256 | `C8EC974C6979C76F9259537464AF5B881015D373FAB13AD643F68BCAB6FD01B5` |
| Validator | `09-Deployment/validate-phase7-pa1-owner-selection.ps1` |
| Selection mode | `OWNER_DIRECTED_MOCK_SUBSTITUTE` |
| Classification | `OWNER-DIRECTED MOCK SUBSTITUTE / SIMULATED/TEST ONLY` |

## 3. ผลตรวจ

| หัวข้อ | ผล |
|---|---|
| JSON parse/schema | PASS |
| Source Pack ID, seed และ SHA-256 ตรงกัน | PASS |
| PA-1 fields 22 ช่องตรงกับ deterministic Mock source | PASS |
| Billing ปิดและ cost 0 ระบุว่าไม่ใช่ประมาณการจริง | PASS |
| URL อยู่บน `.example.invalid` | PASS |
| Candidate เป็น `NOT_FROZEN_NOT_DEPLOYABLE` | PASS |
| PA-1/PA-2/PA-3 ยัง `NOT_APPROVED` | PASS |
| Deployment/external/Production/real data/device/field flags เป็น `false` | PASS |
| ไม่พบ private key หรือ Google API key-like value | PASS |

## 4. ผลลัพธ์เชิง Gate

**OWNER INPUT COMPLETENESS: PASS VIA MOCK SUBSTITUTE**

**PA-1 APPROVAL: NOT APPROVED**

การกรอกครบช่วยให้ Owner ตรวจรูปแบบและนโยบายได้ แต่ยังไม่ทำให้ `.invalid` URL,
รหัส `SIM-*`, ค่าใช้จ่าย 0 หรือ Candidate จำลองใช้ Deploy ได้

## 5. ขั้นตอนถัดไป

1. หากต้องการเดินหน้าต่อแบบ local/emulator rehearsal ให้ Owner ส่งข้อความอนุมัติ
   PA-1 ที่จำกัดเฉพาะ Mock/local และไม่อนุญาต external resource
2. หากต้องการ Private Pilot deployment จริง ต้องแทนค่า provider/project/region,
   budget, URL, owner mapping และ frozen Candidate แล้วขออนุมัติ External Action
3. PA-2 ยังต้องขอแยกก่อนข้อมูลจริง อุปกรณ์จริง QR/ป้ายจริง หรือการลงพื้นที่
