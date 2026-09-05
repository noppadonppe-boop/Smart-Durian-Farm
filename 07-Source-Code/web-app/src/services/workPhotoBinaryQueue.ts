import type { FarmAccess } from '../domain/farm'
import {
  workPhotoUploadPolicy,
  type WorkPhotoEvidence,
  type WorkPhotoPhase,
  type WorkReportInput,
} from '../domain/workCareDisease'

const databaseName = 'kdoms-work-photo-queue-v1'
const storeName = 'batches'
const databaseVersion = 1
const maximumQueueAgeMilliseconds = 7 * 24 * 60 * 60 * 1_000

export type WorkPhotoBinaryBatchKind = 'INSTRUCTION' | 'REPORT'
export type WorkPhotoReportDraft = Omit<WorkReportInput, 'photos'>

export interface WorkPhotoBinaryQueueScope {
  organizationId: string
  farmId: string
  actorUserId: string
}

export interface QueuedWorkPhotoCandidate {
  photoId: string
  phase: WorkPhotoPhase
  file: Blob
  uploadedEvidence?: WorkPhotoEvidence
}

export interface WorkPhotoBinaryBatch {
  schemaVersion: 1
  batchId: string
  organizationId: string
  farmId: string
  actorUserId: string
  workOrderId: string
  kind: WorkPhotoBinaryBatchKind
  commitIdempotencyKey: string
  candidates: readonly QueuedWorkPhotoCandidate[]
  reportDraft?: WorkPhotoReportDraft
  createdAtIso: string
  updatedAtIso: string
  expiresAtIso: string
  exampleData: boolean
}

export interface CreateWorkPhotoBinaryBatchInput {
  farm: FarmAccess
  actorUserId: string
  workOrderId: string
  kind: WorkPhotoBinaryBatchKind
  commitIdempotencyKey: string
  candidates: readonly Omit<QueuedWorkPhotoCandidate, 'uploadedEvidence'>[]
  reportDraft?: WorkPhotoReportDraft
  exampleData: boolean
}

export interface WorkPhotoBinaryQueue {
  put(batch: WorkPhotoBinaryBatch): Promise<void>
  get(batchId: string, scope: WorkPhotoBinaryQueueScope): Promise<WorkPhotoBinaryBatch | undefined>
  list(scope: WorkPhotoBinaryQueueScope): Promise<readonly WorkPhotoBinaryBatch[]>
  checkpointUploaded(
    batchId: string,
    scope: WorkPhotoBinaryQueueScope,
    evidence: WorkPhotoEvidence,
  ): Promise<void>
  delete(batchId: string, scope: WorkPhotoBinaryQueueScope): Promise<void>
  clearScope(scope: WorkPhotoBinaryQueueScope): Promise<void>
}

function idIsSafe(value: string): boolean {
  return /^[A-Za-z0-9_-]{4,160}$/u.test(value)
}

function sameScope(batch: WorkPhotoBinaryBatch, scope: WorkPhotoBinaryQueueScope): boolean {
  return batch.organizationId === scope.organizationId &&
    batch.farmId === scope.farmId &&
    batch.actorUserId === scope.actorUserId
}

function cloneReportDraft(draft: WorkPhotoReportDraft | undefined): WorkPhotoReportDraft | undefined {
  if (!draft) return undefined
  return {
    notes: draft.notes,
    targetConfirmedPositionId: draft.targetConfirmedPositionId,
    materials: draft.materials.map((material) => ({ ...material })),
    completions: draft.completions.map((completion) => ({ ...completion })),
  }
}

function cloneBatch(batch: WorkPhotoBinaryBatch): WorkPhotoBinaryBatch {
  return {
    ...batch,
    candidates: batch.candidates.map((candidate) => ({
      ...candidate,
      file: candidate.file,
      uploadedEvidence: candidate.uploadedEvidence
        ? { ...candidate.uploadedEvidence }
        : undefined,
    })),
    reportDraft: cloneReportDraft(batch.reportDraft),
  }
}

function expectedStoragePathPrefix(batch: WorkPhotoBinaryBatch): string {
  return `organizations/${batch.organizationId}/farms/${batch.farmId}/workEvidence/${batch.workOrderId}/`
}

