import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
import { OrchardTargetSelector } from '../components/OrchardTargetSelector'
import { selectionFromNavigationState } from '../domain/orchardLayout'
import {
  canAddDiseasePhoto,
  canObserveDisease,
  diseasePhotoMimeTypes,
  diseasePhotoPlaceholderKinds,
  diseaseSeverityLabels,
  type DiseaseAssessmentInput,
  type DiseaseFollowUpInput,
  type DiseaseIncidentRecord,
  type DiseasePhotoAction,
  type DiseasePhotoMimeType,
  type DiseasePhotoMockDraft,
  type DiseasePhotoPlaceholderKind,
  type DiseasePhotoUploadState,
  type DiseaseSeverity,
  type TreatmentWorkOrderInput,
} from '../domain/workCareDisease'
import type { TreePositionSummary } from '../domain/treeRegister'
import { PageHeader } from './PageHeader'

type DiseaseFilter = 'ALL' | 'OPEN' | 'URGENT' | 'CLOSED'

const diseaseFilterLabels: Record<DiseaseFilter, string> = {
  ALL: 'ทั้งหมด', OPEN: 'กำลังติดตาม', URGENT: 'เร่งด่วน', CLOSED: 'ปิดแล้ว',
}

const diseaseStatusLabels: Record<DiseaseIncidentRecord['status'], string> = {
  OPEN: 'เปิดเคส', AWAITING_DIAGNOSIS: 'รอวินิจฉัย', TREATING: 'กำลังรักษา',
  FOLLOW_UP: 'ติดตามผล', CLOSED: 'ปิดเคส',
}

const placeholderLabels: Record<DiseasePhotoPlaceholderKind, string> = {
  LEAF_SPOT: 'Placeholder ใบ/จุดโรค',
  TRUNK_AREA: 'Placeholder ลำต้น',
  CANOPY: 'Placeholder ทรงพุ่ม',
}

const photoStateLabels: Record<DiseasePhotoUploadState, string> = {
  PENDING: 'Pending', UPLOADING: 'Uploading', UPLOADED: 'Uploaded', FAILED: 'Failed',
}

interface DiseaseIncidentCardProps {
  assigneeSuggestion: string | null
  busy: boolean
  canAddPhoto: boolean
  incident: DiseaseIncidentRecord
  isAgronomist: boolean
  tree?: TreePositionSummary
  onAddPhoto: (incident: DiseaseIncidentRecord, draft: DiseasePhotoMockDraft) => Promise<void>
  onAdvancePhoto: (incident: DiseaseIncidentRecord, photoId: string, action: DiseasePhotoAction) => Promise<void>
  onAssess: (incident: DiseaseIncidentRecord, input: DiseaseAssessmentInput) => Promise<void>
  onCreateTreatment: (incident: DiseaseIncidentRecord, input: TreatmentWorkOrderInput) => Promise<void>
  onFollowUp: (incident: DiseaseIncidentRecord, input: DiseaseFollowUpInput) => Promise<void>
  onRunDemo: (incident: DiseaseIncidentRecord, tree: TreePositionSummary) => Promise<void>
}

