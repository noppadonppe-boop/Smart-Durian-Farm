import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
import {
  createTreeCycleFormValue,
  treeCycleInputFromForm,
  TreeCycleFormFields,
  type TreeCycleFormValue,
} from '../components/TreeCycleFormFields'
import {
  canManageTreeRegister,
  generateTagCode,
  rowCountingDirectionLabels,
  type RowCountingDirection,
  type TreePositionSummary,
} from '../domain/treeRegister'
import { PageHeader } from './PageHeader'

type LocationMode = 'EXISTING' | 'NEW'

function compareCodes(left: string, right: string): number {
  return left.localeCompare(right, 'th', { numeric: true, sensitivity: 'base' })
}

export function TreeCreatePage() {
  const navigate = useNavigate()
  const { currentFarm, createTreePosition, listTreePositions, mode } = usePhase2()
  const [positions, setPositions] = useState<readonly TreePositionSummary[]>([])
  const [locationsLoading, setLocationsLoading] = useState(true)
  const [locationMode, setLocationMode] = useState<LocationMode>('EXISTING')
  const [zoneCode, setZoneCode] = useState('')
  const [rowCode, setRowCode] = useState('')
  const [rowCountingDirection, setRowCountingDirection] = useState<RowCountingDirection>('TBD')
  const [treeSequence, setTreeSequence] = useState('')
  const [cycleForm, setCycleForm] = useState<TreeCycleFormValue>(() => createTreeCycleFormValue())
  const [confirmNewLocation, setConfirmNewLocation] = useState(false)
  const [confirmPermanentIdentity, setConfirmPermanentIdentity] = useState(false)
  const [error, setError] = useState<string>()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    void listTreePositions()
      .then((items) => {
        if (!active) return
        setPositions(items)
        const first = [...items].sort((left, right) => (
          compareCodes(left.zoneCode, right.zoneCode) || compareCodes(left.rowCode, right.rowCode)
        ))[0]
        if (first) {
          setZoneCode(first.zoneCode)
          setRowCode(first.rowCode)
          setRowCountingDirection(first.rowCountingDirection ?? 'TBD')
          setLocationMode('EXISTING')
        } else {
          setZoneCode('Z01')
          setRowCode('R01')
          setLocationMode('NEW')
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'อ่านรายการโซนและแถวไม่สำเร็จ')
      })
      .finally(() => {
        if (active) setLocationsLoading(false)
      })
    return () => { active = false }
  }, [currentFarm?.farmId, listTreePositions])

  const zones = useMemo(() => [...new Set(positions.map((item) => item.zoneCode))].sort(compareCodes), [positions])
  const rows = useMemo(() => [...new Set(
    positions.filter((item) => item.zoneCode === zoneCode).map((item) => item.rowCode),
  )].sort(compareCodes), [positions, zoneCode])

  const selectExistingZone = (nextZone: string) => {
    const first = positions.find((item) => item.zoneCode === nextZone)
    setZoneCode(nextZone)
    setRowCode(first?.rowCode ?? '')
    setRowCountingDirection(first?.rowCountingDirection ?? 'TBD')
  }

  const selectExistingRow = (nextRow: string) => {
    const reference = positions.find((item) => item.zoneCode === zoneCode && item.rowCode === nextRow)
    setRowCode(nextRow)
    setRowCountingDirection(reference?.rowCountingDirection ?? 'TBD')
  }

  const tagPreview = useMemo(() => {
    if (!currentFarm || !treeSequence) return 'กรอกลำดับตำแหน่งเพื่อสร้างรหัสป้าย'
    try {
      return generateTagCode({
        organizationCode: currentFarm.organizationCode,
        farmSequence: currentFarm.farmSequence,
        zoneCode,
        rowCode,
        treeSequence: Number(treeSequence),
      })
    } catch (reason) {
      return reason instanceof Error ? reason.message : 'รหัสป้ายไม่ถูกต้อง'
    }
  }, [currentFarm, rowCode, treeSequence, zoneCode])

  if (!currentFarm) return null
  if (!canManageTreeRegister(currentFarm)) {
    return (
      <section className="page-stack">
        <PageHeader eyebrow="อ่านอย่างเดียว" title="ไม่มีสิทธิ์เพิ่มตำแหน่ง" description="เฉพาะเจ้าขององค์กรหรือผู้จัดการสวนที่ใช้งานอยู่เท่านั้น" />
        <Link className="secondary-action" to="/trees">กลับทะเบียนต้น</Link>
      </section>
    )
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(undefined)
    setSaving(true)
    try {
      const normalizedZone = zoneCode.trim().toUpperCase()
      const normalizedRow = rowCode.trim().toUpperCase()
      if (locationMode === 'EXISTING' && !positions.some(
        (item) => item.zoneCode === normalizedZone && item.rowCode === normalizedRow,
      )) {
        throw new Error('โซนและแถวที่เลือกไม่อยู่ในทะเบียนของสวนปัจจุบัน')
      }
      if (locationMode === 'NEW' && !confirmNewLocation) {
        throw new Error('กรุณายืนยันการลงทะเบียนโซนและแถวใหม่')
      }
      if (!confirmPermanentIdentity) {
        throw new Error('กรุณาตรวจรหัสป้ายและยืนยันว่าตำแหน่งถูกต้องก่อนบันทึก')
      }
      const cycleInput = treeCycleInputFromForm(cycleForm)
      const created = await createTreePosition({
        organizationCode: currentFarm.organizationCode,
        farmSequence: currentFarm.farmSequence,
        zoneCode: normalizedZone,
        rowCode: normalizedRow,
        treeSequence: Number(treeSequence),
        rowCountingDirection,
        ...cycleInput,
      })
      await navigate(`/trees/${created.positionId}`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'เพิ่มตำแหน่งไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="ทะเบียนตำแหน่งปลูก"
        title="เพิ่มตำแหน่งปลูก"
        description={`บันทึกในสวน ${currentFarm.farmName} (${currentFarm.farmCode})`}
      />
      {mode === 'firebase-live' && !currentFarm.isMock
        ? <aside className="operational-data-banner"><strong>ข้อมูลภาคสนาม</strong><span>ข้อมูลที่บันทึกจะอยู่ใน Firebase ของสวนปัจจุบัน กรุณาตรวจรหัสตำแหน่งก่อนยืนยัน</span></aside>
        : <aside className="field-validation-banner"><strong>โหมดทดสอบระบบ</strong><span>หน้าจอเหมือนการใช้งานจริง แต่ข้อมูลจากโหมดนี้ยังถูกจัดเป็นข้อมูลทดสอบ</span></aside>}

      <form className="tree-form tree-register-form" onSubmit={(event) => void submit(event)}>
        <section className="tree-form-section" aria-labelledby="position-identity-title">
          <div className="tree-form-section__heading">
            <div><span>ส่วนที่ 1 · ต้องกรอก</span><h2 id="position-identity-title">ตัวตนของตำแหน่งปลูก</h2></div>
            <small>รหัสนี้อ้างตำแหน่งถาวร ไม่ใช่ต้นทุเรียนเพียงรุ่นเดียว</small>
          </div>

          <div className="farm-context-card">
            <span>สวนปัจจุบัน</span><strong>{currentFarm.farmName}</strong><code>{currentFarm.farmCode}</code>
          </div>

          {locationsLoading ? <div className="loading-inline" role="status">กำลังอ่านรายการโซนและแถว…</div> : <>
            {positions.length > 0 ? <fieldset className="segmented-choice">
              <legend>เลือกวิธีระบุตำแหน่ง</legend>
              <label><input checked={locationMode === 'EXISTING'} onChange={() => { setLocationMode('EXISTING'); selectExistingZone(zones[0] ?? '') }} type="radio" />ใช้โซนและแถวที่มีอยู่</label>
              <label><input checked={locationMode === 'NEW'} onChange={() => { setLocationMode('NEW'); setZoneCode(''); setRowCode(''); setRowCountingDirection('TBD') }} type="radio" />ลงทะเบียนโซนหรือแถวใหม่</label>
            </fieldset> : <p className="form-guidance">สวนนี้ยังไม่มีตำแหน่ง ระบบจะลงทะเบียนโซนและแถวแรกพร้อมตำแหน่งนี้</p>}

            <div className="form-grid">
              {locationMode === 'EXISTING' ? <>
                <label>โซน <strong aria-hidden="true">*</strong><select onChange={(event) => selectExistingZone(event.target.value)} required value={zoneCode}>{zones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}</select></label>
                <label>แถว <strong aria-hidden="true">*</strong><select onChange={(event) => selectExistingRow(event.target.value)} required value={rowCode}>{rows.map((row) => <option key={row} value={row}>{row}</option>)}</select></label>
              </> : <>
                <label>รหัสโซนใหม่ <strong aria-hidden="true">*</strong><input onChange={(event) => setZoneCode(event.target.value.toUpperCase())} placeholder="เช่น Z01" required value={zoneCode} /></label>
                <label>รหัสแถวใหม่ <strong aria-hidden="true">*</strong><input onChange={(event) => setRowCode(event.target.value.toUpperCase())} placeholder="เช่น R01" required value={rowCode} /></label>
              </>}
              <label>ลำดับตำแหน่ง <strong aria-hidden="true">*</strong><input inputMode="numeric" min="1" onChange={(event) => setTreeSequence(event.target.value)} required type="number" value={treeSequence} /></label>
              <label>ทิศทางการนับในแถว<select disabled={locationMode === 'EXISTING'} onChange={(event) => setRowCountingDirection(event.target.value as RowCountingDirection)} value={rowCountingDirection}>{Object.entries(rowCountingDirectionLabels).map(([direction, label]) => <option key={direction} value={direction}>{label}</option>)}</select></label>
            </div>

            {locationMode === 'NEW' ? <label className="checkbox-control confirmation-control"><input checked={confirmNewLocation} onChange={(event) => setConfirmNewLocation(event.target.checked)} required type="checkbox" />ยืนยันว่าได้ตรวจรหัสโซน แถว และทิศทางการนับสำหรับสวนนี้แล้ว</label> : null}
          </>}

          <div className="tag-preview"><span>ตัวอย่างรหัสป้าย</span><code>{tagPreview}</code><small>หลังบันทึก ระบบจะสงวนรหัสนี้และไม่นำกลับไปใช้กับตำแหน่งอื่น</small></div>
          <label className="checkbox-control confirmation-control"><input checked={confirmPermanentIdentity} onChange={(event) => setConfirmPermanentIdentity(event.target.checked)} required type="checkbox" />ตรวจแล้วว่าสวน โซน แถว ลำดับตำแหน่ง และรหัสป้ายถูกต้อง</label>
        </section>

        <TreeCycleFormFields
          onChange={(patch) => setCycleForm((current) => ({ ...current, ...patch }))}
          value={cycleForm}
        />

        {error ? <div className="form-error" role="alert">{error}</div> : null}
        <div className="form-actions sticky-form-actions">
          <button className="primary-action" disabled={saving || locationsLoading} type="submit">{saving ? 'กำลังบันทึก…' : 'บันทึกตำแหน่งปลูก'}</button>
          <Link className="secondary-action" to="/trees">ยกเลิก</Link>
        </div>
      </form>
    </section>
  )
}
