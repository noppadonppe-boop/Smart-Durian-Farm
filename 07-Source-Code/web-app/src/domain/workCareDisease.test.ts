import { describe, expect, it } from 'vitest'

import type { AuthenticatedIdentity, FarmAccess } from './farm'
import {
  assertWorkAction,
  canAssessDisease,
  nextDiseasePhotoState,
  specialistApprovalForCare,
  validateDiseaseAssessment,
  validateDiseaseDraft,
  validateDiseasePhotoMockDraft,
  validateTreatmentWorkOrderInput,
  validateWorkInstructionPhotos,
  validateWorkReport,
  validateWorkTarget,
  workOrderStatuses,
  type WorkAction,
  type WorkMutationContext,
  type WorkOrderRecord,
  type WorkOrderStatus,
  type WorkReportInput,
  type DiseaseIncidentRecord,
  type DiseasePhotoMockEvidence,
} from './workCareDisease'

const positionA = 'pos_demo_a01f783bc219'
const positionB = 'pos_demo_a02c914ed730'

const identity = (userId: string): AuthenticatedIdentity => ({
  userId,
  displayName: `ผู้ใช้ ${userId}`,
  maskedPhone: '+1•••••••001',
  source: 'mock',
})

const access = (role: FarmAccess['role'], farmId = 'farm_demo_north_01'): FarmAccess => ({
  organizationId: 'org_demo_kdoms_01',
  organizationName: 'องค์กรสาธิต',
  organizationCode: 'DEMO',
  farmId,
  farmCode: farmId === 'farm_demo_north_01' ? 'DEMO-F01' : 'DEMO-F02',
  farmSequence: farmId === 'farm_demo_north_01' ? 'F01' : 'F02',
  farmName: 'สวนสาธิต',
  farmStatus: 'ACTIVE',
  membershipStatus: 'ACTIVE',
  role,
  isOrganizationOwner: role === 'ORG_OWNER',
  isMock: true,
})

const ownerContext: WorkMutationContext = {
  actor: identity('user_demo_owner_01'),
  farm: access('ORG_OWNER'),
}
const workerContext: WorkMutationContext = {
  actor: identity('user_demo_worker_02'),
  farm: access('WORKER'),
}
const agronomistContext: WorkMutationContext = {
  actor: identity('user_demo_agronomist_05'),
  farm: access('AGRONOMIST'),
}

function report(): WorkReportInput {
  return {
    notes: 'รายงานจำลอง',
    targetConfirmedPositionId: positionA,
    materials: [{ materialName: 'วัสดุทดสอบ', quantity: 1, unit: 'ชุด' }],
    photos: [
      {
        photoId: 'photo_before',
        phase: 'BEFORE',
        uploadState: 'UPLOADED',
        storagePath: 'organizations/org_demo/farms/farm_demo/workEvidence/work_01/before.jpg',
        note: 'ภาพจำลองก่อนทำงาน',
      },
      {
        photoId: 'photo_after',
        phase: 'AFTER',
        uploadState: 'UPLOADED',
        storagePath: 'organizations/org_demo/farms/farm_demo/workEvidence/work_01/after.jpg',
        note: 'ภาพจำลองหลังทำงาน',
      },
    ],
    completions: [{ positionId: positionA, status: 'SUCCESS', exceptionReason: '' }],
  }
}

function order(status: WorkOrderStatus, isPaused = false): WorkOrderRecord {
  return {
    organizationId: 'org_demo_kdoms_01',
    farmId: 'farm_demo_north_01',
    workOrderId: 'work_demo_000000000001',
    title: 'ตรวจต้นจำลอง',
    description: 'EXAMPLE DATA ONLY',
    category: 'GENERAL',
    careType: null,
    priority: 'NORMAL',
    target: {
      kind: 'TREE',
      zoneCode: 'Z01',
      rowCode: 'R01',
      positionIds: [positionA],
    },
    dueDate: '2026-09-01',
    assignedUserId: 'user_demo_worker_02',
    status,
    isPaused,
    instructionPhotos: [],
    report:
      ['IN_PROGRESS', 'SUBMITTED', 'VERIFIED', 'REJECTED', 'REWORK', 'CLOSED'].includes(status)
        ? {
            ...report(),
            reportId: 'report_demo_01',
            submittedBy: 'user_demo_worker_02',
            submittedAtLabel: 'เวลาจำลอง',
            version: 1,
          }
        : null,
    targetConfirmedPositionId: status === 'DRAFT' || status === 'ASSIGNED' ? null : positionA,
    rejectionReason: '',
    reworkReason: '',
    sourceDiseaseIncidentId: null,
    version: 1,
    exampleData: true,
    createdBy: 'user_demo_owner_01',
    createdAtLabel: 'เวลาจำลอง',
    audit: [],
  }
}

