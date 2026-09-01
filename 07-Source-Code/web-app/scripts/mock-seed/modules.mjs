import { doc, serverTimestamp, setDoc as firebaseSetDoc } from 'firebase/firestore'
import { ref, uploadBytes } from 'firebase/storage'

const seedBatchId = 'KDOMS-PRODUCTION-MOCK-V1'

function setDoc(reference, data, options) {
  const seededData = { ...data, seedBatchId }
  return options
    ? firebaseSetDoc(reference, seededData, options)
    : firebaseSetDoc(reference, seededData)
}

const placeholderPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
const placeholderPng = Uint8Array.from(
  atob(placeholderPngBase64),
  (character) => character.charCodeAt(0),
)

function uidFor(userMappings, logicalUserId) {
  return userMappings.get(logicalUserId)?.firebaseUserId ?? logicalUserId
}

function assertMockPack(pack, label) {
  const metadata = pack.metadata
  if (
    metadata?.classification !== 'SIMULATED/TEST ONLY' ||
    metadata?.deterministic !== true ||
    metadata?.resettable !== true ||
    metadata?.productionUseAllowed === true
  ) {
    throw new Error(`${label} is not an approved deterministic Mock Data Pack`)
  }
}

function scopedDoc(firestore, rootSegments, ...segments) {
  return doc(firestore, ...rootSegments, ...segments)
}

function farmDoc(firestore, rootSegments, organizationId, farmId, ...segments) {
  return scopedDoc(
    firestore,
    rootSegments,
    'organizations',
    organizationId,
    'farms',
    farmId,
    ...segments,
  )
}

function farmAuditSnapshot(farm, status = farm.status, version = farm.version) {
  return {
    farmId: farm.farmId,
    farmCode: farm.farmCode,
    farmSequence: farm.farmSequence,
    farmName: farm.farmName,
    province: farm.province,
    district: farm.district,
    subdistrict: farm.subdistrict,
    locationNote: farm.locationNote,
    timezone: farm.timezone,
    seasonStartMonth: farm.seasonStartMonth,
    seasonEndMonth: farm.seasonEndMonth,
    seasonNote: farm.seasonNote,
    status,
    notes: farm.notes,
    version,
  }
}

async function uploadPlaceholder(storage, storagePath, metadata) {
  if (!storagePath.startsWith('organizations/') || storagePath.includes('..')) {
    throw new Error(`Unsafe mock Storage path: ${storagePath}`)
  }
  await uploadBytes(ref(storage, storagePath), placeholderPng, {
    contentType: 'image/png',
    customMetadata: {
      ...metadata,
      metadataStripped: 'true',
      exampleData: 'true',
      classification: 'SIMULATED/TEST ONLY',
    },
  })
}

