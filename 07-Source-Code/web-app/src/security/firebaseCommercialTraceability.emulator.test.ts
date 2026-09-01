import { readFile } from 'node:fs/promises'

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, Timestamp, type Firestore } from 'firebase/firestore'

import type { AuthenticatedIdentity, CanonicalRole, FarmAccess } from '../domain/farm'
import { FirebaseCommercialTraceabilityRepository } from '../infrastructure/firebase/firebaseCommercialTraceabilityRepository'

const projectId = 'demo-smart-durian'
const organizationId = 'org_phase5_rules_demo'
const farmA = 'farm_phase5_rules_a'
const farmB = 'farm_phase5_rules_b'
const ownerId = 'phase5_owner_01'
const managerId = 'phase5_manager_02'
const salesId = 'phase5_sales_03'
const agronomistId = 'phase5_agronomist_04'
const workerId = 'phase5_worker_05'
const viewerId = 'phase5_viewer_06'
const auditorId = 'phase5_auditor_07'
const pseudoOwnerId = 'phase5_pseudo_owner_08'
const annualA = 'annual_phase5_a_2026'
const annualB = 'annual_phase5_b_2026'
const cropA = 'crop_phase5_a_001'
const cropB = 'crop_phase5_b_001'
const harvestA = 'harvest_phase5_a_001'
const harvestB = 'harvest_phase5_b_001'
const itemA = 'inventory_item_phase5_a_001'
const lotA = 'inventory_lot_phase5_a_001'
let environment: RulesTestEnvironment

function farmPath(farmId: string): string {
  return `durian-smartfarm/root/organizations/${organizationId}/farms/${farmId}`
}

function identity(userId: string): AuthenticatedIdentity {
  return { userId, displayName: `${userId} จำลอง`, maskedPhone: '000••••000', source: 'firebase-emulator' }
}

function farm(role: CanonicalRole, userId: string, farmId = farmA): FarmAccess {
  return {
    organizationId, organizationName: 'องค์กร Phase 5 จำลอง', organizationCode: 'P5RULES',
    farmId, farmCode: farmId === farmA ? 'P5RULES-F01' : 'P5RULES-F02',
    farmSequence: farmId === farmA ? 'F01' : 'F02', farmName: 'สวน Phase 5 จำลอง',
    farmStatus: 'ACTIVE', membershipStatus: 'ACTIVE', role,
    isOrganizationOwner: userId === ownerId, isMock: true,
  }
}

function repository(userId: string) {
  return new FirebaseCommercialTraceabilityRepository(
    environment.authenticatedContext(userId).firestore() as unknown as Firestore,
  )
}

