import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
import { OrchardTargetSelector } from '../components/OrchardTargetSelector'
import { selectionFromNavigationState } from '../domain/orchardLayout'
import {
  canObserveDisease,
  diseaseSeverityLabels,
  type DiseaseAssessmentInput,
  type DiseaseFollowUpInput,
  type DiseaseIncidentRecord,
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

interface DiseaseIncidentCardProps {
  assigneeSuggestion: string | null
  busy: boolean
  incident: DiseaseIncidentRecord
  isAgronomist: boolean
  isProduction: boolean
  tree?: TreePositionSummary
  onAssess: (incident: DiseaseIncidentRecord, input: DiseaseAssessmentInput) => Promise<void>
  onCreateTreatment: (incident: DiseaseIncidentRecord, input: TreatmentWorkOrderInput) => Promise<void>
  onFollowUp: (incident: DiseaseIncidentRecord, input: DiseaseFollowUpInput) => Promise<void>
}

function DiseaseIncidentCard({
  assigneeSuggestion, busy, incident, isAgronomist, tree,
  onAssess, onCreateTreatment, onFollowUp,
  isProduction,
}: DiseaseIncidentCardProps) {
  const [suspectedDiagnosis, setSuspectedDiagnosis] = useState(incident.suspectedDiagnosis)
  const [confirmedDiagnosis, setConfirmedDiagnosis] = useState(incident.confirmedDiagnosis)
  const [treatmentPlan, setTreatmentPlan] = useState(incident.treatmentPlan)
  const [followUpDate, setFollowUpDate] = useState(incident.followUpDate || '2026-09-05')
  const [outcome, setOutcome] = useState(incident.outcome || (isProduction ? 'ผลติดตาม' : 'ผลติดตามจำลอง'))
  const [assignedUserId, setAssignedUserId] = useState(assigneeSuggestion ?? '')

  const assess = () => onAssess(incident, {
    suspectedDiagnosis, confirmedDiagnosis, treatmentPlan, followUpDate,
  })

  const followUp = (closeIncident: boolean) => onFollowUp(incident, {
    outcome, nextFollowUpDate: closeIncident ? '' : followUpDate, closeIncident,
  })

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

    {incident.photos.length > 0 ? <p className="form-warning">เคสนี้มี metadata รูปแบบเก่า {incident.photos.length} รายการ; ระบบ Live-only ไม่อนุญาตให้สร้าง Placeholder เพิ่ม</p> : null}

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
          <div className="form-actions"><button disabled={busy || !tree} type="button" onClick={() => void createTreatment()}>สร้างงานรักษา</button></div>
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
    createTreatmentWorkOrder,
  } = usePhase2()
  const isProduction = true
  const [trees, setTrees] = useState<readonly TreePositionSummary[]>([])
  const [incidents, setIncidents] = useState<readonly DiseaseIncidentRecord[]>([])
  const [assigneeSuggestion, setAssigneeSuggestion] = useState<string | null>(null)
  const [positionId, setPositionId] = useState('')
  const [symptom, setSymptom] = useState(isProduction ? 'พบอาการผิดปกติ' : 'พบอาการผิดปกติจากข้อมูลจำลอง')
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

  const assess = (item: DiseaseIncidentRecord, input: DiseaseAssessmentInput) => runMutation(item, () => assessDiseaseIncident(item.incidentId, crypto.randomUUID(), input), isProduction ? 'Agronomist บันทึก diagnosis และ treatment ใน Firebase แล้ว' : 'Agronomist บันทึก diagnosis และ treatment จำลองแล้ว', 'บันทึก assessment ไม่สำเร็จ')
  const followUp = (item: DiseaseIncidentRecord, input: DiseaseFollowUpInput) => runMutation(item, () => followUpDiseaseIncident(item.incidentId, crypto.randomUUID(), input), input.closeIncident ? 'ปิด incident แล้ว' : 'บันทึก follow-up แล้ว', 'บันทึก follow-up ไม่สำเร็จ')
  const createTreatment = (item: DiseaseIncidentRecord, input: TreatmentWorkOrderInput) => runMutation(item, () => createTreatmentWorkOrder(item.incidentId, crypto.randomUUID(), input), 'สร้าง Treatment Work Order และลิงก์ Audit สองทางแล้ว', 'สร้างงานรักษาไม่สำเร็จ')
  return <section className="page-stack">
    <PageHeader eyebrow={isProduction ? 'Firebase Production · Disease tracking' : 'Mock MVP · Disease tracking'} title={incidentId ? 'รายละเอียดอาการและการติดตาม' : 'อาการ โรค และการติดตาม'} description="Observed symptom → Photo Metadata → Treatment Work Order · แยก Farm และมี Audit" />
    {isProduction
      ? <aside className="operational-data-banner"><strong>Firebase Production</strong><span>Incident, assessment, follow-up และ Photo Metadata บันทึกใน Farm ปัจจุบัน</span></aside>
      : <aside className="field-validation-banner"><strong>SIMULATED/TEST ONLY</strong><span>ไม่มีภาพจริง กล้อง EXIF/GPS External Storage หรือหลักฐาน Physical Device/Field Validation</span></aside>}
    {incidentId ? <div className="page-actions"><Link className="secondary-action" to="/disease">กลับรายการโรคทั้งหมด</Link></div> : null}
    {!incidentId && canReport ? <form className="workflow-panel" onSubmit={(event) => void create(event)}>
      <h2>{isProduction ? 'รายงานอาการ' : 'รายงานอาการจำลอง'}</h2>
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
    {!loading && !error ? <p className="result-count">{filtered.length} เคส · {currentFarm?.farmCode} · {isProduction ? 'Firebase Production' : 'ข้อมูลจำลองเท่านั้น'}</p> : null}
    <div className="work-list">{filtered.map((item) => <DiseaseIncidentCard assigneeSuggestion={assigneeSuggestion} busy={busyId === item.incidentId} incident={item} isAgronomist={isAgronomist} isProduction={isProduction} key={`${item.incidentId}:${item.version}`} onAssess={assess} onCreateTreatment={createTreatment} onFollowUp={followUp} tree={treeByPosition.get(item.positionId)} />)}
      {!loading && !error && filtered.length === 0 ? <article className="empty-state"><h2>{incidentId ? 'ไม่พบ Disease Incident นี้' : 'ไม่มีเคสในตัวกรองนี้'}</h2><p>{incidentId ? 'ระบบไม่เปิดข้อมูลจากสวนอื่นหรือรหัสที่ไม่มีสิทธิ์' : 'ลองเลือกตัวกรองอื่นหรือรายงาน observed symptom ใหม่'}</p>{incidentId ? <Link className="secondary-action" to="/disease">กลับรายการโรค</Link> : null}</article> : null}
    </div>
  </section>
}
