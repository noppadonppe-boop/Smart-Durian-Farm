import {
  collection,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
  type DocumentData,
  type Firestore,
  type Transaction,
} from 'firebase/firestore'

import type { ManagementReportingRepository } from '../../adapters/contracts'
import { type FarmAccess } from '../../domain/farm'
import {
  canRecordLaborCost,
  canRecordOperatingExpense,
  canViewManagementReports,
  normalizeLaborCostDraft,
  normalizeOperatingExpenseDraft,
  type AnnualPlanFinancialRecord,
  type LaborCostDraft,
  type LaborCostRecord,
  type ManagementCostAuditEvent,
  type ManagementCostSnapshot,
  type ManagementReportContext,
  type OperatingExpenseDraft,
  type OperatingExpenseRecord,
} from '../../domain/managementReporting'
import type { AnnualCycleRecord } from '../../domain/annualFarmCycle'
import { rootDoc } from './firebaseDataRoot'

function clone<T>(value: T): T {
  return structuredClone(value)
}

function scoped<T extends { organizationId: string; farmId: string; exampleData: boolean }>(
  data: DocumentData,
  farm: FarmAccess,
): T {
  if (
    typeof data.organizationId !== 'string' ||
    typeof data.farmId !== 'string' ||
    typeof data.exampleData !== 'boolean' ||
    data.organizationId !== farm.organizationId ||
    data.farmId !== farm.farmId
  ) {
    throw new Error('ข้อมูลต้นทุนไม่อยู่ใน Organization/Farm ปัจจุบัน')
  }
  return clone(data as T)
}

function operationId(actorUserId: string, key: string): string {
  const normalized = `${actorUserId}_${key.trim()}`.replace(/[^A-Za-z0-9_-]/gu, '_')
  if (!key.trim() || normalized.length > 180) throw new Error('Idempotency key ไม่ถูกต้อง')
  return normalized
}

export class FirebaseManagementReportingRepository implements ManagementReportingRepository {
  constructor(
    private readonly firestore: Firestore,
    private readonly exampleData = true,
    private readonly timeLabel = 'Firebase',
  ) {}

  private farmReference(context: ManagementReportContext) {
    return rootDoc(
      this.firestore,
      'organizations', context.farm.organizationId,
      'farms', context.farm.farmId,
    )
  }

  private collectionReference(context: ManagementReportContext, name: string) {
    return collection(this.farmReference(context), name)
  }

  private documentReference(context: ManagementReportContext, name: string, id: string) {
    return doc(this.farmReference(context), name, id)
  }

  private assertContext(context: ManagementReportContext): void {
    if (!context.actor.userId || context.farm.membershipStatus !== 'ACTIVE') {
      throw new Error('ต้องมี Farm membership ที่ใช้งานอยู่')
    }
  }

  private assertCycle(context: ManagementReportContext, cycle: AnnualCycleRecord): void {
    if (
      cycle.organizationId !== context.farm.organizationId ||
      cycle.farmId !== context.farm.farmId ||
      typeof cycle.exampleData !== 'boolean'
    ) {
      throw new Error('Annual Cycle ไม่อยู่ใน Farm ปัจจุบัน')
    }
  }

  private async list<T extends { organizationId: string; farmId: string; exampleData: boolean }>(
    context: ManagementReportContext,
    name: string,
  ): Promise<T[]> {
    const snapshot = await getDocs(this.collectionReference(context, name))
    return snapshot.docs.map((item) => scoped<T>(item.data(), context.farm))
  }

  private writeOperation(
    transaction: Transaction,
    context: ManagementReportContext,
    key: string,
    resultCollection: string,
    resultId: string,
  ): void {
    transaction.set(this.documentReference(context, 'managementCostOperations', operationId(context.actor.userId, key)), {
      recordType: 'MANAGEMENT_COST_OPERATION',
      operationId: operationId(context.actor.userId, key),
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      actorUserId: context.actor.userId,
      resultCollection,
      resultId,
      exampleData: this.exampleData,
      createdAt: serverTimestamp(),
    })
  }

  async listSnapshot(
    context: ManagementReportContext,
    annualCycleId?: string,
  ): Promise<ManagementCostSnapshot> {
    this.assertContext(context)
    if (!canViewManagementReports(context.farm)) throw new Error('ข้อมูลการเงินเปิดให้เฉพาะเจ้าขององค์กรเท่านั้น')
    const [laborCosts, operatingExpenses, annualPlanFinancials, audit] = await Promise.all([
      this.list<LaborCostRecord>(context, 'laborCosts'),
      this.list<OperatingExpenseRecord>(context, 'operatingExpenses'),
      this.list<AnnualPlanFinancialRecord>(context, 'annualPlanFinancials'),
      this.list<ManagementCostAuditEvent>(context, 'managementCostAuditEvents'),
    ])
    const sameCycle = <T extends { annualCycleId: string }>(record: T) => !annualCycleId || record.annualCycleId === annualCycleId
    return {
      laborCosts: laborCosts.filter(sameCycle),
      operatingExpenses: operatingExpenses.filter(sameCycle),
      annualPlanFinancials: annualPlanFinancials.filter(sameCycle),
      audit: audit.filter(sameCycle),
    }
  }

