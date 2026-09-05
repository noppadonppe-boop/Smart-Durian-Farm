import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
import { todayInBangkok } from '../components/TreeCycleFormFields'
import {
  canManageTreeRegister,
  emptyTreeBaselineMeasurements,
  generateTagCode,
  normalizeRowCode,
  normalizeTreeSequence,
  normalizeZoneCode,
  type TreePositionSummary,
} from '../domain/treeRegister'
import { PageHeader } from './PageHeader'

function compareCodes(left: string, right: string): number {
  return left.localeCompare(right, 'th', { numeric: true, sensitivity: 'base' })
}

export function TreeCreatePage() {
  const navigate = useNavigate()
  const { currentFarm, createTreePosition, listTreePositions } = usePhase2()
  const [positions, setPositions] = useState<readonly TreePositionSummary[]>([])
  const [locationsLoading, setLocationsLoading] = useState(true)
  const [zoneCode, setZoneCode] = useState('')
  const [rowCode, setRowCode] = useState('')
  const [treeSequence, setTreeSequence] = useState('')
  const [variety, setVariety] = useState('')
  const [plantingYear, setPlantingYear] = useState('')
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
        setZoneCode(first?.zoneCode ?? 'Z01')
        setRowCode(first ? normalizeRowCode(first.rowCode) : 'R01')
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'อ่านรายการโซนและแถวไม่สำเร็จ')
      })
      .finally(() => {
        if (active) setLocationsLoading(false)
      })
    return () => { active = false }
  }, [currentFarm?.farmId, listTreePositions])

  const zones = useMemo(
    () => [...new Set(positions.map((item) => normalizeZoneCode(item.zoneCode)))].sort(compareCodes),
    [positions],
  )
  const rows = useMemo(() => {
    let normalizedZone = ''
    try {
      normalizedZone = normalizeZoneCode(zoneCode)
    } catch {
      return []
    }
    return [...new Set(
      positions
        .filter((item) => normalizeZoneCode(item.zoneCode) === normalizedZone)
        .map((item) => normalizeRowCode(item.rowCode)),
    )].sort(compareCodes)
  }, [positions, zoneCode])

  const tagPreview = useMemo(() => {
    if (!currentFarm || !zoneCode || !rowCode || !treeSequence) {
      return 'ระบุโซน แถว และลำดับตำแหน่ง'
    }
    try {
      return generateTagCode({
        organizationCode: currentFarm.organizationCode,
        farmSequence: currentFarm.farmSequence,
        zoneCode,
        rowCode,
        treeSequence: normalizeTreeSequence(treeSequence),
      })
    } catch (reason) {
      return reason instanceof Error ? reason.message : 'รหัสป้ายไม่ถูกต้อง'
    }
  }, [currentFarm, rowCode, treeSequence, zoneCode])

  const duplicatePosition = useMemo(() => {
    if (!zoneCode || !rowCode || !treeSequence) return undefined
    try {
      const normalizedZone = normalizeZoneCode(zoneCode)
      const normalizedRow = normalizeRowCode(rowCode)
      const sequence = normalizeTreeSequence(treeSequence)
      return positions.find((position) => (
        normalizeZoneCode(position.zoneCode) === normalizedZone &&
        normalizeRowCode(position.rowCode) === normalizedRow &&
        position.treeSequence === sequence
      ))
    } catch {
      return undefined
    }
  }, [positions, rowCode, treeSequence, zoneCode])

  if (!currentFarm) return null
  if (!canManageTreeRegister(currentFarm)) {
    return (
      <section className="page-stack">
        <PageHeader eyebrow="อ่านอย่างเดียว" title="ไม่มีสิทธิ์ลงทะเบียนตำแหน่ง" description="เฉพาะเจ้าขององค์กรหรือผู้จัดการสวนที่ใช้งานอยู่เท่านั้น" />
        <Link className="secondary-action" to="/trees">กลับทะเบียนต้น</Link>
      </section>
    )
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(undefined)
    setSaving(true)
    try {
      const normalizedZone = normalizeZoneCode(zoneCode)
      const normalizedRow = normalizeRowCode(rowCode)
      const sequence = normalizeTreeSequence(treeSequence)
      if (duplicatePosition) {
        throw new Error(`ตำแหน่ง ${tagPreview} ถูกลงทะเบียนแล้วและห้ามใช้รหัสซ้ำ`)
      }
      if (!confirmPermanentIdentity) {
        throw new Error('กรุณาตรวจโซน แถว ลำดับตำแหน่ง และรหัสป้ายก่อนลงทะเบียน')
      }

      const year = plantingYear.trim() ? Number(plantingYear) : null
      if (year !== null && (!Number.isSafeInteger(year) || year <= 0)) {
        throw new Error('ปีปลูกต้องเป็นจำนวนเต็มบวก')
      }
      const hasTreeData = Boolean(variety.trim() || year !== null)
      const rowReference = positions.find((position) => (
        normalizeZoneCode(position.zoneCode) === normalizedZone &&
        normalizeRowCode(position.rowCode) === normalizedRow
      ))
      const created = await createTreePosition({
        organizationCode: currentFarm.organizationCode,
        farmSequence: currentFarm.farmSequence,
        zoneCode: normalizedZone,
        rowCode: normalizedRow,
        treeSequence: sequence,
        rowCountingDirection: rowReference?.rowCountingDirection ?? 'TBD',
        variety: variety.trim() || null,
        varietyConfidence: 'unknown',
        plantingYear: year,
        plantingYearCalendar: year === null ? null : (year >= 2400 ? 'BE' : 'CE'),
        plantingYearConfidence: 'unknown',
        plantSource: null,
        treeStatus: hasTreeData ? 'normal' : 'empty',
        baselineDate: todayInBangkok(),
        baselineMeasurements: emptyTreeBaselineMeasurements(),
        notes: '',
      })
      await navigate(`/trees/${created.positionId}`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'ลงทะเบียนตำแหน่งไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="ทะเบียนตำแหน่งต้น"
        title="ลงทะเบียน"
        description={`กรอกข้อมูล 10 ช่องตามแม่แบบ Excel สำหรับ ${currentFarm.farmName} (${currentFarm.farmCode})`}
      />
      <aside className="operational-data-banner"><strong>ข้อมูลภาคสนาม</strong><span>ข้อมูลจะบันทึกใน Firebase ของสวนปัจจุบัน รหัสป้ายห้ามซ้ำภายในสวน</span></aside>

      <form className="tree-form tree-register-form" onSubmit={(event) => void submit(event)}>
        <section className="tree-form-section" aria-labelledby="registration-fields-title">
          <div className="tree-form-section__heading">
            <div><span>ต้องกรอกโซน แถว และลำดับตำแหน่ง</span><h2 id="registration-fields-title">ข้อมูลลงทะเบียนตำแหน่งต้น</h2></div>
            <small>รหัสป้ายสร้างอัตโนมัติในรูปแบบ Z01-R03-T05</small>
          </div>

          {locationsLoading ? <div className="loading-inline" role="status">กำลังอ่านทะเบียนเพื่อป้องกันรหัสซ้ำ…</div> : null}

          <div className="form-grid tree-register-form__grid">
            <label><span className="tree-register-field__label">ประเภทข้อมูล</span><input readOnly type="text" value="ข้อมูลภาคสนาม" /></label>
            <label><span className="tree-register-field__label">รหัสองค์กร</span><input readOnly type="text" value={currentFarm.organizationCode} /></label>
            <label><span className="tree-register-field__label">ลำดับสวน</span><input readOnly type="text" value={currentFarm.farmSequence} /></label>
            <label><span className="tree-register-field__label">รหัสโซน <strong aria-hidden="true">*</strong></span><input list="tree-zone-options" onBlur={() => { try { setZoneCode(normalizeZoneCode(zoneCode)) } catch { /* submit จะรายงานค่าที่ไม่ถูกต้อง */ } }} onChange={(event) => { setZoneCode(event.target.value.toUpperCase()); setConfirmPermanentIdentity(false) }} placeholder="เช่น Z01 หรือ 1" required type="text" value={zoneCode} /></label>
            <label><span className="tree-register-field__label">รหัสแถว <strong aria-hidden="true">*</strong></span><input list="tree-row-options" onBlur={() => { try { setRowCode(normalizeRowCode(rowCode)) } catch { /* submit จะรายงานค่าที่ไม่ถูกต้อง */ } }} onChange={(event) => { setRowCode(event.target.value.toUpperCase()); setConfirmPermanentIdentity(false) }} placeholder="เช่น R01 หรือ 1" required type="text" value={rowCode} /></label>
            <label><span className="tree-register-field__label">ลำดับตำแหน่ง <strong aria-hidden="true">*</strong></span><input inputMode="numeric" min="1" onBlur={() => { try { setTreeSequence(String(normalizeTreeSequence(treeSequence)).padStart(2, '0')) } catch { /* submit จะรายงานค่าที่ไม่ถูกต้อง */ } }} onChange={(event) => { setTreeSequence(event.target.value.toUpperCase()); setConfirmPermanentIdentity(false) }} placeholder="เช่น 5 หรือ T05" required type="text" value={treeSequence} /></label>
            <label><span className="tree-register-field__label">รหัสป้าย</span><input aria-describedby="tag-code-help" readOnly type="text" value={tagPreview} /></label>
            <label><span className="tree-register-field__label">รอบปลูก</span><input readOnly type="text" value="1" /></label>
            <label><span className="tree-register-field__label">พันธุ์</span><input onChange={(event) => setVariety(event.target.value)} placeholder="ไม่ทราบให้เว้นว่าง" type="text" value={variety} /></label>
            <label><span className="tree-register-field__label">ปีปลูก</span><input inputMode="numeric" min="1" onChange={(event) => setPlantingYear(event.target.value)} placeholder="เช่น 2568" type="number" value={plantingYear} /></label>
          </div>
          <datalist id="tree-zone-options">{zones.map((zone) => <option key={zone} value={zone} />)}</datalist>
          <datalist id="tree-row-options">{rows.map((row) => <option key={row} value={row} />)}</datalist>

          <p className="form-guidance" id="tag-code-help">ปี 2400 ขึ้นไปบันทึกเป็น พ.ศ. หากเว้นทั้งพันธุ์และปีปลูก ระบบจะลงทะเบียนเป็นตำแหน่ง “ไม่มีต้น”</p>
          <div className="tag-preview"><span>รหัสป้ายที่จะสงวน</span><code>{tagPreview}</code><small>ตรวจซ้ำจากโซน + แถว + ลำดับต้นภายในสวนปัจจุบัน</small></div>
          {duplicatePosition ? <div className="form-error" role="alert">รหัสนี้ถูกใช้แล้วโดย {duplicatePosition.tagCode} กรุณาเปลี่ยนโซน แถว หรือลำดับตำแหน่ง</div> : null}
          <label className="checkbox-control confirmation-control"><input checked={confirmPermanentIdentity} disabled={Boolean(duplicatePosition)} onChange={(event) => setConfirmPermanentIdentity(event.target.checked)} required type="checkbox" />ตรวจแล้วว่าโซน แถว ลำดับตำแหน่ง และรหัสป้ายถูกต้อง</label>
        </section>

        {error ? <div className="form-error" role="alert">{error}</div> : null}
        <div className="form-actions sticky-form-actions">
          <button className="primary-action" disabled={saving || locationsLoading || Boolean(duplicatePosition)} type="submit">{saving ? 'กำลังลงทะเบียน…' : 'ลงทะเบียน'}</button>
          <Link className="secondary-action" to="/trees">ยกเลิก</Link>
        </div>
      </form>
    </section>
  )
}