function validateBatch(batch: WorkPhotoBinaryBatch): WorkPhotoBinaryBatch {
  if (batch.schemaVersion !== 1) throw new Error('เวอร์ชัน Durable Photo Queue ไม่ถูกต้อง')
  for (const value of [
    batch.batchId,
    batch.organizationId,
    batch.farmId,
    batch.actorUserId,
    batch.workOrderId,
    batch.commitIdempotencyKey,
  ]) {
    if (!idIsSafe(value)) throw new Error('รหัสใน Durable Photo Queue ไม่ถูกต้อง')
  }
  const createdAt = Date.parse(batch.createdAtIso)
  const expiresAt = Date.parse(batch.expiresAtIso)
  if (
    !Number.isFinite(createdAt) || !Number.isFinite(expiresAt) ||
    expiresAt <= createdAt || expiresAt - createdAt > maximumQueueAgeMilliseconds
  ) throw new Error('อายุ Durable Photo Queue ต้องไม่เกิน 7 วัน')
  if (batch.candidates.length === 0) throw new Error('Durable Photo Queue ต้องมีรูปอย่างน้อย 1 รูป')
  if (batch.kind === 'INSTRUCTION' && batch.candidates.length > 3) {
    throw new Error('รูปประกอบใบงานใน Queue ต้องไม่เกิน 3 รูป')
  }
  if (batch.kind === 'REPORT' && batch.candidates.length > 6) {
    throw new Error('รูปส่งงานใน Queue ต้องไม่เกิน 6 รูป')
  }
  if (batch.kind === 'REPORT' && !batch.reportDraft) throw new Error('Queue รูปส่งงานไม่มี Report draft')
  if (batch.kind === 'INSTRUCTION' && batch.reportDraft) throw new Error('Queue รูปคำสั่งงานต้องไม่มี Report draft')
  const photoIds = new Set<string>()
  for (const candidate of batch.candidates) {
    if (!/^photo_(instruction|before|after)_[A-Za-z0-9_-]{4,128}$/u.test(candidate.photoId)) {
      throw new Error('Photo ID ใน Durable Photo Queue ไม่ถูกต้อง')
    }
    if (photoIds.has(candidate.photoId)) throw new Error('Photo ID ใน Queue ต้องไม่ซ้ำ')
    photoIds.add(candidate.photoId)
    if (batch.kind === 'INSTRUCTION' && candidate.phase !== 'INSTRUCTION') {
      throw new Error('Queue รูปคำสั่งงานรับเฉพาะ phase INSTRUCTION')
    }
    if (batch.kind === 'REPORT' && !['BEFORE', 'AFTER'].includes(candidate.phase)) {
      throw new Error('Queue รูปส่งงานรับเฉพาะ phase BEFORE/AFTER')
    }
    if (
      candidate.file.size <= 0 || candidate.file.size > workPhotoUploadPolicy.maxSourceBytes ||
      !workPhotoUploadPolicy.sourceMimeTypes.includes(
        candidate.file.type.toLowerCase() as (typeof workPhotoUploadPolicy.sourceMimeTypes)[number],
      )
    ) throw new Error('ไฟล์ใน Durable Photo Queue ไม่ผ่านนโยบายชนิดหรือขนาดต้นฉบับ')
    if (candidate.uploadedEvidence) {
      const evidence = candidate.uploadedEvidence
      const validPath = evidence.storagePath === `${expectedStoragePathPrefix(batch)}${candidate.photoId}`
      if (
        evidence.photoId !== candidate.photoId || evidence.phase !== candidate.phase ||
        evidence.uploadState !== 'UPLOADED' || !validPath
      ) throw new Error('Uploaded checkpoint ไม่อยู่ใน Farm/Work/Photo scope เดียวกัน')
    }
  }
  if (batch.kind === 'REPORT') {
    const phases = new Set(batch.candidates.map((candidate) => candidate.phase))
    if (!phases.has('BEFORE') || !phases.has('AFTER')) {
      throw new Error('Queue รูปส่งงานต้องมี BEFORE และ AFTER อย่างน้อยประเภทละ 1 รูป')
    }
  }
  return cloneBatch(batch)
}

