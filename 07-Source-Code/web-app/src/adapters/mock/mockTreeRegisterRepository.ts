import type {
  TreeRegisterRepository,
  TreeRouteResolution,
} from '../contracts'
import type { CanonicalRole } from '../../domain/farm'
import {
  canManageTreeRegister,
  createOpaquePositionId,
  generateTagCode,
  normalizeRowCode,
  normalizeTagCode,
  normalizeTreeSequence,
  normalizeZoneCode,
  validateTreeCycleInput,
  type PlantingCycleRecord,
  type ReplacePlantingCycleInput,
  type TreeImportCandidate,
  type TreeImportResult,
  type TreeMutationContext,
  type TreePositionDetail,
  type TreePositionDraft,
  type TreePositionSummary,
  type TreeTimelineEvent,
  type UpdatePlantingCycleInput,
} from '../../domain/treeRegister'

const damagedReportRoles: readonly CanonicalRole[] = [
  'ORG_OWNER',
  'FARM_MANAGER',
  'AGRONOMIST',
  'WORKER',
]

function nowLabel(): string {
  return 'เมื่อสักครู่ · เวลาจำลองในเครื่อง'
}

function requireManager(context: TreeMutationContext): void {
  if (!canManageTreeRegister(context.farm)) {
    throw new Error('เฉพาะเจ้าขององค์กรหรือผู้จัดการสวนที่ใช้งานอยู่เท่านั้นที่แก้ทะเบียนต้นได้')
  }
}

function copyDetail(position: TreePositionDetail): TreePositionDetail {
  return structuredClone(position)
}

function summary(position: TreePositionDetail): TreePositionSummary {
  return structuredClone({
    organizationId: position.organizationId,
    farmId: position.farmId,
    positionId: position.positionId,
    organizationCode: position.organizationCode,
    farmSequence: position.farmSequence,
    zoneCode: position.zoneCode,
    rowCode: position.rowCode,
    treeSequence: position.treeSequence,
    tagCode: position.tagCode,
    rowCountingDirection: position.rowCountingDirection ?? 'TBD',
    positionStatus: position.positionStatus,
    currentCycleNumber: position.currentCycleNumber,
    currentCycle: position.currentCycle,
    qrPath: position.qrPath,
    version: position.version,
    exampleData: position.exampleData,
  })
}

function event(
  context: TreeMutationContext,
  eventType: TreeTimelineEvent['eventType'],
  description: string,
  positionVersion: number,
): TreeTimelineEvent {
  return {
    eventId: `event_${crypto.randomUUID()}`,
    eventType,
    actorUserId: context.actor.userId,
    actorDisplayName: context.actor.displayName,
    description,
    createdAtLabel: nowLabel(),
    positionVersion,
  }
}

function cycleFromDraft(
  draft: TreePositionDraft | TreeImportCandidate,
  cycleNumber: number,
): PlantingCycleRecord {
  return {
    cycleId: `cycle_${String(cycleNumber).padStart(3, '0')}`,
    cycleNumber,
    variety: draft.variety,
    varietyConfidence: draft.varietyConfidence,
    plantingYear: draft.plantingYear,
    plantingYearCalendar: draft.plantingYearCalendar,
    plantingYearConfidence: draft.plantingYearConfidence,
    plantSource: draft.plantSource,
    treeStatus: draft.treeStatus,
    baselineDate: draft.baselineDate,
    baselineMeasurements: structuredClone(draft.baselineMeasurements),
    notes: draft.notes,
    startedAtLabel: nowLabel(),
    endedAtLabel: null,
    version: 1,
  }
}

export class MockTreeRegisterRepository implements TreeRegisterRepository {
  private readonly imports = new Map<string, TreeImportResult>()

  constructor(private readonly positions: TreePositionDetail[]) {}

  listTreePositions(
    organizationId: string,
    farmId: string,
  ): Promise<readonly TreePositionSummary[]> {
    return Promise.resolve(
      this.positions
        .filter(
          (position) =>
            position.organizationId === organizationId && position.farmId === farmId,
        )
        .sort((left, right) => left.tagCode.localeCompare(right.tagCode))
        .map(summary),
    )
  }

  getTreePosition(
    organizationId: string,
    farmId: string,
    positionId: string,
  ): Promise<TreePositionDetail | undefined> {
    const position = this.positions.find(
      (candidate) =>
        candidate.organizationId === organizationId &&
        candidate.farmId === farmId &&
        candidate.positionId === positionId,
    )
    return Promise.resolve(position ? copyDetail(position) : undefined)
  }

  resolvePositionRoute(
    context: TreeMutationContext,
    positionId: string,
  ): Promise<TreeRouteResolution> {
    const position = this.positions.find((candidate) => candidate.positionId === positionId)
    if (!position) return Promise.resolve({ status: 'UNKNOWN' })
    if (
      position.organizationId !== context.farm.organizationId ||
      position.farmId !== context.farm.farmId
    ) {
      return Promise.resolve({ status: 'ACCESS_DENIED' })
    }
    return Promise.resolve({ status: 'FOUND', position: copyDetail(position) })
  }

