import { readFile } from 'node:fs/promises'

import {
  assertFails,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
  writeBatch,
  type Firestore,
} from 'firebase/firestore'
import { ref, uploadString } from 'firebase/storage'

import type { AuthenticatedIdentity, CanonicalRole, FarmAccess } from '../domain/farm'
import {
  workPhotoUploadPolicy,
  type PreparedWorkPhotoUpload,
  type WorkReportInput,
} from '../domain/workCareDisease'
import { FirebaseWorkCareDiseaseRepository } from '../infrastructure/firebase/firebaseWorkCareDiseaseRepository'

const projectId = 'demo-smart-durian'
const organizationId = 'org_phase4_rules_demo'
const farmA = 'farm_phase4_rules_a'
const farmB = 'farm_phase4_rules_b'
const ownerId = 'phase4_owner_01'
const workerId = 'phase4_worker_02'
const agronomistId = 'phase4_agronomist_03'
const positionA = 'pos_phase4_tree_a001'
const positionA2 = 'pos_phase4_tree_a002'
const positionB = 'pos_phase4_tree_b001'
const seededWorkId = 'work_phase4_demo_0001'
let environment: RulesTestEnvironment

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

function farmPath(farmId: string): string {
  return `organizations/${organizationId}/farms/${farmId}`
}

function workPath(farmId: string, workOrderId = seededWorkId): string {
  return `${farmPath(farmId)}/workOrders/${workOrderId}`
}

function identity(userId: string): AuthenticatedIdentity {
  return {
    userId,
    displayName: userId === ownerId ? 'Owner จำลอง' : userId === workerId ? 'Worker จำลอง' : 'Agronomist จำลอง',
    maskedPhone: '+165••••004',
    source: 'firebase-emulator',
  }
}

function farm(role: CanonicalRole, userId: string, farmId = farmA): FarmAccess {
  return {
    organizationId,
    organizationName: 'องค์กร Phase 4 จำลอง',
    organizationCode: 'P4RULES',
    farmId,
    farmCode: farmId === farmA ? 'P4RULES-F01' : 'P4RULES-F02',
    farmSequence: farmId === farmA ? 'F01' : 'F02',
    farmName: 'สวน Phase 4 จำลอง',
    farmStatus: 'ACTIVE',
    membershipStatus: 'ACTIVE',
    role,
    isOrganizationOwner: userId === ownerId,
    isMock: true,
  }
}

function repository(userId: string) {
  const context = environment.authenticatedContext(userId)
  return new FirebaseWorkCareDiseaseRepository(
    context.firestore() as unknown as Firestore,
    context.storage(),
  )
}

function report(photos: WorkReportInput['photos']): WorkReportInput {
  return {
    notes: 'ผลปฏิบัติงานจำลอง',
    targetConfirmedPositionId: positionA,
    materials: [{ materialName: 'วัสดุจำลอง', quantity: 1, unit: 'หน่วยทดสอบ' }],
    photos,
    completions: [{ positionId: positionA, status: 'SUCCESS', exceptionReason: '' }],
  }
}