describe('Phase 4 Work target and state policy', () => {
  it('validates Tree, Row, Zone and Tree Set targets with opaque IDs', () => {
    expect(
      validateWorkTarget({ kind: 'TREE', zoneCode: 'Z01', rowCode: 'R01', positionIds: [positionA] }),
    ).toBeTruthy()
    expect(
      validateWorkTarget({ kind: 'ROW', zoneCode: 'Z01', rowCode: 'R01', positionIds: [positionA, positionB] }),
    ).toBeTruthy()
    expect(
      validateWorkTarget({ kind: 'ZONE', zoneCode: 'Z01', rowCode: null, positionIds: [positionA, positionB] }),
    ).toBeTruthy()
    expect(
      validateWorkTarget({ kind: 'TREE_SET', zoneCode: 'Z01', rowCode: null, positionIds: [positionA, positionB] }),
    ).toBeTruthy()
    expect(
      validateWorkTarget({
        kind: 'TREE_SET', zoneCode: 'Z01', zoneCodes: ['Z01', 'Z02'], rowCode: null,
        positionIds: [positionA, positionB],
      }).zoneCodes,
    ).toEqual(['Z01', 'Z02'])
    expect(() =>
      validateWorkTarget({ kind: 'TREE', zoneCode: 'Z01', rowCode: 'R01', positionIds: [positionA, positionB] }),
    ).toThrow(/Position เดียว/u)
  })

  const cases: readonly {
    action: WorkAction
    actor: WorkMutationContext
    allowed: readonly WorkOrderStatus[]
    paused?: boolean
  }[] = [
    { action: { type: 'ASSIGN', assignedUserId: 'user_demo_worker_02' }, actor: ownerContext, allowed: ['DRAFT'] },
    { action: { type: 'ACCEPT' }, actor: workerContext, allowed: ['ASSIGNED'] },
    { action: { type: 'START' }, actor: workerContext, allowed: ['ACCEPTED', 'REWORK'] },
    { action: { type: 'PAUSE' }, actor: workerContext, allowed: ['IN_PROGRESS'], paused: false },
    { action: { type: 'RESUME' }, actor: workerContext, allowed: ['IN_PROGRESS'], paused: true },
    { action: { type: 'SUBMIT' }, actor: workerContext, allowed: ['IN_PROGRESS'], paused: false },
    { action: { type: 'VERIFY' }, actor: ownerContext, allowed: ['SUBMITTED'] },
    { action: { type: 'REJECT', reason: 'หลักฐานไม่ครบ' }, actor: ownerContext, allowed: ['SUBMITTED'] },
    { action: { type: 'REQUEST_REWORK', reason: 'ถ่ายภาพใหม่' }, actor: ownerContext, allowed: ['SUBMITTED'] },
    { action: { type: 'CLOSE' }, actor: ownerContext, allowed: ['VERIFIED', 'REJECTED'] },
  ]

  cases.forEach(({ action, actor, allowed, paused }) => {
    it(`allows only documented statuses for ${action.type}`, () => {
      workOrderStatuses.forEach((status) => {
        const candidate = order(status, paused ?? false)
        const execute = () => assertWorkAction(candidate, actor, action)
        if (allowed.includes(status)) expect(execute).not.toThrow()
        else expect(execute).toThrow()
      })
    })
  })

  it('denies cross-farm work actions and wrong assignees', () => {
    expect(() =>
      assertWorkAction(order('ASSIGNED'), {
        actor: workerContext.actor,
        farm: access('WORKER', 'farm_demo_south_02'),
      }, { type: 'ACCEPT' }),
    ).toThrow(/ข้ามสวน/u)
    expect(() =>
      assertWorkAction(order('ASSIGNED'), {
        actor: identity('different_worker'),
        farm: access('WORKER'),
      }, { type: 'ACCEPT' }),
    ).toThrow(/ไม่ได้มอบหมาย/u)
  })
})

