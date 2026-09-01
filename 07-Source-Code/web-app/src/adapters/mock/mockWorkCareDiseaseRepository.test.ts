import { describe, expect, it } from 'vitest'

import type { AuthenticatedIdentity, CanonicalRole, FarmAccess } from '../../domain/farm'
import {
  workPhotoUploadPolicy,
  type PreparedWorkPhotoUpload,
  type WorkMutationContext,
  type WorkReportInput,
} from '../../domain/workCareDisease'
import {
  MockWorkCareDiseaseRepository,
  createDemoWorkOrders,
  phase4MockDataPackCoverage,
  phase4MockDataPackMetadata,
} from './mockWorkCareDiseaseRepository'

const northPositionA = 'pos_demo_a01f783bc219'
const northPositionB = 'pos_demo_a02c914ed730'

function preparedPhoto(label: string): PreparedWorkPhotoUpload {
  const blob = new Blob([label], { type: 'image/webp' })
  return {
    blob,
    processingVersion: workPhotoUploadPolicy.processingVersion,
    processingMode: 'CANVAS_REENCODED',
    sourceMimeType: 'image/png',
    outputMimeType: 'image/webp',
    originalSizeBytes: blob.size,
    preparedSizeBytes: blob.size,
    originalWidth: 100,
    originalHeight: 100,
    preparedWidth: 100,
    preparedHeight: 100,
    metadataStripped: true,
  }
}

function context(
  role: CanonicalRole,
  userId: string,
  farmId = 'farm_demo_north_01',
): WorkMutationContext {
  const actor: AuthenticatedIdentity = {
    userId,
    displayName: `ผู้ใช้ ${userId}`,
    maskedPhone: '+1•••••••001',
    source: 'mock',
  }
  const farm: FarmAccess = {
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
  }
  return { actor, farm }
}

const worker = context('WORKER', 'user_demo_worker_02')
const owner = context('ORG_OWNER', 'user_demo_owner_01')
const agronomist = context('AGRONOMIST', 'user_demo_agronomist_05')

function workReport(positionIds: readonly string[]): WorkReportInput {
  return {
    notes: 'รายงานจำลองเท่านั้น',
    targetConfirmedPositionId: positionIds.length === 1 ? positionIds[0]! : null,
    materials: [{ materialName: 'น้ำตัวอย่าง', quantity: 10, unit: 'ลิตร' }],
    photos: [
      {
        photoId: 'photo_before_demo',
        phase: 'BEFORE',
        uploadState: 'UPLOADED',
        storagePath: 'organizations/org_demo/farms/farm_demo/workEvidence/work/before.jpg',
        note: 'ก่อนทำงานจำลอง',
      },
      {
        photoId: 'photo_after_demo',
        phase: 'AFTER',
        uploadState: 'UPLOADED',
        storagePath: 'organizations/org_demo/farms/farm_demo/workEvidence/work/after.jpg',
        note: 'หลังทำงานจำลอง',
      },
    ],
    completions: positionIds.map((positionId) => ({
      positionId,
      status: 'SUCCESS' as const,
      exceptionReason: '',
    })),
  }
}

