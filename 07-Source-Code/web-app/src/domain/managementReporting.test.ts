import { describe, expect, it } from 'vitest'

import annualSeed from '../../scripts/seed-data/annual-cycle-mock-data-pack-v1.0.json'
import commercialSeed from '../../scripts/seed-data/phase5-mock-data-pack-v1.0.json'
import costSeed from '../../scripts/seed-data/management-reporting-mock-data-pack-v1.0.json'
import workSeed from '../../scripts/seed-data/phase4-mock-data-pack-v1.0.json'
import type { AnnualCycleRecord, AnnualPlanItemRecord } from './annualFarmCycle'
import {
  calculateDirectCostSummary,
  calculateInventoryBalances,
  buildTraceability,
  type CommercialSnapshot,
} from './commercialTraceability'
import type { FarmAccess } from './farm'
import {
  buildFarmManagementReport,
  createManagementReportCsv,
  normalizeLaborCostDraft,
  normalizeOperatingExpenseDraft,
  resolveReportPeriod,
  type ManagementCostSnapshot,
  type ManagementReportContext,
} from './managementReporting'
import type { DiseaseIncidentRecord, WorkOrderRecord } from './workCareDisease'

const farm: FarmAccess = {
  organizationId: 'org_demo_kdoms_01',
  organizationName: 'องค์กรจำลอง',
  organizationCode: 'DEMO',
  farmId: 'farm_demo_north_01',
  farmCode: 'DEMO-F01',
  farmSequence: 'F01',
  farmName: 'สวนเหนือจำลอง',
  farmStatus: 'ACTIVE',
  membershipStatus: 'ACTIVE',
  role: 'ORG_OWNER',
  isOrganizationOwner: true,
  isMock: true,
}

const context: ManagementReportContext = {
  actor: {
    userId: 'user_demo_owner_01',
    displayName: 'เจ้าของสวนจำลอง',
    maskedPhone: '+66••••001',
    source: 'mock',
  },
  farm,
}

const cycle = (annualSeed.cycles as unknown as AnnualCycleRecord[])
  .find((record) => record.annualCycleId === 'annual_demo_north_2026_06')!

function commercialSnapshot(): CommercialSnapshot {
  const source = structuredClone(commercialSeed) as unknown as {
    cropCycles: CommercialSnapshot['cropCycles']
    fruitObservations: CommercialSnapshot['fruitObservations']
    harvestLots: CommercialSnapshot['harvestLots']
    salesLots: CommercialSnapshot['salesLots']
    salesFinancials: NonNullable<CommercialSnapshot['financial']>['salesLots']
    inventoryItems: CommercialSnapshot['inventoryItems']
    inventoryMovements: CommercialSnapshot['inventoryMovements']
    inventoryMovementFinancials: NonNullable<CommercialSnapshot['financial']>['inventoryMovements']
  }
  const scoped = {
    ...source,
    cropCycles: source.cropCycles.filter((record) => record.farmId === farm.farmId),
    fruitObservations: source.fruitObservations.filter((record) => record.farmId === farm.farmId),
    harvestLots: source.harvestLots.filter((record) => record.farmId === farm.farmId),
    salesLots: source.salesLots.filter((record) => record.farmId === farm.farmId),
    inventoryItems: source.inventoryItems.filter((record) => record.farmId === farm.farmId),
    inventoryMovements: source.inventoryMovements.filter((record) => record.farmId === farm.farmId),
  }
  return {
    ...scoped,
    inventoryBalances: calculateInventoryBalances(scoped.inventoryItems, scoped.inventoryMovements),
    alerts: [],
    financial: {
      salesLots: source.salesFinancials.filter((record) => record.farmId === farm.farmId),
      inventoryMovements: source.inventoryMovementFinancials.filter((record) => record.farmId === farm.farmId),
      directCostSummary: calculateDirectCostSummary(
        scoped.inventoryMovements,
        source.inventoryMovementFinancials.filter((record) => record.farmId === farm.farmId),
      ),
      audit: [],
    },
    traceability: buildTraceability(
      scoped.cropCycles,
      scoped.harvestLots,
      scoped.salesLots,
    ),
  }
}

function buildReport() {
  return buildFarmManagementReport({
    context,
    kind: 'MONTHLY',
    anchorDate: '2026-08-31',
    annualCycle: cycle,
    annualPlanItems: annualSeed.planItems as unknown as AnnualPlanItemRecord[],
    workOrders: (workSeed.workOrders as unknown as WorkOrderRecord[]).filter((record) => record.farmId === farm.farmId),
    diseaseIncidents: (workSeed.diseaseIncidents as unknown as DiseaseIncidentRecord[]).filter((record) => record.farmId === farm.farmId),
    commercial: commercialSnapshot(),
    costs: {
      laborCosts: (costSeed as unknown as ManagementCostSnapshot).laborCosts.filter((record) => record.farmId === farm.farmId),
      operatingExpenses: (costSeed as unknown as ManagementCostSnapshot).operatingExpenses.filter((record) => record.farmId === farm.farmId),
      annualPlanFinancials: [],
      audit: [],
    },
  })
}