function diseaseIncident(): DiseaseIncidentRecord {
  return {
    organizationId: ownerContext.farm.organizationId,
    farmId: ownerContext.farm.farmId,
    incidentId: 'disease_demo_000000000001',
    positionId: positionA,
    observedSymptom: 'SIMULATED/TEST ONLY — อาการตัวอย่าง',
    severity: 'HIGH',
    suspectedDiagnosis: 'ข้อสันนิษฐานจำลอง',
    followUpDate: '2026-09-05',
    status: 'TREATING',
    confirmedDiagnosis: 'ผลยืนยันจำลอง',
    treatmentPlan: 'ขั้นตอนรักษาจำลองจากผู้เชี่ยวชาญ',
    specialistApprovalStatus: 'APPROVED',
    outcome: '',
    photos: [],
    treatmentWorkOrderId: null,
    version: 2,
    exampleData: true,
    reportedBy: workerContext.actor.userId,
    createdAtLabel: 'เวลาจำลอง',
    audit: [],
  }
}

describe('Disease photo mock and treatment work policy', () => {
  it('accepts only synthetic photo metadata within the 5 MB boundary', () => {
    const incident = diseaseIncident()
    expect(validateDiseasePhotoMockDraft(workerContext, incident, {
      placeholderKind: 'LEAF_SPOT',
      mimeType: 'image/webp',
      sizeBytes: 512_000,
      note: 'SIMULATED/TEST ONLY',
    })).toMatchObject({ mimeType: 'image/webp', sizeBytes: 512_000 })
    expect(() => validateDiseasePhotoMockDraft(workerContext, incident, {
      placeholderKind: 'LEAF_SPOT', mimeType: 'image/png',
      sizeBytes: 5 * 1024 * 1024 + 1, note: 'SIMULATED/TEST ONLY',
    })).toThrow(/5 MB/u)
  })

  it('moves Pending through Uploading, Failed, Retry and Uploaded deterministically', () => {
    const photo: DiseasePhotoMockEvidence = {
      photoId: 'diseasephoto_demo_00000001',
      organizationId: ownerContext.farm.organizationId,
      farmId: ownerContext.farm.farmId,
      incidentId: 'disease_demo_000000000001',
      positionId: positionA,
      placeholderKind: 'LEAF_SPOT',
      mimeType: 'image/webp',
      sizeBytes: 512_000,
      note: 'SIMULATED/TEST ONLY',
      source: 'SYNTHETIC_PLACEHOLDER',
      classification: 'SIMULATED/TEST ONLY',
      uploadState: 'PENDING',
      retryCount: 0,
      lastError: '',
      containsExifOrGps: false,
      externalStorage: false,
      lifecycleMode: 'DRY_RUN',
      version: 1,
      createdBy: workerContext.actor.userId,
      createdAtLabel: 'เวลาจำลอง',
    }
    Object.assign(photo, nextDiseasePhotoState(photo, 'START_UPLOAD'))
    expect(photo.uploadState).toBe('UPLOADING')
    Object.assign(photo, nextDiseasePhotoState(photo, 'MARK_FAILED'))
    expect(photo.uploadState).toBe('FAILED')
    Object.assign(photo, nextDiseasePhotoState(photo, 'RETRY'))
    expect(photo.retryCount).toBe(1)
    Object.assign(photo, nextDiseasePhotoState(photo, 'MARK_UPLOADED'))
    expect(photo.uploadState).toBe('UPLOADED')
    expect(photo.lifecycleMode).toBe('DRY_RUN')
  })

  it('requires Agronomist approval and an exact incident tree for treatment work', () => {
    const incident = diseaseIncident()
    const input = {
      positionId: positionA,
      zoneCode: 'Z01',
      rowCode: 'R01',
      assignedUserId: workerContext.actor.userId,
      dueDate: '2026-09-06',
    }
    expect(validateTreatmentWorkOrderInput(agronomistContext, incident, input)).toEqual(input)
    expect(() => validateTreatmentWorkOrderInput(workerContext, incident, input)).toThrow(/Agronomist/u)
    expect(() => validateTreatmentWorkOrderInput(agronomistContext, incident, {
      ...input, positionId: positionB,
    })).toThrow(/Wrong-Tree/u)
  })
})