async function seed() {
  await environment.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore() as unknown as Firestore
    const now = Timestamp.fromDate(new Date('2026-08-31T07:00:00.000Z'))
    await setDoc(doc(firestore, 'durian-smartfarm', 'root', 'organizations', organizationId), {
      organizationId, status: 'ACTIVE', exampleData: true, updatedAt: now,
    })
    const roles = new Map<string, CanonicalRole>([
      [ownerId, 'ORG_OWNER'], [managerId, 'FARM_MANAGER'], [salesId, 'SALES_INVENTORY'],
      [agronomistId, 'AGRONOMIST'], [workerId, 'WORKER'], [viewerId, 'VIEWER'],
      [auditorId, 'AUDITOR'], [pseudoOwnerId, 'ORG_OWNER'],
    ])
    for (const [userId, role] of roles) {
      await setDoc(doc(firestore, 'durian-smartfarm', 'root', 'organizations', organizationId, 'members', userId), {
        organizationId, userId, status: 'ACTIVE', isOwner: userId === ownerId,
        exampleData: true, createdAt: now, updatedAt: now,
      })
      await setDoc(doc(firestore, `${farmPath(farmA)}/members/${userId}`), {
        membershipType: 'FARM', organizationId, farmId: farmA, userId,
        displayName: identity(userId).displayName, maskedPhone: '000••••000', role,
        status: 'ACTIVE', version: 1, auditEventId: 'seed', exampleData: true,
        createdAt: now, updatedAt: now,
      })
    }
    await setDoc(doc(firestore, 'durian-smartfarm', 'root', 'organizations', organizationId, 'members', salesId), {
      organizationId, userId: salesId, status: 'ACTIVE', isOwner: false,
      exampleData: true, createdAt: now, updatedAt: now,
    })
    await setDoc(doc(firestore, `${farmPath(farmB)}/members/${salesId}`), {
      membershipType: 'FARM', organizationId, farmId: farmB, userId: salesId,
      displayName: identity(salesId).displayName, maskedPhone: '000••••000',
      role: 'VIEWER', status: 'ACTIVE', version: 1, auditEventId: 'seed',
      exampleData: true, createdAt: now, updatedAt: now,
    })
    for (const currentFarm of [farmA, farmB]) {
      await setDoc(doc(firestore, farmPath(currentFarm)), {
        organizationId, farmId: currentFarm, status: 'ACTIVE', exampleData: true,
        createdAt: now, updatedAt: now,
      })
    }
    for (const [currentFarm, cropCycleId, code] of [
      [farmA, cropA, 'CROP-A'], [farmB, cropB, 'CROP-B'],
    ] as const) {
      const annualCycleId = currentFarm === farmA ? annualA : annualB
      await setDoc(doc(firestore, `${farmPath(currentFarm)}/annualCycles/${annualCycleId}`), {
        organizationId, farmId: currentFarm, annualCycleId,
        cycleCode: `AFY-${code}`, name: 'Annual Cycle จำลอง',
        periodStart: '2026-06-01', periodEndExclusive: '2027-06-01',
        timezone: 'Asia/Bangkok', notes: 'SIMULATED/TEST ONLY', previousAnnualCycleId: null,
        status: 'ACTIVE', revision: 1, supersedesRevisionId: null,
        lastCorrectionId: null, version: 1, createdBy: ownerId, updatedBy: ownerId,
        createdAtLabel: 'seed', updatedAtLabel: 'seed', exampleData: true,
        actorUserId: ownerId, createdAt: now, updatedAt: now,
      })
      await setDoc(doc(firestore, `${farmPath(currentFarm)}/cropCycles/${cropCycleId}`), {
        organizationId, farmId: currentFarm, annualCycleId, cropCycleId, cycleCode: code,
        name: 'Crop จำลอง', stage: 'PRE_SALE', zoneCodes: ['Z01'],
        varietyReference: 'VARIETY-DEMO', expectedHarvestDate: '2026-09-15',
        status: 'ACTIVE', version: 1, exampleData: true, actorUserId: ownerId,
        createdAt: now, updatedAt: now,
      })
    }
    for (const [currentFarm, harvestLotId, cropCycleId, code] of [
      [farmA, harvestA, cropA, 'H-A'], [farmB, harvestB, cropB, 'H-B'],
    ] as const) {
      await setDoc(doc(firestore, `${farmPath(currentFarm)}/harvestLots/${harvestLotId}`), {
        organizationId, farmId: currentFarm, harvestLotId, cropCycleId, lotCode: code,
        harvestedOn: '2026-08-31', positionIds: [], zoneCodes: ['Z01'],
        quantityFruit: 100, totalWeightKg: 250, valueQuality: 'MEASURED', grades: [],
        note: 'SIMULATED/TEST ONLY', status: 'HARVESTING', soldWeightKg: 0,
        actorUserId: ownerId, createdAtLabel: 'seed', version: 1, exampleData: true,
        audit: [], createdAt: now, updatedAt: now,
      })
    }
    await setDoc(doc(firestore, `${farmPath(farmA)}/inventoryItems/${itemA}`), {
      organizationId, farmId: farmA, itemId: itemA, itemCode: 'ITEM-A',
      name: 'วัสดุจำลอง', baseUnit: 'kg', reorderLevel: 5,
      lots: [{ lotId: lotA, lotCode: 'LOT-A', expiresOn: null }],
      status: 'ACTIVE', version: 1, exampleData: true, actorUserId: ownerId,
      createdAt: now, updatedAt: now,
    })
    await setDoc(doc(firestore, `${farmPath(farmA)}/inventoryBalances/${lotA}`), {
      organizationId, farmId: farmA, itemId: itemA, lotId: lotA, unit: 'kg',
      balance: 20, version: 1, exampleData: true, actorUserId: ownerId, updatedAt: now,
    })
    await setDoc(doc(firestore, `${farmPath(farmA)}/inventoryMovements/seed_receipt`), {
      organizationId, farmId: farmA, movementId: 'seed_receipt', itemId: itemA,
      lotId: lotA, movementType: 'RECEIPT', quantity: 20, quantityDelta: 20,
      unit: 'kg', reason: 'Seed', referenceType: 'PURCHASE_REFERENCE',
      referenceId: 'SEED', dataClass: 'OPERATIONAL',
      actorUserId: ownerId, createdAtLabel: 'seed', version: 1, exampleData: true,
      audit: [], createdAt: now, updatedAt: now,
    })
    await setDoc(doc(firestore, `${farmPath(farmA)}/inventoryMovementFinancials/seed_receipt`), {
      organizationId, farmId: farmA, movementId: 'seed_receipt',
      directUnitCostBaht: 10, directCostBaht: 200, actorUserId: ownerId,
      createdAtLabel: 'seed', version: 1, exampleData: true, createdAt: now, updatedAt: now,
    })
    await setDoc(doc(firestore, `${farmPath(farmA)}/salesFinancials/seed_financial`), {
      organizationId, farmId: farmA, salesLotId: 'seed_financial', customerReference: 'OWNER-ONLY',
      unitPriceBahtPerKg: 100, depositBaht: 0, receivedBaht: 0,
      grossAmountBaht: 1000, outstandingBaht: 1000, paymentStatus: 'UNPAID',
      actorUserId: ownerId, createdAtLabel: 'seed', version: 1, exampleData: true,
      createdAt: now, updatedAt: now,
    })
    await setDoc(doc(firestore, `${farmPath(farmA)}/commercialFinancialAuditEvents/seed_financial_audit`), {
      eventId: 'seed_financial_audit', organizationId, farmId: farmA, actorUserId: ownerId,
      eventType: 'CREATED', targetType: 'SALES_LOT', targetId: 'seed_financial',
      reason: 'Owner-only seed', beforeSummary: '', afterSummary: '1000 THB',
      version: 1, amountBaht: 1000, createdAtLabel: 'seed', exampleData: true, createdAt: now,
    })
    await setDoc(doc(firestore, `${farmPath(farmA)}/annualPlanFinancials/seed_plan`), {
      organizationId, farmId: farmA, planItemId: 'seed_plan', plannedDirectCostBaht: 1000,
      actorUserId: ownerId, version: 1, exampleData: true, createdAt: now, updatedAt: now,
    })
    await setDoc(doc(firestore, `${farmPath(farmA)}/managementLaborCosts/seed_labor`), {
      organizationId, farmId: farmA, costId: 'seed_labor', amountBaht: 500,
      actorUserId: ownerId, version: 1, exampleData: true, createdAt: now, updatedAt: now,
    })
    await setDoc(doc(firestore, `${farmPath(farmA)}/managementOperatingExpenses/seed_expense`), {
      organizationId, farmId: farmA, expenseId: 'seed_expense', amountBaht: 300,
      actorUserId: ownerId, version: 1, exampleData: true, createdAt: now, updatedAt: now,
    })
    await setDoc(doc(firestore, `${farmPath(farmA)}/managementFinancialAuditEvents/seed_management_audit`), {
      organizationId, farmId: farmA, eventId: 'seed_management_audit', amountBaht: 300,
      actorUserId: ownerId, version: 1, exampleData: true, createdAt: now, updatedAt: now,
    })
    await setDoc(doc(firestore, `${farmPath(farmA)}/financialDashboardViews/summary`), {
      organizationId, farmId: farmA, salesGrossBaht: 1000, salesOutstandingBaht: 1000,
      lastCalculatedAtLabel: 'seed', exampleData: true, updatedAt: now,
    })
    await setDoc(doc(firestore, `${farmPath(farmA)}/salesLots/legacy_sale_with_finance`), {
      organizationId, farmId: farmA, salesLotId: 'legacy_sale_with_finance',
      lotCode: 'LEGACY-FINANCE', soldOn: '2026-08-31',
      allocations: [{ harvestLotId: harvestA, weightKg: 1 }],
      quantityFruit: null, weightKg: 1, note: 'legacy mixed document',
      status: 'ARCHIVED', actorUserId: ownerId, createdAtLabel: 'seed', version: 1,
      audit: [],
      unitPriceBahtPerKg: 999, grossAmountBaht: 9999, exampleData: true,
    })
    await setDoc(doc(firestore, `${farmPath(farmA)}/inventoryMovements/legacy_move_with_finance`), {
      organizationId, farmId: farmA, movementId: 'legacy_move_with_finance',
      itemId: itemA, lotId: lotA, movementType: 'RECEIPT', quantity: 1,
      quantityDelta: 1, unit: 'kg', reason: 'legacy mixed document',
      referenceType: 'PURCHASE_REFERENCE', referenceId: 'LEGACY',
      actorUserId: ownerId, createdAtLabel: 'seed', version: 1, audit: [],
      directUnitCostBaht: 999, directCostBaht: 9999, exampleData: true,
    })
    await setDoc(doc(firestore, `${farmPath(farmA)}/annualPlanItems/legacy_plan_with_finance`), {
      organizationId, farmId: farmA, planItemId: 'legacy_plan_with_finance',
      plannedDirectCostBaht: 9999, exampleData: true,
    })
    await setDoc(doc(firestore, `${farmPath(farmA)}/commercialAuditEvents/legacy_financial_audit`), {
      organizationId, farmId: farmA, eventId: 'legacy_financial_audit',
      beforeSummary: '100/200/300', afterSummary: '999/999/999', exampleData: true,
    })
    await setDoc(doc(firestore, `${farmPath(farmA)}/dashboardViews/ORG_OWNER`), {
      organizationId, farmId: farmA, roleBucket: 'ORG_OWNER',
      salesGrossBaht: 9999, salesOutstandingBaht: 9999, exampleData: true,
    })
  })
}

