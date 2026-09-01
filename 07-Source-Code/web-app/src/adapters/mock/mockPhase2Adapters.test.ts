import { createMockPhase2Adapters } from './mockFoundationAdapters'
import {
  emptyTreeBaselineMeasurements,
  previewTreeRegisterCsv,
  treeRegisterCsvHeaders,
} from '../../domain/treeRegister'
import type {
  AuthenticatedIdentity,
  FarmManagementContext,
  FarmProfileDraft,
} from '../../domain/farm'

async function signInOwner() {
  const adapters = createMockPhase2Adapters()
  const challenge = await adapters.auth.requestOtp('+16505550101', 'unused')
  const identity = await adapters.auth.verifyOtp(challenge, '111111')
  return { adapters, identity }
}

function managementContext(identity: AuthenticatedIdentity): FarmManagementContext {
  return {
    actor: identity,
    organizationId: 'org_demo_kdoms_01',
    organizationCode: 'DEMO',
    isOrganizationOwner: true,
  }
}

const newFarmDraft: FarmProfileDraft = {
  farmName: 'สวนสาธิตใหม่ — ข้อมูลจำลอง',
  farmSequence: 'F05',
  province: 'TBD',
  district: 'TBD',
  subdistrict: 'TBD',
  locationNote: 'SIMULATED/TEST ONLY',
  timezone: 'Asia/Bangkok',
  seasonStartMonth: null,
  seasonEndMonth: null,
  seasonNote: 'TBD',
  notes: 'SIMULATED/TEST ONLY',
}