describe('Phase 4 report, photo and disease policy', () => {
  it('allows the Work Order creator to attach up to three uploaded instruction photos while draft', () => {
    const draftOrder = order('DRAFT')
    draftOrder.createdBy = ownerContext.actor.userId
    const instructionPhoto = {
      photoId: 'photo_instruction_demo_000001',
      phase: 'INSTRUCTION' as const,
      uploadState: 'UPLOADED' as const,
      storagePath: 'organizations/org_demo_kdoms_01/farms/farm_demo_north_01/workEvidence/work_demo_000000000001/photo_instruction_demo_000001',
      note: 'รูปประกอบจำลอง',
    }
    expect(validateWorkInstructionPhotos(draftOrder, ownerContext, [instructionPhoto])).toHaveLength(1)
    expect(() => validateWorkInstructionPhotos(
      { ...draftOrder, status: 'ASSIGNED' },
      ownerContext,
      [instructionPhoto],
    )).toThrow(/ยังเป็นร่าง/u)
    expect(() => validateWorkInstructionPhotos(
      draftOrder,
      workerContext,
      [instructionPhoto],
    )).toThrow(/สิทธิ์/u)
  })

  it('requires the exact tree confirmation before saving a single-tree report', () => {
    const input = report()
    input.targetConfirmedPositionId = positionB
    expect(() => validateWorkReport(order('IN_PROGRESS'), input)).toThrow(/ต้นเป้าหมาย/u)
  })

  it('requires every group target and a reason for each exception', () => {
    const group = order('IN_PROGRESS')
    group.target = {
      kind: 'TREE_SET',
      zoneCode: 'Z01',
      rowCode: null,
      positionIds: [positionA, positionB],
    }
    const incomplete = report()
    expect(() => validateWorkReport(group, incomplete)).toThrow(/ครบทุกต้น/u)

    const exception = report()
    exception.targetConfirmedPositionId = null
    exception.completions = [
      { positionId: positionA, status: 'SUCCESS', exceptionReason: '' },
      { positionId: positionB, status: 'EXCEPTION', exceptionReason: '' },
    ]
    expect(() => validateWorkReport(group, exception)).toThrow(/เหตุผล exception/u)
    exception.completions = exception.completions.map((completion) =>
      completion.positionId === positionB
        ? {
            positionId: positionB,
            status: 'EXCEPTION' as const,
            exceptionReason: 'ต้นจำลองเข้าถึงไม่ได้',
          }
        : completion,
    )
    expect(validateWorkReport(group, exception).completions).toHaveLength(2)
  })

  it('blocks a partial photo failure instead of submitting partial evidence', () => {
    const input = report()
    input.photos = input.photos.map((photo) =>
      photo.phase === 'AFTER' ? { ...photo, uploadState: 'FAILED' as const } : photo,
    )
    expect(() => validateWorkReport(order('IN_PROGRESS'), input)).toThrow(/อัปโหลดไม่สำเร็จ/u)
  })

  it('normalizes before/after order and rejects duplicate photo storage paths', () => {
    const reversed = report()
    reversed.photos = [...reversed.photos].reverse()
    expect(validateWorkReport(order('IN_PROGRESS'), reversed).photos.map((photo) => photo.phase))
      .toEqual(['BEFORE', 'AFTER'])

    const duplicate = report()
    duplicate.photos = duplicate.photos.map((photo) => ({
      ...photo,
      storagePath: 'organizations/org_demo/farms/farm_demo/workEvidence/work_01/same.jpg',
    }))
    expect(() => validateWorkReport(order('IN_PROGRESS'), duplicate)).toThrow(/Storage path/u)
  })

  it('keeps chemical care pending a specialist decision', () => {
    expect(specialistApprovalForCare('CHEMICAL')).toBe('PENDING_SPECIALIST')
    expect(specialistApprovalForCare('WATER')).toBe('NOT_REQUIRED')
  })

  it('separates worker observations from Agronomist diagnosis', () => {
    expect(() =>
      validateDiseaseDraft(workerContext, {
        positionId: positionA,
        observedSymptom: 'ใบมีจุดจำลอง',
        severity: 'MEDIUM',
        suspectedDiagnosis: 'โรคที่คาดเดา',
        followUpDate: '2026-09-02',
      }),
    ).toThrow(/ห้ามวินิจฉัย/u)

    expect(canAssessDisease(workerContext.farm.role)).toBe(false)
    expect(() =>
      validateDiseaseAssessment(workerContext, {
        suspectedDiagnosis: 'ข้อสงสัยจำลอง',
        confirmedDiagnosis: 'ผลวินิจฉัยจำลอง',
        treatmentPlan: 'แผนจากผู้เชี่ยวชาญจำลอง',
        followUpDate: '2026-09-03',
      }),
    ).toThrow(/Agronomist/u)
    expect(
      validateDiseaseAssessment(agronomistContext, {
        suspectedDiagnosis: 'ข้อสงสัยจำลอง',
        confirmedDiagnosis: 'ผลวินิจฉัยจำลอง',
        treatmentPlan: 'แผนจากผู้เชี่ยวชาญจำลอง',
        followUpDate: '2026-09-03',
      }).confirmedDiagnosis,
    ).toBe('ผลวินิจฉัยจำลอง')
  })
})