describe('Mock Phase 4 repository', () => {
  it('runs a single-tree worker flow with QR confirmation, verification and audit', async () => {
    const repository = new MockWorkCareDiseaseRepository()
    const workOrderId = 'work_demo_tree_000001'

    const accepted = await repository.performWorkAction(worker, workOrderId, 'accept-1', { type: 'ACCEPT' })
    const retry = await repository.performWorkAction(worker, workOrderId, 'accept-1', { type: 'ACCEPT' })
    expect(accepted.status).toBe('ACCEPTED')
    expect(retry.audit).toHaveLength(accepted.audit.length)

    await repository.performWorkAction(worker, workOrderId, 'start-1', { type: 'START' })
    await expect(
      repository.confirmWorkTarget(worker, workOrderId, 'wrong-tree-1', northPositionB),
    ).rejects.toThrow(/ไม่ตรงต้นเป้าหมาย/u)
    await repository.confirmWorkTarget(worker, workOrderId, 'confirm-1', northPositionA)
    await repository.saveWorkReport(worker, workOrderId, 'report-1', workReport([northPositionA]))
    await repository.performWorkAction(worker, workOrderId, 'submit-1', { type: 'SUBMIT' })
    const verified = await repository.performWorkAction(owner, workOrderId, 'verify-1', { type: 'VERIFY' })

    expect(verified.status).toBe('VERIFIED')
    expect(verified.audit.map((event) => event.eventType)).toContain('WORK_TARGET_CONFIRMED')
    expect((await repository.listCareEvents(owner)).some(
      (event) => event.workOrderId === workOrderId,
    )).toBe(true)
  })

  it('loads a versioned deterministic pack and resets with a new repository', async () => {
    expect(phase4MockDataPackMetadata).toMatchObject({
      version: '1.1.0',
      classification: 'SIMULATED/TEST ONLY',
      deterministic: true,
      resettable: true,
    })
    expect(phase4MockDataPackCoverage.canonicalRoles).toHaveLength(7)
    expect(phase4MockDataPackCoverage.syncScenarios).toEqual([
      'PENDING', 'SYNCING', 'SYNCED', 'CONFLICT', 'RETRY',
    ])
    const packedOrders = createDemoWorkOrders()
    expect(packedOrders.every((order) => Boolean(
      order.workOrderId && order.title && order.priority && order.target,
    ))).toBe(true)
    expect(packedOrders.some((order) => 'incidentId' in order)).toBe(false)
    const first = new MockWorkCareDiseaseRepository()
    const originalIds = (await first.listWorkOrders(worker)).map((item) => item.workOrderId)
    await first.performWorkAction(worker, 'work_demo_tree_000001', 'pack-reset-accept', {
      type: 'ACCEPT',
    })
    const reset = new MockWorkCareDiseaseRepository()
    expect((await reset.listWorkOrders(worker)).map((item) => item.workOrderId)).toEqual(originalIds)
    expect((await reset.getWorkOrder(worker, 'work_demo_tree_000001'))?.status).toBe('ASSIGNED')
  })

  it('stores instruction photos before assignment and exposes them to the assigned worker', async () => {
    const repository = new MockWorkCareDiseaseRepository()
    const created = await repository.createWorkOrder(owner, 'create-photo-work', {
      title: 'งานพร้อมรูปประกอบจำลอง',
      description: 'SIMULATED/TEST ONLY',
      category: 'CARE',
      careType: 'INSPECTION',
      priority: 'NORMAL',
      target: {
        kind: 'TREE', zoneCode: 'Z01', rowCode: 'R01', positionIds: [northPositionA],
      },
      dueDate: '2026-09-06',
      assignedUserId: null,
    })
    const photo = await repository.uploadWorkPhoto(
      owner,
      created.workOrderId,
      'photo_instruction_mock_000001',
      'INSTRUCTION',
      preparedPhoto('instruction'),
    )
    const saved = await repository.saveWorkInstructionPhotos(
      owner, created.workOrderId, 'save-photo-work', [photo],
    )
    const retry = await repository.saveWorkInstructionPhotos(
      owner, created.workOrderId, 'save-photo-work', [photo],
    )
    expect(saved.instructionPhotos).toHaveLength(1)
    expect(retry.audit).toHaveLength(saved.audit.length)
    expect(await repository.getWorkPhotoUrl(owner, created.workOrderId, photo.storagePath)).toMatch(/^(blob:|data:image)/u)

    await repository.performWorkAction(owner, created.workOrderId, 'assign-photo-work', {
      type: 'ASSIGN', assignedUserId: worker.actor.userId,
    })
    expect((await repository.getWorkOrder(worker, created.workOrderId))?.instructionPhotos).toHaveLength(1)
    await expect(repository.uploadWorkPhoto(
      worker,
      created.workOrderId,
      'photo_instruction_worker_000001',
      'INSTRUCTION',
      preparedPhoto('forged'),
    )).rejects.toThrow(/สิทธิ์|สถานะร่าง/u)
  })

  it('stores success/exception per target for group work', async () => {
    const repository = new MockWorkCareDiseaseRepository()
    const workOrderId = 'work_demo_group_00002'
    await repository.performWorkAction(worker, workOrderId, 'group-accept', { type: 'ACCEPT' })
    await repository.performWorkAction(worker, workOrderId, 'group-start', { type: 'START' })
    const report = workReport([northPositionA, northPositionB])
    report.completions = [
      report.completions[0]!,
      {
        positionId: northPositionB,
        status: 'EXCEPTION',
        exceptionReason: 'เข้าถึงตำแหน่งจำลองไม่ได้',
      },
    ]
    const saved = await repository.saveWorkReport(worker, workOrderId, 'group-report', report)
    expect(saved.report?.completions[1]?.status).toBe('EXCEPTION')
  })

  it('blocks partial photo failure and duplicate report events', async () => {
    const repository = new MockWorkCareDiseaseRepository()
    const workOrderId = 'work_demo_tree_000001'
    await repository.performWorkAction(worker, workOrderId, 'photo-accept', { type: 'ACCEPT' })
    await repository.performWorkAction(worker, workOrderId, 'photo-start', { type: 'START' })
    await repository.confirmWorkTarget(worker, workOrderId, 'photo-confirm', northPositionA)
    const report = workReport([northPositionA])
    report.photos = [report.photos[0]!, { ...report.photos[1]!, uploadState: 'FAILED' }]
    await expect(repository.saveWorkReport(worker, workOrderId, 'photo-failed', report)).rejects.toThrow(/บางส่วน/u)

    const valid = workReport([northPositionA])
    const first = await repository.saveWorkReport(worker, workOrderId, 'photo-valid', valid)
    const retry = await repository.saveWorkReport(worker, workOrderId, 'photo-valid', valid)
    expect(retry.report?.reportId).toBe(first.report?.reportId)
    expect(retry.audit).toHaveLength(first.audit.length)
  })

  it('does not expose or mutate a work order across farms', async () => {
    const repository = new MockWorkCareDiseaseRepository()
    expect(await repository.getWorkOrder(worker, 'work_demo_south_00003')).toBeUndefined()
    await expect(
      repository.performWorkAction(worker, 'work_demo_south_00003', 'cross-farm', { type: 'ACCEPT' }),
    ).rejects.toThrow(/ข้ามสวน/u)
  })

  it('requires reasons for rework/reject and keeps idempotent audit', async () => {
    const repository = new MockWorkCareDiseaseRepository()
    const workOrderId = 'work_demo_tree_000001'
    await repository.performWorkAction(worker, workOrderId, 'verify-accept', { type: 'ACCEPT' })
    await repository.performWorkAction(worker, workOrderId, 'verify-start', { type: 'START' })
    await repository.confirmWorkTarget(worker, workOrderId, 'verify-confirm', northPositionA)
    await repository.saveWorkReport(worker, workOrderId, 'verify-report', workReport([northPositionA]))
    await repository.performWorkAction(worker, workOrderId, 'verify-submit', { type: 'SUBMIT' })
    await expect(
      repository.performWorkAction(owner, workOrderId, 'rework-empty', { type: 'REQUEST_REWORK', reason: '' }),
    ).rejects.toThrow(/เหตุผล/u)
    const rework = await repository.performWorkAction(owner, workOrderId, 'rework-1', {
      type: 'REQUEST_REWORK',
      reason: 'ภาพหลังงานไม่ชัด — ข้อมูลจำลอง',
    })
    const retry = await repository.performWorkAction(owner, workOrderId, 'rework-1', {
      type: 'REQUEST_REWORK',
      reason: 'ภาพหลังงานไม่ชัด — ข้อมูลจำลอง',
    })
    expect(rework.status).toBe('REWORK')
    expect(retry.audit).toHaveLength(rework.audit.length)
  })

  it('separates symptom observation from specialist diagnosis and follow-up', async () => {
    const repository = new MockWorkCareDiseaseRepository()
    const incident = await repository.createDiseaseIncident(worker, 'disease-create', {
      positionId: northPositionA,
      observedSymptom: 'ใบซีด — ข้อมูลจำลอง',
      severity: 'MEDIUM',
      suspectedDiagnosis: '',
      followUpDate: '2026-09-03',
    })
    await expect(
      repository.assessDiseaseIncident(worker, incident.incidentId, 'worker-assess', {
        suspectedDiagnosis: 'ข้อสงสัย',
        confirmedDiagnosis: 'ยืนยัน',
        treatmentPlan: 'แผน',
        followUpDate: '2026-09-04',
      }),
    ).rejects.toThrow(/Agronomist/u)
    const assessed = await repository.assessDiseaseIncident(agronomist, incident.incidentId, 'agronomist-assess', {
      suspectedDiagnosis: 'ข้อสงสัยจำลอง',
      confirmedDiagnosis: 'ผลยืนยันจำลอง',
      treatmentPlan: 'แผนผู้เชี่ยวชาญจำลอง',
      followUpDate: '2026-09-04',
    })
    expect(assessed.status).toBe('TREATING')
    const closed = await repository.followUpDiseaseIncident(agronomist, incident.incidentId, 'agronomist-followup', {
      outcome: 'อาการดีขึ้น — ข้อมูลจำลอง',
      nextFollowUpDate: '',
      closeIncident: true,
    })
    expect(closed.status).toBe('CLOSED')
  })

  it('runs the synthetic Disease photo lifecycle with idempotent retry and audit', async () => {
    const repository = new MockWorkCareDiseaseRepository()
    const incident = await repository.createDiseaseIncident(worker, 'photo-disease-create', {
      positionId: northPositionA,
      observedSymptom: 'SIMULATED/TEST ONLY — จุดสีจำลอง',
      severity: 'HIGH',
      suspectedDiagnosis: '',
      followUpDate: '2026-09-05',
    })
    const added = await repository.addDiseasePhotoMock(worker, incident.incidentId, 'photo-add-001', {
      placeholderKind: 'LEAF_SPOT',
      mimeType: 'image/webp',
      sizeBytes: 420_000,
      note: 'SIMULATED/TEST ONLY — ไม่มีไฟล์จริง',
    })
    const addedRetry = await repository.addDiseasePhotoMock(worker, incident.incidentId, 'photo-add-001', {
      placeholderKind: 'LEAF_SPOT',
      mimeType: 'image/webp',
      sizeBytes: 420_000,
      note: 'SIMULATED/TEST ONLY — ไม่มีไฟล์จริง',
    })
    const photoId = added.photos[0]!.photoId
    expect(addedRetry.photos).toHaveLength(1)
    expect(added.photos[0]).toMatchObject({
      source: 'SYNTHETIC_PLACEHOLDER',
      classification: 'SIMULATED/TEST ONLY',
      uploadState: 'PENDING',
      containsExifOrGps: false,
      externalStorage: false,
      lifecycleMode: 'DRY_RUN',
    })
    await repository.advanceDiseasePhotoMock(worker, incident.incidentId, photoId, 'photo-start-001', 'START_UPLOAD')
    await repository.advanceDiseasePhotoMock(worker, incident.incidentId, photoId, 'photo-fail-001', 'MARK_FAILED')
    const retrying = await repository.advanceDiseasePhotoMock(worker, incident.incidentId, photoId, 'photo-retry-001', 'RETRY')
    const retryReplay = await repository.advanceDiseasePhotoMock(worker, incident.incidentId, photoId, 'photo-retry-001', 'RETRY')
    expect(retrying.photos[0]!.retryCount).toBe(1)
    expect(retryReplay.audit).toHaveLength(retrying.audit.length)
    const uploaded = await repository.advanceDiseasePhotoMock(worker, incident.incidentId, photoId, 'photo-uploaded-001', 'MARK_UPLOADED')
    expect(uploaded.photos[0]!.uploadState).toBe('UPLOADED')
    expect(uploaded.audit.map((event) => event.eventType)).toEqual(expect.arrayContaining([
      'PHOTO_PLACEHOLDER_ADDED', 'PHOTO_UPLOAD_FAILED', 'PHOTO_UPLOAD_RETRIED', 'PHOTO_UPLOAD_COMPLETED',
    ]))
  })

  it('creates one Treatment Work Order with exact tree scope and two-way links', async () => {
    const repository = new MockWorkCareDiseaseRepository()
    const incident = await repository.createDiseaseIncident(worker, 'treatment-disease-create', {
      positionId: northPositionA,
      observedSymptom: 'SIMULATED/TEST ONLY — อาการสำหรับสร้างงาน',
      severity: 'HIGH',
      suspectedDiagnosis: '',
      followUpDate: '2026-09-05',
    })
    await repository.assessDiseaseIncident(agronomist, incident.incidentId, 'treatment-assess', {
      suspectedDiagnosis: 'ข้อสงสัยจำลอง',
      confirmedDiagnosis: 'ผลยืนยันจำลอง',
      treatmentPlan: 'ขั้นตอนรักษาจำลองจากผู้เชี่ยวชาญ',
      followUpDate: '2026-09-06',
    })
    const input = {
      positionId: northPositionA,
      zoneCode: 'Z01',
      rowCode: 'R01',
      assignedUserId: worker.actor.userId,
      dueDate: '2026-09-06',
    }
    const created = await repository.createTreatmentWorkOrder(
      agronomist, incident.incidentId, 'treatment-work-001', input,
    )
    const replay = await repository.createTreatmentWorkOrder(
      agronomist, incident.incidentId, 'treatment-work-001', input,
    )
    expect(replay.workOrder.workOrderId).toBe(created.workOrder.workOrderId)
    expect(created.incident.treatmentWorkOrderId).toBe(created.workOrder.workOrderId)
    expect(created.workOrder.sourceDiseaseIncidentId).toBe(incident.incidentId)
    expect(created.workOrder.target.positionIds).toEqual([northPositionA])
    expect(created.workOrder.category).toBe('DISEASE_FOLLOW_UP')
    expect(created.workOrder.assignedUserId).toBe(worker.actor.userId)
    expect(created.incident.audit[0]?.eventType).toBe('TREATMENT_WORK_CREATED')
    expect(created.workOrder.audit[0]?.eventType).toBe('WORK_CREATED')
    await expect(repository.createTreatmentWorkOrder(
      agronomist, incident.incidentId, 'treatment-work-duplicate', input,
    )).rejects.toThrow(/Duplicate Attempt/u)
  })

  it('denies Disease photo/treatment cross-farm, wrong-tree and unauthorized attempts', async () => {
    const repository = new MockWorkCareDiseaseRepository()
    const incident = await repository.createDiseaseIncident(worker, 'deny-disease-create', {
      positionId: northPositionA,
      observedSymptom: 'SIMULATED/TEST ONLY — security case',
      severity: 'MEDIUM',
      suspectedDiagnosis: '',
      followUpDate: '2026-09-05',
    })
    await repository.assessDiseaseIncident(agronomist, incident.incidentId, 'deny-assess', {
      suspectedDiagnosis: 'ข้อสงสัยจำลอง',
      confirmedDiagnosis: 'ผลยืนยันจำลอง',
      treatmentPlan: 'แผนจำลอง',
      followUpDate: '2026-09-06',
    })
    const southWorker = context('WORKER', worker.actor.userId, 'farm_demo_south_02')
    await expect(repository.addDiseasePhotoMock(southWorker, incident.incidentId, 'deny-cross-photo', {
      placeholderKind: 'CANOPY', mimeType: 'image/png', sizeBytes: 1000,
      note: 'SIMULATED/TEST ONLY',
    })).rejects.toThrow(/สวนปัจจุบัน/u)
    await expect(repository.createTreatmentWorkOrder(worker, incident.incidentId, 'deny-worker-treatment', {
      positionId: northPositionA, zoneCode: 'Z01', rowCode: 'R01',
      assignedUserId: worker.actor.userId, dueDate: '2026-09-06',
    })).rejects.toThrow(/Agronomist/u)
    await expect(repository.createTreatmentWorkOrder(agronomist, incident.incidentId, 'deny-wrong-tree', {
      positionId: northPositionB, zoneCode: 'Z01', rowCode: 'R01',
      assignedUserId: worker.actor.userId, dueDate: '2026-09-06',
    })).rejects.toThrow(/Wrong-Tree/u)
  })

  it('builds farm-scoped urgent and disease follow-up notifications', async () => {
    const repository = new MockWorkCareDiseaseRepository()
    const notifications = await repository.listNotifications(owner)
    expect(notifications.some((item) => item.kind === 'URGENT_WORK')).toBe(true)
    expect(notifications.some((item) => item.kind === 'DISEASE_FOLLOW_UP')).toBe(true)
    expect(notifications.every((item) => item.farmId === owner.farm.farmId)).toBe(true)
  })

  it('keeps notifications within visible work scope and includes normal-priority rework', async () => {
    const workOrders = createDemoWorkOrders()
    const normalRework = workOrders.find((item) => item.workOrderId === 'work_demo_group_00002')!
    normalRework.status = 'REWORK'
    normalRework.reworkReason = 'แก้หลักฐานจำลอง'
    workOrders.push({
      ...structuredClone(normalRework),
      workOrderId: 'work_mock_unassigned_000001',
      priority: 'URGENT',
      status: 'ASSIGNED',
      assignedUserId: 'user_demo_other_worker_99',
      reworkReason: '',
    })
    const repository = new MockWorkCareDiseaseRepository(workOrders)

    const workerNotifications = await repository.listNotifications(worker)

    expect(workerNotifications.some((item) => item.kind === 'REWORK')).toBe(true)
    expect(workerNotifications.some((item) => item.targetPath.includes('work_mock_unassigned_000001'))).toBe(false)
  })
})
