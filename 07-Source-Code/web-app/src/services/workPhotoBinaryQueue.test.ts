import { describe, expect, it } from 'vitest'

import type { FarmAccess } from '../domain/farm'
import type { WorkPhotoEvidence } from '../domain/workCareDisease'
import {
  createWorkPhotoBinaryBatch,
  MemoryWorkPhotoBinaryQueue,
  type WorkPhotoBinaryQueueScope,
} from './workPhotoBinaryQueue'

const farm: FarmAccess = {
  organizationId: 'org_demo_01', organizationName: 'องค์กรจำลอง', organizationCode: 'DEMO',
  farmId: 'farm_demo_01', farmCode: 'DEMO-F01', farmSequence: 'F01', farmName: 'สวนจำลอง',
  farmStatus: 'ACTIVE', membershipStatus: 'ACTIVE', role: 'WORKER', isOrganizationOwner: false, isMock: true,
}
const scope: WorkPhotoBinaryQueueScope = {
  organizationId: farm.organizationId,
  farmId: farm.farmId,
  actorUserId: 'user_demo_worker_02',
}

function evidence(photoId: string): WorkPhotoEvidence {
  return {
    photoId,
    phase: 'BEFORE',
    uploadState: 'UPLOADED',
    storagePath: `mock://organizations/${farm.organizationId}/farms/${farm.farmId}/workEvidence/work_demo_01/${photoId}`,
    note: 'SIMULATED/TEST ONLY',
  }
}

describe('durable work photo binary queue', () => {
  it('keeps binary, report draft, and upload checkpoint until explicit commit cleanup', async () => {
    const queue = new MemoryWorkPhotoBinaryQueue()
    const batch = createWorkPhotoBinaryBatch({
      farm,
      actorUserId: scope.actorUserId,
      workOrderId: 'work_demo_01',
      kind: 'REPORT',
      commitIdempotencyKey: 'commit_report_demo_01',
      candidates: [
        { photoId: 'photo_before_demo01', phase: 'BEFORE', file: new Blob(['before'], { type: 'image/jpeg' }) },
        { photoId: 'photo_after_demo01', phase: 'AFTER', file: new Blob(['after'], { type: 'image/jpeg' }) },
      ],
      reportDraft: {
        notes: 'รายงานจำลอง', targetConfirmedPositionId: 'position_demo_01',
        materials: [], completions: [],
      },
      exampleData: true,
    }, new Date(), () => 'fixed_demo_01')

    await queue.put(batch)
    expect((await queue.list(scope))[0]?.candidates[0]?.file.size).toBe(6)
    await queue.checkpointUploaded(batch.batchId, scope, evidence('photo_before_demo01'))
    expect((await queue.get(batch.batchId, scope))?.candidates[0]?.uploadedEvidence?.uploadState)
      .toBe('UPLOADED')
    await queue.delete(batch.batchId, scope)
    expect(await queue.list(scope)).toHaveLength(0)
  })

  it('rejects cross-farm reads and invalid report batches', async () => {
    const queue = new MemoryWorkPhotoBinaryQueue()
    const batch = createWorkPhotoBinaryBatch({
      farm,
      actorUserId: scope.actorUserId,
      workOrderId: 'work_demo_01',
      kind: 'INSTRUCTION',
      commitIdempotencyKey: 'commit_instruction_demo_01',
      candidates: [{
        photoId: 'photo_instruction_demo01', phase: 'INSTRUCTION',
        file: new Blob(['instruction'], { type: 'image/png' }),
      }],
      exampleData: true,
    }, new Date(), () => 'fixed_demo_02')
    await queue.put(batch)
    await expect(queue.get(batch.batchId, { ...scope, farmId: 'farm_demo_02' }))
      .rejects.toThrow(/Cross-Farm/u)

    expect(() => createWorkPhotoBinaryBatch({
      farm,
      actorUserId: scope.actorUserId,
      workOrderId: 'work_demo_01',
      kind: 'REPORT',
      commitIdempotencyKey: 'commit_invalid_demo_01',
      candidates: [{
        photoId: 'photo_before_demo02', phase: 'BEFORE',
        file: new Blob(['before'], { type: 'image/jpeg' }),
      }],
      reportDraft: { notes: 'x', targetConfirmedPositionId: null, materials: [], completions: [] },
      exampleData: true,
    })).toThrow(/BEFORE.*AFTER/u)
  })

  it('purges a device batch after the seven-day maximum age', async () => {
    const queue = new MemoryWorkPhotoBinaryQueue()
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1_000)
    const batch = createWorkPhotoBinaryBatch({
      farm,
      actorUserId: scope.actorUserId,
      workOrderId: 'work_demo_01',
      kind: 'INSTRUCTION',
      commitIdempotencyKey: 'commit_expired_demo_01',
      candidates: [{
        photoId: 'photo_instruction_expired01', phase: 'INSTRUCTION',
        file: new Blob(['instruction'], { type: 'image/jpeg' }),
      }],
      exampleData: true,
    }, eightDaysAgo, () => 'expired_demo_01')
    await queue.put(batch)
    expect(await queue.list(scope)).toHaveLength(0)
    expect(await queue.get(batch.batchId, scope)).toBeUndefined()
  })
})
