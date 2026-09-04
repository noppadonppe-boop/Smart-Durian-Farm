import type { ManagementReportingRepository } from '../contracts'
import type { AnnualCycleRecord } from '../../domain/annualFarmCycle'
import {
  canRecordLaborCost,
  canRecordOperatingExpense,
  canViewManagementReports,
  normalizeLaborCostDraft,
  normalizeOperatingExpenseDraft,
  type LaborCostDraft,
  type LaborCostRecord,
  type AnnualPlanFinancialRecord,
  type ManagementCostAuditEvent,
  type ManagementCostSnapshot,
  type ManagementReportContext,
  type OperatingExpenseDraft,
  type OperatingExpenseRecord,
} from '../../domain/managementReporting'
import seed from '../../../scripts/seed-data/management-reporting-mock-data-pack-v1.0.json'

interface ReportingSeed {
  laborCosts: LaborCostRecord[]
  operatingExpenses: OperatingExpenseRecord[]
  annualPlanFinancials: AnnualPlanFinancialRecord[]
  audit: ManagementCostAuditEvent[]
}

type RememberedOperation =
  | { kind: 'LABOR'; record: LaborCostRecord }
  | { kind: 'EXPENSE'; record: OperatingExpenseRecord }

function cloneSeed(): ReportingSeed {
  return structuredClone(seed) as unknown as ReportingSeed
}

export class MockManagementReportingRepository implements ManagementReportingRepository {
  private state = cloneSeed()
  private readonly operations = new Map<string, RememberedOperation>()

  private assertContext(context: ManagementReportContext): void {
    if (!context.actor.userId || context.farm.membershipStatus !== 'ACTIVE') {
      throw new Error('ต้องมี Farm membership ที่ใช้งานอยู่')
    }
    if (!context.farm.isMock) {
      throw new Error('DEC-049 อนุญาตต้นทุนและรายงานเฉพาะ Farm จำลองเท่านั้น')
    }
  }

  private operationKey(
    context: ManagementReportContext,
    idempotencyKey: string,
  ): string {
    const normalized = idempotencyKey.trim()
    if (!normalized || normalized.length > 128) {
      throw new Error('Idempotency key ต้องมี 1–128 ตัวอักษร')
    }
    return [
      context.farm.organizationId,
      context.farm.farmId,
      context.actor.userId,
      normalized,
    ].join(':')
  }

  private assertCycle(
    context: ManagementReportContext,
    cycle: AnnualCycleRecord,
  ): void {
    if (
      cycle.organizationId !== context.farm.organizationId ||
      cycle.farmId !== context.farm.farmId ||
      cycle.exampleData !== true
    ) {
      throw new Error('ปฏิเสธ Annual Cycle ข้าม Farm หรือไม่ใช่ข้อมูลจำลอง')
    }
  }

  async listSnapshot(
    context: ManagementReportContext,
    annualCycleId?: string,
  ): Promise<ManagementCostSnapshot> {
    await Promise.resolve()
    this.assertContext(context)
    if (!canViewManagementReports(context.farm)) {
      throw new Error('ข้อมูลการเงินเปิดให้เฉพาะเจ้าขององค์กรเท่านั้น')
    }
    const sameScope = <T extends { organizationId: string; farmId: string; annualCycleId: string }>(record: T) =>
      record.organizationId === context.farm.organizationId &&
      record.farmId === context.farm.farmId &&
      (!annualCycleId || record.annualCycleId === annualCycleId)
    return {
      laborCosts: this.state.laborCosts.filter(sameScope).map((record) => structuredClone(record)),
      operatingExpenses: this.state.operatingExpenses.filter(sameScope).map((record) => structuredClone(record)),
      annualPlanFinancials: this.state.annualPlanFinancials.filter(sameScope).map((record) => structuredClone(record)),
      audit: this.state.audit.filter(sameScope).map((record) => structuredClone(record)),
    }
  }