describe('mock Phase 2 adapter contract', () => {
  it('supports different roles for one user in different farms', async () => {
    const { adapters, identity } = await signInOwner()
    const farms = await adapters.repository.listFarmAccess(identity.userId)

    expect(farms).toHaveLength(4)
    expect(farms.find((farm) => farm.farmCode === 'DEMO-F01')?.role).toBe('ORG_OWNER')
    expect(farms.find((farm) => farm.farmCode === 'DEMO-F02')?.role).toBe('FARM_MANAGER')
  })

  it('creates an append-only audit event with each membership change', async () => {
    const { adapters, identity } = await signInOwner()
    const event = await adapters.repository.changeFarmMembership({
      actor: identity,
      organizationId: 'org_demo_kdoms_01',
      farmId: 'farm_demo_north_01',
      targetUserId: 'user_demo_worker_02',
      nextRole: 'VIEWER',
      nextStatus: 'ACTIVE',
    })

    expect(event.eventType).toBe('ROLE_CHANGED')
    expect(event.beforeRole).toBe('WORKER')
    expect(event.afterRole).toBe('VIEWER')
    expect(
      await adapters.repository.listMembershipAudit(
        'org_demo_kdoms_01',
        'farm_demo_north_01',
      ),
    ).toHaveLength(1)
  })

  it('rejects an unlisted phone number before any network action', async () => {
    const adapters = createMockPhase2Adapters()
    await expect(adapters.auth.requestOtp('+66999999999', 'unused')).rejects.toThrow(
      /เฉพาะหมายเลขทดสอบ/u,
    )
  })

  it('creates Farm + Owner membership + Audit once for an idempotent retry', async () => {
    const { adapters, identity } = await signInOwner()
    const context = managementContext(identity)
    const first = await adapters.repository.createFarm({
      context,
      idempotencyKey: 'create-farm-f05',
      draft: newFarmDraft,
    })
    const retry = await adapters.repository.createFarm({
      context,
      idempotencyKey: 'create-farm-f05',
      draft: newFarmDraft,
    })

    expect(first.profile.farmCode).toBe('DEMO-F05')
    expect(retry.wasRetry).toBe(true)
    expect(retry.profile.farmId).toBe(first.profile.farmId)
    expect(await adapters.repository.listFarmAccess(identity.userId)).toHaveLength(5)
    expect((await adapters.repository.listFarmMembers(
      context.organizationId,
      first.profile.farmId,
    )).find((member) => member.userId === identity.userId)?.role).toBe('ORG_OWNER')
    expect(await adapters.repository.listFarmAudit(
      context,
      first.profile.farmId,
    )).toHaveLength(1)
  })

  it('rejects duplicate Farm Sequence/Code and preserves the four-Farm baseline', async () => {
    const { adapters, identity } = await signInOwner()
    const context = managementContext(identity)
    await expect(adapters.repository.createFarm({
      context,
      idempotencyKey: 'duplicate-f01',
      draft: { ...newFarmDraft, farmSequence: 'F01' },
    })).rejects.toThrow(/ถูกใช้แล้ว/u)
    expect(await adapters.repository.listFarmProfiles(context)).toHaveLength(4)
  })

  it('updates editable Profile fields with versioned before/after Audit', async () => {
    const { adapters, identity } = await signInOwner()
    const context = managementContext(identity)
    const profile = await adapters.repository.getFarmProfile(context, 'farm_demo_north_01')
    const result = await adapters.repository.updateFarmProfile({
      context,
      farmId: 'farm_demo_north_01',
      idempotencyKey: 'update-f01-profile',
      draft: {
        ...newFarmDraft,
        farmName: 'สวนสาธิตเหนือปรับปรุง — ข้อมูลจำลอง',
        farmSequence: 'F01',
      },
    })

    expect(result.profile.version).toBe((profile?.version ?? 0) + 1)
    expect(result.auditEvent.before?.farmName).toBe(profile?.farmName)
    expect(result.auditEvent.after.farmName).toBe(result.profile.farmName)
    expect(result.auditEvent.eventType).toBe('FARM_PROFILE_UPDATED')
  })

  it('blocks Archive when open Work Orders or Pending operations exist', async () => {
    const { adapters, identity } = await signInOwner()
    const context = managementContext(identity)
    const readiness = await adapters.repository.getFarmArchiveReadiness(
      context,
      'farm_demo_north_01',
    )
    expect(readiness.canArchive).toBe(false)
    expect(readiness.openWorkOrders.length + readiness.pendingOperations.length).toBeGreaterThan(0)
    await expect(adapters.repository.changeFarmStatus({
      context,
      farmId: 'farm_demo_north_01',
      idempotencyKey: 'archive-blocked-f01',
      nextStatus: 'ARCHIVED',
      knownPendingOperationIds: [],
    })).rejects.toThrow(/ยัง Archive ไม่ได้/u)
  })

  it('supports suspend/reactivate/archive but never reopens an archived Farm', async () => {
    const { adapters, identity } = await signInOwner()
    const context = managementContext(identity)
    const created = await adapters.repository.createFarm({
      context,
      idempotencyKey: 'create-lifecycle-f05',
      draft: newFarmDraft,
    })
    await adapters.repository.changeFarmStatus({
      context,
      farmId: created.profile.farmId,
      idempotencyKey: 'suspend-f05',
      nextStatus: 'SUSPENDED',
      knownPendingOperationIds: [],
    })
    await adapters.repository.changeFarmStatus({
      context,
      farmId: created.profile.farmId,
      idempotencyKey: 'reactivate-f05',
      nextStatus: 'ACTIVE',
      knownPendingOperationIds: [],
    })
    const archived = await adapters.repository.changeFarmStatus({
      context,
      farmId: created.profile.farmId,
      idempotencyKey: 'archive-f05',
      nextStatus: 'ARCHIVED',
      knownPendingOperationIds: [],
    })
    expect(archived.profile.status).toBe('ARCHIVED')
    await expect(adapters.repository.changeFarmStatus({
      context,
      farmId: created.profile.farmId,
      idempotencyKey: 'forbidden-reopen-f05',
      nextStatus: 'ACTIVE',
      knownPendingOperationIds: [],
    })).rejects.toThrow(/ไม่อนุญาต/u)
  })

  it('lets a member read only assigned Farm Profiles and denies Farm administration', async () => {
    const adapters = createMockPhase2Adapters()
    const challenge = await adapters.auth.requestOtp('+16505550102', 'unused')
    const identity = await adapters.auth.verifyOtp(challenge, '222222')
    const context: FarmManagementContext = {
      actor: identity,
      organizationId: 'org_demo_kdoms_01',
      organizationCode: 'DEMO',
      isOrganizationOwner: false,
    }

    expect(await adapters.repository.getFarmProfile(context, 'farm_demo_north_01')).toBeDefined()
    expect(await adapters.repository.getFarmProfile(context, 'farm_demo_archived_04')).toBeUndefined()
    await expect(adapters.repository.listFarmProfiles(context)).rejects.toThrow(/ORG_OWNER/u)
  })
})