async function seed(): Promise<void> {
  await environment.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore() as unknown as Firestore
    const now = Timestamp.fromDate(new Date('2026-08-31T07:00:00.000Z'))
    await setDoc(doc(firestore, 'organizations', organizationId), {
      organizationId, organizationName: 'องค์กร Phase 4 จำลอง',
      organizationCode: 'P4RULES', status: 'ACTIVE', updatedAt: now,
    })
    for (const userId of [ownerId, workerId, agronomistId]) {
      await setDoc(doc(firestore, 'organizations', organizationId, 'members', userId), {
        organizationId, userId, status: 'ACTIVE', isOwner: userId === ownerId,
        createdAt: now, updatedAt: now,
      })
    }
    for (const currentFarmId of [farmA, farmB]) {
      await setDoc(doc(firestore, farmPath(currentFarmId)), {
        organizationId, farmId: currentFarmId,
        farmCode: currentFarmId === farmA ? 'P4RULES-F01' : 'P4RULES-F02',
        farmSequence: currentFarmId === farmA ? 'F01' : 'F02',
        farmName: 'สวน Phase 4 จำลอง', status: 'ACTIVE',
        createdAt: now, updatedAt: now,
      })
    }
    for (const [currentFarmId, userId, role] of [
      [farmA, ownerId, 'ORG_OWNER'], [farmB, ownerId, 'ORG_OWNER'],
      [farmA, workerId, 'WORKER'], [farmA, agronomistId, 'AGRONOMIST'],
    ] as const) {
      await setDoc(doc(firestore, `${farmPath(currentFarmId)}/members/${userId}`), {
        membershipType: 'FARM', organizationId, farmId: currentFarmId, userId,
        displayName: identity(userId).displayName, maskedPhone: '+165••••004',
        role, status: 'ACTIVE', version: 1, auditEventId: 'seed',
        exampleData: true, createdAt: now, updatedAt: now,
      })
    }
    for (const [currentFarmId, positionId] of [
      [farmA, positionA], [farmA, positionA2], [farmB, positionB],
    ] as const) {
      await setDoc(doc(firestore, `${farmPath(currentFarmId)}/treePositions/${positionId}`), {
        recordType: 'TREE_POSITION', organizationId, farmId: currentFarmId,
        positionId, organizationCode: 'P4RULES',
        farmSequence: currentFarmId === farmA ? 'F01' : 'F02',
        zoneCode: 'Z01', rowCode: 'R01', treeSequence: positionId === positionA2 ? 2 : 1,
        positionStatus: 'ACTIVE', exampleData: true,
      })
    }
    const eventId = 'workevt_phase4_seed_0001'
    await setDoc(doc(firestore, workPath(farmA)), {
      recordType: 'WORK_ORDER', organizationId, farmId: farmA,
      workOrderId: seededWorkId, title: 'ตรวจต้นจำลอง',
      description: 'EXAMPLE DATA ONLY', category: 'CARE', careType: 'INSPECTION',
      priority: 'URGENT', target: {
        kind: 'TREE', zoneCode: 'Z01', rowCode: 'R01', positionIds: [positionA],
      },
      dueDate: '2026-09-02', assignedUserId: workerId,
      status: 'ASSIGNED', isPaused: false, instructionPhotos: [], report: null,
      targetConfirmedPositionId: null, rejectionReason: '', reworkReason: '',
      sourceDiseaseIncidentId: null,
      version: 1, lastEventId: eventId, exampleData: true,
      createdBy: ownerId, createdAt: now, updatedBy: ownerId, updatedAt: now,
    })
    await setDoc(doc(firestore, `${workPath(farmA)}/events/${eventId}`), {
      recordType: 'WORK_EVENT', organizationId, farmId: farmA,
      workOrderId: seededWorkId, eventId, eventType: 'WORK_ASSIGNED',
      actorUserId: ownerId, actorDisplayName: 'Owner จำลอง',
      beforeStatus: 'DRAFT', afterStatus: 'ASSIGNED', reason: 'Seed',
      workVersion: 1, exampleData: true, createdAt: now,
    })
    await setDoc(doc(firestore, workPath(farmB, 'work_phase4_cross_0002')), {
      recordType: 'WORK_ORDER', organizationId, farmId: farmB,
      workOrderId: 'work_phase4_cross_0002', title: 'งานคนละสวน',
      description: 'EXAMPLE', category: 'GENERAL', careType: null,
      priority: 'NORMAL', target: { kind: 'TREE', zoneCode: 'Z01', rowCode: 'R01', positionIds: [positionB] },
      dueDate: '2026-09-03', assignedUserId: ownerId, status: 'ASSIGNED',
      isPaused: false, instructionPhotos: [], report: null, targetConfirmedPositionId: null,
      rejectionReason: '', reworkReason: '', version: 1,
      sourceDiseaseIncidentId: null,
      lastEventId: 'seed_cross', exampleData: true, createdBy: ownerId,
      createdAt: now, updatedBy: ownerId, updatedAt: now,
    })
  })
}

beforeAll(async () => {
  const [firestoreRules, storageRules] = await Promise.all([
    readFile(new URL('../../firestore.rules', import.meta.url), 'utf8'),
    readFile(new URL('../../storage.rules', import.meta.url), 'utf8'),
  ])
  environment = await initializeTestEnvironment({
    projectId,
    firestore: { rules: firestoreRules },
    storage: { rules: storageRules },
  })
})

beforeEach(async () => {
  await environment.clearFirestore()
  await environment.clearStorage()
  await seed()
})

afterAll(async () => environment.cleanup())