describe('DEC-049 report period and cost normalization', () => {
  it('resolves Monday week, calendar month, annual-cycle three-month block and annual period', () => {
    expect(resolveReportPeriod('WEEKLY', '2026-08-31', cycle)).toMatchObject({
      periodStart: '2026-08-31',
      periodEndExclusive: '2026-09-07',
    })
    expect(resolveReportPeriod('MONTHLY', '2026-08-31', cycle)).toMatchObject({
      periodStart: '2026-08-01',
      periodEndExclusive: '2026-09-01',
    })
    expect(resolveReportPeriod('THREE_MONTH', '2026-08-31', cycle)).toMatchObject({
      periodStart: '2026-06-01',
      periodEndExclusive: '2026-09-01',
    })
    expect(resolveReportPeriod('ANNUAL', '2026-08-31', cycle)).toMatchObject({
      periodStart: cycle.periodStart,
      periodEndExclusive: cycle.periodEndExclusive,
    })
  })

  it('calculates labor amount and keeps capital outside operating cost', () => {
    expect(normalizeLaborCostDraft(context, cycle, {
      annualCycleId: cycle.annualCycleId,
      incurredOn: '2026-08-31',
      workerReference: 'ทีมจำลอง',
      basis: 'HOUR',
      quantity: 2.5,
      rateBaht: 100,
      referenceType: 'FARM_OPERATION',
      referenceId: farm.farmId,
      notes: '',
    }).amountBaht).toBe(250)
    expect(normalizeOperatingExpenseDraft(context, cycle, {
      annualCycleId: cycle.annualCycleId,
      incurredOn: '2026-08-31',
      category: 'CAPITAL_ASSET',
      description: 'สินทรัพย์จำลอง',
      amountBaht: 1000,
      allocationScope: 'FARM',
      allocationReferenceId: '',
      notes: '',
    }).costTreatment).toBe('CAPITAL')
  })

  it('rejects a forged annual cycle from another farm', () => {
    expect(() => normalizeLaborCostDraft(context, {
      ...cycle,
      farmId: 'farm_demo_south_02',
    }, {
      annualCycleId: cycle.annualCycleId,
      incurredOn: '2026-08-31',
      workerReference: 'ทีมจำลอง',
      basis: 'DAY',
      quantity: 1,
      rateBaht: 500,
      referenceType: 'FARM_OPERATION',
      referenceId: farm.farmId,
      notes: '',
    })).toThrow(/Annual Cycle/u)
  })
})

describe('DEC-049 farm management report', () => {
  it('separates issued material, labor, operating expense and capital without double count', () => {
    const report = buildReport()
    expect(report.metrics.materialDirectCostBaht).toBe(7012.5)
    expect(report.metrics.laborCostBaht).toBe(3500)
    expect(report.metrics.operatingExpenseBaht).toBe(3000)
    expect(report.metrics.capitalExpenseBaht).toBe(15000)
    expect(report.metrics.totalManagementCostBaht).toBe(13512.5)
    expect(report.metrics.grossSalesRecordedBaht).toBe(26100)
    expect(report.metrics.managementMarginBaht).toBe(12587.5)
    expect(report.qualityFlags).toContain('CAPITAL_EXCLUDED_FROM_OPERATING_COST')
  })

  it('keeps unknown current fruit visible instead of replacing it with zero', () => {
    const report = buildReport()
    expect(report.metrics.currentFruitCount).toBeNull()
    expect(report.qualityFlags).toContain('UNKNOWN_FRUIT_VALUE')
  })

  it('fails closed when one source record belongs to another farm', () => {
    const input = commercialSnapshot()
    input.salesLots = [{ ...input.salesLots[0]!, farmId: 'farm_demo_south_02' }]
    expect(() => buildFarmManagementReport({
      context,
      kind: 'MONTHLY',
      anchorDate: '2026-08-31',
      annualCycle: cycle,
      annualPlanItems: [],
      workOrders: [],
      diseaseIncidents: [],
      commercial: input,
      costs: { laborCosts: [], operatingExpenses: [], annualPlanFinancials: [], audit: [] },
    })).toThrow(/ข้าม Farm/u)
  })

  it('exports UTF-8 CSV and neutralizes formula-shaped cells', () => {
    const report = buildReport()
    const csv = createManagementReportCsv({
      ...report,
      details: [{
        sourceType: 'EXPENSE',
        sourceId: 'expense_demo_formula',
        effectiveOn: '2026-08-31',
        description: '=SUM(A1:A2)',
        category: 'อื่น',
        amountBaht: 1,
        quantity: null,
        unit: 'บาท',
      }],
    })
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain("'=SUM(A1:A2)")
  })
})
