import { FirebaseError } from 'firebase/app'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  writeBatch,
  type DocumentData,
  type DocumentReference,
  type Firestore,
} from 'firebase/firestore'

import type {
  TreeRegisterRepository,
  TreeRouteResolution,
} from '../../adapters/contracts'
import type { CanonicalRole } from '../../domain/farm'
import {
  canManageTreeRegister,
  createOpaquePositionId,
  generateTagCode,
  identityConfidences,
  isOpaquePositionId,
  normalizeTagCode,
  positionStatuses,
  treeStatuses,
  type IdentityConfidence,
  type PlantingCycleRecord,
  type PositionStatus,
  type ReplacePlantingCycleInput,
  type TreeImportCandidate,
  type TreeImportResult,
  type TreeMutationContext,
  type TreePositionDetail,
  type TreePositionDraft,
  type TreePositionSummary,
  type TreeStatus,
  type TreeTimelineEvent,
  type UpdatePlantingCycleInput,
} from '../../domain/treeRegister'

const damagedReportRoles: readonly CanonicalRole[] = [
  'ORG_OWNER',
  'FARM_MANAGER',
  'AGRONOMIST',
  'WORKER',
]

function requiredString(data: DocumentData, field: string): string {
  const value: unknown = data[field]
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Invalid Tree Register field: ${field}`)
  }
  return value
}

function requiredInteger(data: DocumentData, field: string): number {
  const value: unknown = data[field]
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new Error(`Invalid Tree Register integer: ${field}`)
  }
  return value
}

function timestampLabel(value: unknown, fallback: string): string {
  if (!(value instanceof Timestamp)) return fallback
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value.toDate())
}

function optionalYear(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error('Invalid plantingYear')
  }
  return value
}

function cycleFromData(data: DocumentData): PlantingCycleRecord {
  const varietyConfidence: unknown = data.varietyConfidence
  const plantingYearConfidence: unknown = data.plantingYearConfidence
  const treeStatus: unknown = data.treeStatus
  const calendar: unknown = data.plantingYearCalendar
  if (
    !identityConfidences.includes(varietyConfidence as IdentityConfidence) ||
    !identityConfidences.includes(plantingYearConfidence as IdentityConfidence) ||
    !treeStatuses.includes(treeStatus as TreeStatus) ||
    (calendar !== null && calendar !== 'BE' && calendar !== 'CE')
  ) {
    throw new Error('Invalid Planting Cycle vocabulary')
  }
  const variety: unknown = data.variety
  if (variety !== null && typeof variety !== 'string') throw new Error('Invalid variety')
  return {
    cycleId: requiredString(data, 'cycleId'),
    cycleNumber: requiredInteger(data, 'cycleNumber'),
    variety,
    varietyConfidence: varietyConfidence as IdentityConfidence,
    plantingYear: optionalYear(data.plantingYear),
    plantingYearCalendar: calendar,
    plantingYearConfidence: plantingYearConfidence as IdentityConfidence,
    treeStatus: treeStatus as TreeStatus,
    baselineDate: requiredString(data, 'baselineDate'),
    notes: typeof data.notes === 'string' ? data.notes : '',
    startedAtLabel: timestampLabel(data.startedAt, 'รอเวลา Emulator'),
    endedAtLabel: data.endedAt === null
      ? null
      : timestampLabel(data.endedAt, 'รอเวลา Emulator'),
    version: requiredInteger(data, 'version'),
  }
}

function eventFromData(data: DocumentData): TreeTimelineEvent {
  const eventType: unknown = data.eventType
  const allowed: readonly TreeTimelineEvent['eventType'][] = [
    'TREE_POSITION_CREATED',
    'TREE_POSITION_IMPORTED',
    'TREE_CYCLE_UPDATED',
    'TREE_CYCLE_REPLACED',
    'TREE_POSITION_ARCHIVED',
    'TAG_DAMAGED_REPORTED',
  ]
  if (!allowed.includes(eventType as TreeTimelineEvent['eventType'])) {
    throw new Error('Invalid Tree timeline event type')
  }
  return {
    eventId: requiredString(data, 'eventId'),
    eventType: eventType as TreeTimelineEvent['eventType'],
    actorUserId: requiredString(data, 'actorUserId'),
    actorDisplayName: requiredString(data, 'actorDisplayName'),
    description: requiredString(data, 'description'),
    createdAtLabel: timestampLabel(data.createdAt, 'รอเวลา Emulator'),
    positionVersion: requiredInteger(data, 'positionVersion'),
  }
}

function requireManager(context: TreeMutationContext): void {
  if (!canManageTreeRegister(context.farm)) {
    throw new Error('เฉพาะเจ้าขององค์กรหรือผู้จัดการสวนที่ใช้งานอยู่เท่านั้นที่แก้ทะเบียนต้นได้')
  }
}

function treePositionReference(
  firestore: Firestore,
  context: TreeMutationContext,
  positionId: string,
): DocumentReference {
  return doc(
    firestore,
    'organizations',
    context.farm.organizationId,
    'farms',
    context.farm.farmId,
    'treePositions',
    positionId,
  )
}

function cycleData(
  draft: TreePositionDraft | TreeImportCandidate | UpdatePlantingCycleInput,
  cycleId: string,
  cycleNumber: number,
  actorUserId: string,
  baselineDate: string,
  version = 1,
) {
  return {
    recordType: 'PLANTING_CYCLE',
    cycleId,
    cycleNumber,
    variety: draft.variety,
    varietyConfidence: draft.varietyConfidence,
    plantingYear: draft.plantingYear,
    plantingYearCalendar: draft.plantingYearCalendar,
    plantingYearConfidence: draft.plantingYearConfidence,
    treeStatus: draft.treeStatus,
    baselineDate,
    notes: draft.notes,
    startedAt: serverTimestamp(),
    endedAt: null,
    version,
    createdBy: actorUserId,
    updatedBy: actorUserId,
    updatedAt: serverTimestamp(),
    exampleData: true,
  }
}

function eventData(
  context: TreeMutationContext,
  eventId: string,
  eventType: TreeTimelineEvent['eventType'],
  positionId: string,
  description: string,
  positionVersion: number,
) {
  return {
    recordType: 'TREE_EVENT',
    eventId,
    eventType,
    organizationId: context.farm.organizationId,
    farmId: context.farm.farmId,
    positionId,
    actorUserId: context.actor.userId,
    actorDisplayName: context.actor.displayName,
    description,
    positionVersion,
    exampleData: true,
    createdAt: serverTimestamp(),
  }
}

export class FirebaseTreeRegisterRepository implements TreeRegisterRepository {
  constructor(private readonly firestore: Firestore) {}

  async listTreePositions(
    organizationId: string,
    farmId: string,
  ): Promise<readonly TreePositionSummary[]> {
    const snapshot = await getDocs(
      query(
        collection(
          this.firestore,
          'organizations',
          organizationId,
          'farms',
          farmId,
          'treePositions',
        ),
        orderBy('tagCode'),
      ),
    )
    return Promise.all(
      snapshot.docs.map(async (positionDocument) => {
        const data = positionDocument.data()
        return this.summaryFromData(data, await this.loadCurrentCycle(
          organizationId,
          farmId,
          positionDocument.id,
          requiredInteger(data, 'currentCycleNumber'),
        ))
      }),
    )
  }

  async getTreePosition(
    organizationId: string,
    farmId: string,
    positionId: string,
  ): Promise<TreePositionDetail | undefined> {
    const reference = doc(
      this.firestore,
      'organizations',
      organizationId,
      'farms',
      farmId,
      'treePositions',
      positionId,
    )
    const positionDocument = await getDoc(reference)
    if (!positionDocument.exists()) return undefined
    const [cyclesSnapshot, eventsSnapshot] = await Promise.all([
      getDocs(query(collection(reference, 'plantingCycles'), orderBy('cycleNumber'))),
      getDocs(query(collection(reference, 'events'), orderBy('createdAt', 'desc'))),
    ])
    const cycles = cyclesSnapshot.docs.map((cycleDocument) => cycleFromData(cycleDocument.data()))
    const currentCycleNumber = requiredInteger(positionDocument.data(), 'currentCycleNumber')
    const currentCycle = cycles.find((cycle) => cycle.cycleNumber === currentCycleNumber)
    if (!currentCycle) throw new Error('ไม่พบ Planting Cycle ปัจจุบันใน Emulator')
    return {
      ...this.summaryFromData(positionDocument.data(), currentCycle),
      plantingCycles: cycles,
      timeline: eventsSnapshot.docs.map((eventDocument) => eventFromData(eventDocument.data())),
    }
  }

  async resolvePositionRoute(
    context: TreeMutationContext,
    positionId: string,
  ): Promise<TreeRouteResolution> {
    if (!isOpaquePositionId(positionId)) return { status: 'UNKNOWN' }
    try {
      const route = await getDoc(doc(this.firestore, 'positionRoutes', positionId))
      if (!route.exists()) return { status: 'UNKNOWN' }
      const data = route.data()
      const routeOrganizationId = requiredString(data, 'organizationId')
      const routeFarmId = requiredString(data, 'farmId')
      if (
        routeOrganizationId !== context.farm.organizationId ||
        routeFarmId !== context.farm.farmId
      ) {
        return { status: 'ACCESS_DENIED' }
      }
      const position = await this.getTreePosition(
        routeOrganizationId,
        routeFarmId,
        positionId,
      )
      return position ? { status: 'FOUND', position } : { status: 'UNKNOWN' }
    } catch (error) {
      if (error instanceof FirebaseError && error.code === 'permission-denied') {
        return { status: 'ACCESS_DENIED' }
      }
      throw error
    }
  }

  async resolveTag(
    organizationId: string,
    farmId: string,
    tagCode: string,
  ): Promise<TreePositionDetail | undefined> {
    const normalized = normalizeTagCode(tagCode)
    const tagDocument = await getDoc(doc(
      this.firestore,
      'organizations',
      organizationId,
      'farms',
      farmId,
      'treeTags',
      normalized,
    ))
    if (!tagDocument.exists()) return undefined
    return this.getTreePosition(
      organizationId,
      farmId,
      requiredString(tagDocument.data(), 'positionId'),
    )
  }

  async createTreePosition(
    context: TreeMutationContext,
    draft: TreePositionDraft,
  ): Promise<TreePositionDetail> {
    requireManager(context)
    const tagCode = generateTagCode(draft)
    const tagReference = this.tagReference(context, tagCode)
    if ((await getDoc(tagReference)).exists()) {
      throw new Error('Tag นี้เคยถูกใช้แล้วและห้ามนำกลับมาใช้ แม้ตำแหน่งจะเก็บถาวร')
    }
    const positionId = createOpaquePositionId()
    const eventId = `event_${crypto.randomUUID()}`
    const batch = writeBatch(this.firestore)
    this.addNewPositionToBatch(
      batch,
      context,
      positionId,
      draft,
      1,
      tagCode,
      eventId,
      'TREE_POSITION_CREATED',
      'สร้างตำแหน่งปลูกจำลอง',
    )
    await batch.commit()
    const position = await this.getTreePosition(
      context.farm.organizationId,
      context.farm.farmId,
      positionId,
    )
    if (!position) throw new Error('สร้างตำแหน่งแล้วแต่ไม่สามารถอ่านกลับได้')
    return position
  }

  async updateCurrentPlantingCycle(
    context: TreeMutationContext,
    positionId: string,
    input: UpdatePlantingCycleInput,
  ): Promise<TreePositionDetail> {
    requireManager(context)
    const current = await this.requirePosition(context, positionId)
    if (current.positionStatus !== 'ACTIVE') throw new Error('ตำแหน่งที่เก็บถาวรแก้ไขไม่ได้')
    const nextPositionVersion = current.version + 1
    const eventId = `event_${crypto.randomUUID()}`
    const positionReference = treePositionReference(this.firestore, context, positionId)
    const cycleReference = doc(
      positionReference,
      'plantingCycles',
      current.currentCycle.cycleId,
    )
    const eventReference = doc(positionReference, 'events', eventId)
    const batch = writeBatch(this.firestore)
    batch.update(positionReference, {
      version: nextPositionVersion,
      lastEventId: eventId,
      updatedBy: context.actor.userId,
      updatedAt: serverTimestamp(),
    })
    batch.update(cycleReference, {
      variety: input.variety,
      varietyConfidence: input.varietyConfidence,
      plantingYear: input.plantingYear,
      plantingYearCalendar: input.plantingYearCalendar,
      plantingYearConfidence: input.plantingYearConfidence,
      treeStatus: input.treeStatus,
      notes: input.notes,
      version: current.currentCycle.version + 1,
      updatedBy: context.actor.userId,
      updatedAt: serverTimestamp(),
    })
    batch.set(eventReference, eventData(
      context,
      eventId,
      'TREE_CYCLE_UPDATED',
      positionId,
      `แก้ข้อมูลรอบปลูก ${current.currentCycleNumber}`,
      nextPositionVersion,
    ))
    await batch.commit()
    return this.requirePosition(context, positionId)
  }

  async replacePlantingCycle(
    context: TreeMutationContext,
    positionId: string,
    input: ReplacePlantingCycleInput,
  ): Promise<TreePositionDetail> {
    requireManager(context)
    if (!input.reason.trim()) throw new Error('ต้องระบุเหตุผลการปลูกทดแทน')
    const current = await this.requirePosition(context, positionId)
    if (current.positionStatus !== 'ACTIVE') throw new Error('ตำแหน่งที่เก็บถาวรเพิ่มรอบปลูกไม่ได้')
    const nextPositionVersion = current.version + 1
    const nextCycleNumber = current.currentCycleNumber + 1
    const nextCycleId = `cycle_${String(nextCycleNumber).padStart(3, '0')}`
    const eventId = `event_${crypto.randomUUID()}`
    const positionReference = treePositionReference(this.firestore, context, positionId)
    const oldCycleReference = doc(positionReference, 'plantingCycles', current.currentCycle.cycleId)
    const nextCycleReference = doc(positionReference, 'plantingCycles', nextCycleId)
    const eventReference = doc(positionReference, 'events', eventId)
    const batch = writeBatch(this.firestore)
    batch.update(positionReference, {
      currentCycleNumber: nextCycleNumber,
      version: nextPositionVersion,
      lastEventId: eventId,
      updatedBy: context.actor.userId,
      updatedAt: serverTimestamp(),
    })
    batch.update(oldCycleReference, {
      endedAt: serverTimestamp(),
      version: current.currentCycle.version + 1,
      updatedBy: context.actor.userId,
      updatedAt: serverTimestamp(),
    })
    batch.set(nextCycleReference, cycleData(
      { ...input, notes: `${input.notes}${input.notes ? ' · ' : ''}เหตุผลปลูกทดแทน: ${input.reason}` },
      nextCycleId,
      nextCycleNumber,
      context.actor.userId,
      input.baselineDate,
    ))
    batch.set(eventReference, eventData(
      context,
      eventId,
      'TREE_CYCLE_REPLACED',
      positionId,
      `ปิดรอบปลูก ${current.currentCycleNumber} และเพิ่มรอบปลูก ${nextCycleNumber}; Tag เดิมไม่เปลี่ยน`,
      nextPositionVersion,
    ))
    await batch.commit()
    return this.requirePosition(context, positionId)
  }

  async archiveTreePosition(
    context: TreeMutationContext,
    positionId: string,
    reason: string,
  ): Promise<TreePositionDetail> {
    requireManager(context)
    if (!reason.trim()) throw new Error('ต้องระบุเหตุผลการเก็บถาวร')
    const current = await this.requirePosition(context, positionId)
    if (current.positionStatus === 'ARCHIVED') return current
    const nextVersion = current.version + 1
    const eventId = `event_${crypto.randomUUID()}`
    const positionReference = treePositionReference(this.firestore, context, positionId)
    const batch = writeBatch(this.firestore)
    batch.update(positionReference, {
      positionStatus: 'ARCHIVED',
      version: nextVersion,
      lastEventId: eventId,
      updatedBy: context.actor.userId,
      updatedAt: serverTimestamp(),
    })
    batch.set(doc(positionReference, 'events', eventId), eventData(
      context,
      eventId,
      'TREE_POSITION_ARCHIVED',
      positionId,
      `เก็บตำแหน่งถาวร: ${reason}; Tag จะไม่ถูกนำกลับมาใช้`,
      nextVersion,
    ))
    await batch.commit()
    return this.requirePosition(context, positionId)
  }

  async reportDamagedTag(
    context: TreeMutationContext,
    positionId: string,
    note: string,
  ): Promise<TreePositionDetail> {
    if (
      context.farm.farmStatus !== 'ACTIVE' ||
      !damagedReportRoles.includes(context.farm.role)
    ) {
      throw new Error('บทบาทนี้ไม่มีสิทธิ์รายงานป้ายชำรุด')
    }
    const current = await this.requirePosition(context, positionId)
    const eventId = `event_${crypto.randomUUID()}`
    const reference = doc(
      treePositionReference(this.firestore, context, positionId),
      'events',
      eventId,
    )
    const batch = writeBatch(this.firestore)
    batch.set(reference, eventData(
      context,
      eventId,
      'TAG_DAMAGED_REPORTED',
      positionId,
      `รายงานป้ายชำรุด${note.trim() ? `: ${note.trim()}` : ''}`,
      current.version,
    ))
    await batch.commit()
    return this.requirePosition(context, positionId)
  }

  async importTreePositions(
    context: TreeMutationContext,
    idempotencyKey: string,
    candidates: readonly TreeImportCandidate[],
  ): Promise<TreeImportResult> {
    requireManager(context)
    if (candidates.length === 0) throw new Error('ไม่มีแถวที่ผ่านการตรวจสำหรับ Import')
    if (candidates.length > 50) throw new Error('Phase 3 local import จำกัดครั้งละไม่เกิน 50 ตำแหน่ง')
    const importReference = doc(
      this.firestore,
      'organizations',
      context.farm.organizationId,
      'farms',
      context.farm.farmId,
      'treeImports',
      idempotencyKey,
    )
    const prior = await getDoc(importReference)
    if (prior.exists()) {
      const positionIds: unknown = prior.data().positionIds
      if (!Array.isArray(positionIds) || !positionIds.every((value) => typeof value === 'string')) {
        throw new Error('Import retry record ไม่ถูกต้อง')
      }
      return {
        idempotencyKey,
        importedCount: 0,
        existingCount: requiredInteger(prior.data(), 'importedCount'),
        positionIds,
        wasRetry: true,
      }
    }

    const tagDocuments = await Promise.all(
      candidates.map((candidate) => getDoc(this.tagReference(context, candidate.tagCode))),
    )
    const duplicateIndex = tagDocuments.findIndex((document) => document.exists())
    if (duplicateIndex >= 0) {
      throw new Error(`Import ถูกยกเลิกทั้งชุด: Tag ${candidates[duplicateIndex]?.tagCode ?? ''} เคยถูกใช้แล้ว`)
    }

    const batch = writeBatch(this.firestore)
    const positionIds: string[] = []
    candidates.forEach((candidate) => {
      const positionId = createOpaquePositionId()
      positionIds.push(positionId)
      const eventId = `event_${crypto.randomUUID()}`
      this.addNewPositionToBatch(
        batch,
        context,
        positionId,
        candidate,
        candidate.plantingCycle,
        candidate.tagCode,
        eventId,
        'TREE_POSITION_IMPORTED',
        `นำเข้าจาก CSV แถว ${candidate.sourceRow} แบบ atomic Emulator flow`,
      )
    })
    batch.set(importReference, {
      recordType: 'TREE_IMPORT',
      idempotencyKey,
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      actorUserId: context.actor.userId,
      status: 'COMPLETED',
      importedCount: positionIds.length,
      positionIds,
      exampleData: true,
      createdAt: serverTimestamp(),
    })
    await batch.commit()
    return {
      idempotencyKey,
      importedCount: positionIds.length,
      existingCount: 0,
      positionIds,
      wasRetry: false,
    }
  }

  private async loadCurrentCycle(
    organizationId: string,
    farmId: string,
    positionId: string,
    cycleNumber: number,
  ): Promise<PlantingCycleRecord> {
    const cycleId = `cycle_${String(cycleNumber).padStart(3, '0')}`
    const snapshot = await getDoc(doc(
      this.firestore,
      'organizations',
      organizationId,
      'farms',
      farmId,
      'treePositions',
      positionId,
      'plantingCycles',
      cycleId,
    ))
    if (!snapshot.exists()) throw new Error('ไม่พบ Planting Cycle ปัจจุบัน')
    return cycleFromData(snapshot.data())
  }

  private summaryFromData(
    data: DocumentData,
    currentCycle: PlantingCycleRecord,
  ): TreePositionSummary {
    const positionStatus: unknown = data.positionStatus
    if (!positionStatuses.includes(positionStatus as PositionStatus)) {
      throw new Error('Invalid position status')
    }
    return {
      organizationId: requiredString(data, 'organizationId'),
      farmId: requiredString(data, 'farmId'),
      positionId: requiredString(data, 'positionId'),
      organizationCode: requiredString(data, 'organizationCode'),
      farmSequence: requiredString(data, 'farmSequence'),
      zoneCode: requiredString(data, 'zoneCode'),
      rowCode: requiredString(data, 'rowCode'),
      treeSequence: requiredInteger(data, 'treeSequence'),
      tagCode: requiredString(data, 'tagCode'),
      positionStatus: positionStatus as PositionStatus,
      currentCycleNumber: requiredInteger(data, 'currentCycleNumber'),
      currentCycle,
      qrPath: requiredString(data, 'qrPath'),
      version: requiredInteger(data, 'version'),
      exampleData: data.exampleData === true,
    }
  }

  private async requirePosition(
    context: TreeMutationContext,
    positionId: string,
  ): Promise<TreePositionDetail> {
    const position = await this.getTreePosition(
      context.farm.organizationId,
      context.farm.farmId,
      positionId,
    )
    if (!position) throw new Error('ไม่พบตำแหน่งปลูกในสวนปัจจุบัน')
    return position
  }

  private tagReference(
    context: TreeMutationContext,
    tagCode: string,
  ): DocumentReference {
    return doc(
      this.firestore,
      'organizations',
      context.farm.organizationId,
      'farms',
      context.farm.farmId,
      'treeTags',
      normalizeTagCode(tagCode),
    )
  }

  private addNewPositionToBatch(
    batch: ReturnType<typeof writeBatch>,
    context: TreeMutationContext,
    positionId: string,
    draft: TreePositionDraft | TreeImportCandidate,
    cycleNumber: number,
    tagCode: string,
    eventId: string,
    eventType: 'TREE_POSITION_CREATED' | 'TREE_POSITION_IMPORTED',
    description: string,
  ): void {
    const positionReference = treePositionReference(this.firestore, context, positionId)
    const cycleId = `cycle_${String(cycleNumber).padStart(3, '0')}`
    batch.set(positionReference, {
      recordType: 'TREE_POSITION',
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      positionId,
      organizationCode: context.farm.organizationCode,
      farmSequence: context.farm.farmSequence,
      zoneCode: draft.zoneCode,
      rowCode: draft.rowCode,
      treeSequence: draft.treeSequence,
      tagCode,
      positionStatus: 'ACTIVE',
      currentCycleNumber: cycleNumber,
      qrPath: `/t/${positionId}`,
      version: 1,
      lastEventId: eventId,
      exampleData: true,
      createdBy: context.actor.userId,
      createdAt: serverTimestamp(),
      updatedBy: context.actor.userId,
      updatedAt: serverTimestamp(),
    })
    batch.set(doc(positionReference, 'plantingCycles', cycleId), cycleData(
      draft,
      cycleId,
      cycleNumber,
      context.actor.userId,
      draft.baselineDate,
    ))
    batch.set(doc(positionReference, 'events', eventId), eventData(
      context,
      eventId,
      eventType,
      positionId,
      description,
      1,
    ))
    batch.set(this.tagReference(context, tagCode), {
      recordType: 'TREE_TAG_INDEX',
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      positionId,
      tagCode,
      exampleData: true,
      createdBy: context.actor.userId,
      createdAt: serverTimestamp(),
    })
    batch.set(doc(this.firestore, 'positionRoutes', positionId), {
      recordType: 'POSITION_ROUTE',
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      positionId,
      exampleData: true,
      createdBy: context.actor.userId,
      createdAt: serverTimestamp(),
    })
  }
}