function importRow(treeSequence: number): string {
  const tag = `DEMO-F01-Z01-R02-T${String(treeSequence).padStart(3, '0')}`
  const values: Record<string, string> = {
    recordType: 'FIELD_DATA', organizationCode: 'DEMO', farmSequence: 'F01',
    zoneCode: 'Z01', rowCode: 'R02', treeSequence: String(treeSequence),
    tagCode: tag, plantingCycle: '1', varietyConfidence: 'unknown',
    plantingYearConfidence: 'unknown', treeStatus: 'empty',
    baselineDate: '2026-08-31', notes: 'TEST EXAMPLE DATA ONLY',
  }
  return treeRegisterCsvHeaders.map((field) => values[field] ?? '').join(',')
}

function importPreview(...treeSequences: number[]) {
  return previewTreeRegisterCsv(
    `${treeRegisterCsvHeaders.join(',')}\n${treeSequences.map(importRow).join('\n')}`,
    'DEMO',
    'F01',
  )
}

describe('mock Phase 3 Tree Register contract', () => {
  it('keeps the permanent tag while adding a replacement planting cycle', async () => {
    const { adapters, identity } = await signInOwner()
    const farm = (await adapters.repository.listFarmAccess(identity.userId)).find(
      (candidate) => candidate.farmCode === 'DEMO-F01',
    )!
    const original = await adapters.treeRepository.getTreePosition(
      farm.organizationId,
      farm.farmId,
      'pos_demo_a01f783bc219',
    )
    const replaced = await adapters.treeRepository.replacePlantingCycle(
      { actor: identity, farm },
      'pos_demo_a01f783bc219',
      {
        variety: null,
        varietyConfidence: 'unknown',
        plantingYear: null,
        plantingYearCalendar: null,
        plantingYearConfidence: 'unknown',
        plantSource: null,
        treeStatus: 'empty',
        baselineDate: '2026-08-31',
        baselineMeasurements: emptyTreeBaselineMeasurements(),
        notes: 'TEST EXAMPLE DATA ONLY',
        reason: 'ทดสอบปลูกทดแทน',
      },
    )

    expect(replaced.tagCode).toBe(original?.tagCode)
    expect(replaced.currentCycleNumber).toBe(2)
    expect(replaced.plantingCycles).toHaveLength(2)
    expect(replaced.plantingCycles.at(0)?.endedAtLabel).not.toBeNull()
  })

  it('does not reuse a tag after the position is archived', async () => {
    const { adapters, identity } = await signInOwner()
    const farm = (await adapters.repository.listFarmAccess(identity.userId)).find(
      (candidate) => candidate.farmCode === 'DEMO-F01',
    )!
    await adapters.treeRepository.archiveTreePosition(
      { actor: identity, farm },
      'pos_demo_a01f783bc219',
      'ทดสอบ archive',
    )
    await expect(async () => adapters.treeRepository.createTreePosition(
      { actor: identity, farm },
      {
        organizationCode: 'DEMO', farmSequence: 'F01', zoneCode: 'Z01',
        rowCode: 'R01', treeSequence: 1, rowCountingDirection: 'TBD', variety: null,
        varietyConfidence: 'unknown', plantingYear: null,
        plantingYearCalendar: null, plantingYearConfidence: 'unknown', plantSource: null,
        treeStatus: 'empty', baselineDate: '2026-08-31',
        baselineMeasurements: emptyTreeBaselineMeasurements(), notes: 'TEST',
      },
    )).rejects.toThrow(/ห้ามนำกลับมาใช้/u)
  })

  it('imports atomically and treats the same idempotency key as a retry', async () => {
    const { adapters, identity } = await signInOwner()
    const farm = (await adapters.repository.listFarmAccess(identity.userId)).find(
      (candidate) => candidate.farmCode === 'DEMO-F01',
    )!
    const preview = importPreview(10, 11)
    const first = await adapters.treeRepository.importTreePositions(
      { actor: identity, farm },
      preview.idempotencyKey,
      preview.candidates,
    )
    const retry = await adapters.treeRepository.importTreePositions(
      { actor: identity, farm },
      preview.idempotencyKey,
      preview.candidates,
    )

    expect(first.importedCount).toBe(2)
    expect(retry.wasRetry).toBe(true)
    expect(retry.positionIds).toEqual(first.positionIds)
    expect((await adapters.treeRepository.listTreePositions(
      farm.organizationId,
      farm.farmId,
    )).filter((position) => [10, 11].includes(position.treeSequence))).toHaveLength(2)
  })
})
