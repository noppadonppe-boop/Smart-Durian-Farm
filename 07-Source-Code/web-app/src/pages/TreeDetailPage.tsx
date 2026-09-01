import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
import { appEnvironment } from '../config/environment'
import {
  buildQrPayload,
  canManageTreeRegister,
  identityConfidenceLabels,
  treeStatusLabels,
  type IdentityConfidence,
  type TreePositionDetail,
  type TreeStatus,
} from '../domain/treeRegister'
import { PageHeader } from './PageHeader'

type EditorMode = 'EDIT' | 'REPLACE' | 'ARCHIVE' | null

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function TreeDetailPage() {
  const { positionId } = useParams()
  const {
    currentFarm,
    getTreePosition,
    updateCurrentPlantingCycle,
    replacePlantingCycle,
    archiveTreePosition,
    reportDamagedTag,
  } = usePhase2()
  const [detail, setDetail] = useState<TreePositionDetail>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [notice, setNotice] = useState<string>()
  const [editor, setEditor] = useState<EditorMode>(null)
  const [variety, setVariety] = useState('')
  const [varietyConfidence, setVarietyConfidence] = useState<IdentityConfidence>('unknown')
  const [plantingYear, setPlantingYear] = useState('')
  const [plantingYearCalendar, setPlantingYearCalendar] = useState<'BE' | 'CE'>('BE')
  const [plantingYearConfidence, setPlantingYearConfidence] = useState<IdentityConfidence>('unknown')
  const [treeStatus, setTreeStatus] = useState<TreeStatus>('empty')
  const [notes, setNotes] = useState('')
  const [baselineDate, setBaselineDate] = useState(today)
  const [reason, setReason] = useState('')
  const [damagedNote, setDamagedNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    if (!positionId) return
    void Promise.resolve()
      .then(() => {
        if (active) {
          setLoading(true)
          setError(undefined)
        }
        return getTreePosition(positionId)
      })
      .then((position) => {
        if (active) setDetail(position)
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'อ่านข้อมูลต้นไม่สำเร็จ')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [currentFarm?.farmId, getTreePosition, positionId])

  const openEditor = (mode: Exclude<EditorMode, null>) => {
    if (!detail) return
    setEditor(mode)
    setNotice(undefined)
    setError(undefined)
    setVariety(mode === 'REPLACE' ? '' : detail.currentCycle.variety ?? '')
    setVarietyConfidence(mode === 'REPLACE' ? 'unknown' : detail.currentCycle.varietyConfidence)
    setPlantingYear(mode === 'REPLACE' ? '' : String(detail.currentCycle.plantingYear ?? ''))
    setPlantingYearCalendar(detail.currentCycle.plantingYearCalendar ?? 'BE')
    setPlantingYearConfidence(mode === 'REPLACE' ? 'unknown' : detail.currentCycle.plantingYearConfidence)
    setTreeStatus(mode === 'REPLACE' ? 'empty' : detail.currentCycle.treeStatus)
    setNotes(mode === 'REPLACE' ? 'ข้อมูลรอบปลูกทดแทนจำลอง' : detail.currentCycle.notes)
    setBaselineDate(today())
    setReason('')
  }

  const cycleInput = () => ({
    variety: variety.trim() || null,
    varietyConfidence: variety.trim() ? varietyConfidence : 'unknown' as const,
    plantingYear: plantingYear ? Number(plantingYear) : null,
    plantingYearCalendar: plantingYear ? plantingYearCalendar : null,
    plantingYearConfidence: plantingYear ? plantingYearConfidence : 'unknown' as const,
    treeStatus,
    notes: notes.trim(),
  })

  const submitEditor = async (event: FormEvent) => {
    event.preventDefault()
    if (!detail || !editor) return
    setSaving(true)
    setError(undefined)
    try {
      let updated: TreePositionDetail
      if (editor === 'EDIT') {
        updated = await updateCurrentPlantingCycle(detail.positionId, cycleInput())
        setNotice('บันทึกการแก้ไขพร้อม Tree timeline แล้ว')
      } else if (editor === 'REPLACE') {
        updated = await replacePlantingCycle(detail.positionId, {
          ...cycleInput(),
          baselineDate,
          reason,
        })
        setNotice('เพิ่ม Planting Cycle ใหม่แล้ว โดย Tag และตำแหน่งเดิมไม่เปลี่ยน')
      } else {
        updated = await archiveTreePosition(detail.positionId, reason)
        setNotice('เก็บตำแหน่งถาวรแล้ว ประวัติและ Tag ยังถูกสงวนไว้')
      }
      setDetail(updated)
      setEditor(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const submitDamagedReport = async () => {
    if (!detail) return
    setSaving(true)
    setError(undefined)
    try {
      const updated = await reportDamagedTag(detail.positionId, damagedNote)
      setDetail(updated)
      setDamagedNote('')
      setNotice('บันทึกรายงานป้ายชำรุดใน Timeline แล้ว')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'รายงานป้ายไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <section className="page-stack"><div className="loading-inline" role="status">กำลังอ่านข้อมูลตำแหน่ง…</div></section>
  if (error && !detail) return <section className="page-stack"><div className="form-error" role="alert">{error}</div><Link to="/trees">กลับทะเบียนต้น</Link></section>
  if (!detail || !currentFarm) return <section className="page-stack"><PageHeader eyebrow="Not found" title="ไม่พบตำแหน่งในสวนปัจจุบัน" description="ระบบไม่เปิดเผยข้อมูลจากสวนอื่น" /><Link className="secondary-action" to="/trees">กลับทะเบียนต้น</Link></section>

  const canManage = canManageTreeRegister(currentFarm)
  const canReportDamage = ['ORG_OWNER', 'FARM_MANAGER', 'AGRONOMIST', 'WORKER'].includes(currentFarm.role)
  const qrPayload = buildQrPayload(appEnvironment.qrBaseUrl, detail.positionId)

  return (
    <section className="page-stack">
      <PageHeader eyebrow={`${detail.zoneCode} · ${detail.rowCode}`} title={detail.tagCode} description={`Opaque Position ID: ${detail.positionId}`} />
      {notice ? <div className="success-notice" role="status">{notice}</div> : null}
      {error ? <div className="form-error" role="alert">{error}</div> : null}

      <div className="tree-detail-grid">
        <article className="tree-profile-card">
          <div className="tree-profile-card__heading">
            <span className={`tree-status tree-status--${detail.currentCycle.treeStatus}`}>{treeStatusLabels[detail.currentCycle.treeStatus]}</span>
            {detail.positionStatus === 'ARCHIVED' ? <span className="status-pill">ตำแหน่งเก็บถาวร</span> : null}
          </div>
          <h2>{detail.currentCycle.variety ?? 'ไม่ทราบพันธุ์'}</h2>
          <dl className="detail-list">
            <div><dt>Planting Cycle</dt><dd>{detail.currentCycleNumber}</dd></div>
            <div><dt>ความมั่นใจ</dt><dd>{identityConfidenceLabels[detail.currentCycle.varietyConfidence]}</dd></div>
            <div><dt>ปีปลูก</dt><dd>{detail.currentCycle.plantingYear ? `${detail.currentCycle.plantingYear} ${detail.currentCycle.plantingYearCalendar}` : 'ไม่ทราบ'}</dd></div>
            <div><dt>Baseline</dt><dd>{detail.currentCycle.baselineDate}</dd></div>
          </dl>
          <p>{detail.currentCycle.notes || 'ไม่มีหมายเหตุ'}</p>
        </article>

        <article className="qr-payload-card">
          <span aria-hidden="true">⌗</span>
          <h2>QR permanent route</h2>
          <code>{qrPayload}</code>
          <p>QR เก็บเฉพาะ opaque ID และไม่ใช้แทน authorization</p>
          <Link className="primary-action" to={`/scan?expected=${detail.positionId}`}>สแกนยืนยันตำแหน่งนี้</Link>
        </article>
      </div>

      {canManage && detail.positionStatus === 'ACTIVE' ? (
        <div className="page-actions">
          <button className="secondary-action" onClick={() => openEditor('EDIT')} type="button">แก้ข้อมูลรอบปัจจุบัน</button>
          <button className="secondary-action" onClick={() => openEditor('REPLACE')} type="button">เพิ่มรอบปลูกทดแทน</button>
          <button className="danger-action" onClick={() => openEditor('ARCHIVE')} type="button">เก็บตำแหน่งถาวร</button>
        </div>
      ) : null}

      {editor ? (
        <form className="tree-form" onSubmit={(event) => void submitEditor(event)}>
          <h2>{editor === 'EDIT' ? 'แก้รอบปลูกปัจจุบัน' : editor === 'REPLACE' ? `เพิ่มรอบปลูก ${detail.currentCycleNumber + 1}` : 'ยืนยันเก็บตำแหน่งถาวร'}</h2>
          {editor !== 'ARCHIVE' ? (
            <div className="form-grid">
              <label>พันธุ์<input onChange={(event) => setVariety(event.target.value)} value={variety} /></label>
              <label>ความมั่นใจ<select onChange={(event) => setVarietyConfidence(event.target.value as IdentityConfidence)} value={varietyConfidence}><option value="unknown">ไม่ทราบ</option><option value="estimated">ประมาณ</option><option value="confirmed">ยืนยันแล้ว</option></select></label>
              <label>ปีปลูก<input inputMode="numeric" min="1" onChange={(event) => setPlantingYear(event.target.value)} type="number" value={plantingYear} /></label>
              <label>ปฏิทิน<select disabled={!plantingYear} onChange={(event) => setPlantingYearCalendar(event.target.value as 'BE' | 'CE')} value={plantingYearCalendar}><option value="BE">พ.ศ. (BE)</option><option value="CE">ค.ศ. (CE)</option></select></label>
              <label>ความมั่นใจปีปลูก<select disabled={!plantingYear} onChange={(event) => setPlantingYearConfidence(event.target.value as IdentityConfidence)} value={plantingYearConfidence}><option value="unknown">ไม่ทราบ</option><option value="estimated">ประมาณ</option><option value="confirmed">ยืนยันแล้ว</option></select></label>
              <label>สถานะต้น<select onChange={(event) => setTreeStatus(event.target.value as TreeStatus)} value={treeStatus}>{Object.entries(treeStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              {editor === 'REPLACE' ? <label>วันที่ Baseline<input onChange={(event) => setBaselineDate(event.target.value)} required type="date" value={baselineDate} /></label> : null}
            </div>
          ) : null}
          {editor !== 'ARCHIVE' ? <label>หมายเหตุ<textarea onChange={(event) => setNotes(event.target.value)} rows={3} value={notes} /></label> : null}
          {editor !== 'EDIT' ? <label>เหตุผล<input onChange={(event) => setReason(event.target.value)} required value={reason} /></label> : null}
          {editor === 'REPLACE' ? <div className="form-warning">Tag <code>{detail.tagCode}</code> จะคงเดิม ระบบเพิ่มเฉพาะ Planting Cycle</div> : null}
          {editor === 'ARCHIVE' ? <div className="form-warning">การเก็บถาวรไม่ลบประวัติ และ Tag นี้จะไม่ถูกนำกลับมาใช้</div> : null}
          <div className="form-actions"><button className={editor === 'ARCHIVE' ? 'danger-action' : 'primary-action'} disabled={saving} type="submit">{saving ? 'กำลังบันทึก…' : 'ยืนยันและบันทึก Audit'}</button><button className="secondary-action" onClick={() => setEditor(null)} type="button">ยกเลิก</button></div>
        </form>
      ) : null}

      {canReportDamage && detail.positionStatus === 'ACTIVE' ? (
        <section className="damaged-tag-panel" aria-labelledby="damaged-tag-title">
          <h2 id="damaged-tag-title">ป้ายอ่านไม่ได้หรือชำรุด</h2>
          <p>รายงานเหตุการณ์ได้โดยไม่เปลี่ยน Tag หรือข้อมูลตำแหน่ง</p>
          <div><input aria-label="หมายเหตุป้ายชำรุด" onChange={(event) => setDamagedNote(event.target.value)} placeholder="เช่น QR เปื้อน อ่านด้วยตาได้" value={damagedNote} /><button disabled={saving} onClick={() => void submitDamagedReport()} type="button">บันทึกรายงานป้ายชำรุด</button></div>
        </section>
      ) : null}

      <section className="cycle-history" aria-labelledby="cycle-history-title">
        <h2 id="cycle-history-title">ประวัติ Planting Cycle</h2>
        {detail.plantingCycles.map((cycle) => <article key={cycle.cycleId}><strong>รอบปลูก {cycle.cycleNumber} · {treeStatusLabels[cycle.treeStatus]}</strong><span>{cycle.variety ?? 'ไม่ทราบพันธุ์'} · {cycle.endedAtLabel ? `สิ้นสุด ${cycle.endedAtLabel}` : 'รอบปัจจุบัน'}</span><p>{cycle.notes}</p></article>)}
      </section>

      <section className="tree-timeline" aria-labelledby="tree-timeline-title">
        <h2 id="tree-timeline-title">Timeline ที่ตรวจสอบได้</h2>
        {detail.timeline.map((item) => <article key={item.eventId}><span aria-hidden="true">●</span><div><strong>{item.description}</strong><small>{item.actorDisplayName} · {item.createdAtLabel} · version {item.positionVersion}</small></div></article>)}
      </section>
    </section>
  )
}
