import { useEffect, useMemo, useRef, useState } from 'react'

import './OrchardTargetSelector.css'

import type { FarmAccess } from '../domain/farm'
import {
  buildOrchardLayout,
  positionIdsForAnchor,
  type OrchardSelectionMode,
} from '../domain/orchardLayout'
import {
  treeStatusLabels,
  type TreePositionSummary,
} from '../domain/treeRegister'

export type OrchardSelectorView = 'PLAN' | 'CHECKLIST'
export type OrchardPlanDirection = 'VERTICAL' | 'HORIZONTAL'

interface OrchardTargetSelectorProps {
  farm: FarmAccess
  positions: readonly TreePositionSummary[]
  selectedPositionIds: readonly string[]
  selectionMode: OrchardSelectionMode
  onChange: (positionIds: readonly string[]) => void
  defaultView?: OrchardSelectorView
  defaultPlanDirection?: OrchardPlanDirection
  disabledReason?: (position: TreePositionSummary) => string | undefined
  orientationLabel?: string
  title?: string
}

interface GroupCheckboxProps {
  checked: boolean
  disabled?: boolean
  indeterminate: boolean
  label: string
  onChange: () => void
}

function GroupCheckbox({ checked, disabled, indeterminate, label, onChange }: GroupCheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate
  }, [indeterminate])

  return <label className="orchard-group-check">
    <input
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      ref={inputRef}
      type="checkbox"
    />
    <span>{label}</span>
  </label>
}

function modeLabel(mode: OrchardSelectionMode): string {
  if (mode === 'SINGLE') return 'เลือกต้นเดียว'
  if (mode === 'ROW') return 'เลือกทั้งแถว'
  if (mode === 'ZONE') return 'เลือกทั้งโซน'
  return 'เลือกหลายต้น'
}

