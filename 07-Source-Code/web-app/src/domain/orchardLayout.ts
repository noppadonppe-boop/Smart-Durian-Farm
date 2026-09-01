import type { FarmAccess } from './farm'
import type { TreePositionSummary } from './treeRegister'

export const orchardSelectionModes = ['SINGLE', 'MULTIPLE', 'ROW', 'ZONE'] as const

export type OrchardSelectionMode = (typeof orchardSelectionModes)[number]

export const orchardNavigationIntents = [
  'WORK_GENERAL',
  'WORK_CARE',
  'DISEASE_INCIDENT',
  'FRUIT_OBSERVATION',
  'HARVEST_LOT',
] as const

export type OrchardNavigationIntent = (typeof orchardNavigationIntents)[number]

export interface OrchardLayoutRow {
  rowCode: string
  positions: readonly TreePositionSummary[]
}

export interface OrchardLayoutZone {
  zoneCode: string
  rows: readonly OrchardLayoutRow[]
}

export interface OrchardLayout {
  organizationId: string
  farmId: string
  farmName: string
  farmCode: string
  layoutVersion: 'DERIVED-STRUCTURAL-V1'
  orientationLabel: string
  zones: readonly OrchardLayoutZone[]
}

export interface OrchardNavigationSelection {
  source: 'ORCHARD_LAYOUT'
  farmId: string
  positionIds: readonly string[]
  intent?: OrchardNavigationIntent
}

function compareHumanCodes(left: string, right: string): number {
  return left.localeCompare(right, 'th', { numeric: true, sensitivity: 'base' })
}

export function buildOrchardLayout(
  farm: Pick<FarmAccess, 'organizationId' | 'farmId' | 'farmName' | 'farmCode'>,
  positions: readonly TreePositionSummary[],
  orientationLabel = 'TBD — ต้องยืนยันจุดอ้างอิงด้านบนก่อนใช้ภาคสนาม',
): OrchardLayout {
  const crossFarm = positions.find((position) => (
    position.organizationId !== farm.organizationId || position.farmId !== farm.farmId
  ))
  if (crossFarm) {
    throw new Error('ปฏิเสธการสร้างแปลนจากตำแหน่งข้ามสวน')
  }

  const zones = new Map<string, Map<string, TreePositionSummary[]>>()
  positions.forEach((position) => {
    const rows = zones.get(position.zoneCode) ?? new Map<string, TreePositionSummary[]>()
    const rowPositions = rows.get(position.rowCode) ?? []
    rowPositions.push(position)
    rows.set(position.rowCode, rowPositions)
    zones.set(position.zoneCode, rows)
  })

  return {
    organizationId: farm.organizationId,
    farmId: farm.farmId,
    farmName: farm.farmName,
    farmCode: farm.farmCode,
    layoutVersion: 'DERIVED-STRUCTURAL-V1',
    orientationLabel,
    zones: [...zones.entries()]
      .sort(([left], [right]) => compareHumanCodes(left, right))
      .map(([zoneCode, rows]) => ({
        zoneCode,
        rows: [...rows.entries()]
          .sort(([left], [right]) => compareHumanCodes(left, right))
          .map(([rowCode, rowPositions]) => ({
            rowCode,
            positions: [...rowPositions].sort((left, right) => (
              left.treeSequence - right.treeSequence || compareHumanCodes(left.tagCode, right.tagCode)
            )),
          })),
      })),
  }
}

export function positionIdsForAnchor(
  positions: readonly TreePositionSummary[],
  anchorPositionId: string,
  mode: OrchardSelectionMode,
  canSelect: (position: TreePositionSummary) => boolean = () => true,
): readonly string[] {
  const anchor = positions.find((position) => position.positionId === anchorPositionId)
  if (!anchor || !canSelect(anchor)) return []
  if (mode === 'SINGLE' || mode === 'MULTIPLE') return [anchor.positionId]

  return positions
    .filter((position) => {
      if (!canSelect(position) || position.zoneCode !== anchor.zoneCode) return false
      return mode === 'ZONE' || position.rowCode === anchor.rowCode
    })
    .sort((left, right) => (
      compareHumanCodes(left.rowCode, right.rowCode) || left.treeSequence - right.treeSequence
    ))
    .map((position) => position.positionId)
}

export function selectionZoneCodes(
  positions: readonly TreePositionSummary[],
  selectedPositionIds: readonly string[],
): readonly string[] {
  const selected = new Set(selectedPositionIds)
  return [...new Set(
    positions.filter((position) => selected.has(position.positionId)).map((position) => position.zoneCode),
  )].sort(compareHumanCodes)
}

export function selectionFromNavigationState(
  state: unknown,
  farmId: string,
): readonly string[] {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return []
  const selection = (state as { targetSelection?: unknown }).targetSelection
  if (!selection || typeof selection !== 'object' || Array.isArray(selection)) return []
  const candidate = selection as Partial<OrchardNavigationSelection>
  if (
    candidate.source !== 'ORCHARD_LAYOUT' ||
    candidate.farmId !== farmId ||
    !Array.isArray(candidate.positionIds) ||
    !candidate.positionIds.every((positionId) => typeof positionId === 'string')
  ) return []
  return [...new Set(candidate.positionIds)]
}

export function navigationIntentFromState(
  state: unknown,
  farmId: string,
): OrchardNavigationIntent | undefined {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return undefined
  const selection = (state as { targetSelection?: unknown }).targetSelection
  if (!selection || typeof selection !== 'object' || Array.isArray(selection)) return undefined
  const candidate = selection as Partial<OrchardNavigationSelection>
  if (
    candidate.source !== 'ORCHARD_LAYOUT' ||
    candidate.farmId !== farmId ||
    !candidate.intent ||
    !orchardNavigationIntents.includes(candidate.intent)
  ) return undefined
  return candidate.intent
}
