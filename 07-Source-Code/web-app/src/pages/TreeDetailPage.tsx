import { useEffect, useState, type FormEvent } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
import {
  createTreeCycleFormValue,
  treeCycleFormValueFromRecord,
  treeCycleInputFromForm,
  TreeCycleFormFields,
  type TreeCycleFormValue,
} from '../components/TreeCycleFormFields'
import { appEnvironment } from '../config/environment'
import {
  buildQrPayload,
  canManageTreeRegister,
  identityConfidenceLabels,
  measurementConfidenceLabels,
  rowCountingDirectionLabels,
  treePresenceFromStatus,
  treePresenceLabels,
  treeStatusLabels,
  type TreePositionDetail,
} from '../domain/treeRegister'
import { PageHeader } from './PageHeader'
import './TreeRegisterPages.css'

type EditorMode = 'EDIT' | 'REPLACE' | 'ARCHIVE' | null

export function TreeDetailPage() {
  const { syncState } = useOutletContext<{ syncState: 'synced' | 'offline' }>()
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
  const [cycleForm, setCycleForm] = useState<TreeCycleFormValue>(() => createTreeCycleFormValue())
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && editor) {
        setEditor(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [editor])

  const openEditor = (mode: Exclude<EditorMode, null>) => {
    if (!detail) return
    setEditor(mode)
    setNotice(undefined)
    setError(undefined)
    setCycleForm(mode === 'REPLACE'
      ? createTreeCycleFormValue('normal')
      : treeCycleFormValueFromRecord(detail.currentCycle))
    setReason('')
  }

  const cycleInput = () => treeCycleInputFromForm(cycleForm)

  const submitEditor = async (event: FormEvent) => {
    event.preventDefault()
    if (!detail || !editor) return
    setSaving(true)
    setError(undefined)
    try {
      let updated: TreePositionDetail
      if (editor === 'EDIT') {
        updated = await updateCurrentPlantingCycle(detail.positionId, cycleInput())
        setNotice(syncState === 'offline'
          ? 'บันทึกในเครื่องแล้ว — Firebase จะซิงก์ให้อัตโนมัติเมื่อกลับมาออนไลน์'
          : 'บันทึกการแก้ไขพร้อม Tree timeline แล้ว')
      } else if (editor === 'REPLACE') {
        updated = await replacePlantingCycle(detail.positionId, {
          ...cycleInput(),
          reason,
        })
        setNotice(syncState === 'offline'
          ? 'เก็บ Planting Cycle ใหม่ในเครื่องแล้ว — รอ Firebase ซิงก์ โดย Tag และตำแหน่งเดิมไม่เปลี่ยน'
          : 'เพิ่ม Planting Cycle ใหม่แล้ว โดย Tag และตำแหน่งเดิมไม่เปลี่ยน')
      } else {
        updated = await archiveTreePosition(detail.positionId, reason)
        setNotice(syncState === 'offline'
          ? 'เก็บคำสั่ง Archive ในเครื่องแล้ว — จะส่งเมื่อ Firebase กลับมาออนไลน์'
          : 'ลบรายการออกจากการใช้งานแล้ว (เก็บถาวร) ประวัติและ Tag ยังถูกสงวนไว้')
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
      setNotice(syncState === 'offline'
        ? 'เก็บรายงานป้ายชำรุดในเครื่องแล้ว — จะส่งเมื่อ Firebase กลับมาออนไลน์'
        : 'บันทึกรายงานป้ายชำรุดใน Timeline แล้ว')
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
  const treePresence = treePresenceFromStatus(detail.currentCycle.treeStatus)
  const canReportDamage = ['ORG_OWNER', 'FARM_MANAGER', 'AGRONOMIST', 'WORKER'].includes(currentFarm.role)
  const qrPayload = buildQrPayload(appEnvironment.qrBaseUrl, detail.positionId)
  const measurements = detail.currentCycle.baselineMeasurements ?? {
    gps: null,
    trunk: null,
    canopy: null,
    height: null,
  }
  const measurementCount = Object.values(measurements).filter(Boolean).length
  const plantingYear = detail.currentCycle.plantingYear
    ? `${detail.currentCycle.plantingYear} ${detail.currentCycle.plantingYearCalendar === 'BE' ? 'พ.ศ.' : 'ค.ศ.'}`
    : 'ไม่ทราบ'
  const measurementCards = [
    {
      key: 'height',
      icon: '↕',
      label: 'ความสูงต้น',
      value: measurements.height ? `${measurements.height.value.toLocaleString('th-TH')} ${measurements.height.unit}` : 'ยังไม่มีข้อมูล',
      meta: measurements.height ? `${measurements.height.method} · ${measurements.height.measuredAt}` : 'ไม่ได้เปิดกลุ่มวัดความสูง',
      evidence: measurements.height ? `${measurementConfidenceLabels[measurements.height.confidence]} · ${measurements.height.measuredBy} · ${measurements.height.source}` : null,
    },
    {
      key: 'trunk',
      icon: '◯',
      label: measurements.trunk?.type === 'diameter' ? 'เส้นผ่านศูนย์กลางลำต้น' : 'เส้นรอบวงลำต้น',
      value: measurements.trunk ? `${measurements.trunk.value.toLocaleString('th-TH')} ${measurements.trunk.unit}` : 'ยังไม่มีข้อมูล',
      meta: measurements.trunk ? `วัดที่ความสูง ${measurements.trunk.heightCm.toLocaleString('th-TH')} cm · ${measurements.trunk.measuredAt}` : 'ไม่ได้เปิดกลุ่มวัดลำต้น',
      evidence: measurements.trunk ? `${measurementConfidenceLabels[measurements.trunk.confidence]} · ${measurements.trunk.measuredBy} · ${measurements.trunk.source}` : null,
    },
    {
      key: 'canopy',
      icon: '⊕',
      label: 'ขนาดทรงพุ่ม',
      value: measurements.canopy ? `${measurements.canopy.widthNS.toLocaleString('th-TH')} × ${measurements.canopy.widthEW.toLocaleString('th-TH')} ${measurements.canopy.unit}` : 'ยังไม่มีข้อมูล',
      meta: measurements.canopy ? `แนวเหนือ–ใต้ × ตะวันออก–ตะวันตก · ${measurements.canopy.measuredAt}` : 'ไม่ได้เปิดกลุ่มวัดทรงพุ่ม',
      evidence: measurements.canopy ? `${measurementConfidenceLabels[measurements.canopy.confidence]} · ${measurements.canopy.measuredBy} · ${measurements.canopy.source}` : null,
    },
    {
      key: 'gps',
      icon: '⌖',
      label: 'พิกัดโดยประมาณ',
      value: measurements.gps ? `${measurements.gps.latitude.toFixed(6)}, ${measurements.gps.longitude.toFixed(6)}` : 'ยังไม่มีข้อมูล',
      meta: measurements.gps ? `ความคลาดเคลื่อน ±${measurements.gps.accuracyM.toLocaleString('th-TH')} m · ${measurements.gps.measuredAt}` : 'GPS ไม่ใช่ตัวตนหรือขอบเขตสิทธิ์ของต้น',
      evidence: measurements.gps ? `${measurementConfidenceLabels[measurements.gps.confidence]} · ${measurements.gps.measuredBy} · ${measurements.gps.source}` : null,
    },
  ]

  return (
    <section className="page-stack">
      <PageHeader
        backTo="/trees"
        eyebrow={`ทะเบียนต้น · ${detail.zoneCode} / ${detail.rowCode}`}
        title={detail.tagCode}
        description="รายละเอียดตำแหน่งปลูกถาวร ต้นปลูกทดแทนจะเพิ่มรอบปลูกใหม่โดยไม่เปลี่ยนรหัสป้าย"
      />
      {notice ? <div className="success-notice" role="status">{notice}</div> : null}
      {error ? <div className="form-error" role="alert">{error}</div> : null}

      <article className="tree-detail-hero">
        <div className="tree-detail-hero__heading">
          <div>
            <span>พันธุ์ปัจจุบัน</span>
            <h2>{detail.currentCycle.variety ?? 'ไม่ทราบพันธุ์'}</h2>
            <p>{detail.zoneCode} · {detail.rowCode} · ตำแหน่ง {detail.treeSequence}</p>
          </div>
          <div className="tree-detail-hero__statuses">
            <span className={`tree-status tree-status--${detail.currentCycle.treeStatus}`}>{treePresenceLabels[treePresence]}</span>
            {treePresence === 'present' && detail.currentCycle.treeStatus !== 'normal' ? <span className={`tree-status tree-status--${detail.currentCycle.treeStatus}`}>{treeStatusLabels[detail.currentCycle.treeStatus]}</span> : null}
            {detail.positionStatus === 'ARCHIVED' ? <span className="status-pill">ตำแหน่งเก็บถาวร</span> : null}
          </div>
        </div>
        <dl className="tree-detail-stats">
          <div><dt>รอบปลูก</dt><dd>{detail.currentCycleNumber}</dd><small>รอบปัจจุบัน</small></div>
          <div><dt>ปีปลูก</dt><dd>{plantingYear}</dd><small>{identityConfidenceLabels[detail.currentCycle.plantingYearConfidence]}</small></div>
          <div><dt>ข้อมูลตั้งต้น</dt><dd>{detail.currentCycle.baselineDate}</dd><small>วันที่บันทึก</small></div>
          <div><dt>ข้อมูลสำรวจ</dt><dd>{measurementCount}</dd><small>จาก 4 กลุ่ม</small></div>
        </dl>
      </article>

      <div className="tree-detail-grid">
        <article className="tree-profile-card">
          <div className="tree-section-heading">
            <span aria-hidden="true">✽</span>
            <div><h2>ข้อมูลต้นและตำแหน่ง</h2><p>ข้อมูลอ้างอิงของรอบปลูกปัจจุบัน</p></div>
            {canManage && detail.positionStatus === 'ACTIVE' ? (
              <button className="secondary-action tree-section-heading__action" onClick={() => openEditor('EDIT')} type="button">
                แก้ไขรายละเอียด
              </button>
            ) : null}
          </div>
          <dl className="detail-list">
            <div><dt>รหัสป้าย</dt><dd><code>{detail.tagCode}</code></dd></div>
            <div><dt>โซน / แถว / ตำแหน่ง</dt><dd>{detail.zoneCode} / {detail.rowCode} / {detail.treeSequence}</dd></div>
            <div><dt>สถานะการมีต้น</dt><dd>{treePresenceLabels[treePresence]}</dd></div>
            <div><dt>สถานะสุขภาพต้น</dt><dd>{treePresence === 'empty' ? 'ไม่ใช้เมื่อไม่มีต้น' : treeStatusLabels[detail.currentCycle.treeStatus]}</dd></div>
            <div><dt>ความมั่นใจของพันธุ์</dt><dd>{identityConfidenceLabels[detail.currentCycle.varietyConfidence]}</dd></div>
            <div><dt>แหล่งต้นพันธุ์</dt><dd>{detail.currentCycle.plantSource ?? 'ไม่ทราบ'}</dd></div>
            <div><dt>ทิศทางการนับในแถว</dt><dd>{rowCountingDirectionLabels[detail.rowCountingDirection ?? 'TBD']}</dd></div>
            <div><dt>สถานะตำแหน่ง</dt><dd>{detail.positionStatus === 'ACTIVE' ? 'ใช้งาน' : 'เก็บถาวร'}</dd></div>
          </dl>
          <div className="tree-note"><strong>หมายเหตุ</strong><p>{detail.currentCycle.notes || 'ไม่มีหมายเหตุ'}</p></div>
        </article>

        <article className="qr-payload-card">
          <div className="qr-payload-card__icon" aria-hidden="true">⌗</div>
          <span className="qr-payload-card__eyebrow">QR permanent route</span>
          <h2>เส้นทาง QR ประจำตำแหน่ง</h2>
          <p>QR เก็บเฉพาะรหัสภายใน ระบบยังตรวจสอบสิทธิ์และสวนทุกครั้งหลังเปิดลิงก์</p>
          <div className="qr-payload-card__code"><small>ปลายทาง</small><code>{qrPayload}</code></div>
          <Link className="primary-action" to={`/scan?expected=${detail.positionId}`}>สแกนยืนยันตำแหน่งนี้</Link>
          <small className="qr-payload-card__id">Position ID · <code>{detail.positionId}</code></small>
        </article>
      </div>

      <section className="tree-measurements" aria-labelledby="tree-measurements-title">
        <div className="tree-section-heading">
          <span aria-hidden="true">◎</span>
          <div><h2 id="tree-measurements-title">ข้อมูลสำรวจเริ่มต้น</h2><p>กลุ่มที่มีข้อมูลจะแสดงหลักฐานการวัดครบถ้วน</p></div>
          <strong>{measurementCount}/4 กลุ่ม</strong>
        </div>
        <div className="tree-measurement-grid">
          {measurementCards.map((measurement) => (
            <article className={measurement.evidence ? 'tree-measurement' : 'tree-measurement tree-measurement--empty'} key={measurement.key}>
              <span aria-hidden="true">{measurement.icon}</span>
              <div><small>{measurement.label}</small><strong>{measurement.value}</strong><p>{measurement.meta}</p>{measurement.evidence ? <em>{measurement.evidence}</em> : null}</div>
            </article>
          ))}
        </div>
      </section>

      {canManage && detail.positionStatus === 'ACTIVE' ? (
        <section className="tree-detail-actions" aria-labelledby="tree-actions-title">
          <div><h2 id="tree-actions-title">จัดการตำแหน่งนี้</h2><p>การแก้ไขจะถูกบันทึกใน Audit และ Timeline</p></div>
          <div className="page-actions">
            <button className="secondary-action" onClick={() => openEditor('REPLACE')} type="button">เพิ่มรอบปลูกทดแทน</button>
            <button className="danger-action" onClick={() => openEditor('ARCHIVE')} type="button">ลบรายการ (เก็บถาวร)</button>
          </div>
        </section>
      ) : null}

      {editor ? (
        <div
          aria-labelledby="tree-editor-title"
          aria-modal="true"
          className="tree-edit-modal-backdrop"
          onClick={() => setEditor(null)}
          role="dialog"
        >
          <div
            className="tree-edit-modal"
            onClick={(e) => e.stopPropagation()}
            role="document"
          >
            <div className="tree-edit-modal__heading">
              <div>
                <span className="tree-edit-modal__eyebrow">
                  {editor === 'EDIT'
                    ? `แก้ไขข้อมูลต้น · ${detail.tagCode}`
                    : editor === 'REPLACE'
                      ? `เพิ่มรอบปลูกทดแทน · ${detail.tagCode}`
                      : `จัดการสถานะตำแหน่ง · ${detail.tagCode}`}
                </span>
                <h2 id="tree-editor-title">
                  {editor === 'EDIT'
                    ? 'แก้ไขรายละเอียดต้นและรอบปลูกปัจจุบัน'
                    : editor === 'REPLACE'
                      ? `เพิ่มรอบปลูก ${detail.currentCycleNumber + 1}`
                      : 'ยืนยันลบรายการแบบเก็บถาวร'}
                </h2>
              </div>
              <button
                aria-label="ปิดหน้าต่างแก้ไข"
                className="tree-edit-modal__close-btn"
                onClick={() => setEditor(null)}
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="tree-edit-modal__body">
              <form className="tree-form" onSubmit={(event) => void submitEditor(event)}>
                {editor === 'EDIT' ? (
                  <div className="form-guidance">
                    แก้ไขพันธุ์ ปีปลูก สถานะ และข้อมูลสำรวจของรอบปัจจุบันได้ ส่วนรหัสป้าย โซน แถว และลำดับตำแหน่งเป็นตัวตนถาวร จึงแก้ไขไม่ได้
                  </div>
                ) : null}
                {editor !== 'ARCHIVE' ? (
                  <TreeCycleFormFields
                    onChange={(patch) => setCycleForm((current) => ({ ...current, ...patch }))}
                    value={cycleForm}
                  />
                ) : null}
                {editor !== 'EDIT' ? (
                  <label>
                    เหตุผล
                    <input onChange={(event) => setReason(event.target.value)} required value={reason} />
                  </label>
                ) : null}
                {editor === 'REPLACE' ? (
                  <div className="form-warning">
                    Tag <code>{detail.tagCode}</code> จะคงเดิม ระบบเพิ่มเฉพาะ Planting Cycle
                  </div>
                ) : null}
                {editor === 'ARCHIVE' ? (
                  <div className="form-warning">
                    การลบรายการจะเป็นการเก็บถาวร ไม่ลบประวัติ และ Tag นี้จะไม่ถูกนำกลับมาใช้
                  </div>
                ) : null}
                <div className="form-actions tree-edit-modal__actions">
                  <button
                    className={editor === 'ARCHIVE' ? 'danger-action' : 'primary-action'}
                    disabled={saving}
                    type="submit"
                  >
                    {saving ? 'กำลังบันทึก…' : 'ยืนยันและบันทึก Audit'}
                  </button>
                  <button className="secondary-action" onClick={() => setEditor(null)} type="button">
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {canReportDamage && detail.positionStatus === 'ACTIVE' ? (
        <section className="damaged-tag-panel" aria-labelledby="damaged-tag-title">
          <h2 id="damaged-tag-title">ป้ายอ่านไม่ได้หรือชำรุด</h2>
          <p>รายงานเหตุการณ์ได้โดยไม่เปลี่ยน Tag หรือข้อมูลตำแหน่ง</p>
          <div><input aria-label="หมายเหตุป้ายชำรุด" onChange={(event) => setDamagedNote(event.target.value)} placeholder="เช่น QR เปื้อน อ่านด้วยตาได้" value={damagedNote} /><button disabled={saving} onClick={() => void submitDamagedReport()} type="button">บันทึกรายงานป้ายชำรุด</button></div>
        </section>
      ) : null}

      <div className="tree-history-grid">
        <section className="cycle-history" aria-labelledby="cycle-history-title">
          <div className="tree-section-heading"><span aria-hidden="true">↻</span><div><h2 id="cycle-history-title">ประวัติรอบปลูก</h2><p>Planting Cycle ของตำแหน่งเดิม</p></div></div>
          <div className="cycle-history__list">
            {detail.plantingCycles.map((cycle) => <article key={cycle.cycleId}><span>{cycle.cycleNumber}</span><div><strong>รอบปลูก {cycle.cycleNumber} · {treeStatusLabels[cycle.treeStatus]}</strong><small>{cycle.variety ?? 'ไม่ทราบพันธุ์'} · {cycle.endedAtLabel ? `สิ้นสุด ${cycle.endedAtLabel}` : 'รอบปัจจุบัน'}</small><p>{cycle.notes || 'ไม่มีหมายเหตุ'}</p></div></article>)}
          </div>
        </section>

        <section className="tree-timeline" aria-labelledby="tree-timeline-title">
          <div className="tree-section-heading"><span aria-hidden="true">◷</span><div><h2 id="tree-timeline-title">Timeline ที่ตรวจสอบได้</h2><p>ลำดับเหตุการณ์และผู้บันทึก</p></div></div>
          <div className="tree-timeline__list">
            {detail.timeline.map((item) => <article key={item.eventId}><span aria-hidden="true"></span><div><strong>{item.description}</strong><small>{item.actorDisplayName} · {item.createdAtLabel} · version {item.positionVersion}</small></div></article>)}
          </div>
        </section>
      </div>
    </section>
  )
}