function DiseaseIncidentCard({
  assigneeSuggestion, busy, canAddPhoto: mayAddPhoto, incident, isAgronomist, tree,
  onAddPhoto, onAdvancePhoto, onAssess, onCreateTreatment, onFollowUp, onRunDemo,
}: DiseaseIncidentCardProps) {
  const [suspectedDiagnosis, setSuspectedDiagnosis] = useState(incident.suspectedDiagnosis)
  const [confirmedDiagnosis, setConfirmedDiagnosis] = useState(incident.confirmedDiagnosis)
  const [treatmentPlan, setTreatmentPlan] = useState(incident.treatmentPlan)
  const [followUpDate, setFollowUpDate] = useState(incident.followUpDate || '2026-09-05')
  const [outcome, setOutcome] = useState(incident.outcome || 'ผลติดตามจำลอง')
  const [placeholderKind, setPlaceholderKind] = useState<DiseasePhotoPlaceholderKind>('LEAF_SPOT')
  const [mimeType, setMimeType] = useState<DiseasePhotoMimeType>('image/webp')
  const [sizeKb, setSizeKb] = useState('640')
  const [photoNote, setPhotoNote] = useState('ภาพ Placeholder สังเคราะห์สำหรับทดสอบ Workflow เท่านั้น')
  const [assignedUserId, setAssignedUserId] = useState(assigneeSuggestion ?? '')

  const assess = () => onAssess(incident, {
    suspectedDiagnosis, confirmedDiagnosis, treatmentPlan, followUpDate,
  })

  const followUp = (closeIncident: boolean) => onFollowUp(incident, {
    outcome, nextFollowUpDate: closeIncident ? '' : followUpDate, closeIncident,
  })

  const addPhoto = (event: FormEvent) => {
    event.preventDefault()
    return onAddPhoto(incident, {
      placeholderKind,
      mimeType,
      sizeBytes: Math.round(Number(sizeKb) * 1024),
      note: photoNote,
    })
  }

  const createTreatment = () => {
    if (!tree) return Promise.resolve()
    return onCreateTreatment(incident, {
      positionId: tree.positionId,
      zoneCode: tree.zoneCode,
      rowCode: tree.rowCode,
      assignedUserId: assignedUserId || null,
      dueDate: followUpDate || '2026-09-05',
    })
  }

  return <article className="work-card disease-card">
    <div className="work-card__heading">
      <span className={`disease-severity disease-severity--${incident.severity.toLowerCase()}`}>{diseaseSeverityLabels[incident.severity]}</span>
      <span className="status-pill">{diseaseStatusLabels[incident.status]}</span>
    </div>
    <h2>{incident.observedSymptom}</h2>
    <p>{tree ? <Link to={`/trees/${tree.positionId}`}>{tree.tagCode}</Link> : 'ไม่พบ Tag ในทะเบียนต้นของสวนนี้'}{' · '}<code>{incident.positionId}</code></p>
    <dl className="work-card__meta">
      <div><dt>Suspected</dt><dd>{incident.suspectedDiagnosis || 'ยังไม่ระบุ'}</dd></div>
      <div><dt>Confirmed</dt><dd>{incident.confirmedDiagnosis || 'ยังไม่ยืนยัน'}</dd></div>
      <div><dt>Treatment</dt><dd>{incident.treatmentPlan || 'รอ Agronomist'}</dd></div>
      <div><dt>Follow-up</dt><dd>{incident.followUpDate || 'TBD'}</dd></div>
      <div><dt>Outcome</dt><dd>{incident.outcome || 'ยังไม่มีผลติดตาม'}</dd></div>
      <div><dt>Version</dt><dd>{incident.version}</dd></div>
    </dl>

    {mayAddPhoto && incident.status !== 'CLOSED' ? <section className="disease-photo-panel" aria-label={`รูปจำลองสำหรับ ${incident.observedSymptom}`}>
      <div><span className="status-pill">Local DRY_RUN</span><h3>Disease-photo mock flow</h3><p>รับเฉพาะ Placeholder/Synthetic ไม่มีไฟล์ภาพ กล้อง EXIF/GPS หรือ External Storage</p></div>
      <form className="disease-photo-form" onSubmit={(event) => void addPhoto(event)}>
        <label>Placeholder<select value={placeholderKind} onChange={(event) => setPlaceholderKind(event.target.value as DiseasePhotoPlaceholderKind)}>{diseasePhotoPlaceholderKinds.map((value) => <option key={value} value={value}>{placeholderLabels[value]}</option>)}</select></label>
        <label>ชนิดไฟล์จำลอง<select value={mimeType} onChange={(event) => setMimeType(event.target.value as DiseasePhotoMimeType)}>{diseasePhotoMimeTypes.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <label>ขนาดจำลอง (KB)<input inputMode="numeric" min="1" max="5120" required type="number" value={sizeKb} onChange={(event) => setSizeKb(event.target.value)} /></label>
        <label className="span-full">หมายเหตุ<textarea required value={photoNote} onChange={(event) => setPhotoNote(event.target.value)} /></label>
        <button className="secondary-action span-full" disabled={busy} type="submit">เพิ่ม Placeholder รูปโรค</button>
      </form>
      {incident.photos.length > 0 ? <div className="disease-photo-gallery">{incident.photos.map((photo) => <article key={`${photo.photoId}:${photo.version}`}>
        <div className={`synthetic-photo synthetic-photo--${photo.placeholderKind.toLowerCase()}`} aria-label={placeholderLabels[photo.placeholderKind]}><strong>SIMULATED/TEST ONLY</strong><span>{placeholderLabels[photo.placeholderKind]}</span><small>ไม่มี binary image</small></div>
        <div className="disease-photo-meta">
          <span className={`photo-state photo-state--${photo.uploadState.toLowerCase()}`}>{photoStateLabels[photo.uploadState]}</span>
          <strong>{photo.mimeType} · {Math.round(photo.sizeBytes / 1024)} KB</strong>
          <small>{photo.note}</small><small>Retry {photo.retryCount}/3 · {photo.lifecycleMode} · EXIF/GPS: ไม่มี</small>
          {photo.lastError ? <small className="form-error">{photo.lastError}</small> : null}
          <div className="form-actions">
            {photo.uploadState === 'PENDING' ? <button disabled={busy} type="button" onClick={() => void onAdvancePhoto(incident, photo.photoId, 'START_UPLOAD')}>เริ่ม Upload จำลอง</button> : null}
            {photo.uploadState === 'UPLOADING' ? <><button className="primary-action" disabled={busy} type="button" onClick={() => void onAdvancePhoto(incident, photo.photoId, 'MARK_UPLOADED')}>จำลองสำเร็จ</button><button disabled={busy} type="button" onClick={() => void onAdvancePhoto(incident, photo.photoId, 'MARK_FAILED')}>จำลองล้มเหลว</button></> : null}
            {photo.uploadState === 'FAILED' ? <button disabled={busy || photo.retryCount >= 3} type="button" onClick={() => void onAdvancePhoto(incident, photo.photoId, 'RETRY')}>Retry จำลอง</button> : null}
          </div>
        </div>
      </article>)}</div> : <p className="result-count">ยังไม่มี Placeholder ในเคสนี้</p>}
    </section> : null}

    {isAgronomist && incident.status !== 'CLOSED' ? <section className="specialist-panel" aria-label={`Agronomist controls สำหรับ ${incident.observedSymptom}`}>
      <h3>Agronomist controls</h3>
      {incident.specialistApprovalStatus !== 'APPROVED' ? <>
        <label>Suspected diagnosis<input value={suspectedDiagnosis} onChange={(event) => setSuspectedDiagnosis(event.target.value)} /></label>
        <label>Confirmed diagnosis<input value={confirmedDiagnosis} onChange={(event) => setConfirmedDiagnosis(event.target.value)} /></label>
        <label>Treatment plan<textarea value={treatmentPlan} onChange={(event) => setTreatmentPlan(event.target.value)} /></label>
        <label>Follow-up date<input type="date" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} /></label>
        <button disabled={busy} onClick={() => void assess()} type="button">{busy ? 'กำลังบันทึก…' : 'ยืนยัน assessment'}</button>
      </> : <>
        {incident.treatmentWorkOrderId ? <p className="success-notice">เชื่อม Treatment Work Order แล้ว · <Link to={`/work/${incident.treatmentWorkOrderId}`}>เปิด {incident.treatmentWorkOrderId}</Link></p> : <div className="treatment-work-panel">
          <h4>สร้างงานรักษา</h4><p>Target ถูกล็อกกับ {tree?.tagCode ?? incident.positionId}; ระบบตรวจ Farm + Zone + Row + Position ซ้ำอีกชั้น</p>
          <label>Assignee suggestion<input value={assignedUserId} onChange={(event) => setAssignedUserId(event.target.value)} placeholder="เว้นว่างเพื่อสร้าง Draft รอมอบหมาย" /></label>
          <label>Due date<input type="date" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} /></label>
          <div className="form-actions"><button disabled={busy || !tree} type="button" onClick={() => void createTreatment()}>สร้างงานรักษา</button><button className="primary-action" disabled={busy || !tree} type="button" onClick={() => tree && void onRunDemo(incident, tree)}>One-click Mock Demo</button></div>
          <small>One-click จะสร้าง Placeholder → Uploaded → Treatment Work Order; การรับงาน/ส่งตรวจ/Verification ใช้ Workflow ปกติ</small>
        </div>}
        <label>Outcome<input value={outcome} onChange={(event) => setOutcome(event.target.value)} /></label>
        <label>วันติดตามถัดไป<input type="date" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} /></label>
        <div className="form-actions"><button disabled={busy} onClick={() => void followUp(false)} type="button">บันทึกติดตาม</button><button className="primary-action" disabled={busy} onClick={() => void followUp(true)} type="button">ปิด incident</button></div>
      </>}
    </section> : null}

    <details className="audit-timeline"><summary>ประวัติเคส {incident.audit.length} เหตุการณ์</summary><ol>{incident.audit.map((audit) => <li key={audit.eventId}><strong>{audit.eventType}</strong> · {audit.description}<span>{audit.actorDisplayName} · {audit.createdAtLabel} · v{audit.incidentVersion}</span></li>)}</ol></details>
  </article>
}

