import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
import {
  diseaseAnalysisAbstainLabels,
  diseaseAnalysisDispositionLabels,
  diseaseAnalysisEvidenceScenarios,
  diseaseAnalysisScenarioLabels,
  type DiseaseAnalysisEvidenceScenario,
  type DiseaseAnalysisReviewDisposition,
  type DiseaseAnalysisReviewInput,
  type DiseaseAnalysisSessionRecord,
} from '../domain/diseaseAnalysis'
import { roleLabels } from '../domain/farm'
import type { TreePositionSummary } from '../domain/treeRegister'
import type { DiseaseIncidentRecord } from '../domain/workCareDisease'
import { PageHeader } from './PageHeader'

const analysisRoles = ['ORG_OWNER', 'FARM_MANAGER', 'AGRONOMIST'] as const

const workflowStages = [
  ['1', 'อ้างอิง Disease Incident', 'ใช้ observed symptom, Farm, Position และ Planting Cycle ที่ตรวจสิทธิ์แล้ว'],
  ['2', 'เลือก Scenario', 'ใช้ deterministic scenario และไม่ผูกกับไฟล์ภาพหรือ External Storage'],
  ['3', 'Candidate หรือ Abstain', 'สร้างผลเดิมซ้ำได้ พร้อม Confidence, Quality และ uncertainty'],
  ['4', 'Agronomist Human Review', 'รับ แก้ หรือปฏิเสธผลเบื้องต้น โดยเก็บ Audit แบบ append-oriented'],
  ['5', 'กลับสู่ Workflow ปัจจุบัน', 'Human Review ไม่เขียน confirmed diagnosis และไม่สร้าง Treatment Work Order อัตโนมัติ'],
] as const

interface SessionCardProps {
  session: DiseaseAnalysisSessionRecord
  incident: DiseaseIncidentRecord | undefined
  tree: TreePositionSummary | undefined
  canReview: boolean
  isProduction: boolean
  busy: boolean
  onReview: (session: DiseaseAnalysisSessionRecord, input: DiseaseAnalysisReviewInput) => Promise<void>
}

