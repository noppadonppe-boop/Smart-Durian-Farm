import type { FarmAccess } from '../domain/farm'
import type { PhotoRecoveryDraft } from '../domain/operationalHardening'
import type { WorkPhotoEvidence, WorkPhotoPhase } from '../domain/workCareDisease'
import { withBoundedPhotoRetry } from './workPhotoProcessing'

export interface WorkPhotoUploadCandidate {
  photoId: string
  phase: WorkPhotoPhase
  file: Blob
  uploadedEvidence?: WorkPhotoEvidence
}

interface UploadAndCommitOptions<T> {
  mode: 'mock' | 'firebase-emulator'
  farm: FarmAccess
  workOrderId: string
  candidates: readonly WorkPhotoUploadCandidate[]
  upload: (candidate: WorkPhotoUploadCandidate) => Promise<WorkPhotoEvidence>
  commit: (photos: readonly WorkPhotoEvidence[]) => Promise<T>
  register: (idempotencyKey: string, draft: PhotoRecoveryDraft) => Promise<unknown>
  onPhotoUploaded?: (
    candidate: WorkPhotoUploadCandidate,
    evidence: WorkPhotoEvidence,
  ) => Promise<void>
  onCommitted?: () => Promise<void>
  wait?: (milliseconds: number) => Promise<void>
}

class PhotoUploadCheckpointError extends Error {
  constructor(
    readonly evidence: WorkPhotoEvidence,
    cause: unknown,
  ) {
    super(`อัปโหลดรูปสำเร็จแต่บันทึก Durable Queue checkpoint ไม่สำเร็จ: ${errorMessage(cause)}`, {
      cause,
    })
  }
}

export function expectedWorkPhotoStoragePath(
  mode: 'mock' | 'firebase-emulator',
  farm: FarmAccess,
  workOrderId: string,
  photoId: string,
): string {
  if (mode === 'mock') {
    return `mock://organizations/${farm.organizationId}/farms/${farm.farmId}/workEvidence/${workOrderId}/${photoId}`
  }
  return `organizations/${farm.organizationId}/farms/${farm.farmId}/workEvidence/${workOrderId}/${photoId}`
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'การอัปโหลดหรือผูกรูปไม่สำเร็จ'
}

export async function uploadAndCommitWorkPhotoBatch<T>(
  options: UploadAndCommitOptions<T>,
): Promise<T> {
  const results = await Promise.allSettled(options.candidates.map(async (candidate) => {
    if (candidate.uploadedEvidence) return candidate.uploadedEvidence
    const evidence = await withBoundedPhotoRetry(() => options.upload(candidate), 3, options.wait)
    try {
      await options.onPhotoUploaded?.(candidate, evidence)
    } catch (error) {
      throw new PhotoUploadCheckpointError(evidence, error)
    }
    return evidence
  }))
  const uploaded: WorkPhotoEvidence[] = []
  const registrations: Promise<unknown>[] = []
  let firstFailure: unknown

  results.forEach((result, index) => {
    const candidate = options.candidates[index]!
    const storagePath = expectedWorkPhotoStoragePath(
      options.mode, options.farm, options.workOrderId, candidate.photoId,
    )
    if (result.status === 'fulfilled') {
      uploaded.push(result.value)
      return
    }
    firstFailure ??= result.reason
    if (result.reason instanceof PhotoUploadCheckpointError) {
      uploaded.push(result.reason.evidence)
      return
    }
    registrations.push(options.register(`photo-failed-${candidate.photoId}`, {
      workOrderId: options.workOrderId,
      photoId: candidate.photoId,
      phase: candidate.phase,
      storagePath,
      status: 'FAILED',
      failureMode: 'PARTIAL_ONCE',
      lastError: errorMessage(result.reason),
    }))
  })

  if (firstFailure !== undefined) {
    for (const photo of uploaded) {
      registrations.push(options.register(`photo-orphan-${photo.photoId}`, {
        workOrderId: options.workOrderId,
        photoId: photo.photoId,
        phase: photo.phase,
        storagePath: photo.storagePath,
        status: 'ORPHANED',
        failureMode: 'ORPHANED_OBJECT',
        lastError: 'อัปโหลดสำเร็จแต่รูปอื่นในชุดล้มเหลว จึงยังไม่ได้ผูกกับ Work Order',
      }))
    }
    await Promise.allSettled(registrations)
    throw new Error(`${errorMessage(firstFailure)} · ลงทะเบียนเข้า Photo Retry/Orphan Cleanup แล้ว`)
  }

  try {
    const result = await options.commit(uploaded)
    try {
      await options.onCommitted?.()
    } catch {
      // Commit is idempotent and already authoritative. Keeping the local batch is
      // safer than reporting the Work update as failed; the next replay removes it.
    }
    return result
  } catch (error) {
    await Promise.allSettled(uploaded.map((photo) => options.register(
      `photo-orphan-${photo.photoId}`,
      {
        workOrderId: options.workOrderId,
        photoId: photo.photoId,
        phase: photo.phase,
        storagePath: photo.storagePath,
        status: 'ORPHANED',
        failureMode: 'ORPHANED_OBJECT',
        lastError: `อัปโหลดสำเร็จแต่ผูกรูปกับ Work Order ไม่สำเร็จ: ${errorMessage(error)}`,
      },
    )))
    throw new Error(`${errorMessage(error)} · ลงทะเบียน Orphan Cleanup แล้ว`, { cause: error })
  }
}
