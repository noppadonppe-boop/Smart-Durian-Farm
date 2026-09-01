import { readFile } from 'node:fs/promises'

import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'

const projectId = 'demo-smart-durian'
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099'
const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080'
const authBaseUrl = `http://${authHost}`
const seed = JSON.parse(
  await readFile(new URL('../src/demo/phase2-demo-seed.json', import.meta.url), 'utf8'),
)
const phase4Seed = JSON.parse(
  await readFile(new URL('../src/demo/phase4-mock-data-pack-v1.0.json', import.meta.url), 'utf8'),
)
const phase5Seed = JSON.parse(
  await readFile(new URL('../src/demo/phase5-mock-data-pack-v1.0.json', import.meta.url), 'utf8'),
)
const phase6Seed = JSON.parse(
  await readFile(new URL('../src/demo/phase6-mock-data-pack-v1.0.json', import.meta.url), 'utf8'),
)
const firestoreRules = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8')

async function jsonResponse(response) {
  const payload = await response.json()
  if (!response.ok) throw new Error(JSON.stringify(payload))
  return payload
}

async function authenticateTestPhone(phoneNumber) {
  const send = await jsonResponse(
    await fetch(
      `${authBaseUrl}/identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=demo-api-key-not-a-secret`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phoneNumber, recaptchaToken: 'emulator-seed-token' }),
      },
    ),
  )
  const verificationPayload = await jsonResponse(
    await fetch(`${authBaseUrl}/emulator/v1/projects/${projectId}/verificationCodes`),
  )
  const verification = verificationPayload.verificationCodes.find(
    (candidate) => candidate.sessionInfo === send.sessionInfo,
  )
  if (!verification) throw new Error(`OTP not found for ${phoneNumber}`)

  return jsonResponse(
    await fetch(
      `${authBaseUrl}/identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber?key=demo-api-key-not-a-secret`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionInfo: send.sessionInfo, code: verification.code }),
      },
    ),
  )
}

const clearAuthResponse = await fetch(
  `${authBaseUrl}/emulator/v1/projects/${projectId}/accounts`,
  { method: 'DELETE' },
)
if (!clearAuthResponse.ok) {
  throw new Error(`Authentication Emulator reset failed: ${clearAuthResponse.status}`)
}

const userMappings = new Map()
for (const user of seed.users) {
  const auth = await authenticateTestPhone(user.phoneNumber)
  userMappings.set(user.userId, { ...user, firebaseUserId: auth.localId })
}

const [firestoreHostname, firestorePortText] = firestoreHost.split(':')
const environment = await initializeTestEnvironment({
  projectId,
  firestore: {
    rules: firestoreRules,
    host: firestoreHostname,
    port: Number(firestorePortText),
  },
})

await environment.clearFirestore()
await environment.clearStorage()