function SessionCard({ session, incident, tree, canReview, isProduction, busy, onReview }: SessionCardProps) {
  const candidate = session.candidateFindings[0]
  const [disposition, setDisposition] = useState<DiseaseAnalysisReviewDisposition>(
    session.abstainReason ? 'REJECTED' : 'ACCEPTED',
  )
  const [correctedFinding, setCorrectedFinding] = useState('')
  const [note, setNote] = useState('')

  const submitReview = async (event: FormEvent) => {
    event.preventDefault()
    const reviewedFindingLabel = disposition === 'ACCEPTED'
      ? candidate?.label ?? ''
      : disposition === 'CORRECTED'
        ? correctedFinding
        : ''
    await onReview(session, { disposition, reviewedFindingLabel, note })
  }

  return <article className="work-card">
    <div className="work-card__heading">
      <span className="status-pill">{session.status === 'REVIEWED' ? 'Human Review แล้ว' : 'รอ Human Review'}</span>
      <code>{session.analysisSessionId}</code>
    </div>
    <h3>{tree?.tagCode ?? session.positionId}</h3>
    <p>{session.observedSymptom}</p>
    <dl className="work-card__meta">
      <div><dt>Scenario</dt><dd>{diseaseAnalysisScenarioLabels[session.evidenceScenario]}</dd></div>
      <div><dt>Quality</dt><dd>{session.qualityScorePercent}%{isProduction ? '' : ' · Mock score'}</dd></div>
      <div><dt>Confidence</dt><dd>{candidate ? `${candidate.confidencePercent}%${isProduction ? '' : ' · Mock confidence'}` : 'ไม่มี — Abstain'}</dd></div>
      <div><dt>Source</dt><dd>{session.analysisSource}</dd></div>
      <div><dt>Sync</dt><dd>{isProduction ? 'Firebase Production' : 'ข้อมูลจำลอง'}</dd></div>
      <div><dt>Diagnosis writeback</dt><dd>NOT_WRITTEN</dd></div>
    </dl>

    {candidate ? <div className="form-warning">
      <strong>Candidate finding</strong>
      <p>{candidate.label}</p>
      <small>{candidate.uncertaintyNote}</small>
    </div> : <div className="form-warning">
      <strong>Abstain</strong>
      <p>{session.abstainReason ? diseaseAnalysisAbstainLabels[session.abstainReason] : 'ไม่มีผลเบื้องต้น'}</p>
      <small>ระบบไม่บังคับเลือกกลุ่มอาการเมื่อหลักฐานไม่เพียงพอ</small>
    </div>}

    <div className="page-actions">
      <Link className="secondary-action" to={`/disease/${session.incidentId}`}>
        เปิด Disease Incident
      </Link>
    </div>

    {session.status === 'REVIEWED' ? <section className="phase-boundary">
      <h4>{session.reviewDisposition ? diseaseAnalysisDispositionLabels[session.reviewDisposition] : 'Human Review'}</h4>
      {session.reviewedFindingLabel ? <p>ผลที่ตรวจทาน: {session.reviewedFindingLabel}</p> : null}
      {session.reviewNote ? <p>หมายเหตุ: {session.reviewNote}</p> : null}
      <p><strong>ยังไม่ใช่ confirmed diagnosis</strong> — หากต้องยืนยัน ให้ Agronomist บันทึกแยกใน Disease Incident</p>
    </section> : null}

    {session.status === 'HUMAN_REVIEW_REQUIRED' && canReview ? <form className="phase-boundary analysis-review-form" onSubmit={(event) => void submitReview(event)}>
      <h4>Agronomist Human Review</h4>
      <label>Disposition
        <select value={disposition} onChange={(event) => setDisposition(event.target.value as DiseaseAnalysisReviewDisposition)}>
          {!session.abstainReason ? <option value="ACCEPTED">รับ candidate finding</option> : null}
          <option value="CORRECTED">แก้ผลเบื้องต้น</option>
          <option value="REJECTED">ปฏิเสธผลเบื้องต้น</option>
        </select>
      </label>
      {disposition === 'CORRECTED' ? <label>ผลที่แก้โดย Agronomist
        <input required value={correctedFinding} onChange={(event) => setCorrectedFinding(event.target.value)} />
      </label> : null}
      <label>เหตุผล/หมายเหตุ
        <textarea
          required={disposition !== 'ACCEPTED'}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      <button className="primary-action" disabled={busy} type="submit">
        {busy ? 'กำลังบันทึก…' : 'บันทึก Human Review'}
      </button>
      <small>การบันทึกนี้ไม่เขียน confirmed diagnosis และไม่สร้างคำแนะนำการรักษา</small>
    </form> : null}

    {session.status === 'HUMAN_REVIEW_REQUIRED' && !canReview ? <p className="form-warning">
      รอ Agronomist รับ แก้ หรือปฏิเสธผลเบื้องต้น
    </p> : null}

    <details className="audit-timeline">
      <summary>Audit ของ Analysis Session {session.audit.length} เหตุการณ์</summary>
      <ol>{session.audit.map((event) => <li key={event.eventId}>
        <strong>{event.eventType}</strong> · {event.description}
        <span>{event.actorDisplayName} · {event.createdAtLabel} · v{event.sessionVersion}</span>
      </li>)}</ol>
    </details>
    {!incident ? <p className="form-error">ไม่พบ Disease Incident อ้างอิงใน Farm scope ปัจจุบัน</p> : null}
  </article>
}