  async createLaborCost(
    context: ManagementReportContext,
    cycle: AnnualCycleRecord,
    idempotencyKey: string,
    draft: LaborCostDraft,
  ): Promise<LaborCostRecord> {
    this.assertContext(context)
    this.assertCycle(context, cycle)
    if (!canRecordLaborCost(context.farm)) throw new Error('ข้อมูลการเงินเปิดให้เฉพาะเจ้าขององค์กรเท่านั้น')
    const key = operationId(context.actor.userId, idempotencyKey)
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
      createdAtLabel: this.timeLabel,
      exampleData: this.exampleData,
    }
    const audit: ManagementCostAuditEvent = {
      eventId: `audit_${crypto.randomUUID().replaceAll('-', '')}`,
      organizationId: record.organizationId,
      farmId: record.farmId,
      annualCycleId: cycle.annualCycleId,
      eventType: 'LABOR_COST_RECORDED',
      targetId: laborCostId,
      actorUserId: context.actor.userId,
      actorDisplayName: context.actor.displayName,
      amountBaht: record.amountBaht,
      reason: record.notes || 'บันทึกต้นทุนแรงงาน',
      idempotencyKey,
      createdAtLabel: this.timeLabel,
      exampleData: this.exampleData,
    }
    return runTransaction(this.firestore, async (transaction) => {
      const operationReference = this.documentReference(context, 'managementCostOperations', key)
      const existing = await transaction.get(operationReference)
      if (existing.exists()) {
        const data = existing.data() ?? {}
        const result = await transaction.get(this.documentReference(context, 'laborCosts', String(data.resultId)))
        return scoped<LaborCostRecord>(result.data() ?? {}, context.farm)
      }
      transaction.set(this.documentReference(context, 'laborCosts', laborCostId), {
        ...record,
        createdAt: serverTimestamp(),
      })
      transaction.set(this.documentReference(context, 'managementCostAuditEvents', audit.eventId), {
        ...audit,
        createdAt: serverTimestamp(),
      })
      this.writeOperation(transaction, context, idempotencyKey, 'laborCosts', laborCostId)
      return record
    })
  }

  async createOperatingExpense(
    context: ManagementReportContext,
    cycle: AnnualCycleRecord,
    idempotencyKey: string,
    draft: OperatingExpenseDraft,
  ): Promise<OperatingExpenseRecord> {
    this.assertContext(context)
    this.assertCycle(context, cycle)
    if (!canRecordOperatingExpense(context.farm)) throw new Error('ข้อมูลการเงินเปิดให้เฉพาะเจ้าขององค์กรเท่านั้น')
    const key = operationId(context.actor.userId, idempotencyKey)
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
      createdAtLabel: this.timeLabel,
      exampleData: this.exampleData,
    }
    const audit: ManagementCostAuditEvent = {
      eventId: `audit_${crypto.randomUUID().replaceAll('-', '')}`,
      organizationId: record.organizationId,
      farmId: record.farmId,
      annualCycleId: cycle.annualCycleId,
      eventType: 'OPERATING_EXPENSE_RECORDED',
      targetId: expenseId,
      actorUserId: context.actor.userId,
      actorDisplayName: context.actor.displayName,
      amountBaht: record.amountBaht,
      reason: record.description,
      idempotencyKey,
      createdAtLabel: this.timeLabel,
      exampleData: this.exampleData,
    }
    return runTransaction(this.firestore, async (transaction) => {
      const operationReference = this.documentReference(context, 'managementCostOperations', key)
      const existing = await transaction.get(operationReference)
      if (existing.exists()) {
        const data = existing.data() ?? {}
        const result = await transaction.get(this.documentReference(context, 'operatingExpenses', String(data.resultId)))
        return scoped<OperatingExpenseRecord>(result.data() ?? {}, context.farm)
      }
      transaction.set(this.documentReference(context, 'operatingExpenses', expenseId), {
        ...record,
        createdAt: serverTimestamp(),
      })
      transaction.set(this.documentReference(context, 'managementCostAuditEvents', audit.eventId), {
        ...audit,
        createdAt: serverTimestamp(),
      })
      this.writeOperation(transaction, context, idempotencyKey, 'operatingExpenses', expenseId)
      return record
    })
  }

  resetMockPack(): Promise<void> {
    if (!this.exampleData) throw new Error('Production data ไม่รองรับการ Reset')
    return Promise.resolve()
  }
}