export async function seedFoundation({ firestore, packs, rootSegments = [], userMappings }) {
  const seed = packs.foundation
  const organizationId = seed.organization.organizationId
  if (rootSegments.length > 0) {
    const owner = userMappings.get('user_demo_owner_01')
    if (!owner) throw new Error('Canonical Owner mock account is missing')
    await setDoc(doc(firestore, ...rootSegments), {
      projectId: 'durian-smartfarm',
      documentName: 'root',
      schemaVersion: '2.0.0',
      layout: 'ROOT_ORGANIZATION_FARM_MENU',
      menuCategories: [
        'foundation', 'trees', 'work', 'care', 'disease', 'commercial',
        'operations', 'disease-analysis', 'audit',
      ],
      seedOwnerUid: owner.firebaseUserId,
      classification: 'SIMULATED/TEST ONLY',
      exampleData: true,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  }
  await setDoc(scopedDoc(firestore, rootSegments, 'organizations', organizationId), {
    ...seed.organization,
    status: 'ACTIVE',
    classification: 'SIMULATED/TEST ONLY',
    exampleData: true,
    updatedAt: serverTimestamp(),
  })

  for (const mapping of userMappings.values()) {
    await setDoc(scopedDoc(
      firestore,
      rootSegments,
      'organizations',
      organizationId,
      'members',
      mapping.firebaseUserId,
    ), {
      organizationId,
      userId: mapping.firebaseUserId,
      status: 'ACTIVE',
      isOwner: mapping.isOrganizationOwner,
      classification: 'SIMULATED/TEST ONLY',
      exampleData: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  for (const farm of seed.farms) {
    const createdAuditEventId = `audit_seed_farm_created_${farm.farmSequence.toLowerCase()}`
    const statusAuditEventId = `audit_seed_farm_status_${farm.farmSequence.toLowerCase()}`
    const lastAuditEventId = farm.status === 'ACTIVE'
      ? createdAuditEventId
      : statusAuditEventId
    const storedFarm = Object.fromEntries(
      Object.entries(farm).filter(([key]) => ![
        'createdAtLabel', 'updatedAtLabel', 'classification', 'exampleData',
      ].includes(key)),
    )
    await setDoc(farmDoc(firestore, rootSegments, organizationId, farm.farmId), {
      recordType: 'FARM_PROFILE',
      organizationId,
      ...storedFarm,
      classification: 'SIMULATED/TEST ONLY',
      exampleData: true,
      lastAuditEventId,
      lastOperationId: 'seed',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    await setDoc(scopedDoc(
      firestore,
      rootSegments,
      'organizations',
      organizationId,
      'farmSequenceGuards',
      farm.farmSequence,
    ), {
      organizationId,
      farmId: farm.farmId,
      farmSequence: farm.farmSequence,
      farmCode: farm.farmCode,
      classification: 'SIMULATED/TEST ONLY',
      exampleData: true,
      createdAt: serverTimestamp(),
    })
    await setDoc(farmDoc(
      firestore,
      rootSegments,
      organizationId,
      farm.farmId,
      'auditEvents',
      createdAuditEventId,
    ), {
      auditEventId: createdAuditEventId,
      organizationId,
      farmId: farm.farmId,
      actorUserId: 'system_demo',
      actorDisplayName: 'ระบบข้อมูลจำลอง',
      eventType: 'FARM_CREATED',
      before: null,
      after: farmAuditSnapshot(farm, 'ACTIVE', 1),
      farmVersion: 1,
      idempotencyKey: `seed-create-${farm.farmSequence.toLowerCase()}`,
      classification: 'SIMULATED/TEST ONLY',
      exampleData: true,
      createdAt: serverTimestamp(),
    })
    if (farm.status !== 'ACTIVE') {
      await setDoc(farmDoc(
        firestore,
        rootSegments,
        organizationId,
        farm.farmId,
        'auditEvents',
        statusAuditEventId,
      ), {
        auditEventId: statusAuditEventId,
        organizationId,
        farmId: farm.farmId,
        actorUserId: 'system_demo',
        actorDisplayName: 'ระบบข้อมูลจำลอง',
        eventType: farm.status === 'SUSPENDED' ? 'FARM_SUSPENDED' : 'FARM_ARCHIVED',
        before: farmAuditSnapshot(farm, 'ACTIVE', 1),
        after: farmAuditSnapshot(farm),
        farmVersion: farm.version,
        idempotencyKey: `seed-status-${farm.farmSequence.toLowerCase()}`,
        classification: 'SIMULATED/TEST ONLY',
        exampleData: true,
        createdAt: serverTimestamp(),
      })
    }
  }

  let membershipCount = 0
  for (const mapping of userMappings.values()) {
    for (const membership of mapping.memberships) {
      membershipCount += 1
      await setDoc(farmDoc(
        firestore,
        rootSegments,
        organizationId,
        membership.farmId,
        'members',
        mapping.firebaseUserId,
      ), {
        membershipType: 'FARM',
        organizationId,
        farmId: membership.farmId,
        userId: mapping.firebaseUserId,
        displayName: mapping.displayName,
        maskedPhone: `${mapping.phoneNumber.slice(0, 4)}••••${mapping.phoneNumber.slice(-3)}`,
        role: membership.role,
        status: membership.status,
        version: membership.version,
        auditEventId: 'seed',
        classification: 'SIMULATED/TEST ONLY',
        exampleData: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }
  }

  const owner = userMappings.get('user_demo_owner_01')
  const worker = userMappings.get('user_demo_worker_02')
  if (!owner || !worker) throw new Error('Canonical Owner/Worker mock accounts are missing')
  const auditEventId = 'audit_seed_membership_restored_0001'
  await setDoc(farmDoc(
    firestore,
    rootSegments,
    organizationId,
    'farm_demo_north_01',
    'auditEvents',
    auditEventId,
  ), {
    auditEventId,
    organizationId,
    farmId: 'farm_demo_north_01',
    actorUserId: owner.firebaseUserId,
    actorDisplayName: owner.displayName,
    targetUserId: worker.firebaseUserId,
    targetDisplayName: worker.displayName,
    eventType: 'MEMBERSHIP_RESTORED',
    beforeRole: 'WORKER',
    afterRole: 'WORKER',
    beforeStatus: 'REVOKED',
    afterStatus: 'ACTIVE',
    membershipVersion: 1,
    classification: 'SIMULATED/TEST ONLY',
    exampleData: true,
    createdAt: serverTimestamp(),
  })

  return {
    rootDocuments: rootSegments.length > 0 ? 1 : 0,
    organizations: 1,
    organizationMembers: userMappings.size,
    farms: seed.farms.length,
    farmSequenceGuards: seed.farms.length,
    farmAuditEvents: seed.farms.reduce(
      (total, farm) => total + (farm.status === 'ACTIVE' ? 1 : 2),
      0,
    ),
    farmMembers: membershipCount,
    membershipAuditEvents: 1,
  }
}

export async function seedTreeRegister({ firestore, packs, rootSegments = [] }) {
  const seed = packs.foundation
  let plantingCycles = 0
  let treeEvents = 0
  for (const position of seed.treePositions) {
    const reference = farmDoc(
      firestore,
      rootSegments,
      position.organizationId,
      position.farmId,
      'treePositions',
      position.positionId,
    )
    await setDoc(reference, {
      recordType: 'TREE_POSITION',
      organizationId: position.organizationId,
      farmId: position.farmId,
      positionId: position.positionId,
      organizationCode: position.organizationCode,
      farmSequence: position.farmSequence,
      zoneCode: position.zoneCode,
      rowCode: position.rowCode,
      treeSequence: position.treeSequence,
      tagCode: position.tagCode,
      positionStatus: position.positionStatus,
      currentCycleNumber: position.currentCycleNumber,
      qrPath: position.qrPath,
      version: position.version,
      lastEventId: position.timeline[0]?.eventId ?? 'seed',
      classification: 'SIMULATED/TEST ONLY',
      exampleData: true,
      createdBy: 'system_demo',
      createdAt: serverTimestamp(),
      updatedBy: 'system_demo',
      updatedAt: serverTimestamp(),
    })
    for (const cycle of position.plantingCycles) {
      plantingCycles += 1
      await setDoc(doc(reference, 'plantingCycles', cycle.cycleId), {
        recordType: 'PLANTING_CYCLE',
        cycleId: cycle.cycleId,
        cycleNumber: cycle.cycleNumber,
        variety: cycle.variety,
        varietyConfidence: cycle.varietyConfidence,
        plantingYear: cycle.plantingYear,
        plantingYearCalendar: cycle.plantingYearCalendar,
        plantingYearConfidence: cycle.plantingYearConfidence,
        treeStatus: cycle.treeStatus,
        baselineDate: cycle.baselineDate,
        notes: cycle.notes,
        startedAt: serverTimestamp(),
        endedAt: cycle.endedAtLabel ? serverTimestamp() : null,
        version: cycle.version,
        createdBy: 'system_demo',
        updatedBy: 'system_demo',
        updatedAt: serverTimestamp(),
        classification: 'SIMULATED/TEST ONLY',
        exampleData: true,
      })
    }
    for (const event of position.timeline) {
      treeEvents += 1
      await setDoc(doc(reference, 'events', event.eventId), {
        recordType: 'TREE_EVENT',
        eventId: event.eventId,
        eventType: event.eventType,
        organizationId: position.organizationId,
        farmId: position.farmId,
        positionId: position.positionId,
        actorUserId: event.actorUserId,
        actorDisplayName: event.actorDisplayName,
        description: event.description,
        positionVersion: event.positionVersion,
        classification: 'SIMULATED/TEST ONLY',
        exampleData: true,
        createdAt: serverTimestamp(),
      })
    }
    await setDoc(farmDoc(
      firestore,
      rootSegments,
      position.organizationId,
      position.farmId,
      'treeTags',
      position.tagCode,
    ), {
      recordType: 'TREE_TAG_INDEX',
      organizationId: position.organizationId,
      farmId: position.farmId,
      positionId: position.positionId,
      tagCode: position.tagCode,
      classification: 'SIMULATED/TEST ONLY',
      exampleData: true,
      createdBy: 'system_demo',
      createdAt: serverTimestamp(),
    })
    await setDoc(scopedDoc(firestore, rootSegments, 'positionRoutes', position.positionId), {
      recordType: 'POSITION_ROUTE',
      organizationId: position.organizationId,
      farmId: position.farmId,
      positionId: position.positionId,
      classification: 'SIMULATED/TEST ONLY',
      exampleData: true,
      createdBy: 'system_demo',
      createdAt: serverTimestamp(),
    })
  }
  return {
    treePositions: seed.treePositions.length,
    plantingCycles,
    treeEvents,
    treeTags: seed.treePositions.length,
    positionRoutes: seed.treePositions.length,
  }
}

function workEventState(status) {
  const states = {
    DRAFT: ['WORK_CREATED', 'DRAFT'],
    ASSIGNED: ['WORK_ASSIGNED', 'DRAFT'],
    ACCEPTED: ['WORK_ACCEPTED', 'ASSIGNED'],
    IN_PROGRESS: ['WORK_STARTED', 'ACCEPTED'],
    SUBMITTED: ['WORK_SUBMITTED', 'IN_PROGRESS'],
    VERIFIED: ['WORK_VERIFIED', 'SUBMITTED'],
    REJECTED: ['WORK_REJECTED', 'SUBMITTED'],
    REWORK: ['WORK_REWORK_REQUESTED', 'SUBMITTED'],
    CLOSED: ['WORK_CLOSED', 'VERIFIED'],
  }
  return states[status] ?? ['WORK_CREATED', status]
}

export async function seedWorkCareDisease({
  firestore,
  storage,
  packs,
  rootSegments = [],
  userMappings,
  skipStorageUploads = false,
}) {
  assertMockPack(packs.work, 'Phase 4')
  let workEvents = 0
  let storagePhotos = 0
  for (const work of packs.work.workOrders) {
    const eventId = `workevt_seed_${work.workOrderId}`
    const reference = farmDoc(
      firestore,
      rootSegments,
      work.organizationId,
      work.farmId,
      'workOrders',
      work.workOrderId,
    )
    const report = work.report
      ? {
          ...work.report,
          submittedBy: uidFor(userMappings, work.report.submittedBy),
          submittedAtLabel: packs.work.metadata.fixedClock,
        }
      : null
    await setDoc(reference, {
      recordType: 'WORK_ORDER',
      organizationId: work.organizationId,
      farmId: work.farmId,
      workOrderId: work.workOrderId,
      title: work.title,
      description: work.description,
      category: work.category,
      careType: work.careType,
      priority: work.priority,
      target: work.target,
      dueDate: work.dueDate,
      assignedUserId: work.assignedUserId ? uidFor(userMappings, work.assignedUserId) : null,
      status: work.status,
      isPaused: work.isPaused,
      instructionPhotos: work.instructionPhotos ?? [],
      report,
      targetConfirmedPositionId: work.targetConfirmedPositionId,
      rejectionReason: work.rejectionReason,
      reworkReason: work.reworkReason,
      sourceDiseaseIncidentId: work.sourceDiseaseIncidentId ?? null,
      version: work.version,
      lastEventId: eventId,
      classification: 'SIMULATED/TEST ONLY',
      exampleData: true,
      createdBy: uidFor(userMappings, work.createdBy),
      createdAt: serverTimestamp(),
      updatedBy: uidFor(userMappings, work.createdBy),
      updatedAt: serverTimestamp(),
    })
    const [eventType, beforeStatus] = workEventState(work.status)
    await setDoc(doc(reference, 'events', eventId), {
      recordType: 'WORK_EVENT',
      organizationId: work.organizationId,
      farmId: work.farmId,
      workOrderId: work.workOrderId,
      eventId,
      eventType,
      actorUserId: uidFor(userMappings, work.createdBy),
      actorDisplayName: 'ผู้ใช้ระบบจำลอง',
      beforeStatus,
      afterStatus: work.status,
      reason: packs.work.metadata.classification,
      workVersion: work.version,
      classification: 'SIMULATED/TEST ONLY',
      exampleData: true,
      createdAt: serverTimestamp(),
    })
    workEvents += 1

    const photos = [
      ...(work.instructionPhotos ?? []).map((photo) => ({
        ...photo,
        uploadedBy: uidFor(userMappings, work.createdBy),
      })),
      ...(work.report?.photos ?? []).map((photo) => ({
        ...photo,
        uploadedBy: uidFor(userMappings, work.report.submittedBy),
      })),
    ]
    for (const photo of photos) {
      if (!skipStorageUploads) {
        await uploadPlaceholder(storage, photo.storagePath, {
          organizationId: work.organizationId,
          farmId: work.farmId,
          workOrderId: work.workOrderId,
          uploadedBy: photo.uploadedBy,
          evidencePhase: photo.phase,
          uploadSessionId: photo.photoId,
          processingVersion: 'SEED_PLACEHOLDER_V1',
          processingMode: 'SYNTHETIC_PLACEHOLDER',
        })
        storagePhotos += 1
      }
    }
  }

  let careEvents = 0
  for (const care of packs.work.careEvents) {
    const eventId = `careevt_seed_${care.careEventId}`
    const reference = farmDoc(
      firestore,
      rootSegments,
      care.organizationId,
      care.farmId,
      'careEvents',
      care.careEventId,
    )
    await setDoc(reference, {
      recordType: 'CARE_EVENT',
      organizationId: care.organizationId,
      farmId: care.farmId,
      careEventId: care.careEventId,
      workOrderId: care.workOrderId,
      careType: care.careType,
      positionIds: care.positionIds,
      materials: care.materials,
      notes: care.notes,
      approvalStatus: care.approvalStatus,
      approvedBy: care.approvedBy ? uidFor(userMappings, care.approvedBy) : null,
      version: care.version,
      lastEventId: eventId,
      classification: 'SIMULATED/TEST ONLY',
      exampleData: true,
      createdBy: uidFor(userMappings, 'user_demo_owner_01'),
      createdAt: serverTimestamp(),
      updatedBy: uidFor(userMappings, 'user_demo_owner_01'),
      updatedAt: serverTimestamp(),
    })
    await setDoc(doc(reference, 'events', eventId), {
      recordType: 'CARE_EVENT_AUDIT',
      organizationId: care.organizationId,
      farmId: care.farmId,
      careEventId: care.careEventId,
      eventId,
      eventType: 'CARE_RECORDED',
      actorUserId: uidFor(userMappings, 'user_demo_owner_01'),
      careVersion: care.version,
      classification: 'SIMULATED/TEST ONLY',
      exampleData: true,
      createdAt: serverTimestamp(),
    })
    careEvents += 1
  }

  let diseaseEvents = 0
  let diseasePhotos = 0
  for (const incident of packs.work.diseaseIncidents) {
    const eventId = `diseaseevt_seed_${incident.incidentId}`
    const reference = farmDoc(
      firestore,
      rootSegments,
      incident.organizationId,
      incident.farmId,
      'diseaseIncidents',
      incident.incidentId,
    )
    await setDoc(reference, {
      recordType: 'DISEASE_INCIDENT',
      organizationId: incident.organizationId,
      farmId: incident.farmId,
      incidentId: incident.incidentId,
      positionId: incident.positionId,
      observedSymptom: incident.observedSymptom,
      severity: incident.severity,
      suspectedDiagnosis: incident.suspectedDiagnosis,
      confirmedDiagnosis: incident.confirmedDiagnosis,
      treatmentPlan: incident.treatmentPlan,
      followUpDate: incident.followUpDate,
      status: incident.status,
      specialistApprovalStatus: incident.specialistApprovalStatus,
      outcome: incident.outcome,
      treatmentWorkOrderId: incident.treatmentWorkOrderId ?? null,
      treatmentOperationId: null,
      version: incident.version,
      lastEventId: eventId,
      classification: 'SIMULATED/TEST ONLY',
      exampleData: true,
      reportedBy: uidFor(userMappings, incident.reportedBy),
      createdAt: serverTimestamp(),
      updatedBy: uidFor(userMappings, incident.reportedBy),
      updatedAt: serverTimestamp(),
    })
    await setDoc(doc(reference, 'events', eventId), {
      recordType: 'DISEASE_EVENT',
      organizationId: incident.organizationId,
      farmId: incident.farmId,
      incidentId: incident.incidentId,
      eventId,
      eventType: 'SYMPTOM_OBSERVED',
      actorUserId: uidFor(userMappings, incident.reportedBy),
      actorDisplayName: 'ผู้รายงานจำลอง',
      description: incident.observedSymptom,
      incidentVersion: incident.version,
      classification: 'SIMULATED/TEST ONLY',
      exampleData: true,
      createdAt: serverTimestamp(),
    })
    diseaseEvents += 1
    for (const photo of incident.photos ?? []) {
      await setDoc(doc(reference, 'photos', photo.photoId), {
        ...photo,
        organizationId: incident.organizationId,
        farmId: incident.farmId,
        incidentId: incident.incidentId,
        positionId: incident.positionId,
        createdBy: uidFor(userMappings, photo.createdBy),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      diseasePhotos += 1
    }
  }

  return {
    workOrders: packs.work.workOrders.length,
    workEvents,
    storagePhotos,
    careRecords: packs.work.careEvents.length,
    careEvents,
    diseaseIncidents: packs.work.diseaseIncidents.length,
    diseaseEvents,
    diseasePhotos,
  }
}

export async function seedAnnualCycles({ firestore, packs, rootSegments = [], userMappings }) {
  assertMockPack(packs.annualCycles, 'Annual Farm Management Cycle')
  for (const cycle of packs.annualCycles.cycles) {
    await setDoc(farmDoc(
      firestore,
      rootSegments,
      cycle.organizationId,
      cycle.farmId,
      'annualCycles',
      cycle.annualCycleId,
    ), {
      ...cycle,
      actorUserId: uidFor(userMappings, cycle.updatedBy),
      createdBy: uidFor(userMappings, cycle.createdBy),
      updatedBy: uidFor(userMappings, cycle.updatedBy),
      classification: 'SIMULATED/TEST ONLY',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    if (cycle.status === 'ACTIVE' || cycle.status === 'CLOSING') {
      await setDoc(farmDoc(
        firestore,
        rootSegments,
        cycle.organizationId,
        cycle.farmId,
        'annualCycleGuards',
        'current',
      ), {
        organizationId: cycle.organizationId,
        farmId: cycle.farmId,
        annualCycleId: cycle.annualCycleId,
        status: cycle.status,
        actorUserId: uidFor(userMappings, cycle.updatedBy),
        classification: 'SIMULATED/TEST ONLY',
        exampleData: true,
        updatedAt: serverTimestamp(),
      })
    }
  }
  for (const plan of packs.annualCycles.planItems) {
    await setDoc(farmDoc(
      firestore,
      rootSegments,
      plan.organizationId,
      plan.farmId,
      'annualPlanItems',
      plan.planItemId,
    ), {
      ...plan,
      actorUserId: uidFor(userMappings, plan.updatedBy),
      createdBy: uidFor(userMappings, plan.createdBy),
      updatedBy: uidFor(userMappings, plan.updatedBy),
      classification: 'SIMULATED/TEST ONLY',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }
  for (const correction of packs.annualCycles.corrections) {
    await setDoc(farmDoc(
      firestore,
      rootSegments,
      correction.organizationId,
      correction.farmId,
      'annualCycleCorrections',
      correction.correctionId,
    ), {
      ...correction,
      actorUserId: uidFor(userMappings, correction.actorUserId),
      classification: 'SIMULATED/TEST ONLY',
      createdAt: serverTimestamp(),
    })
  }
  for (const event of packs.annualCycles.audit) {
    await setDoc(farmDoc(
      firestore,
      rootSegments,
      event.organizationId,
      event.farmId,
      'annualCycleAuditEvents',
      event.eventId,
    ), {
      ...event,
      actorUserId: uidFor(userMappings, event.actorUserId),
      classification: 'SIMULATED/TEST ONLY',
      createdAt: serverTimestamp(),
    })
  }
  return {
    annualCycles: packs.annualCycles.cycles.length,
    annualPlanItems: packs.annualCycles.planItems.length,
    annualCycleCorrections: packs.annualCycles.corrections.length,
    annualCycleAuditEvents: packs.annualCycles.audit.length,
    annualCycleGuards: packs.annualCycles.cycles.filter(
      (cycle) => cycle.status === 'ACTIVE' || cycle.status === 'CLOSING',
    ).length,
  }
}

export async function seedCommercialTraceability({ firestore, packs, rootSegments = [], userMappings }) {
  assertMockPack(packs.commercial, 'Phase 5')
  const collections = [
    ['cropCycles', packs.commercial.cropCycles, 'cropCycleId'],
    ['fruitObservations', packs.commercial.fruitObservations, 'observationId'],
    ['harvestLots', packs.commercial.harvestLots, 'harvestLotId'],
    ['salesLots', packs.commercial.salesLots, 'salesLotId'],
    ['inventoryItems', packs.commercial.inventoryItems, 'itemId'],
    ['inventoryMovements', packs.commercial.inventoryMovements, 'movementId'],
  ]
  for (const [collectionName, records, idField] of collections) {
    for (const record of records) {
      const actorUserId = record.actorUserId
        ? uidFor(userMappings, record.actorUserId)
        : uidFor(userMappings, 'user_demo_owner_01')
      await setDoc(farmDoc(
        firestore,
        rootSegments,
        record.organizationId,
        record.farmId,
        collectionName,
        record[idField],
      ), {
        ...record,
        actorUserId,
        classification: 'SIMULATED/TEST ONLY',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }
  }

  const balances = new Map()
  for (const movement of packs.commercial.inventoryMovements) {
    const key = `${movement.organizationId}:${movement.farmId}:${movement.lotId}`
    const current = balances.get(key) ?? {
      organizationId: movement.organizationId,
      farmId: movement.farmId,
      lotId: movement.lotId,
      itemId: movement.itemId,
      unit: movement.unit,
      balance: 0,
    }
    current.balance += movement.quantityDelta
    balances.set(key, current)
  }
  for (const balance of balances.values()) {
    await setDoc(farmDoc(
      firestore,
      rootSegments,
      balance.organizationId,
      balance.farmId,
      'inventoryBalances',
      balance.lotId,
    ), {
      ...balance,
      version: 1,
      actorUserId: uidFor(userMappings, 'user_demo_owner_01'),
      classification: 'SIMULATED/TEST ONLY',
      exampleData: true,
      updatedAt: serverTimestamp(),
    })
  }

  const auditSources = [
    ...packs.commercial.fruitObservations.map((record) => ['FRUIT_OBSERVATION', record.observationId, record]),
    ...packs.commercial.harvestLots.map((record) => ['HARVEST_LOT', record.harvestLotId, record]),
    ...packs.commercial.salesLots.map((record) => ['SALES_LOT', record.salesLotId, record]),
    ...packs.commercial.inventoryMovements.map((record) => ['INVENTORY_MOVEMENT', record.movementId, record]),
  ]
  for (const [recordKind, recordId, record] of auditSources) {
    const eventId = `commercial_seed_${recordId}`
    await setDoc(farmDoc(
      firestore,
      rootSegments,
      record.organizationId,
      record.farmId,
      'commercialAuditEvents',
      eventId,
    ), {
      eventId,
      recordKind,
      recordId,
      eventType: recordKind === 'INVENTORY_MOVEMENT' ? 'STOCK_RECORDED' : 'CREATED',
      actorUserId: record.actorUserId
        ? uidFor(userMappings, record.actorUserId)
        : uidFor(userMappings, 'user_demo_owner_01'),
      actorDisplayName: 'ผู้ใช้ระบบจำลอง',
      reason: 'SIMULATED/TEST ONLY — deterministic seed',
      beforeSummary: '',
      afterSummary: `seeded:${recordId}`,
      recordVersion: record.version,
      createdAtLabel: packs.commercial.metadata.fixedClock,
      organizationId: record.organizationId,
      farmId: record.farmId,
      classification: 'SIMULATED/TEST ONLY',
      exampleData: true,
      createdAt: serverTimestamp(),
    })
  }

  return {
    cropCycles: packs.commercial.cropCycles.length,
    fruitObservations: packs.commercial.fruitObservations.length,
    harvestLots: packs.commercial.harvestLots.length,
    salesLots: packs.commercial.salesLots.length,
    inventoryItems: packs.commercial.inventoryItems.length,
    inventoryMovements: packs.commercial.inventoryMovements.length,
    inventoryBalances: balances.size,
    commercialAuditEvents: auditSources.length,
  }
}

export async function seedOperationalHardening({ firestore, packs, rootSegments = [], userMappings }) {
  const dashboards = packs.operations.farmDashboards
  const dashboardRoles = [
    'ORG_OWNER', 'FARM_MANAGER', 'AGRONOMIST', 'WORKER', 'SALES_INVENTORY', 'VIEWER',
  ]
  for (const dashboard of dashboards) {
    for (const role of dashboardRoles) {
      const view = structuredClone(dashboard)
      if (role === 'WORKER') {
        view.fruitEstimate = { count: null, unit: 'fruit', quality: 'UNKNOWN' }
        view.harvestAvailableKg = 0
        view.inventoryWarningCount = 0
        view.salesGrossBaht = 0
        view.salesOutstandingBaht = 0
      }
      if (role === 'AGRONOMIST') {
        view.inventoryWarningCount = 0
        view.salesGrossBaht = 0
        view.salesOutstandingBaht = 0
      }
      if (role === 'SALES_INVENTORY') {
        view.treeHealth = { normal: 0, watch: 0, sick: 0, recovering: 0, dead: 0, empty: 0 }
        view.urgentDiseaseCount = 0
      }
      await setDoc(farmDoc(
        firestore,
        rootSegments,
        dashboard.organizationId,
        dashboard.farmId,
        'dashboardViews',
        role,
      ), {
        ...view,
        roleBucket: role,
        classification: 'SIMULATED/TEST ONLY',
        updatedAt: serverTimestamp(),
      })
    }
  }

  for (const operation of packs.operations.offlineOperations) {
    await setDoc(farmDoc(
      firestore,
      rootSegments,
      operation.organizationId,
      operation.farmId,
      'offlineOperations',
      operation.operationId,
    ), {
      ...operation,
      actorUserId: uidFor(userMappings, operation.actorUserId),
      classification: 'SIMULATED/TEST ONLY',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }
  for (const conflict of packs.operations.masterConflicts) {
    await setDoc(farmDoc(
      firestore,
      rootSegments,
      conflict.organizationId,
      conflict.farmId,
      'masterConflicts',
      conflict.conflictId,
    ), {
      ...conflict,
      classification: 'SIMULATED/TEST ONLY',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }
  for (const recovery of packs.operations.photoRecoveries) {
    await setDoc(farmDoc(
      firestore,
      rootSegments,
      recovery.organizationId,
      recovery.farmId,
      'photoRecoveries',
      recovery.recoveryId,
    ), {
      ...recovery,
      actorUserId: uidFor(userMappings, recovery.actorUserId),
      classification: 'SIMULATED/TEST ONLY',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }
  for (const event of packs.operations.auditEvents) {
    await setDoc(farmDoc(
      firestore,
      rootSegments,
      event.organizationId,
      event.farmId,
      'operationalAuditEvents',
      event.eventId,
    ), {
      ...event,
      actorUserId: uidFor(userMappings, event.actorUserId),
      classification: 'SIMULATED/TEST ONLY',
      createdAt: serverTimestamp(),
    })
  }
  return {
    dashboardViews: dashboards.length * dashboardRoles.length,
    offlineOperations: packs.operations.offlineOperations.length,
    masterConflicts: packs.operations.masterConflicts.length,
    photoRecoveries: packs.operations.photoRecoveries.length,
    operationalAuditEvents: packs.operations.auditEvents.length,
  }
}

export async function seedDiseaseAnalysis({ firestore, packs, rootSegments = [], userMappings }) {
  assertMockPack(packs.diseaseAnalysis, 'Disease Analysis P1')
  let analysisEvents = 0
  for (const session of packs.diseaseAnalysis.analysisSessions) {
    const lastEvent = session.audit.at(-1)
    if (!lastEvent) throw new Error(`Disease Analysis Session ${session.analysisSessionId} has no audit event`)
    const reference = farmDoc(
      firestore,
      rootSegments,
      session.organizationId,
      session.farmId,
      'diseaseAnalysisSessions',
      session.analysisSessionId,
    )
    await setDoc(reference, {
      recordType: 'DISEASE_ANALYSIS_SESSION',
      organizationId: session.organizationId,
      farmId: session.farmId,
      analysisSessionId: session.analysisSessionId,
      incidentId: session.incidentId,
      positionId: session.positionId,
      plantingCycleId: session.plantingCycleId,
      evidenceScenario: session.evidenceScenario,
      observedSymptom: session.observedSymptom,
      analysisSource: 'MOCK_DETERMINISTIC_V1',
      classification: 'SIMULATED/TEST ONLY',
      status: session.status,
      qualityScorePercent: session.qualityScorePercent,
      candidateFindings: session.candidateFindings,
      abstainReason: session.abstainReason,
      reviewedBy: session.reviewedBy ? uidFor(userMappings, session.reviewedBy) : null,
      reviewDisposition: session.reviewDisposition,
      reviewedFindingLabel: session.reviewedFindingLabel,
      reviewNote: session.reviewNote,
      diagnosisWritebackStatus: 'NOT_WRITTEN',
      version: session.version,
      lastEventId: lastEvent.eventId,
      createdBy: uidFor(userMappings, session.createdBy),
      updatedBy: uidFor(userMappings, session.createdBy),
      exampleData: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    for (const event of session.audit) {
      await setDoc(doc(reference, 'events', event.eventId), {
        recordType: 'DISEASE_ANALYSIS_EVENT',
        eventId: event.eventId,
        eventType: event.eventType,
        organizationId: session.organizationId,
        farmId: session.farmId,
        analysisSessionId: session.analysisSessionId,
        actorUserId: uidFor(userMappings, event.actorUserId),
        actorDisplayName: event.actorDisplayName,
        description: event.description,
        sessionVersion: event.sessionVersion,
        classification: 'SIMULATED/TEST ONLY',
        exampleData: true,
        createdAt: serverTimestamp(),
      })
      analysisEvents += 1
    }
  }
  return {
    diseaseAnalysisSessions: packs.diseaseAnalysis.analysisSessions.length,
    diseaseAnalysisEvents: analysisEvents,
  }
}

export const seeders = Object.freeze({
  foundation: seedFoundation,
  'annual-cycles': seedAnnualCycles,
  trees: seedTreeRegister,
  work: seedWorkCareDisease,
  commercial: seedCommercialTraceability,
  operations: seedOperationalHardening,
  'disease-analysis': seedDiseaseAnalysis,
})
