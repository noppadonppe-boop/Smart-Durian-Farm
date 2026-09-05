import { describe, expect, it, vi } from 'vitest'

import type { FarmAccess } from '../domain/farm'
import type { PhotoRecoveryDraft } from '../domain/operationalHardening'
import type { WorkPhotoEvidence } from '../domain/workCareDisease'
import { uploadAndCommitWorkPhotoBatch } from './workPhotoRecovery'

const farm: FarmAccess = {
  organizationId: 'org_demo_01', organizationName: 'องค์กรจำลอง', organizationCode: 'DEMO',
  farmId: 'farm_demo_01', farmCode: 'DEMO-F01', farmSequence: 'F01', farmName: 'สวนจำลอง',
  farmStatus: 'ACTIVE', membershipStatus: 'ACTIVE', role: 'WORKER', isOrganizationOwner: false, isMock: true,
}

function photo(photoId: string): WorkPhotoEvidence {
  return {
    photoId,
    phase: 'BEFORE',
    uploadState: 'UPLOADED',
    storagePath: `mock://organizations/${farm.organizationId}/farms/${farm.farmId}/workEvidence/work_demo_01/${photoId}`,
    note: 'test',
  }
}

describe('automatic work photo recovery registration', () => {
  it('retries a transient upload and commits without a recovery record', async () => {
    let attempts = 0
    const register = vi.fn()
    const result = await uploadAndCommitWorkPhotoBatch({
      farm, workOrderId: 'work_demo_01',
      candidates: [{ photoId: 'photo_before_demo01', phase: 'BEFORE', file: new Blob(['x']) }],
      upload: (candidate) => {
        attempts += 1
        return attempts < 3
          ? Promise.reject(new Error('offline'))
          : Promise.resolve(photo(candidate.photoId))
      },
      commit: (photos) => Promise.resolve(photos.length),
      register,
      wait: () => Promise.resolve(),
    })
    expect(result).toBe(1)
    expect(attempts).toBe(3)
    expect(register).not.toHaveBeenCalled()
  })

  it('registers failed and already-uploaded items for retry/orphan cleanup', async () => {
    const registeredDrafts: PhotoRecoveryDraft[] = []
    const register = vi.fn((idempotencyKey: string, draft: PhotoRecoveryDraft) => {
      expect(idempotencyKey).toMatch(/^photo-(failed|orphan)-/u)
      registeredDrafts.push(draft)
      return Promise.resolve()
    })
    await expect(uploadAndCommitWorkPhotoBatch({
      farm, workOrderId: 'work_demo_01',
      candidates: [
        { photoId: 'photo_before_demo01', phase: 'BEFORE', file: new Blob(['x']) },
        { photoId: 'photo_after_demo02', phase: 'AFTER', file: new Blob(['y']) },
      ],
      upload: (candidate) => candidate.phase === 'AFTER'
        ? Promise.reject(new Error('offline'))
        : Promise.resolve(photo(candidate.photoId)),
      commit: () => Promise.resolve(),
      register,
      wait: () => Promise.resolve(),
    })).rejects.toThrow('Photo Retry/Orphan Cleanup')
    expect(register).toHaveBeenCalledTimes(2)
    expect(registeredDrafts.map((draft) => draft.status).sort()).toEqual(['FAILED', 'ORPHANED'])
  })

  it('skips an uploaded checkpoint on reload and checkpoints only the missing binary', async () => {
    const upload = vi.fn((candidate: { photoId: string }) => Promise.resolve(photo(candidate.photoId)))
    const checkpoint = vi.fn(() => Promise.resolve())
    const existing = photo('photo_before_demo01')
    const committed = await uploadAndCommitWorkPhotoBatch({
      farm, workOrderId: 'work_demo_01',
      candidates: [
        {
          photoId: 'photo_before_demo01', phase: 'BEFORE', file: new Blob(['x']),
          uploadedEvidence: existing,
        },
        { photoId: 'photo_after_demo02', phase: 'AFTER', file: new Blob(['y']) },
      ],
      upload,
      commit: (photos) => Promise.resolve(photos.map((item) => item.photoId)),
      register: vi.fn(),
      onPhotoUploaded: checkpoint,
      wait: () => Promise.resolve(),
    })
    expect(upload).toHaveBeenCalledTimes(1)
    expect(upload).toHaveBeenCalledWith(expect.objectContaining({ photoId: 'photo_after_demo02' }))
    expect(checkpoint).toHaveBeenCalledTimes(1)
    expect(committed).toEqual(['photo_before_demo01', 'photo_after_demo02'])
  })

  it('registers an uploaded object as orphan when its durable checkpoint fails', async () => {
    const registeredDrafts: PhotoRecoveryDraft[] = []
    await expect(uploadAndCommitWorkPhotoBatch({
      farm, workOrderId: 'work_demo_01',
      candidates: [{ photoId: 'photo_before_demo01', phase: 'BEFORE', file: new Blob(['x']) }],
      upload: (candidate) => Promise.resolve(photo(candidate.photoId)),
      commit: () => Promise.resolve(),
      register: (_key, draft) => {
        registeredDrafts.push(draft)
        return Promise.resolve()
      },
      onPhotoUploaded: () => Promise.reject(new Error('quota exceeded')),
      wait: () => Promise.resolve(),
    })).rejects.toThrow(/Durable Queue checkpoint/u)
    expect(registeredDrafts).toEqual([
      expect.objectContaining({ photoId: 'photo_before_demo01', status: 'ORPHANED' }),
    ])
  })
})