describe('Firebase Phase 4 Work/Care/Disease repository and Rules', () => {
  it('lists only assigned Work Orders in the current Farm for a Worker', async () => {
    const workerRepository = repository(workerId)
    const workOrders = await workerRepository.listWorkOrders({
      actor: identity(workerId),
      farm: farm('WORKER', workerId),
    })

    expect(workOrders.map((workOrder) => workOrder.workOrderId)).toEqual([seededWorkId])
    await expect(workerRepository.listWorkOrders({
      actor: identity(workerId),
      farm: farm('WORKER', workerId, farmB),
    })).rejects.toThrow()
  })

  it('allows the Work Order creator to attach instruction photos before assignment', async () => {
    const ownerRepository = repository(ownerId)
    const ownerContext = { actor: identity(ownerId), farm: farm('ORG_OWNER', ownerId) }
    const created = await ownerRepository.createWorkOrder(ownerContext, 'create_photo_work_001', {
      title: 'งานพร้อมรูปประกอบจำลอง',
      description: 'SIMULATED/TEST ONLY',
      category: 'CARE',
      careType: 'INSPECTION',
      priority: 'NORMAL',
      target: { kind: 'TREE', zoneCode: 'Z01', rowCode: 'R01', positionIds: [positionA] },
      dueDate: '2026-09-06',
      assignedUserId: null,
    })
    const photo = await ownerRepository.uploadWorkPhoto(
      ownerContext,
      created.workOrderId,
      'photo_instruction_rules_000001',
      'INSTRUCTION',
      preparedPhoto('instruction'),
    )
    const saved = await ownerRepository.saveWorkInstructionPhotos(
      ownerContext, created.workOrderId, 'save_photo_work_001', [photo],
    )
    const retry = await ownerRepository.saveWorkInstructionPhotos(
      ownerContext, created.workOrderId, 'save_photo_work_001', [photo],
    )
    expect(saved.instructionPhotos).toHaveLength(1)
    expect(retry.version).toBe(saved.version)

    await expect(repository(workerId).uploadWorkPhoto(
      { actor: identity(workerId), farm: farm('WORKER', workerId) },
      created.workOrderId,
      'photo_instruction_forged_000001',
      'INSTRUCTION',
      preparedPhoto('forged'),
    )).rejects.toThrow()
  })

  it('runs accept/start/QR/photos/report/submit/verify with idempotent audit', async () => {
    const workerRepository = repository(workerId)
    const workerContext = { actor: identity(workerId), farm: farm('WORKER', workerId) }
    const accepted = await workerRepository.performWorkAction(
      workerContext, seededWorkId, 'accept_000001', { type: 'ACCEPT' },
    )
    const retry = await workerRepository.performWorkAction(
      workerContext, seededWorkId, 'accept_000001', { type: 'ACCEPT' },
    )
    expect(retry.version).toBe(accepted.version)
    await workerRepository.performWorkAction(workerContext, seededWorkId, 'start_000001', { type: 'START' })
    await workerRepository.confirmWorkTarget(workerContext, seededWorkId, 'confirm_0001', positionA)
    const before = await workerRepository.uploadWorkPhoto(
      workerContext, seededWorkId, 'photo_before_0001', 'BEFORE',
      preparedPhoto('before'),
    )
    const after = await workerRepository.uploadWorkPhoto(
      workerContext, seededWorkId, 'photo_after_0001', 'AFTER',
      preparedPhoto('after'),
    )
    await workerRepository.saveWorkReport(
      workerContext, seededWorkId, 'report_000001', report([before, after]),
    )
    await workerRepository.performWorkAction(workerContext, seededWorkId, 'submit_00001', { type: 'SUBMIT' })

    const ownerRepository = repository(ownerId)
    const verified = await ownerRepository.performWorkAction(
      { actor: identity(ownerId), farm: farm('ORG_OWNER', ownerId) },
      seededWorkId, 'verify_00001', { type: 'VERIFY' },
    )
    expect(verified.status).toBe('VERIFIED')
    expect(verified.audit.map((event) => event.eventType)).toContain('WORK_VERIFIED')
    expect(await ownerRepository.listCareEvents(
      { actor: identity(ownerId), farm: farm('ORG_OWNER', ownerId) },
    )).toHaveLength(1)
  })

  it('denies a forged wrong-tree confirmation even with a matching audit event', async () => {
    const workerRepository = repository(workerId)
    const workerContext = { actor: identity(workerId), farm: farm('WORKER', workerId) }
    await workerRepository.performWorkAction(workerContext, seededWorkId, 'accept_wrong01', { type: 'ACCEPT' })
    await workerRepository.performWorkAction(workerContext, seededWorkId, 'start_wrong001', { type: 'START' })
    const firestore = environment.authenticatedContext(workerId).firestore()
    const snapshot = await getDoc(doc(firestore, workPath(farmA)))
    const version = snapshot.data()!.version + 1
    const eventId = 'workevt_forged_wrong_tree'
    const batch = writeBatch(firestore)
    batch.update(doc(firestore, workPath(farmA)), {
      targetConfirmedPositionId: positionA2, version, lastEventId: eventId,
      updatedBy: workerId, updatedAt: serverTimestamp(),
    })
    batch.set(doc(firestore, `${workPath(farmA)}/events/${eventId}`), {
      recordType: 'WORK_EVENT', organizationId, farmId: farmA,
      workOrderId: seededWorkId, eventId, eventType: 'WORK_TARGET_CONFIRMED',
      actorUserId: workerId, actorDisplayName: 'Worker จำลอง',
      beforeStatus: 'IN_PROGRESS', afterStatus: 'IN_PROGRESS', reason: positionA2,
      workVersion: version, exampleData: true, createdAt: serverTimestamp(),
    })
    await assertFails(batch.commit())
  })

  it('denies cross-farm reads and work-evidence writes', async () => {
    const workerFirestore = environment.authenticatedContext(workerId).firestore()
    await assertFails(getDoc(doc(workerFirestore, workPath(farmB, 'work_phase4_cross_0002'))))
    const workerRepository = repository(workerId)
    await expect(workerRepository.uploadWorkPhoto(
      { actor: identity(workerId), farm: farm('WORKER', workerId, farmB) },
      'work_phase4_cross_0002', 'photo_cross_0001', 'BEFORE',
      preparedPhoto('image'),
    )).rejects.toThrow()
  })

  it('denies worker evidence uploads before the assigned work is in progress', async () => {
    const fileName = 'photo_before_early_0001'
    const storage = environment.authenticatedContext(workerId).storage()
    await assertFails(uploadString(
      ref(storage, `organizations/${organizationId}/farms/${farmA}/workEvidence/${seededWorkId}/${fileName}`),
      'image',
      'raw',
      {
        contentType: 'image/png',
        customMetadata: {
          organizationId,
          farmId: farmA,
          uploadedBy: workerId,
          workOrderId: seededWorkId,
          uploadSessionId: fileName,
          evidencePhase: 'BEFORE',
          exampleData: 'true',
        },
      },
    ))
  })

  it('denies a raw Work photo that bypasses WebP re-encoding and metadata stripping', async () => {
    const created = await repository(ownerId).createWorkOrder(
      { actor: identity(ownerId), farm: farm('ORG_OWNER', ownerId) },
      'raw_photo_work_001',
      {
        title: 'ทดสอบรูปดิบ', description: 'SIMULATED/TEST ONLY', category: 'CARE',
        careType: 'INSPECTION', priority: 'NORMAL',
        target: { kind: 'TREE', zoneCode: 'Z01', rowCode: 'R01', positionIds: [positionA] },
        dueDate: '2026-09-06', assignedUserId: null,
      },
    )
    const fileName = 'photo_instruction_raw_bypass01'
    const storage = environment.authenticatedContext(ownerId).storage()
    await assertFails(uploadString(
      ref(storage, `organizations/${organizationId}/farms/${farmA}/workEvidence/${created.workOrderId}/${fileName}`),
      'raw-png', 'raw', {
        contentType: 'image/png',
        customMetadata: {
          organizationId, farmId: farmA, uploadedBy: ownerId,
          workOrderId: created.workOrderId, uploadSessionId: fileName,
          evidencePhase: 'INSTRUCTION', exampleData: 'true',
        },
      },
    ))
  })

  it('keeps Worker observations separate from Agronomist diagnosis', async () => {
    const workerRepository = repository(workerId)
    const workerContext = { actor: identity(workerId), farm: farm('WORKER', workerId) }
    const incident = await workerRepository.createDiseaseIncident(
      workerContext, 'disease_create_01', {
        positionId: positionA, observedSymptom: 'ใบซีด — ข้อมูลจำลอง',
        severity: 'MEDIUM', suspectedDiagnosis: '', followUpDate: '2026-09-04',
      },
    )
    await expect(workerRepository.assessDiseaseIncident(
      workerContext, incident.incidentId, 'worker_assess_01', {
        suspectedDiagnosis: 'ข้อสงสัย', confirmedDiagnosis: 'ผลยืนยัน',
        treatmentPlan: 'แผน', followUpDate: '2026-09-05',
      },
    )).rejects.toThrow(/Agronomist/u)
    const agronomistRepository = repository(agronomistId)
    const assessed = await agronomistRepository.assessDiseaseIncident(
      { actor: identity(agronomistId), farm: farm('AGRONOMIST', agronomistId) },
      incident.incidentId, 'agro_assess_0001', {
        suspectedDiagnosis: 'ข้อสงสัยจำลอง', confirmedDiagnosis: 'ผลยืนยันจำลอง',
        treatmentPlan: 'แผนจำลองจากผู้เชี่ยวชาญ', followUpDate: '2026-09-05',
      },
    )
    expect(assessed.specialistApprovalStatus).toBe('APPROVED')
  })

  it('stores only farm-scoped synthetic Disease photo metadata and supports idempotent retry', async () => {
    const workerRepository = repository(workerId)
    const workerContext = { actor: identity(workerId), farm: farm('WORKER', workerId) }
    const incident = await workerRepository.createDiseaseIncident(
      workerContext, 'disease_photo_create_01', {
        positionId: positionA,
        observedSymptom: 'SIMULATED/TEST ONLY — จุดใบจำลอง',
        severity: 'HIGH',
        suspectedDiagnosis: '',
        followUpDate: '2026-09-05',
      },
    )
    const added = await workerRepository.addDiseasePhotoMock(
      workerContext, incident.incidentId, 'disease_photo_add_01', {
        placeholderKind: 'LEAF_SPOT',
        mimeType: 'image/webp',
        sizeBytes: 420_000,
        note: 'SIMULATED/TEST ONLY — ไม่มีไฟล์จริง',
      },
    )
    const replay = await workerRepository.addDiseasePhotoMock(
      workerContext, incident.incidentId, 'disease_photo_add_01', {
        placeholderKind: 'LEAF_SPOT',
        mimeType: 'image/webp',
        sizeBytes: 420_000,
        note: 'SIMULATED/TEST ONLY — ไม่มีไฟล์จริง',
      },
    )
    const photoId = added.photos[0]!.photoId
    expect(replay.photos).toHaveLength(1)
    expect(added.photos[0]).toMatchObject({
      organizationId,
      farmId: farmA,
      incidentId: incident.incidentId,
      positionId: positionA,
      source: 'SYNTHETIC_PLACEHOLDER',
      uploadState: 'PENDING',
      containsExifOrGps: false,
      externalStorage: false,
      lifecycleMode: 'DRY_RUN',
    })
    await workerRepository.advanceDiseasePhotoMock(
      workerContext, incident.incidentId, photoId, 'disease_photo_start_01', 'START_UPLOAD',
    )
    await workerRepository.advanceDiseasePhotoMock(
      workerContext, incident.incidentId, photoId, 'disease_photo_fail_01', 'MARK_FAILED',
    )
    await workerRepository.advanceDiseasePhotoMock(
      workerContext, incident.incidentId, photoId, 'disease_photo_retry_01', 'RETRY',
    )
    const uploaded = await workerRepository.advanceDiseasePhotoMock(
      workerContext, incident.incidentId, photoId, 'disease_photo_done_01', 'MARK_UPLOADED',
    )
    expect(uploaded.photos[0]).toMatchObject({ uploadState: 'UPLOADED', retryCount: 1 })
    expect(uploaded.audit.map((event) => event.eventType)).toContain('PHOTO_UPLOAD_COMPLETED')

    await expect(workerRepository.addDiseasePhotoMock(
      { actor: identity(workerId), farm: farm('WORKER', workerId, farmB) },
      incident.incidentId,
      'disease_photo_cross_01',
      { placeholderKind: 'CANOPY', mimeType: 'image/png', sizeBytes: 1000, note: 'SIMULATED/TEST ONLY' },
    )).rejects.toThrow()
  })

  it('atomically links one Treatment Work Order and denies duplicate, wrong-tree and unauthorized attempts', async () => {
    const workerRepository = repository(workerId)
    const workerContext = { actor: identity(workerId), farm: farm('WORKER', workerId) }
    const agronomistRepository = repository(agronomistId)
    const agronomistContext = { actor: identity(agronomistId), farm: farm('AGRONOMIST', agronomistId) }
    const incident = await workerRepository.createDiseaseIncident(
      workerContext, 'treatment_incident_01', {
        positionId: positionA,
        observedSymptom: 'SIMULATED/TEST ONLY — อาการสำหรับงานรักษา',
        severity: 'HIGH',
        suspectedDiagnosis: '',
        followUpDate: '2026-09-05',
      },
    )
    await agronomistRepository.assessDiseaseIncident(
      agronomistContext, incident.incidentId, 'treatment_assess_01', {
        suspectedDiagnosis: 'ข้อสงสัยจำลอง',
        confirmedDiagnosis: 'ผลยืนยันจำลอง',
        treatmentPlan: 'ขั้นตอนรักษาจำลองจากผู้เชี่ยวชาญ',
        followUpDate: '2026-09-06',
      },
    )
    const input = {
      positionId: positionA,
      zoneCode: 'Z01',
      rowCode: 'R01',
      assignedUserId: workerId,
      dueDate: '2026-09-06',
    }
    const created = await agronomistRepository.createTreatmentWorkOrder(
      agronomistContext, incident.incidentId, 'treatment_work_create_01', input,
    )
    const replay = await agronomistRepository.createTreatmentWorkOrder(
      agronomistContext, incident.incidentId, 'treatment_work_create_01', input,
    )
    expect(replay.workOrder.workOrderId).toBe(created.workOrder.workOrderId)
    expect(created.incident.treatmentWorkOrderId).toBe(created.workOrder.workOrderId)
    expect(created.workOrder).toMatchObject({
      organizationId,
      farmId: farmA,
      sourceDiseaseIncidentId: incident.incidentId,
      category: 'DISEASE_FOLLOW_UP',
      assignedUserId: workerId,
    })
    await expect(agronomistRepository.createTreatmentWorkOrder(
      agronomistContext, incident.incidentId, 'treatment_work_duplicate_01', input,
    )).rejects.toThrow(/Duplicate Attempt/u)
    await expect(workerRepository.createTreatmentWorkOrder(
      workerContext, incident.incidentId, 'treatment_work_worker_01', input,
    )).rejects.toThrow(/Agronomist/u)

    const wrongTreeIncident = await workerRepository.createDiseaseIncident(
      workerContext, 'wrong_tree_incident_01', {
        positionId: positionA,
        observedSymptom: 'SIMULATED/TEST ONLY — wrong tree',
        severity: 'MEDIUM',
        suspectedDiagnosis: '',
        followUpDate: '2026-09-05',
      },
    )
    await agronomistRepository.assessDiseaseIncident(
      agronomistContext, wrongTreeIncident.incidentId, 'wrong_tree_assess_01', {
        suspectedDiagnosis: 'ข้อสงสัยจำลอง', confirmedDiagnosis: 'ผลยืนยันจำลอง',
        treatmentPlan: 'แผนจำลอง', followUpDate: '2026-09-06',
      },
    )
    await expect(agronomistRepository.createTreatmentWorkOrder(
      agronomistContext, wrongTreeIncident.incidentId, 'wrong_tree_work_01', {
        ...input, positionId: positionA2,
      },
    )).rejects.toThrow(/Wrong-Tree/u)
  })

  it('denies Worker creation of a general work order', async () => {
    const workerRepository = repository(workerId)
    await expect(workerRepository.createWorkOrder(
      { actor: identity(workerId), farm: farm('WORKER', workerId) },
      'create_general_01', {
        title: 'งานทั่วไปจำลอง', description: 'EXAMPLE', category: 'GENERAL',
        careType: null, priority: 'NORMAL',
        target: { kind: 'TREE', zoneCode: 'Z01', rowCode: 'R01', positionIds: [positionA] },
        dueDate: '2026-09-05', assignedUserId: workerId,
      },
    )).rejects.toThrow(/ไม่มีสิทธิ์/u)
  })
})