await environment.withSecurityRulesDisabled(async (context) => {
  const firestore = context.firestore()
  await setDoc(doc(firestore, 'organizations', seed.organization.organizationId), {
    ...seed.organization,
    status: 'ACTIVE',
    exampleData: true,
    updatedAt: serverTimestamp(),
  })

  for (const mapping of userMappings.values()) {
    await setDoc(
      doc(
        firestore,
        'organizations',
        seed.organization.organizationId,
        'members',
        mapping.firebaseUserId,
      ),
      {
        organizationId: seed.organization.organizationId,
        userId: mapping.firebaseUserId,
        status: 'ACTIVE',
        isOwner: mapping.isOrganizationOwner,
        exampleData: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
    )
  }

  for (const farm of seed.farms) {
    await setDoc(
      doc(
        firestore,
        'organizations',
        seed.organization.organizationId,
        'farms',
        farm.farmId,
      ),
      {
        organizationId: seed.organization.organizationId,
        ...farm,
        exampleData: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
    )
  }

  for (const mapping of userMappings.values()) {
    for (const membership of mapping.memberships) {
      await setDoc(
        doc(
          firestore,
          'organizations',
          seed.organization.organizationId,
          'farms',
          membership.farmId,
          'members',
          mapping.firebaseUserId,
        ),
        {
          membershipType: 'FARM',
          organizationId: seed.organization.organizationId,
          farmId: membership.farmId,
          userId: mapping.firebaseUserId,
          displayName: mapping.displayName,
          maskedPhone: `${mapping.phoneNumber.slice(0, 4)}••••${mapping.phoneNumber.slice(-3)}`,
          role: membership.role,
          status: membership.status,
          version: membership.version,
          auditEventId: 'seed',
          exampleData: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
      )
    }
  }

  for (const position of seed.treePositions) {
    const positionReference = doc(
      firestore,
      'organizations',
      position.organizationId,
      'farms',
      position.farmId,
      'treePositions',
      position.positionId,
    )
    await setDoc(positionReference, {
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
      exampleData: true,
      createdBy: 'system_demo',
      createdAt: serverTimestamp(),
      updatedBy: 'system_demo',
      updatedAt: serverTimestamp(),
    })
    for (const cycle of position.plantingCycles) {
      await setDoc(doc(positionReference, 'plantingCycles', cycle.cycleId), {
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
        exampleData: true,
      })
    }
    for (const event of position.timeline) {
      await setDoc(doc(positionReference, 'events', event.eventId), {
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
        exampleData: true,
        createdAt: serverTimestamp(),
      })
    }
    await setDoc(
      doc(
        firestore,
        'organizations',
        position.organizationId,
        'farms',
        position.farmId,
        'treeTags',
        position.tagCode,
      ),
      {
        recordType: 'TREE_TAG_INDEX',
        organizationId: position.organizationId,
        farmId: position.farmId,
        positionId: position.positionId,
        tagCode: position.tagCode,
        exampleData: true,
        createdBy: 'system_demo',
        createdAt: serverTimestamp(),
      },
    )
    await setDoc(doc(firestore, 'positionRoutes', position.positionId), {
      recordType: 'POSITION_ROUTE',
      organizationId: position.organizationId,
      farmId: position.farmId,
      positionId: position.positionId,
      exampleData: true,
      createdBy: 'system_demo',
      createdAt: serverTimestamp(),
    })
  }

  const uidFor = (logicalUserId) =>
    userMappings.get(logicalUserId)?.firebaseUserId ?? logicalUserId

  for (const work of phase4Seed.workOrders) {
    const eventId = `workevt_seed_${work.workOrderId}`
    const reference = doc(
      firestore, 'organizations', work.organizationId,
      'farms', work.farmId, 'workOrders', work.workOrderId,
    )
    const report = work.report
      ? {
          ...work.report,
          submittedBy: uidFor(work.report.submittedBy),
          submittedAtLabel: phase4Seed.metadata.fixedClock,
        }
      : null
    await setDoc(reference, {
      recordType: 'WORK_ORDER', organizationId: work.organizationId,
      farmId: work.farmId, workOrderId: work.workOrderId,
      title: work.title, description: work.description, category: work.category,
      careType: work.careType, priority: work.priority, target: work.target,
      dueDate: work.dueDate, assignedUserId: work.assignedUserId ? uidFor(work.assignedUserId) : null,
      status: work.status, isPaused: work.isPaused,
      instructionPhotos: work.instructionPhotos ?? [], report,
      targetConfirmedPositionId: work.targetConfirmedPositionId,
      rejectionReason: work.rejectionReason, reworkReason: work.reworkReason,
      sourceDiseaseIncidentId: work.sourceDiseaseIncidentId ?? null,
      version: work.version, lastEventId: eventId, exampleData: true,
      createdBy: uidFor(work.createdBy), createdAt: serverTimestamp(),
      updatedBy: uidFor(work.createdBy), updatedAt: serverTimestamp(),
    })
    await setDoc(doc(reference, 'events', eventId), {
      recordType: 'WORK_EVENT', organizationId: work.organizationId,
      farmId: work.farmId, workOrderId: work.workOrderId, eventId,
      eventType: work.status == 'ASSIGNED' ? 'WORK_ASSIGNED' : 'WORK_VERIFIED',
      actorUserId: uidFor(work.createdBy), actorDisplayName: 'ผู้ใช้ระบบจำลอง',
      beforeStatus: work.status == 'ASSIGNED' ? 'DRAFT' : 'SUBMITTED',
      afterStatus: work.status, reason: phase4Seed.metadata.classification,
      workVersion: work.version, exampleData: true, createdAt: serverTimestamp(),
    })
  }

  for (const care of phase4Seed.careEvents) {
    const eventId = `careevt_seed_${care.careEventId}`
    const reference = doc(
      firestore, 'organizations', care.organizationId,
      'farms', care.farmId, 'careEvents', care.careEventId,
    )
    await setDoc(reference, {
      recordType: 'CARE_EVENT', organizationId: care.organizationId,
      farmId: care.farmId, careEventId: care.careEventId,
      workOrderId: care.workOrderId, careType: care.careType,
      positionIds: care.positionIds, materials: care.materials, notes: care.notes,
      approvalStatus: care.approvalStatus,
      approvedBy: care.approvedBy ? uidFor(care.approvedBy) : null,
      version: care.version, lastEventId: eventId, exampleData: true,
      createdBy: uidFor('user_demo_owner_01'), createdAt: serverTimestamp(),
      updatedBy: uidFor('user_demo_owner_01'), updatedAt: serverTimestamp(),
    })
    await setDoc(doc(reference, 'events', eventId), {
      recordType: 'CARE_EVENT_AUDIT', organizationId: care.organizationId,
      farmId: care.farmId, careEventId: care.careEventId, eventId,
      eventType: 'CARE_RECORDED', actorUserId: uidFor('user_demo_owner_01'),
      careVersion: care.version, exampleData: true, createdAt: serverTimestamp(),
    })
  }

  for (const incident of phase4Seed.diseaseIncidents) {
    const eventId = `diseaseevt_seed_${incident.incidentId}`
    const reference = doc(
      firestore, 'organizations', incident.organizationId,
      'farms', incident.farmId, 'diseaseIncidents', incident.incidentId,
    )
    await setDoc(reference, {
      recordType: 'DISEASE_INCIDENT', organizationId: incident.organizationId,
      farmId: incident.farmId, incidentId: incident.incidentId,
      positionId: incident.positionId, observedSymptom: incident.observedSymptom,
      severity: incident.severity, suspectedDiagnosis: incident.suspectedDiagnosis,
      confirmedDiagnosis: incident.confirmedDiagnosis, treatmentPlan: incident.treatmentPlan,
      followUpDate: incident.followUpDate, status: incident.status,
      specialistApprovalStatus: incident.specialistApprovalStatus,
      outcome: incident.outcome,
      treatmentWorkOrderId: incident.treatmentWorkOrderId ?? null,
      treatmentOperationId: null,
      version: incident.version, lastEventId: eventId,
      exampleData: true, reportedBy: uidFor(incident.reportedBy),
      createdAt: serverTimestamp(), updatedBy: uidFor(incident.reportedBy),
      updatedAt: serverTimestamp(),
    })
    await setDoc(doc(reference, 'events', eventId), {
      recordType: 'DISEASE_EVENT', organizationId: incident.organizationId,
      farmId: incident.farmId, incidentId: incident.incidentId, eventId,
      eventType: 'SYMPTOM_OBSERVED', actorUserId: uidFor(incident.reportedBy),
      actorDisplayName: 'ผู้รายงานจำลอง', description: incident.observedSymptom,
      incidentVersion: incident.version, exampleData: true, createdAt: serverTimestamp(),
    })
  }

  const phase5Collections = [
    ['cropCycles', phase5Seed.cropCycles, 'cropCycleId'],
    ['fruitObservations', phase5Seed.fruitObservations, 'observationId'],
    ['harvestLots', phase5Seed.harvestLots, 'harvestLotId'],
    ['salesLots', phase5Seed.salesLots, 'salesLotId'],
    ['inventoryItems', phase5Seed.inventoryItems, 'itemId'],
    ['inventoryMovements', phase5Seed.inventoryMovements, 'movementId'],
  ]
  for (const [collectionName, records, idField] of phase5Collections) {
    for (const record of records) {
      const recordId = record[idField]
      const actorUserId = record.actorUserId ? uidFor(record.actorUserId) : uidFor('user_demo_owner_01')
      await setDoc(doc(
        firestore, 'organizations', record.organizationId,
        'farms', record.farmId, collectionName, recordId,
      ), {
        ...record,
        actorUserId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }
  }

  const phase5Balances = new Map()
  for (const movement of phase5Seed.inventoryMovements) {
    const key = `${movement.organizationId}:${movement.farmId}:${movement.lotId}`
    const current = phase5Balances.get(key) ?? {
      organizationId: movement.organizationId,
      farmId: movement.farmId,
      lotId: movement.lotId,
      itemId: movement.itemId,
      unit: movement.unit,
      balance: 0,
    }
    current.balance += movement.quantityDelta
    phase5Balances.set(key, current)
  }
  for (const balance of phase5Balances.values()) {
    await setDoc(doc(
      firestore, 'organizations', balance.organizationId,
      'farms', balance.farmId, 'inventoryBalances', balance.lotId,
    ), {
      ...balance,
      version: 1,
      actorUserId: uidFor('user_demo_owner_01'),
      exampleData: true,
      updatedAt: serverTimestamp(),
    })
  }

  const dashboardRoles = [
    'ORG_OWNER', 'FARM_MANAGER', 'AGRONOMIST', 'WORKER', 'SALES_INVENTORY', 'VIEWER',
  ]
  for (const dashboard of phase6Seed.farmDashboards) {
    for (const role of dashboardRoles) {
      const view = structuredClone(dashboard)
      if (['WORKER'].includes(role)) {
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
      await setDoc(doc(
        firestore, 'organizations', dashboard.organizationId,
        'farms', dashboard.farmId, 'dashboardViews', role,
      ), { ...view, roleBucket: role, updatedAt: serverTimestamp() })
    }
  }

  for (const operation of phase6Seed.offlineOperations) {
    await setDoc(doc(
      firestore, 'organizations', operation.organizationId,
      'farms', operation.farmId, 'offlineOperations', operation.operationId,
    ), {
      ...operation,
      actorUserId: uidFor(operation.actorUserId),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  for (const conflict of phase6Seed.masterConflicts) {
    await setDoc(doc(
      firestore, 'organizations', conflict.organizationId,
      'farms', conflict.farmId, 'masterConflicts', conflict.conflictId,
    ), { ...conflict, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  }

  for (const recovery of phase6Seed.photoRecoveries) {
    await setDoc(doc(
      firestore, 'organizations', recovery.organizationId,
      'farms', recovery.farmId, 'photoRecoveries', recovery.recoveryId,
    ), { ...recovery, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  }

  for (const event of phase6Seed.auditEvents) {
    await setDoc(doc(
      firestore, 'organizations', event.organizationId,
      'farms', event.farmId, 'operationalAuditEvents', event.eventId,
    ), { ...event, createdAt: serverTimestamp() })
  }
})

await environment.cleanup()
console.log(
  `Phase 6 Mock Data Pack ${phase6Seed.metadata.version} reset complete: ${seed.users.length} test accounts, ${seed.farms.length} example farms, ${seed.treePositions.length} example positions, ${phase4Seed.workOrders.length} work orders, ${phase5Seed.cropCycles.length} crop cycles, ${phase5Seed.harvestLots.length} harvest lots, ${phase5Seed.salesLots.length} sales lots, ${phase5Seed.inventoryMovements.length} inventory movements, ${phase6Seed.farmDashboards.length} dashboard fixtures, ${phase6Seed.offlineOperations.length} offline operations, ${phase6Seed.masterConflicts.length} conflicts — ${phase6Seed.metadata.classification}.`,
)