  resolveTag(
    organizationId: string,
    farmId: string,
    tagCode: string,
  ): Promise<TreePositionDetail | undefined> {
    const normalized = normalizeTagCode(tagCode)
    const position = this.positions.find(
      (candidate) =>
        candidate.organizationId === organizationId &&
        candidate.farmId === farmId &&
        candidate.tagCode === normalized,
    )
    return Promise.resolve(position ? copyDetail(position) : undefined)
  }

  createTreePosition(
    context: TreeMutationContext,
    draft: TreePositionDraft,
  ): Promise<TreePositionDetail> {
    requireManager(context)
    const normalizedDraft = {
      ...draft,
      zoneCode: normalizeZoneCode(draft.zoneCode),
      rowCode: normalizeRowCode(draft.rowCode),
      treeSequence: normalizeTreeSequence(draft.treeSequence),
    }
    validateTreeCycleInput(normalizedDraft)
    const tagCode = generateTagCode(normalizedDraft)
    if (
      this.positions.some(
        (position) =>
          position.organizationId === context.farm.organizationId &&
          position.farmId === context.farm.farmId &&
          (
            position.tagCode === tagCode ||
            (
              normalizeZoneCode(position.zoneCode) === normalizedDraft.zoneCode &&
              normalizeRowCode(position.rowCode) === normalizedDraft.rowCode &&
              position.treeSequence === normalizedDraft.treeSequence
            )
          ),
      )
    ) {
      throw new Error('Tag นี้เคยถูกใช้แล้วและห้ามนำกลับมาใช้ แม้ตำแหน่งจะเก็บถาวร')
    }
    const positionId = createOpaquePositionId()
    const currentCycle = cycleFromDraft(normalizedDraft, 1)
    const position: TreePositionDetail = {
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      positionId,
      organizationCode: context.farm.organizationCode,
      farmSequence: context.farm.farmSequence,
      zoneCode: normalizedDraft.zoneCode,
      rowCode: normalizedDraft.rowCode,
      treeSequence: normalizedDraft.treeSequence,
      tagCode,
      rowCountingDirection: draft.rowCountingDirection,
      positionStatus: 'ACTIVE',
      currentCycleNumber: 1,
      currentCycle,
      qrPath: `/t/${positionId}`,
      version: 1,
      exampleData: true,
      plantingCycles: [currentCycle],
      timeline: [event(context, 'TREE_POSITION_CREATED', 'สร้างตำแหน่งปลูก', 1)],
    }
    this.positions.push(position)
    return Promise.resolve(copyDetail(position))
  }

  updateCurrentPlantingCycle(
    context: TreeMutationContext,
    positionId: string,
    input: UpdatePlantingCycleInput,
  ): Promise<TreePositionDetail> {
    requireManager(context)
    validateTreeCycleInput(input)
    const position = this.requirePosition(context, positionId)
    if (position.positionStatus !== 'ACTIVE') throw new Error('ตำแหน่งที่เก็บถาวรแก้ไขไม่ได้')
    const cycle = position.plantingCycles.find(
      (candidate) => candidate.cycleNumber === position.currentCycleNumber,
    )
    if (!cycle) throw new Error('ไม่พบ Planting Cycle ปัจจุบัน')
    Object.assign(cycle, input, { version: cycle.version + 1 })
    position.currentCycle = structuredClone(cycle)
    position.version += 1
    position.timeline.unshift(
      event(context, 'TREE_CYCLE_UPDATED', `แก้ข้อมูลรอบปลูก ${cycle.cycleNumber}`, position.version),
    )
    return Promise.resolve(copyDetail(position))
  }

  replacePlantingCycle(
    context: TreeMutationContext,
    positionId: string,
    input: ReplacePlantingCycleInput,
  ): Promise<TreePositionDetail> {
    requireManager(context)
    validateTreeCycleInput(input)
    const position = this.requirePosition(context, positionId)
    if (position.positionStatus !== 'ACTIVE') throw new Error('ตำแหน่งที่เก็บถาวรเพิ่มรอบปลูกไม่ได้')
    if (!input.reason.trim()) throw new Error('ต้องระบุเหตุผลการปลูกทดแทน')
    const previous = position.plantingCycles.find(
      (candidate) => candidate.cycleNumber === position.currentCycleNumber,
    )
    if (!previous) throw new Error('ไม่พบ Planting Cycle ปัจจุบัน')
    previous.endedAtLabel = nowLabel()
    previous.version += 1
    const nextCycleNumber = previous.cycleNumber + 1
    const nextCycle = cycleFromDraft(
      {
        ...position,
        ...input,
        notes: `${input.notes}${input.notes ? ' · ' : ''}เหตุผลปลูกทดแทน: ${input.reason}`,
      },
      nextCycleNumber,
    )
    position.currentCycleNumber = nextCycleNumber
    position.currentCycle = nextCycle
    position.plantingCycles.push(nextCycle)
    position.version += 1
    position.timeline.unshift(
      event(
        context,
        'TREE_CYCLE_REPLACED',
        `ปิดรอบปลูก ${previous.cycleNumber} และเพิ่มรอบปลูก ${nextCycleNumber}; Tag เดิมไม่เปลี่ยน`,
        position.version,
      ),
    )
    return Promise.resolve(copyDetail(position))
  }

