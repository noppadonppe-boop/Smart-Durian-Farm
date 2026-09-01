import { createMockPhase2Adapters } from './mockFoundationAdapters'
import {
  previewTreeRegisterCsv,
  treeRegisterCsvHeaders,
} from '../../domain/treeRegister'

async function signInOwner() {
  const adapters = createMockPhase2Adapters()
  const challenge = await adapters.auth.requestOtp('+16505550101', 'unused')
  const identity = await adapters.auth.verifyOtp(challenge, '111111')
  return { adapters, identity }
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
        treeStatus: 'empty',
        baselineDate: '2026-08-31',
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
        rowCode: 'R01', treeSequence: 1, variety: null,
        varietyConfidence: 'unknown', plantingYear: null,
        plantingYearCalendar: null, plantingYearConfidence: 'unknown',
        treeStatus: 'empty', baselineDate: '2026-08-31', notes: 'TEST',
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