export function OrchardTargetSelector({
  farm,
  positions,
  selectedPositionIds,
  selectionMode,
  onChange,
  defaultView = 'PLAN',
  defaultPlanDirection = 'VERTICAL',
  disabledReason,
  orientationLabel,
  title = 'เลือกตำแหน่งจากแปลนสวน',
}: OrchardTargetSelectorProps) {
  const [view, setView] = useState<OrchardSelectorView>(defaultView)
  const [planDirection, setPlanDirection] = useState<OrchardPlanDirection>(defaultPlanDirection)
  const hasCrossFarmPosition = positions.some((position) => (
    position.organizationId !== farm.organizationId || position.farmId !== farm.farmId
  ))
  const layout = useMemo(
    () => hasCrossFarmPosition ? undefined : buildOrchardLayout(farm, positions, orientationLabel),
    [farm, hasCrossFarmPosition, orientationLabel, positions],
  )
  const selected = useMemo(() => new Set(selectedPositionIds), [selectedPositionIds])
  const positionById = useMemo(
    () => new Map(positions.map((position) => [position.positionId, position])),
    [positions],
  )
  const selectedPositions = selectedPositionIds
    .map((positionId) => positionById.get(positionId))
    .filter((position): position is TreePositionSummary => Boolean(position))
  const selectedByZone = layout?.zones.map((zone) => ({
    count: zone.rows.flatMap((row) => row.positions).filter((position) => selected.has(position.positionId)).length,
    zoneCode: zone.zoneCode,
  })).filter((zone) => zone.count > 0) ?? []

  const reasonFor = (position: TreePositionSummary): string | undefined => {
    if (position.positionStatus === 'ARCHIVED') return 'ตำแหน่งเก็บถาวร'
    return disabledReason?.(position)
  }
  const canSelect = (position: TreePositionSummary) => !reasonFor(position)

  const applyGroup = (positionIds: readonly string[]) => {
    if (positionIds.length === 0) return
    if (selectionMode !== 'MULTIPLE') {
      onChange(positionIds)
      return
    }
    const allSelected = positionIds.every((positionId) => selected.has(positionId))
    onChange(allSelected
      ? selectedPositionIds.filter((positionId) => !positionIds.includes(positionId))
      : [...new Set([...selectedPositionIds, ...positionIds])])
  }

  const selectPosition = (position: TreePositionSummary) => {
    const next = positionIdsForAnchor(positions, position.positionId, selectionMode, canSelect)
    if (selectionMode === 'MULTIPLE') {
      applyGroup(next)
      return
    }
    onChange(next)
  }

  const selectableRowIds = (zoneCode: string, rowCode: string) => positions
    .filter((position) => (
      position.zoneCode === zoneCode && position.rowCode === rowCode && canSelect(position)
    ))
    .map((position) => position.positionId)

  const selectableZoneIds = (zoneCode: string) => positions
    .filter((position) => position.zoneCode === zoneCode && canSelect(position))
    .map((position) => position.positionId)

  const selectRow = (zoneCode: string, rowCode: string) => {
    applyGroup(selectableRowIds(zoneCode, rowCode))
  }

  const selectZone = (zoneCode: string) => {
    applyGroup(selectableZoneIds(zoneCode))
  }

  if (hasCrossFarmPosition) {
    return <div className="form-error" role="alert">ปฏิเสธการแสดงตำแหน่งข้ามสวนในตัวเลือกเป้าหมาย</div>
  }

  return <section className="orchard-selector" aria-label={title}>
    <header className="orchard-selector__header">
      <div className="orchard-selector__title-group">
        <div className="orchard-selector__title-main">
          <span className="status-pill">{modeLabel(selectionMode)}</span>
          <h3>{title}</h3>
          <span className="orchard-selector__farm-code">
            <strong>{farm.farmName}</strong> · <code>{farm.farmCode}</code>
          </span>
        </div>
        {layout?.orientationLabel ? (
          <div className="orchard-orientation" role="note">
            <span aria-hidden="true">↑</span>
            <span>ด้านบนของแปลน: {layout.orientationLabel}</span>
          </div>
        ) : null}
      </div>

      <div className="orchard-selector__controls">
        {view === 'PLAN' ? (
          <div className="orchard-plan-direction" role="group" aria-label="ทิศทางแถวในแปลน">
            <span className="orchard-plan-direction__label">ทิศทางแถวในแปลน:</span>
            <div className="orchard-plan-direction__toggle">
              <button
                aria-pressed={planDirection === 'VERTICAL'}
                className="orchard-direction-btn"
                onClick={() => setPlanDirection('VERTICAL')}
                title="แถวแนวตั้ง (ต้นบน → ล่าง)"
                type="button"
              >
                <span aria-hidden="true">↕</span>
                <span><strong>แถวแนวตั้ง</strong></span>
              </button>
              <button
                aria-pressed={planDirection === 'HORIZONTAL'}
                className="orchard-direction-btn"
                onClick={() => setPlanDirection('HORIZONTAL')}
                title="แถวแนวนอน (ต้นซ้าย → ขวา)"
                type="button"
              >
                <span aria-hidden="true">↔</span>
                <span><strong>แถวแนวนอน</strong></span>
              </button>
            </div>
          </div>
        ) : null}

        <div className="orchard-selector__view-toggle" aria-label="รูปแบบแสดงตัวเลือก">
          <button aria-pressed={view === 'PLAN'} onClick={() => setView('PLAN')} type="button">
            <strong>แปลนต้น</strong>
          </button>
          <button aria-pressed={view === 'CHECKLIST'} onClick={() => setView('CHECKLIST')} type="button">
            <strong>ตารางติ๊กเลือก</strong>
          </button>
        </div>
      </div>
    </header>

    {positions.length === 0 ? <div className="empty-state"><h3>ไม่มีตำแหน่งในสวนนี้</h3><p>เพิ่มหรือนำเข้าทะเบียนตำแหน่งก่อนเลือกเป้าหมาย</p></div> : null}

    {layout && view === 'PLAN' ? <div className="orchard-plan">
      {layout.zones.map((zone) => {
        const zoneIds = selectableZoneIds(zone.zoneCode)
        const zoneIsSelected = zoneIds.length > 0 && zoneIds.every((positionId) => selected.has(positionId))
        return <section className={`orchard-zone orchard-zone--${planDirection.toLowerCase()}`} key={zone.zoneCode} aria-labelledby={`plan-zone-${zone.zoneCode}`}>
          <div className="orchard-zone__heading">
            <div><small>โซน</small><h4 id={`plan-zone-${zone.zoneCode}`}>{zone.zoneCode}</h4><span>{zone.rows.length} แถว · {zoneIds.length} ตำแหน่งที่เลือกได้</span></div>
            {selectionMode === 'ZONE' || selectionMode === 'MULTIPLE' ? <button onClick={() => selectZone(zone.zoneCode)} type="button">{zoneIsSelected ? 'ยกเลิกทั้งโซน' : 'เลือกทั้งโซน'}</button> : null}
          </div>
          <div
            className={`orchard-rows orchard-rows--${planDirection.toLowerCase()}`}
            aria-label={`${zone.zoneCode} ${planDirection === 'VERTICAL' ? 'แถวแนวตั้ง ต้นเรียงจากบนลงล่าง' : 'แถวแนวนอน ต้นเรียงจากซ้ายไปขวา'}`}
          >
            {zone.rows.map((row) => <section className="orchard-row" key={`${zone.zoneCode}:${row.rowCode}`}>
              <button
                className="orchard-row__heading"
                disabled={selectionMode === 'SINGLE' || selectionMode === 'ZONE'}
                onClick={() => selectRow(zone.zoneCode, row.rowCode)}
                type="button"
              >
                <small>แถว</small><strong>{row.rowCode}</strong><span>{planDirection === 'VERTICAL' ? 'ต้นบน ↓ ล่าง' : 'ต้นซ้าย → ขวา'}</span>
              </button>
              <div className="orchard-tree-stack">
                {row.positions.map((position) => {
                  const disabled = reasonFor(position)
                  return <button
                    aria-label={`${position.tagCode} · ${treeStatusLabels[position.currentCycle.treeStatus]}${disabled ? ` · เลือกไม่ได้: ${disabled}` : ''}`}
                    aria-pressed={selected.has(position.positionId)}
                    className={`orchard-tree orchard-tree--${position.currentCycle.treeStatus}`}
                    disabled={Boolean(disabled)}
                    key={position.positionId}
                    onClick={() => selectPosition(position)}
                    title={disabled ?? position.tagCode}
                    type="button"
                  >
                    <span className="orchard-tree__marker" aria-hidden="true">{position.currentCycle.treeStatus === 'empty' ? '—' : '●'}</span>
                    <strong className="orchard-tree__tag">T{String(position.treeSequence).padStart(3, '0')}</strong>
                    {position.currentCycle.treeStatus !== 'empty' ? <small>{treeStatusLabels[position.currentCycle.treeStatus]}</small> : null}
                  </button>
                })}
              </div>
            </section>)}
          </div>
        </section>
      })}
    </div> : null}

    {layout && view === 'CHECKLIST' ? <div className="orchard-checklist">
      {layout.zones.map((zone) => {
        const zoneIds = selectableZoneIds(zone.zoneCode)
        const zoneSelectedCount = zoneIds.filter((positionId) => selected.has(positionId)).length
        return <section className="orchard-checklist__zone" key={zone.zoneCode} aria-labelledby={`checklist-zone-${zone.zoneCode}`}>
          <header className="orchard-checklist__zone-heading">
            <div><small>โซน</small><h4 id={`checklist-zone-${zone.zoneCode}`}>{zone.zoneCode}</h4><span>{zone.rows.length} แถว · เลือกแล้ว {zoneSelectedCount}/{zoneIds.length}</span></div>
            {selectionMode === 'ZONE' || selectionMode === 'MULTIPLE' ? <GroupCheckbox
              checked={zoneIds.length > 0 && zoneSelectedCount === zoneIds.length}
              disabled={zoneIds.length === 0}
              indeterminate={zoneSelectedCount > 0 && zoneSelectedCount < zoneIds.length}
              label="เลือกทั้งโซน"
              onChange={() => selectZone(zone.zoneCode)}
            /> : null}
          </header>
          <div className="orchard-checklist__scroll">
            <div className="orchard-checklist__rows" aria-label={`${zone.zoneCode} ตารางติ๊กเลือก แถวซ้ายไปขวา`}>
              {zone.rows.map((row) => {
                const rowIds = selectableRowIds(zone.zoneCode, row.rowCode)
                const rowSelectedCount = rowIds.filter((positionId) => selected.has(positionId)).length
                return <section className="orchard-checklist__row" key={`${zone.zoneCode}:${row.rowCode}`} aria-label={`${zone.zoneCode} ${row.rowCode}`}>
                  <header>
                    {selectionMode === 'ROW' || selectionMode === 'MULTIPLE' ? <GroupCheckbox
                      checked={rowIds.length > 0 && rowSelectedCount === rowIds.length}
                      disabled={rowIds.length === 0}
                      indeterminate={rowSelectedCount > 0 && rowSelectedCount < rowIds.length}
                      label={row.rowCode}
                      onChange={() => selectRow(zone.zoneCode, row.rowCode)}
                    /> : <strong>{row.rowCode}</strong>}
                    <small>บน ↓ ล่าง</small>
                  </header>
                  <div className="orchard-checklist__trees">
                    {row.positions.map((position) => {
                      const disabled = reasonFor(position)
                      const inputId = `orchard-${farm.farmId}-${position.positionId}`
                      return <label className={`orchard-checklist__tree orchard-checklist__tree--${position.currentCycle.treeStatus}`} htmlFor={inputId} key={position.positionId} title={disabled ?? position.tagCode}>
                        <input
                          aria-label={`${position.tagCode} · ${treeStatusLabels[position.currentCycle.treeStatus]}${disabled ? ` · เลือกไม่ได้: ${disabled}` : ''}`}
                          checked={selected.has(position.positionId)}
                          disabled={Boolean(disabled)}
                          id={inputId}
                          name={selectionMode === 'SINGLE' ? `orchard-single-${farm.farmId}` : undefined}
                          onChange={() => selectPosition(position)}
                          type={selectionMode === 'SINGLE' ? 'radio' : 'checkbox'}
                        />
                        <strong>T{String(position.treeSequence).padStart(3, '0')}</strong>
                        <small>{disabled ?? treeStatusLabels[position.currentCycle.treeStatus]}</small>
                      </label>
                    })}
                  </div>
                </section>
              })}
            </div>
          </div>
        </section>
      })}
    </div> : null}

    <footer className="orchard-selection-summary" aria-live="polite">
      <div>
        <strong>เลือกแล้ว {selectedPositions.length} ตำแหน่ง</strong>
        <span>{selectedByZone.length > 0 ? selectedByZone.map((zone) => `${zone.zoneCode} ${zone.count}`).join(' · ') : 'ยังไม่ได้เลือก Zone/ต้น'}</span>
        {selectedPositions.length > 0 ? <small>{selectedPositions.slice(0, 4).map((position) => position.tagCode).join(', ')}{selectedPositions.length > 4 ? ` และอีก ${selectedPositions.length - 4}` : ''}</small> : null}
      </div>
      <button disabled={selectedPositions.length === 0} onClick={() => onChange([])} type="button">ล้างที่เลือก</button>
    </footer>
  </section>
}