  archiveTreePosition(
    context: TreeMutationContext,
    positionId: string,
    reason: string,
  ): Promise<TreePositionDetail> {
    requireManager(context)
    if (!reason.trim()) throw new Error('ต้องระบุเหตุผลการเก็บถาวร')
    const position = this.requirePosition(context, positionId)
    if (position.positionStatus === 'ARCHIVED') return Promise.resolve(copyDetail(position))
    position.positionStatus = 'ARCHIVED'
    position.version += 1
    position.timeline.unshift(
      event(
        context,
        'TREE_POSITION_ARCHIVED',
        `เก็บตำแหน่งถาวร: ${reason}; Tag จะไม่ถูกนำกลับมาใช้`,
        position.version,
      ),
    )
    return Promise.resolve(copyDetail(position))
  }

  reportDamagedTag(
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
    const position = this.requirePosition(context, positionId)
    position.timeline.unshift(
      event(
        context,
        'TAG_DAMAGED_REPORTED',
        `รายงานป้ายชำรุด${note.trim() ? `: ${note.trim()}` : ''}`,
        position.version,
      ),
    )
    return Promise.resolve(copyDetail(position))
  }

  importTreePositions(
    context: TreeMutationContext,
    idempotencyKey: string,
    candidates: readonly TreeImportCandidate[],
  ): Promise<TreeImportResult> {
    requireManager(context)
    const prior = this.imports.get(`${context.farm.farmId}:${idempotencyKey}`)
    if (prior) return Promise.resolve({ ...prior, wasRetry: true })
    if (candidates.length === 0) throw new Error('ไม่มีแถวที่ผ่านการตรวจสำหรับ Import')
    if (candidates.length > 50) throw new Error('Phase 3 local import จำกัดครั้งละไม่เกิน 50 ตำแหน่ง')

    const existingTags = new Set(
      this.positions
        .filter((position) => position.farmId === context.farm.farmId)
        .map((position) => position.tagCode),
    )
    const existingCoordinates = new Set(
      this.positions
        .filter((position) => position.farmId === context.farm.farmId)
        .map((position) => `${normalizeZoneCode(position.zoneCode)}:${normalizeRowCode(position.rowCode)}:${position.treeSequence}`),
    )
    const duplicate = candidates.find((candidate) => (
      existingTags.has(candidate.tagCode) ||
      existingCoordinates.has(`${normalizeZoneCode(candidate.zoneCode)}:${normalizeRowCode(candidate.rowCode)}:${candidate.treeSequence}`)
    ))
    if (duplicate) {
      throw new Error(`Import ถูกยกเลิกทั้งชุด: Tag ${duplicate.tagCode} เคยถูกใช้แล้ว`)
    }

    const additions = candidates.map((candidate) => {
      const positionId = createOpaquePositionId()
      const currentCycle = cycleFromDraft(candidate, candidate.plantingCycle)
      const position: TreePositionDetail = {
        organizationId: context.farm.organizationId,
        farmId: context.farm.farmId,
        positionId,
        organizationCode: candidate.organizationCode,
        farmSequence: candidate.farmSequence,
        zoneCode: candidate.zoneCode,
        rowCode: candidate.rowCode,
        treeSequence: candidate.treeSequence,
        tagCode: candidate.tagCode,
        rowCountingDirection: candidate.rowCountingDirection,
        positionStatus: 'ACTIVE',
        currentCycleNumber: candidate.plantingCycle,
        currentCycle,
        qrPath: `/t/${positionId}`,
        version: 1,
        exampleData: true,
        plantingCycles: [currentCycle],
        timeline: [
          event(
            context,
            'TREE_POSITION_IMPORTED',
            `นำเข้าจากไฟล์ Template แถว ${candidate.sourceRow} แบบ atomic local flow`,
            1,
          ),
        ],
      }
      return position
    })
    this.positions.push(...additions)
    const result: TreeImportResult = {
      idempotencyKey,
      importedCount: additions.length,
      existingCount: 0,
      positionIds: additions.map((position) => position.positionId),
      wasRetry: false,
    }
    this.imports.set(`${context.farm.farmId}:${idempotencyKey}`, result)
    return Promise.resolve(result)
  }

  private requirePosition(
    context: TreeMutationContext,
    positionId: string,
  ): TreePositionDetail {
    const position = this.positions.find(
      (candidate) =>
        candidate.organizationId === context.farm.organizationId &&
        candidate.farmId === context.farm.farmId &&
        candidate.positionId === positionId,
    )
    if (!position) throw new Error('ไม่พบตำแหน่งปลูกในสวนปัจจุบัน')
    return position
  }
}
