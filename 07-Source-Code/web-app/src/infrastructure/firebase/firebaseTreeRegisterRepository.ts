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
  measurementConfidences,
  normalizeTagCode,
  positionStatuses,
  rowCountingDirections,
  treeStatuses,
  validateTreeCycleInput,
  type IdentityConfidence,
  type MeasurementConfidence,
  type PlantingCycleRecord,
  type PositionStatus,
  type ReplacePlantingCycleInput,
  type RowCountingDirection,
  type TreeBaselineMeasurements,
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
import { rootCollection, rootDoc } from './firebaseDataRoot'

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

function optionalString(value: unknown, field: string): string | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') throw new Error(`Invalid ${field}`)
  return value
}

function requiredFiniteNumber(data: DocumentData, field: string): number {
  const value: unknown = data[field]
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid Tree Register number: ${field}`)
  }
  return value
}

function measurementConfidence(value: unknown, field: string): MeasurementConfidence {
  if (!measurementConfidences.includes(value as MeasurementConfidence)) {
    throw new Error(`Invalid measurement confidence: ${field}`)
  }
  return value as MeasurementConfidence
}

function baselineMeasurementsFromData(value: unknown): TreeBaselineMeasurements {
  if (value === undefined || value === null) {
    return { gps: null, trunk: null, canopy: null, height: null }
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid baselineMeasurements')
  }
  const data = value as DocumentData
  const gps = data.gps as DocumentData | null | undefined
  const trunk = data.trunk as DocumentData | null | undefined
  const canopy = data.canopy as DocumentData | null | undefined
  const height = data.height as DocumentData | null | undefined
  return {
    gps: gps ? {
      latitude: requiredFiniteNumber(gps, 'latitude'),
      longitude: requiredFiniteNumber(gps, 'longitude'),
      accuracyM: requiredFiniteNumber(gps, 'accuracyM'),
      method: requiredString(gps, 'method'),
      measuredAt: requiredString(gps, 'measuredAt'),
      measuredBy: requiredString(gps, 'measuredBy'),
      confidence: measurementConfidence(gps.confidence, 'gps'),
      source: requiredString(gps, 'source'),
    } : null,
    trunk: trunk ? {
      type: requiredString(trunk, 'type') as 'circumference' | 'diameter',
      value: requiredFiniteNumber(trunk, 'value'),
      unit: requiredString(trunk, 'unit') as 'cm',
      heightCm: requiredFiniteNumber(trunk, 'heightCm'),
      method: requiredString(trunk, 'method'),
      measuredAt: requiredString(trunk, 'measuredAt'),
      measuredBy: requiredString(trunk, 'measuredBy'),
      confidence: measurementConfidence(trunk.confidence, 'trunk'),
      source: requiredString(trunk, 'source'),
    } : null,
    canopy: canopy ? {
      widthNS: requiredFiniteNumber(canopy, 'widthNS'),
      widthEW: requiredFiniteNumber(canopy, 'widthEW'),
      unit: requiredString(canopy, 'unit') as 'm',
      method: requiredString(canopy, 'method'),
      measuredAt: requiredString(canopy, 'measuredAt'),
      measuredBy: requiredString(canopy, 'measuredBy'),
      confidence: measurementConfidence(canopy.confidence, 'canopy'),
      source: requiredString(canopy, 'source'),
    } : null,
    height: height ? {
      value: requiredFiniteNumber(height, 'value'),
      unit: requiredString(height, 'unit') as 'm',
      method: requiredString(height, 'method'),
      measuredAt: requiredString(height, 'measuredAt'),
      measuredBy: requiredString(height, 'measuredBy'),
      confidence: measurementConfidence(height.confidence, 'height'),
      source: requiredString(height, 'source'),
    } : null,
  }
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
  const result: PlantingCycleRecord = {
    cycleId: requiredString(data, 'cycleId'),
    cycleNumber: requiredInteger(data, 'cycleNumber'),
    variety,
    varietyConfidence: varietyConfidence as IdentityConfidence,
    plantingYear: optionalYear(data.plantingYear),
    plantingYearCalendar: calendar,
    plantingYearConfidence: plantingYearConfidence as IdentityConfidence,
    plantSource: optionalString(data.plantSource, 'plantSource'),
    treeStatus: treeStatus as TreeStatus,
    baselineDate: requiredString(data, 'baselineDate'),
    baselineMeasurements: baselineMeasurementsFromData(data.baselineMeasurements),
    notes: typeof data.notes === 'string' ? data.notes : '',
    startedAtLabel: timestampLabel(data.startedAt, 'รอเวลา Emulator'),
    endedAtLabel: data.endedAt === null
      ? null
      : timestampLabel(data.endedAt, 'รอเวลา Emulator'),
    version: requiredInteger(data, 'version'),
  }
  validateTreeCycleInput(result)
  return result
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
  return rootDoc(
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
  exampleData: boolean,
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
    plantSource: draft.plantSource,
    treeStatus: draft.treeStatus,
    baselineDate,
    baselineMeasurements: draft.baselineMeasurements,
    notes: draft.notes,
    startedAt: serverTimestamp(),
    endedAt: null,
    version,
    createdBy: actorUserId,
    updatedBy: actorUserId,
    updatedAt: serverTimestamp(),
    exampleData,
  }
}

function eventData(
  context: TreeMutationContext,
  eventId: string,
  eventType: TreeTimelineEvent['eventType'],
  positionId: string,
  description: string,
  positionVersion: number,
  exampleData: boolean,
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
    exampleData,
    createdAt: serverTimestamp(),
  }
}

export class FirebaseTreeRegisterRepository implements TreeRegisterRepository {
  constructor(
    private readonly firestore: Firestore,
    private readonly exampleData = true,
  ) {}

  async listTreePositions(
    organizationId: string,
    farmId: string,
  ): Promise<readonly TreePositionSummary[]> {
    const snapshot = await getDocs(
      query(
        rootCollection(
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
    const reference = rootDoc(
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
      const route = await getDoc(rootDoc(this.firestore, 'positionRoutes', positionId))
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
    const tagDocument = await getDoc(rootDoc(
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
    validateTreeCycleInput(draft)
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
      'สร้างตำแหน่งปลูก',
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
    validateTreeCycleInput(input)
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
      rowCountingDirection: current.rowCountingDirection,
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
      plantSource: input.plantSource,
      treeStatus: input.treeStatus,
      baselineDate: input.baselineDate,
      baselineMeasurements: input.baselineMeasurements,
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
      current.exampleData,
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
    validateTreeCycleInput(input)
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
      rowCountingDirection: current.rowCountingDirection,
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
      current.exampleData,
    ))
    batch.set(eventReference, eventData(
      context,
      eventId,
      'TREE_CYCLE_REPLACED',
      positionId,
      `ปิดรอบปลูก ${current.currentCycleNumber} และเพิ่มรอบปลูก ${nextCycleNumber}; Tag เดิมไม่เปลี่ยน`,
      nextPositionVersion,
      current.exampleData,
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
      rowCountingDirection: current.rowCountingDirection,
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
      current.exampleData,
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
      current.exampleData,
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
    const importReference = rootDoc(
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
        `นำเข้าจากไฟล์ทะเบียนต้น แถว ${candidate.sourceRow} แบบทั้งชุด`,
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
      exampleData: this.exampleData || context.farm.isMock,
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
    const snapshot = await getDoc(rootDoc(
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
      rowCountingDirection: rowCountingDirections.includes(data.rowCountingDirection as RowCountingDirection)
        ? data.rowCountingDirection as RowCountingDirection
        : 'TBD',
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
    return rootDoc(
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
    const exampleData = this.exampleData || context.farm.isMock
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
      rowCountingDirection: draft.rowCountingDirection,
      positionStatus: 'ACTIVE',
      currentCycleNumber: cycleNumber,
      qrPath: `/t/${positionId}`,
      version: 1,
      lastEventId: eventId,
      exampleData,
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
      exampleData,
    ))
    batch.set(doc(positionReference, 'events', eventId), eventData(
      context,
      eventId,
      eventType,
      positionId,
      description,
      1,
      exampleData,
    ))
    batch.set(this.tagReference(context, tagCode), {
      recordType: 'TREE_TAG_INDEX',
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      positionId,
      tagCode,
      exampleData,
      createdBy: context.actor.userId,
      createdAt: serverTimestamp(),
    })
    batch.set(rootDoc(this.firestore, 'positionRoutes', positionId), {
      recordType: 'POSITION_ROUTE',
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      positionId,
      exampleData,
      createdBy: context.actor.userId,
      createdAt: serverTimestamp(),
    })
  }
}