export function createWorkPhotoBinaryBatch(
  input: CreateWorkPhotoBinaryBatchInput,
  now = new Date(),
  idFactory: () => string = () => crypto.randomUUID().replaceAll('-', ''),
): WorkPhotoBinaryBatch {
  const createdAtIso = now.toISOString()
  return validateBatch({
    schemaVersion: 1,
    batchId: `photo_batch_${idFactory()}`,
    organizationId: input.farm.organizationId,
    farmId: input.farm.farmId,
    actorUserId: input.actorUserId,
    workOrderId: input.workOrderId,
    kind: input.kind,
    commitIdempotencyKey: input.commitIdempotencyKey,
    candidates: input.candidates.map((candidate) => ({ ...candidate })),
    reportDraft: cloneReportDraft(input.reportDraft),
    createdAtIso,
    updatedAtIso: createdAtIso,
    expiresAtIso: new Date(now.getTime() + maximumQueueAgeMilliseconds).toISOString(),
    exampleData: input.exampleData,
  })
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request ไม่สำเร็จ'))
  })
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction ไม่สำเร็จ'))
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction ถูกยกเลิก'))
  })
}

class BrowserWorkPhotoBinaryQueue implements WorkPhotoBinaryQueue {
  private databasePromise?: Promise<IDBDatabase>

  constructor(private readonly indexedDbFactory: IDBFactory) {}

  private database(): Promise<IDBDatabase> {
    this.databasePromise ??= new Promise((resolve, reject) => {
      const request = this.indexedDbFactory.open(databaseName, databaseVersion)
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(storeName)) {
          request.result.createObjectStore(storeName, { keyPath: 'batchId' })
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('เปิด IndexedDB Photo Queue ไม่สำเร็จ'))
      request.onblocked = () => reject(new Error('IndexedDB Photo Queue ถูกแท็บอื่นขวางการอัปเกรด'))
    })
    return this.databasePromise
  }

  private async all(): Promise<readonly WorkPhotoBinaryBatch[]> {
    const database = await this.database()
    const transaction = database.transaction(storeName, 'readonly')
    const request = transaction.objectStore(storeName).getAll() as unknown as IDBRequest<WorkPhotoBinaryBatch[]>
    const [records] = await Promise.all([
      requestResult(request),
      transactionComplete(transaction),
    ])
    return records.map(validateBatch)
  }

  async put(batch: WorkPhotoBinaryBatch): Promise<void> {
    const database = await this.database()
    const transaction = database.transaction(storeName, 'readwrite')
    const request = transaction.objectStore(storeName).put(validateBatch(batch))
    await Promise.all([requestResult(request), transactionComplete(transaction)])
  }

  async get(batchId: string, scope: WorkPhotoBinaryQueueScope): Promise<WorkPhotoBinaryBatch | undefined> {
    const database = await this.database()
    const transaction = database.transaction(storeName, 'readonly')
    const request = transaction.objectStore(storeName).get(batchId) as unknown as IDBRequest<WorkPhotoBinaryBatch | undefined>
    const [raw] = await Promise.all([
      requestResult(request),
      transactionComplete(transaction),
    ])
    if (!raw) return undefined
    const batch = validateBatch(raw)
    if (!sameScope(batch, scope)) throw new Error('Cross-Farm Durable Photo Queue ถูกปฏิเสธ')
    if (Date.parse(batch.expiresAtIso) <= Date.now()) {
      await this.delete(batchId, scope)
      return undefined
    }
    return batch
  }

  async list(scope: WorkPhotoBinaryQueueScope): Promise<readonly WorkPhotoBinaryBatch[]> {
    const records = await this.all()
    const active: WorkPhotoBinaryBatch[] = []
    for (const batch of records) {
      if (!sameScope(batch, scope)) continue
      if (Date.parse(batch.expiresAtIso) <= Date.now()) {
        await this.delete(batch.batchId, scope)
      } else {
        active.push(batch)
      }
    }
    return active.sort((left, right) => left.createdAtIso.localeCompare(right.createdAtIso))
  }

  async checkpointUploaded(
    batchId: string,
    scope: WorkPhotoBinaryQueueScope,
    evidence: WorkPhotoEvidence,
  ): Promise<void> {
    const batch = await this.get(batchId, scope)
    if (!batch) throw new Error('ไม่พบ Durable Photo Queue ที่ต้อง checkpoint')
    const found = batch.candidates.some((candidate) => candidate.photoId === evidence.photoId)
    if (!found) throw new Error('Photo checkpoint ไม่อยู่ใน batch นี้')
    await this.put(validateBatch({
      ...batch,
      candidates: batch.candidates.map((candidate) => candidate.photoId === evidence.photoId
        ? { ...candidate, uploadedEvidence: { ...evidence } }
        : candidate),
      updatedAtIso: new Date().toISOString(),
    }))
  }

  async delete(batchId: string, scope: WorkPhotoBinaryQueueScope): Promise<void> {
    const records = await this.all()
    const batch = records.find((candidate) => candidate.batchId === batchId)
    if (!batch) return
    if (!sameScope(batch, scope)) throw new Error('Cross-Farm Durable Photo Queue delete ถูกปฏิเสธ')
    const database = await this.database()
    const transaction = database.transaction(storeName, 'readwrite')
    const request = transaction.objectStore(storeName).delete(batchId)
    await Promise.all([requestResult(request), transactionComplete(transaction)])
  }

  async clearScope(scope: WorkPhotoBinaryQueueScope): Promise<void> {
    const records = await this.all()
    for (const batch of records) {
      if (sameScope(batch, scope)) await this.delete(batch.batchId, scope)
    }
  }
}

