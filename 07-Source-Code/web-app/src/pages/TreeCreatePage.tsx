import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
import {
  canManageTreeRegister,
  generateTagCode,
  type IdentityConfidence,
  type TreeStatus,
} from '../domain/treeRegister'
import { PageHeader } from './PageHeader'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function TreeCreatePage() {
  const navigate = useNavigate()
  const { currentFarm, createTreePosition } = usePhase2()
  const [zoneCode, setZoneCode] = useState('Z01')
  const [rowCode, setRowCode] = useState('R01')
  const [treeSequence, setTreeSequence] = useState('')
  const [variety, setVariety] = useState('')
  const [varietyConfidence, setVarietyConfidence] = useState<IdentityConfidence>('unknown')
  const [treeStatus, setTreeStatus] = useState<TreeStatus>('empty')
  const [baselineDate, setBaselineDate] = useState(today)
  const [notes, setNotes] = useState('ข้อมูลจำลองเท่านั้น')
  const [error, setError] = useState<string>()
  const [saving, setSaving] = useState(false)

  const tagPreview = useMemo(() => {
    if (!currentFarm || !treeSequence) return 'กรอกลำดับตำแหน่งเพื่อสร้าง Tag'
    try {
      return generateTagCode({
        organizationCode: currentFarm.organizationCode,
        farmSequence: currentFarm.farmSequence,
        zoneCode,
        rowCode,
        treeSequence: Number(treeSequence),
      })
    } catch (reason) {
      return reason instanceof Error ? reason.message : 'Tag ไม่ถูกต้อง'
    }
  }, [currentFarm, rowCode, treeSequence, zoneCode])

  if (!currentFarm) return null
  if (!canManageTreeRegister(currentFarm)) {
    return (
      <section className="page-stack">
        <PageHeader eyebrow="Read only" title="ไม่มีสิทธิ์เพิ่มตำแหน่ง" description="สิทธิ์จำกัดตาม Role Matrix" />
        <Link className="secondary-action" to="/trees">กลับทะเบียนต้น</Link>
      </section>
    )
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(undefined)
    setSaving(true)
    try {
      const created = await createTreePosition({
        organizationCode: currentFarm.organizationCode,
        farmSequence: currentFarm.farmSequence,
        zoneCode: zoneCode.trim().toUpperCase(),
        rowCode: rowCode.trim().toUpperCase(),
        treeSequence: Number(treeSequence),
        variety: variety.trim() || null,
        varietyConfidence: variety.trim() ? varietyConfidence : 'unknown',
        plantingYear: null,
        plantingYearCalendar: null,
        plantingYearConfidence: 'unknown',
        treeStatus,
        baselineDate,
        notes: notes.trim(),
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
        eyebrow="Phase 3 · Local/Emulator only"
        title="เพิ่มตำแหน่งปลูกจำลอง"
        description={`กำลังสร้างใน ${currentFarm.farmCode}; ยังไม่ใช่ topology ภาคสนามจริง`}
      />
      <form className="tree-form" onSubmit={(event) => void submit(event)}>
        <div className="form-grid">
          <label>Zone Code<input onChange={(event) => setZoneCode(event.target.value)} required value={zoneCode} /></label>
          <label>Row Code<input onChange={(event) => setRowCode(event.target.value)} required value={rowCode} /></label>
          <label>ลำดับตำแหน่ง<input inputMode="numeric" min="1" onChange={(event) => setTreeSequence(event.target.value)} required type="number" value={treeSequence} /></label>
          <label>สถานะต้น<select onChange={(event) => setTreeStatus(event.target.value as TreeStatus)} value={treeStatus}>
            <option value="empty">ไม่มีต้น</option><option value="normal">ปกติ</option><option value="watch">เฝ้าระวัง</option><option value="sick">ป่วย</option><option value="recovering">พักฟื้น</option><option value="dead">ตาย</option>
          </select></label>
          <label>พันธุ์ (ไม่ทราบให้เว้นว่าง)<input onChange={(event) => setVariety(event.target.value)} value={variety} /></label>
          <label>ความมั่นใจของพันธุ์<select disabled={!variety.trim()} onChange={(event) => setVarietyConfidence(event.target.value as IdentityConfidence)} value={varietyConfidence}>
            <option value="unknown">ไม่ทราบ</option><option value="estimated">ประมาณ</option><option value="confirmed">ยืนยันแล้ว</option>
          </select></label>
          <label>วันที่ Baseline<input onChange={(event) => setBaselineDate(event.target.value)} required type="date" value={baselineDate} /></label>
        </div>
        <label>หมายเหตุ<textarea onChange={(event) => setNotes(event.target.value)} rows={3} value={notes} /></label>
        <div className="tag-preview"><span>Tag preview</span><code>{tagPreview}</code><small>Tag จะอ้างตำแหน่งถาวรและห้ามนำกลับมาใช้</small></div>
        {error ? <div className="form-error" role="alert">{error}</div> : null}
        <div className="form-actions">
          <button className="primary-action" disabled={saving} type="submit">{saving ? 'กำลังบันทึก…' : 'สร้างตำแหน่งจำลอง'}</button>
          <Link className="secondary-action" to="/trees">ยกเลิก</Link>
        </div>
      </form>
    </section>
  )
}