export function DiseasePage() {
  const { incidentId } = useParams()
  const location = useLocation()
  const {
    currentFarm, listTreePositions, listWorkOrders, listDiseaseIncidents,
    createDiseaseIncident, assessDiseaseIncident, followUpDiseaseIncident,
    addDiseasePhotoMock, advanceDiseasePhotoMock, createTreatmentWorkOrder,
  } = usePhase2()
  const [trees, setTrees] = useState<readonly TreePositionSummary[]>([])
  const [incidents, setIncidents] = useState<readonly DiseaseIncidentRecord[]>([])
  const [assigneeSuggestion, setAssigneeSuggestion] = useState<string | null>(null)
  const [positionId, setPositionId] = useState('')
  const [symptom, setSymptom] = useState('พบอาการผิดปกติจากข้อมูลจำลอง')
  const [severity, setSeverity] = useState<DiseaseSeverity>('MEDIUM')
  const [suspectedDiagnosis, setSuspectedDiagnosis] = useState('')
  const [followUpDate, setFollowUpDate] = useState('2026-09-05')
  const [filter, setFilter] = useState<DiseaseFilter>('ALL')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string>()
  const [error, setError] = useState<string>()
  const [message, setMessage] = useState<string>()
  const isAgronomist = currentFarm?.role === 'AGRONOMIST'
  const canReport = currentFarm ? canObserveDisease(currentFarm.role) : false
  const mayAddPhoto = currentFarm ? canAddDiseasePhoto(currentFarm.role) : false

  const reload = useCallback(async () => {
    const [nextTrees, nextIncidents, nextWorkOrders] = await Promise.all([listTreePositions(), listDiseaseIncidents(), listWorkOrders()])
    const active = nextTrees.filter((tree) => tree.positionStatus === 'ACTIVE')
    setTrees(active)
    const requested = currentFarm
      ? selectionFromNavigationState(location.state, currentFarm.farmId)
      : []
    setPositionId((current) => {
      const requestedPosition = requested.find((candidate) => active.some((tree) => (
        tree.positionId === candidate && tree.currentCycle.treeStatus !== 'empty'
      )))
      if (requestedPosition) return requestedPosition
      return active.some((tree) => tree.positionId === current && tree.currentCycle.treeStatus !== 'empty')
        ? current
        : active.find((tree) => tree.currentCycle.treeStatus !== 'empty')?.positionId ?? ''
    })
    setIncidents(nextIncidents)
    setAssigneeSuggestion(nextWorkOrders.find((order) => order.assignedUserId)?.assignedUserId ?? null)
  }, [currentFarm, listDiseaseIncidents, listTreePositions, listWorkOrders, location.state])

  useEffect(() => {
    let active = true
    queueMicrotask(() => {
      if (!active) return
      setLoading(true); setError(undefined); setMessage(undefined); setIncidents([]); setTrees([]); setAssigneeSuggestion(null)
      void reload().catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'โหลดข้อมูลไม่สำเร็จ') }).finally(() => { if (active) setLoading(false) })
    })
    return () => { active = false }
  }, [currentFarm?.farmId, reload])

  const treeByPosition = useMemo(() => new Map(trees.map((tree) => [tree.positionId, tree])), [trees])
  const filtered = useMemo(() => {
    if (incidentId) return incidents.filter((item) => item.incidentId === incidentId)
    if (filter === 'OPEN') return incidents.filter((item) => item.status !== 'CLOSED')
    if (filter === 'URGENT') return incidents.filter((item) => item.status !== 'CLOSED' && ['HIGH', 'CRITICAL'].includes(item.severity))
    if (filter === 'CLOSED') return incidents.filter((item) => item.status === 'CLOSED')
    return incidents
  }, [filter, incidentId, incidents])

  const runMutation = async (item: DiseaseIncidentRecord, operation: () => Promise<unknown>, success: string, fallback: string) => {
    setBusyId(item.incidentId); setError(undefined); setMessage(undefined)
    try { await operation(); await reload(); setMessage(success) }
    catch (cause) { setError(cause instanceof Error ? cause.message : fallback) }
    finally { setBusyId(undefined) }
  }

  const create = async (event: FormEvent) => {
    event.preventDefault(); setBusyId('CREATE'); setError(undefined); setMessage(undefined)
    try {
      await createDiseaseIncident(crypto.randomUUID(), { positionId, observedSymptom: symptom, severity, suspectedDiagnosis: isAgronomist ? suspectedDiagnosis : '', followUpDate })
      await reload(); setFilter('ALL'); setMessage('บันทึก observed symptom แล้ว โดยยังไม่ถือเป็น diagnosis')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'บันทึกอาการไม่สำเร็จ') }
    finally { setBusyId(undefined) }
  }

  const assess = (item: DiseaseIncidentRecord, input: DiseaseAssessmentInput) => runMutation(item, () => assessDiseaseIncident(item.incidentId, crypto.randomUUID(), input), 'Agronomist บันทึก diagnosis และ treatment จำลองแล้ว', 'บันทึก assessment ไม่สำเร็จ')
  const followUp = (item: DiseaseIncidentRecord, input: DiseaseFollowUpInput) => runMutation(item, () => followUpDiseaseIncident(item.incidentId, crypto.randomUUID(), input), input.closeIncident ? 'ปิด incident แล้ว' : 'บันทึก follow-up แล้ว', 'บันทึก follow-up ไม่สำเร็จ')
  const addPhoto = (item: DiseaseIncidentRecord, draft: DiseasePhotoMockDraft) => runMutation(item, () => addDiseasePhotoMock(item.incidentId, crypto.randomUUID(), draft), 'เพิ่ม Synthetic Placeholder แล้ว · สถานะ Pending · Local DRY_RUN', 'เพิ่ม Placeholder ไม่สำเร็จ')
  const advancePhoto = (item: DiseaseIncidentRecord, photoId: string, action: DiseasePhotoAction) => runMutation(item, () => advanceDiseasePhotoMock(item.incidentId, photoId, crypto.randomUUID(), action), `เปลี่ยนสถานะรูปจำลองด้วย ${action} แล้ว`, 'เปลี่ยนสถานะรูปจำลองไม่สำเร็จ')
  const createTreatment = (item: DiseaseIncidentRecord, input: TreatmentWorkOrderInput) => runMutation(item, () => createTreatmentWorkOrder(item.incidentId, crypto.randomUUID(), input), 'สร้าง Treatment Work Order และลิงก์ Audit สองทางแล้ว', 'สร้างงานรักษาไม่สำเร็จ')
  const runDemo = (item: DiseaseIncidentRecord, tree: TreePositionSummary) => runMutation(item, async () => {
    const added = await addDiseasePhotoMock(item.incidentId, crypto.randomUUID(), { placeholderKind: 'LEAF_SPOT', mimeType: 'image/webp', sizeBytes: 640 * 1024, note: 'One-click synthetic disease evidence · SIMULATED/TEST ONLY' })
    const photo = added.photos[0]
    if (!photo) throw new Error('ไม่พบ Placeholder ที่เพิ่งสร้าง')
    await advanceDiseasePhotoMock(item.incidentId, photo.photoId, crypto.randomUUID(), 'START_UPLOAD')
    await advanceDiseasePhotoMock(item.incidentId, photo.photoId, crypto.randomUUID(), 'MARK_UPLOADED')
    await createTreatmentWorkOrder(item.incidentId, crypto.randomUUID(), { positionId: tree.positionId, zoneCode: tree.zoneCode, rowCode: tree.rowCode, assignedUserId: assigneeSuggestion, dueDate: item.followUpDate || '2026-09-05' })
  }, 'One-click Mock Demo สำเร็จ: Photo Uploaded และสร้าง Treatment Work Order แล้ว', 'One-click Mock Demo ไม่สำเร็จ')

  return <section className="page-stack">
    <PageHeader eyebrow="Local Mock MVP · Disease tracking" title={incidentId ? 'รายละเอียดอาการและการติดตาม' : 'อาการ โรค และการติดตาม'} description="Observed symptom → Synthetic photo → Treatment Work Order · แยก Farm และมี Audit" />
    <aside className="field-validation-banner"><strong>SIMULATED/TEST ONLY · Local/Emulator</strong><span>ไม่มีภาพจริง กล้อง EXIF/GPS External Storage หรือหลักฐาน Physical Device/Field Validation</span></aside>
    {incidentId ? <div className="page-actions"><Link className="secondary-action" to="/disease">กลับรายการโรคทั้งหมด</Link></div> : null}
    {!incidentId && canReport ? <form className="workflow-panel" onSubmit={(event) => void create(event)}>
      <h2>รายงานอาการจำลอง</h2>
      {currentFarm ? <OrchardTargetSelector
        disabledReason={(tree) => tree.currentCycle.treeStatus === 'empty' ? 'ตำแหน่งไม่มีต้น จึงรายงานอาการไม่ได้' : undefined}
        farm={currentFarm}
        onChange={(positionIds) => setPositionId(positionIds[0] ?? '')}
        positions={trees}
        selectedPositionIds={positionId ? [positionId] : []}
        selectionMode="SINGLE"
        title="เลือกต้นที่พบอาการ"
      /> : null}
      <label>Observed symptom<textarea required value={symptom} onChange={(event) => setSymptom(event.target.value)} /></label>
      <div className="form-grid"><label>Severity<select value={severity} onChange={(event) => setSeverity(event.target.value as DiseaseSeverity)}>{Object.entries(diseaseSeverityLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Follow-up date<input type="date" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} /></label></div>
      {isAgronomist ? <label>Suspected diagnosis<input value={suspectedDiagnosis} onChange={(event) => setSuspectedDiagnosis(event.target.value)} /></label> : <p className="form-warning">บทบาทนี้รายงานอาการได้ แต่ห้ามบันทึก diagnosis/treatment</p>}
      {trees.length === 0 ? <p className="form-warning">ไม่มีตำแหน่งปลูก Active ในสวนนี้ จึงยังรายงานอาการไม่ได้</p> : null}
      <button className="primary-action" disabled={busyId === 'CREATE' || trees.length === 0} type="submit">{busyId === 'CREATE' ? 'กำลังบันทึก…' : 'บันทึกอาการ'}</button>
    </form> : null}
    {!incidentId ? <div className="work-filter" aria-label="กรอง Disease Incident">{(Object.keys(diseaseFilterLabels) as DiseaseFilter[]).map((value) => <button aria-pressed={filter === value} className={filter === value ? 'status-filter status-filter--active' : 'status-filter'} key={value} onClick={() => setFilter(value)} type="button">{diseaseFilterLabels[value]}</button>)}</div> : null}
    {loading ? <div className="loading-inline" role="status">กำลังอ่าน Disease Incident…</div> : null}
    {error ? <p className="form-error" role="alert">{error}</p> : null}{message ? <p className="success-notice" role="status">{message}</p> : null}
    {!loading && !error ? <p className="result-count">{filtered.length} เคส · {currentFarm?.farmCode} · ข้อมูลจำลองเท่านั้น</p> : null}
    <div className="work-list">{filtered.map((item) => <DiseaseIncidentCard assigneeSuggestion={assigneeSuggestion} busy={busyId === item.incidentId} canAddPhoto={mayAddPhoto} incident={item} isAgronomist={isAgronomist} key={`${item.incidentId}:${item.version}`} onAddPhoto={addPhoto} onAdvancePhoto={advancePhoto} onAssess={assess} onCreateTreatment={createTreatment} onFollowUp={followUp} onRunDemo={runDemo} tree={treeByPosition.get(item.positionId)} />)}
      {!loading && !error && filtered.length === 0 ? <article className="empty-state"><h2>{incidentId ? 'ไม่พบ Disease Incident นี้' : 'ไม่มีเคสในตัวกรองนี้'}</h2><p>{incidentId ? 'ระบบไม่เปิดข้อมูลจากสวนอื่นหรือรหัสที่ไม่มีสิทธิ์' : 'ลองเลือกตัวกรองอื่นหรือรายงาน observed symptom ใหม่'}</p>{incidentId ? <Link className="secondary-action" to="/disease">กลับรายการโรค</Link> : null}</article> : null}
    </div>
  </section>
}