export class MemoryWorkPhotoBinaryQueue implements WorkPhotoBinaryQueue {
  private readonly records = new Map<string, WorkPhotoBinaryBatch>()

  async put(batch: WorkPhotoBinaryBatch): Promise<void> {
    await Promise.resolve()
    this.records.set(batch.batchId, validateBatch(batch))
  }

  async get(batchId: string, scope: WorkPhotoBinaryQueueScope): Promise<WorkPhotoBinaryBatch | undefined> {
    await Promise.resolve()
    const stored = this.records.get(batchId)
    if (!stored) return undefined
    if (!sameScope(stored, scope)) throw new Error('Cross-Farm Durable Photo Queue ถูกปฏิเสธ')
    if (Date.parse(stored.expiresAtIso) <= Date.now()) {
      this.records.delete(batchId)
      return undefined
    }
    return cloneBatch(stored)
  }

  async list(scope: WorkPhotoBinaryQueueScope): Promise<readonly WorkPhotoBinaryBatch[]> {
    await Promise.resolve()
    const active: WorkPhotoBinaryBatch[] = []
    for (const batch of this.records.values()) {
      if (!sameScope(batch, scope)) continue
      if (Date.parse(batch.expiresAtIso) <= Date.now()) this.records.delete(batch.batchId)
      else active.push(cloneBatch(batch))
    }
    return active.sort((left, right) => left.createdAtIso.localeCompare(right.createdAtIso))
  }

  async checkpointUploaded(
    batchId: string,
    scope: WorkPhotoBinaryQueueScope,
    evidence: WorkPhotoEvidence,
  ): Promise<void> {
    const batch = await this.get(batchId, scope)
    if (!batch) throw new Error('ไม่พบ Durable Photo Queue ที่ต้อง checkpoint')
    const found = batch.candidates.some((candidate) => candidate.photoId === evidence.photoId)
    if (!found) throw new Error('Photo checkpoint ไม่อยู่ใน batch นี้')
    await this.put({
      ...batch,
      candidates: batch.candidates.map((candidate) => candidate.photoId === evidence.photoId
        ? { ...candidate, uploadedEvidence: { ...evidence } }
        : candidate),
      updatedAtIso: new Date().toISOString(),
    })
  }

  async delete(batchId: string, scope: WorkPhotoBinaryQueueScope): Promise<void> {
    await Promise.resolve()
    const stored = this.records.get(batchId)
    if (!stored) return
    if (!sameScope(stored, scope)) throw new Error('Cross-Farm Durable Photo Queue delete ถูกปฏิเสธ')
    this.records.delete(batchId)
  }

  async clearScope(scope: WorkPhotoBinaryQueueScope): Promise<void> {
    await Promise.resolve()
    for (const batch of this.records.values()) {
      if (sameScope(batch, scope)) this.records.delete(batch.batchId)
    }
  }
}

export const workPhotoBinaryQueue: WorkPhotoBinaryQueue = typeof indexedDB === 'undefined'
  ? new MemoryWorkPhotoBinaryQueue()
  : new BrowserWorkPhotoBinaryQueue(indexedDB)