  async createLaborCost(
    context: ManagementReportContext,
    cycle: AnnualCycleRecord,
    idempotencyKey: string,
    draft: LaborCostDraft,
  ): Promise<LaborCostRecord> {
    await Promise.resolve()
    this.assertContext(context)
    this.assertCycle(context, cycle)
    if (!canRecordLaborCost(context.farm)) {
      throw new Error('ข้อมูลการเงินเปิดให้เฉพาะเจ้าขององค์กรเท่านั้น')
    }
    const key = this.operationKey(context, idempotencyKey)
    const remembered = this.operations.get(key)
    if (remembered) {
      if (remembered.kind !== 'LABOR') throw new Error('Idempotency key นี้ถูกใช้กับคำสั่งอื่นแล้ว')
      return structuredClone(remembered.record)
    }
    const normalized = normalizeLaborCostDraft(context, cycle, draft)
    const laborCostId = `labor_${crypto.randomUUID().replaceAll('-', '')}`
    const record: LaborCostRecord = {
      ...normalized,
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      laborCostId,
      actorUserId: context.actor.userId,
      actorDisplayName: context.actor.displayName,
      version: 1,
      createdAtLabel: 'เมื่อสักครู่ · เวลาจำลองในเครื่อง',
      exampleData: true,
    }
    this.state.laborCosts.unshift(record)
    this.state.audit.unshift({
      eventId: `audit_${crypto.randomUUID().replaceAll('-', '')}`,
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      annualCycleId: cycle.annualCycleId,
      eventType: 'LABOR_COST_RECORDED',
      targetId: laborCostId,
      actorUserId: context.actor.userId,
      actorDisplayName: context.actor.displayName,
      amountBaht: record.amountBaht,
      reason: record.notes || 'บันทึกต้นทุนแรงงานจำลอง',
      idempotencyKey,
      createdAtLabel: record.createdAtLabel,
      exampleData: true,
    })
    this.operations.set(key, { kind: 'LABOR', record: structuredClone(record) })
    return structuredClone(record)
  }

  async createOperatingExpense(
    context: ManagementReportContext,
    cycle: AnnualCycleRecord,
    idempotencyKey: string,
    draft: OperatingExpenseDraft,
  ): Promise<OperatingExpenseRecord> {
    await Promise.resolve()
    this.assertContext(context)
    this.assertCycle(context, cycle)
    if (!canRecordOperatingExpense(context.farm)) {
      throw new Error('ข้อมูลการเงินเปิดให้เฉพาะเจ้าขององค์กรเท่านั้น')
    }
    const key = this.operationKey(context, idempotencyKey)
    const remembered = this.operations.get(key)
    if (remembered) {
      if (remembered.kind !== 'EXPENSE') throw new Error('Idempotency key นี้ถูกใช้กับคำสั่งอื่นแล้ว')
      return structuredClone(remembered.record)
    }
    const normalized = normalizeOperatingExpenseDraft(context, cycle, draft)
    const expenseId = `expense_${crypto.randomUUID().replaceAll('-', '')}`
    const record: OperatingExpenseRecord = {
      ...normalized,
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      expenseId,
      actorUserId: context.actor.userId,
      actorDisplayName: context.actor.displayName,
      version: 1,
      createdAtLabel: 'เมื่อสักครู่ · เวลาจำลองในเครื่อง',
      exampleData: true,
    }
    this.state.operatingExpenses.unshift(record)
    this.state.audit.unshift({
      eventId: `audit_${crypto.randomUUID().replaceAll('-', '')}`,
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      annualCycleId: cycle.annualCycleId,
      eventType: 'OPERATING_EXPENSE_RECORDED',
      targetId: expenseId,
      actorUserId: context.actor.userId,
      actorDisplayName: context.actor.displayName,
      amountBaht: record.amountBaht,
      reason: record.description,
      idempotencyKey,
      createdAtLabel: record.createdAtLabel,
      exampleData: true,
    })
    this.operations.set(key, { kind: 'EXPENSE', record: structuredClone(record) })
    return structuredClone(record)
  }

  resetMockPack(): Promise<void> {
    this.state = cloneSeed()
    this.operations.clear()
    return Promise.resolve()
  }
}