export function DiseaseAnalysisReadinessPage() {
  const {
    currentFarm,
    listDiseaseIncidents,
    listTreePositions,
    listDiseaseAnalysisSessions,
    createDiseaseAnalysisSession,
    reviewDiseaseAnalysisSession,
  } = usePhase2()
  const isProduction = true
  const [incidents, setIncidents] = useState<readonly DiseaseIncidentRecord[]>([])
  const [trees, setTrees] = useState<readonly TreePositionSummary[]>([])
  const [sessions, setSessions] = useState<readonly DiseaseAnalysisSessionRecord[]>([])
  const [incidentId, setIncidentId] = useState('')
  const [scenario, setScenario] = useState<DiseaseAnalysisEvidenceScenario>('CLEAR_SYMPTOM_PATTERN')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string>()
  const [error, setError] = useState<string>()
  const [message, setMessage] = useState<string>()

  const canOpen = currentFarm
    ? analysisRoles.some((role) => role === currentFarm.role)
    : false
  const canReview = currentFarm?.role === 'AGRONOMIST'

  const reload = useCallback(async () => {
    const [nextIncidents, nextTrees, nextSessions] = await Promise.all([
      listDiseaseIncidents(),
      listTreePositions(),
      listDiseaseAnalysisSessions(),
    ])
    setIncidents(nextIncidents)
    setTrees(nextTrees)
    setSessions(nextSessions)
    setIncidentId((current) => nextIncidents.some((incident) => incident.incidentId === current)
      ? current
      : nextIncidents.find((incident) => incident.status !== 'CLOSED')?.incidentId ?? nextIncidents[0]?.incidentId ?? '')
  }, [listDiseaseAnalysisSessions, listDiseaseIncidents, listTreePositions])

  useEffect(() => {
    if (!canOpen) {
      return
    }
    let active = true
    queueMicrotask(() => {
      if (!active) return
      setLoading(true)
      setError(undefined)
      setMessage(undefined)
      void reload()
        .catch((cause: unknown) => {
          if (active) setError(cause instanceof Error ? cause.message : 'โหลด Analysis Session ไม่สำเร็จ')
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    })
    return () => { active = false }
  }, [canOpen, currentFarm?.farmId, reload])

  const incidentById = useMemo(() => new Map(incidents.map((incident) => [incident.incidentId, incident])), [incidents])
  const treeByPosition = useMemo(() => new Map(trees.map((tree) => [tree.positionId, tree])), [trees])
  const selectedIncident = incidentById.get(incidentId)
  const selectedTree = selectedIncident ? treeByPosition.get(selectedIncident.positionId) : undefined

  if (!currentFarm) return null

  if (!canOpen) {
    return <section className="empty-state">
      <h1>{isProduction ? 'ศูนย์วิเคราะห์โรค' : 'ศูนย์วิเคราะห์โรคจำลอง'}</h1>
      <p>เปิดให้ Owner, Farm Manager และ Agronomist เท่านั้น ไม่มีข้อมูลจากสวนอื่นถูกแสดง</p>
      <Link className="secondary-action" to="/disease">กลับไปติดตามโรค</Link>
    </section>
  }

  const createSession = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedIncident || !selectedTree) return
    setBusyId('CREATE')
    setError(undefined)
    setMessage(undefined)
    try {
      const created = await createDiseaseAnalysisSession(crypto.randomUUID(), {
        incidentId: selectedIncident.incidentId,
        positionId: selectedIncident.positionId,
        plantingCycleId: selectedTree.currentCycle.cycleId,
        evidenceScenario: scenario,
        observedSymptom: selectedIncident.observedSymptom,
      })
      await reload()
      setMessage(created.abstainReason
        ? 'สร้าง Analysis Session แล้ว · ผลเป็น Abstain และรอ Agronomist Review'
        : isProduction ? 'สร้าง candidate finding ใน Firebase แล้ว · รอ Agronomist Review' : 'สร้าง candidate finding จำลองแล้ว · รอ Agronomist Review')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'สร้าง Analysis Session ไม่สำเร็จ')
    } finally {
      setBusyId(undefined)
    }
  }

  const reviewSession = async (
    session: DiseaseAnalysisSessionRecord,
    input: DiseaseAnalysisReviewInput,
  ) => {
    setBusyId(session.analysisSessionId)
    setError(undefined)
    setMessage(undefined)
    try {
      await reviewDiseaseAnalysisSession(session.analysisSessionId, crypto.randomUUID(), input)
      await reload()
      setMessage('บันทึก Human Review แล้ว · confirmed diagnosis ยังคงไม่ถูกเขียนอัตโนมัติ')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'บันทึก Human Review ไม่สำเร็จ')
    } finally {
      setBusyId(undefined)
    }
  }

  return <section className="page-stack">
    <PageHeader
      eyebrow={isProduction ? 'Disease Analysis · Firebase Production' : 'P1 Approved · Deterministic Mock Analysis'}
      title={isProduction ? 'ศูนย์วิเคราะห์โรค' : 'ศูนย์วิเคราะห์โรคจำลอง'}
      description="Analysis Session, Confidence, Abstain และ Human Review โดยไม่เขียน confirmed diagnosis อัตโนมัติ"
    />

    {isProduction
      ? <aside className="operational-data-banner"><strong>Firebase Production</strong><span>Analysis Session และ Human Review บันทึกใน Farm ปัจจุบัน; ผลไม่เขียน confirmed diagnosis อัตโนมัติ</span></aside>
      : <aside className="field-validation-banner"><strong>SIMULATED/TEST ONLY</strong><span>ไม่มี Upload, Camera, External AI/API/model, External Storage, diagnosis writeback หรือคำแนะนำสารเคมีอัตโนมัติ</span></aside>}

    <article className="hero-card">
      <div>
        <span className="status-pill">P1 — Approved</span>
        <h2>{currentFarm.farmCode} · {roleLabels[currentFarm.role]}</h2>
        <p>Analysis เป็นเครื่องมือช่วยจัดลำดับข้อมูล ส่วน Disease Incident และการยืนยัน diagnosis ยังคงเป็น Workflow หลักของ Agronomist</p>
      </div>
      <div className="hero-actions">
        <Link className="primary-action" to="/disease">เปิดติดตามโรคปัจจุบัน</Link>
        <Link className="secondary-action" to="/notifications">ดูคิวเร่งด่วน</Link>
      </div>
    </article>

    <section className="workflow-panel" aria-labelledby="analysis-create-title">
      <div className="section-heading">
        <div><span className="status-pill">Deterministic rules</span><h2 id="analysis-create-title">{isProduction ? 'สร้าง Analysis Session' : 'สร้าง Analysis Session จำลอง'}</h2></div>
      </div>
      <form onSubmit={(event) => void createSession(event)}>
        <label>Disease Incident
          <select disabled={incidents.length === 0} value={incidentId} onChange={(event) => setIncidentId(event.target.value)}>
            {incidents.map((incident) => <option key={incident.incidentId} value={incident.incidentId}>
              {treeByPosition.get(incident.positionId)?.tagCode ?? incident.positionId} · {incident.observedSymptom}
            </option>)}
          </select>
        </label>
        <label>Evidence scenario
          <select value={scenario} onChange={(event) => setScenario(event.target.value as DiseaseAnalysisEvidenceScenario)}>
            {diseaseAnalysisEvidenceScenarios.map((value) => <option value={value} key={value}>{diseaseAnalysisScenarioLabels[value]}</option>)}
          </select>
        </label>
        {selectedTree ? <p className="result-count">
          ล็อก scope: {currentFarm.farmCode} · {selectedTree.tagCode} · {selectedTree.currentCycle.cycleId}
        </p> : null}
        <button className="primary-action" disabled={busyId === 'CREATE' || !selectedIncident || !selectedTree} type="submit">
          {busyId === 'CREATE' ? 'กำลังสร้าง…' : isProduction ? 'สร้างผลวิเคราะห์' : 'สร้างผลวิเคราะห์จำลอง'}
        </button>
        <small>ผลถูกคำนวณจาก Scenario คงที่ ไม่อ่านไฟล์ภาพ ไม่เรียก External Model และใช้ idempotency key ต่อ operation</small>
      </form>
    </section>

    {loading ? <div className="loading-inline" role="status">กำลังอ่าน Analysis Session…</div> : null}
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    {message ? <p className="success-notice" role="status">{message}</p> : null}
    {!loading && !error ? <p className="result-count">{sessions.length} Analysis Session · {currentFarm.farmCode} · {isProduction ? 'Firebase Production' : 'SIMULATED/TEST ONLY'}</p> : null}

    <div className="work-list">
      {sessions.map((session) => <SessionCard
        busy={busyId === session.analysisSessionId}
        canReview={canReview}
        isProduction={isProduction}
        incident={incidentById.get(session.incidentId)}
        key={`${session.analysisSessionId}:${session.version}`}
        onReview={reviewSession}
        session={session}
        tree={treeByPosition.get(session.positionId)}
      />)}
      {!loading && !error && sessions.length === 0 ? <article className="empty-state">
        <h2>ยังไม่มี Analysis Session ในสวนนี้</h2>
         <p>{isProduction ? 'เลือก Disease Incident และ Scenario เพื่อสร้างผลใน Firebase ของ Farm ปัจจุบัน' : 'เลือก Disease Incident และ Scenario เพื่อสร้างผลจำลอง โดยข้อมูลแยกจากข้อมูลใช้งานจริง'}</p>
      </article> : null}
    </div>

    <section className="workflow-panel" aria-labelledby="p1-workflow-title">
      <div className="section-heading">
        <div><span className="status-pill">P1 Workflow</span><h2 id="p1-workflow-title">ลำดับการทำงานที่เปิดใช้แล้ว</h2></div>
      </div>
      <div className="work-list">
        {workflowStages.map(([number, title, description]) => <article className="work-card" key={number}>
          <div className="work-card__heading"><span className="status-pill">ขั้น {number}</span></div>
          <h3>{title}</h3>
          <p>{description}</p>
        </article>)}
      </div>
    </section>

    <section className="phase-boundary" aria-labelledby="p2-boundary-title">
      <h2 id="p2-boundary-title">{isProduction ? 'ขอบเขตการใช้งานปัจจุบัน' : 'ยังไม่อนุมัติ P2 / Pilot / Production'}</h2>
      <ul>
        <li>ชื่อโรคและ taxonomy ทางวิชาการยังต้องให้ Owner/Agronomist อนุมัติ</li>
        <li>ภาพจริง Dataset จริง Model/Provider และ metric เชิงความแม่นยำยังไม่อนุมัติ</li>
        <li>DEC-026 เรื่อง Treatment/Chemical Policy ยังคง Open</li>
        {isProduction ? <li>การเชื่อม External AI, การใช้ภาพจริง และการให้คำแนะนำสารเคมีอัตโนมัติยังไม่เปิดใช้</li> : <li>External PA-1 ยัง Blocked; PA-2, Controlled Pilot, Deployment และ Production ยังไม่อนุมัติ</li>}
      </ul>
    </section>
  </section>
}