beforeAll(async () => {
  const rules = await readFile(new URL('../../firestore.rules', import.meta.url), 'utf8')
  environment = await initializeTestEnvironment({ projectId, firestore: { rules } })
})

beforeEach(async () => {
  await environment.clearFirestore()
  await seed()
})

afterAll(async () => environment.cleanup())

describe('Firebase Phase 5 Commercial repository and Rules', () => {
  it('fails closed before a live Crop write when Annual linkage is unavailable', async () => {
    const ownerFirestore = environment.authenticatedContext(ownerId).firestore() as unknown as Firestore
    const mixedModeRepository = new FirebaseCommercialTraceabilityRepository(ownerFirestore, false)
    const context = { actor: identity(ownerId), farm: farm('ORG_OWNER', ownerId) }
    const before = (await mixedModeRepository.listSnapshot(context)).cropCycles.length

    await expect(mixedModeRepository.createCropCycle(context, 'blocked-live-crop', {
      annualCycleId: annualA,
      cycleCode: 'CROP-BLOCKED',
      name: 'ต้องไม่ถูกเขียน',
      stage: 'FLOWERING',
      zoneCodes: ['Z01'],
      varietyReference: 'VARIETY-DEMO',
      expectedHarvestDate: null,
    })).rejects.toThrow('ANNUAL_CYCLE_LINKAGE_UNAVAILABLE')

    expect((await mixedModeRepository.listSnapshot(context)).cropCycles).toHaveLength(before)
  })

  it('allows SALES_INVENTORY partial lots once and keeps traceability farm-scoped', async () => {
    const salesRepository = repository(salesId)
    const context = { actor: identity(salesId), farm: farm('SALES_INVENTORY', salesId) }
    const created = await salesRepository.createSalesLot(context, 'sale_once_001', {
      lotCode: 'S-A-001',
      allocations: [{ harvestLotId: harvestA, weightKg: 50 }], quantityFruit: 20,
      weightKg: 50, note: 'SIMULATED/TEST ONLY',
    })
    const retry = await salesRepository.createSalesLot(context, 'sale_once_001', {
      lotCode: 'IGNORED',
      allocations: [{ harvestLotId: harvestA, weightKg: 1 }], quantityFruit: null,
      weightKg: 1, note: '',
    })
    expect(retry.salesLotId).toBe(created.salesLotId)
    const snapshot = await salesRepository.listSnapshot(context)
    expect(snapshot.traceability[0]).toMatchObject({ harvestLotId: harvestA, cropCycleId: cropA })
    expect(snapshot.harvestLots.some((item) => item.farmId === farmB)).toBe(false)
    expect(snapshot.financial).toBeNull()
  })

  it('denies cross-farm allocation and hides commercial records from Worker', async () => {
    const salesRepository = repository(salesId)
    await expect(salesRepository.createSalesLot(
      { actor: identity(salesId), farm: farm('SALES_INVENTORY', salesId) },
      'cross_farm_001', {
        lotCode: 'S-CROSS',
        allocations: [{ harvestLotId: harvestB, weightKg: 10 }], quantityFruit: null,
        weightKg: 10, note: '',
      },
    )).rejects.toThrow()
    const workerFirestore = environment.authenticatedContext(workerId).firestore()
    await assertFails(getDoc(doc(workerFirestore, `${farmPath(farmA)}/harvestLots/${harvestA}`)))
    const viewerFirestore = environment.authenticatedContext(viewerId).firestore()
    await assertSucceeds(getDoc(doc(viewerFirestore, `${farmPath(farmA)}/harvestLots/${harvestA}`)))
  })

  it('allows Agronomist observations but denies SALES_INVENTORY fruit writes', async () => {
    const agronomist = repository(agronomistId)
    const created = await agronomist.createFruitObservation(
      { actor: identity(agronomistId), farm: farm('AGRONOMIST', agronomistId) },
      'fruit_once_001', {
        cropCycleId: cropA, stage: 'PRE_SALE', scopeKind: 'ZONE', positionIds: [],
        zoneCodes: ['Z01'], countingMode: 'AI_ASSISTED',
        sourceCountSessionId: 'aifc_mock_emulator_001', countMethod: 'SAMPLE', observedCount: 120,
        droppedCount: 3, valueQuality: 'ESTIMATED',
        confidenceNote: 'SIMULATED/TEST ONLY — sample limitation', observedAt: '2026-08-31',
      },
    )
    expect(created.observedCount).toBe(120)
    const agronomistFirestore = environment.authenticatedContext(agronomistId).firestore() as unknown as Firestore
    const now = Timestamp.fromDate(new Date('2026-08-31T08:00:00.000Z'))
    await assertFails(setDoc(doc(agronomistFirestore, `${farmPath(farmA)}/fruitObservations/fruit_forged_ai_measured`), {
      ...created,
      observationId: 'fruit_forged_ai_measured',
      countMethod: 'FULL_COUNT',
      valueQuality: 'MEASURED',
      createdAt: now,
      updatedAt: now,
    }))
    await expect(repository(salesId).createFruitObservation(
      { actor: identity(salesId), farm: farm('SALES_INVENTORY', salesId) },
      'fruit_denied_001', {
        cropCycleId: cropA, stage: 'PRE_SALE', scopeKind: 'ZONE', positionIds: [],
        zoneCodes: ['Z01'], countingMode: 'MANUAL', sourceCountSessionId: null,
        countMethod: 'SAMPLE', observedCount: 1,
        droppedCount: 0, valueQuality: 'ESTIMATED', confidenceNote: 'denied',
        observedAt: '2026-08-31',
      },
    )).rejects.toThrow('ไม่มีสิทธิ์')
  })

  it('denies negative stock and restricts adjustments to Owner/Manager', async () => {
    const salesRepository = repository(salesId)
    const context = { actor: identity(salesId), farm: farm('SALES_INVENTORY', salesId) }
    const issue = await salesRepository.recordInventoryMovement(context, 'issue_once_001', {
      itemId: itemA, lotId: lotA, movementType: 'ISSUE', quantity: 5, unit: 'kg',
      reason: 'SIMULATED issue', referenceType: 'WORK_ORDER', referenceId: 'WORK-DEMO',
    })
    const retry = await salesRepository.recordInventoryMovement(context, 'issue_once_001', {
      itemId: itemA, lotId: lotA, movementType: 'ISSUE', quantity: 1, unit: 'kg',
      reason: 'ignored', referenceType: 'WORK_ORDER', referenceId: 'WORK-DEMO',
    })
    expect(retry.movementId).toBe(issue.movementId)
    await expect(salesRepository.recordInventoryMovement(context, 'negative_001', {
      itemId: itemA, lotId: lotA, movementType: 'ISSUE', quantity: 100, unit: 'kg',
      reason: 'negative', referenceType: 'WORK_ORDER', referenceId: 'WORK-DEMO',
    })).rejects.toThrow('สต็อกติดลบ')
    await expect(salesRepository.recordInventoryMovement(context, 'adjust_denied_001', {
      itemId: itemA, lotId: lotA, movementType: 'ADJUSTMENT', quantity: -1, unit: 'kg',
      reason: 'count correction', referenceType: 'COUNT_CORRECTION', referenceId: 'COUNT-DEMO',
    })).rejects.toThrow('Owner/Manager')
    const managerMovement = await repository(managerId).recordInventoryMovement(
      { actor: identity(managerId), farm: farm('FARM_MANAGER', managerId) },
      'adjust_allowed_001', {
        itemId: itemA, lotId: lotA, movementType: 'ADJUSTMENT', quantity: -1, unit: 'kg',
        reason: 'SIMULATED count correction', referenceType: 'COUNT_CORRECTION', referenceId: 'COUNT-DEMO',
      },
    )
    expect(managerMovement.quantityDelta).toBe(-1)
    expect((await repository(managerId).listCommercialAudit({
      actor: identity(managerId), farm: farm('FARM_MANAGER', managerId),
    })).every((event) => event.reason !== '100/200/300')).toBe(true)
  })

  it('keeps sales financial creation and correction Owner-only', async () => {
    const salesRepository = repository(salesId)
    const salesContext = { actor: identity(salesId), farm: farm('SALES_INVENTORY', salesId) }
    await expect(salesRepository.createSalesLot(salesContext, 'sale_finance_denied', {
      lotCode: 'S-A-DENIED',
      allocations: [{ harvestLotId: harvestA, weightKg: 40 }], quantityFruit: null,
      weightKg: 40, note: '',
      financial: { customerReference: 'MUST-NOT-PERSIST', unitPriceBahtPerKg: 100, depositBaht: 0, receivedBaht: 0 },
    })).rejects.toThrow('เฉพาะเจ้าขององค์กร')
    const ownerRepository = repository(ownerId)
    const ownerContext = { actor: identity(ownerId), farm: farm('ORG_OWNER', ownerId) }
    const sale = await ownerRepository.createSalesLot(ownerContext, 'sale_correction_seed', {
      lotCode: 'S-A-CORR',
      allocations: [{ harvestLotId: harvestA, weightKg: 40 }], quantityFruit: null,
      weightKg: 40, note: '',
      financial: { customerReference: 'BUYER-DEMO-CORR', unitPriceBahtPerKg: 100, depositBaht: 0, receivedBaht: 0 },
    })
    await expect(salesRepository.correctSalesLot(salesContext, sale.salesLotId, 'denied_corr', {
      weightKg: 40, unitPriceBahtPerKg: 110, depositBaht: 0,
      receivedBaht: 0, reason: 'denied',
    })).rejects.toThrow('เฉพาะเจ้าขององค์กร')
    const corrected = await ownerRepository.correctSalesLot(
      ownerContext,
      sale.salesLotId, 'owner_corr', {
        weightKg: 40, unitPriceBahtPerKg: 110, depositBaht: 1000,
        receivedBaht: 0, reason: 'SIMULATED correction',
      },
    )
    expect(corrected).toMatchObject({ unitPriceBahtPerKg: 110, grossAmountBaht: 4400 })
    const ownerSnapshot = await ownerRepository.listSnapshot(ownerContext)
    expect(ownerSnapshot.financial?.audit.some((event) => event.eventType === 'CORRECTED')).toBe(true)
  })

  it('allows finance reads only for the active organization owner across every financial collection', async () => {
    const ownerFirestore = environment.authenticatedContext(ownerId).firestore()
    const targets = [
      'inventoryMovementFinancials/seed_receipt',
      'salesFinancials/seed_financial',
      'commercialFinancialAuditEvents/seed_financial_audit',
      'annualPlanFinancials/seed_plan',
      'managementLaborCosts/seed_labor',
      'managementOperatingExpenses/seed_expense',
      'managementFinancialAuditEvents/seed_management_audit',
      'financialDashboardViews/summary',
    ]
    for (const target of targets) {
      await assertSucceeds(getDoc(doc(ownerFirestore, `${farmPath(farmA)}/${target}`)))
    }

    for (const userId of [managerId, salesId, agronomistId, workerId, viewerId, auditorId, pseudoOwnerId]) {
      const firestore = environment.authenticatedContext(userId).firestore()
      for (const target of targets) {
        await assertFails(getDoc(doc(firestore, `${farmPath(farmA)}/${target}`)))
      }
    }
  })

  it('fails closed for legacy mixed documents that still contain financial fields', async () => {
    const legacyTargets = [
      'salesLots/legacy_sale_with_finance',
      'inventoryMovements/legacy_move_with_finance',
      'annualPlanItems/legacy_plan_with_finance',
      'commercialAuditEvents/legacy_financial_audit',
      'dashboardViews/ORG_OWNER',
    ]
    const ownerFirestore = environment.authenticatedContext(ownerId).firestore()
    for (const target of legacyTargets) {
      await assertSucceeds(getDoc(doc(ownerFirestore, `${farmPath(farmA)}/${target}`)))
    }
    for (const userId of [managerId, salesId, agronomistId, workerId, viewerId, auditorId, pseudoOwnerId]) {
      const firestore = environment.authenticatedContext(userId).firestore()
      for (const target of legacyTargets) {
        await assertFails(getDoc(doc(firestore, `${farmPath(farmA)}/${target}`)))
      }
    }
  })
})
