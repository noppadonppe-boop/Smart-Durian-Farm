import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
import {
  careTypeLabels,
  workStatusLabels,
  type PerTreeCompletion,
  type WorkAction,
  type WorkOrderRecord,
} from '../domain/workCareDisease'
import { uploadAndCommitWorkPhotoBatch } from '../services/workPhotoRecovery'
import { PageHeader } from './PageHeader'

export function WorkDetailPage() {
  const { workOrderId = '' } = useParams()
  const {
    mode,
    currentFarm,
    identity,
    getWorkOrder,
    performWorkAction,
    saveWorkReport,
    uploadWorkPhoto,
    getWorkPhotoUrl,
    registerPhotoRecovery,
    queueWorkPhotoBinaryBatch,
    checkpointQueuedWorkPhoto,
    removeQueuedWorkPhotoBatch,
  } = usePhase2()
  const [order, setOrder] = useState<WorkOrderRecord>()
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string>()
  const [reason, setReason] = useState('ต้องแก้หลักฐานจำลองให้ครบ')
  const [notes, setNotes] = useState('บันทึกผลการทำงานด้วยข้อมูลจำลอง')
  const [materialName, setMaterialName] = useState('วัสดุจำลอง')
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState('หน่วยทดสอบ')
  const [beforeFile, setBeforeFile] = useState<File>()
  const [afterFile, setAfterFile] = useState<File>()
  const [completions, setCompletions] = useState<readonly PerTreeCompletion[]>([])
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})

  const reload = useCallback(async () => {
    const next = await getWorkOrder(workOrderId)
    setOrder(next)
    setCompletions((current) => current.length > 0 ? current : (next?.target.positionIds ?? []).map(
      (positionId) => ({ positionId, status: 'SUCCESS' as const, exceptionReason: '' }),
    ))
    setLoading(false)
  }, [getWorkOrder, workOrderId])

  useEffect(() => { void Promise.resolve().then(reload).catch((cause: unknown) => {
    setMessage(cause instanceof Error ? cause.message : 'โหลด Work Order ไม่สำเร็จ')
    setLoading(false)
  }) }, [currentFarm?.farmId, reload])

  useEffect(() => {
    const photos = [
      ...(order?.instructionPhotos ?? []),
      ...(order?.report?.photos ?? []),
    ]
    let active = true
    void Promise.all(photos.map(async (photo) => {
      try {
        return [photo.photoId, await getWorkPhotoUrl(workOrderId, photo.storagePath)] as const
      } catch {
        return [photo.photoId, ''] as const
      }
    })).then((entries) => {
      if (active) setPhotoUrls(Object.fromEntries(entries))
    })
    return () => { active = false }
  }, [getWorkPhotoUrl, order, workOrderId])

  const canReview = currentFarm?.role === 'ORG_OWNER' || currentFarm?.role === 'FARM_MANAGER' ||
    (currentFarm?.role === 'AGRONOMIST' && order?.category !== 'GENERAL')
  const canAssign = currentFarm?.role === 'ORG_OWNER' || currentFarm?.role === 'FARM_MANAGER' ||
    (currentFarm?.role === 'AGRONOMIST' && order?.category === 'DISEASE_FOLLOW_UP')
  const isAssignee = order?.assignedUserId === identity?.userId
  const expectedPositionId = order?.target.positionIds[0]
  const targetConfirmed = order?.target.kind !== 'TREE' || order.targetConfirmedPositionId === expectedPositionId

  const act = async (action: WorkAction) => {
    setBusy(true)
    setMessage(undefined)
    try {
      const updated = await performWorkAction(workOrderId, crypto.randomUUID(), action)
      setOrder(updated)
      setMessage(`บันทึก ${action.type} แล้ว`)
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'เปลี่ยนสถานะไม่สำเร็จ')
    } finally { setBusy(false) }
  }

  const saveReport = async () => {
    if (!beforeFile || !afterFile) {
      setMessage('ต้องเลือกภาพก่อนและหลังอย่างละ 1 ภาพ (ข้อมูลทดสอบเท่านั้น)')
      return
    }
    setBusy(true)
    setMessage('กำลังเก็บภาพใน Local Adapter/Storage Emulator…')
    try {
      if (!currentFarm) throw new Error('ไม่พบสวนปัจจุบัน')
      const beforeId = `photo_before_${crypto.randomUUID().replaceAll('-', '')}`
      const afterId = `photo_after_${crypto.randomUUID().replaceAll('-', '')}`
      const reportDraft = {
        notes,
        targetConfirmedPositionId: order?.target.kind === 'TREE' ? order.targetConfirmedPositionId : null,
        materials: [{ materialName, quantity: Number(quantity), unit }],
        completions,
      }
      const batch = await queueWorkPhotoBinaryBatch({
        workOrderId,
        kind: 'REPORT',
        commitIdempotencyKey: crypto.randomUUID(),
        candidates: [
          { photoId: beforeId, phase: 'BEFORE', file: beforeFile },
          { photoId: afterId, phase: 'AFTER', file: afterFile },
        ],
        reportDraft,
      })
      const updated = await uploadAndCommitWorkPhotoBatch({
        mode,
        farm: currentFarm,
        workOrderId,
        candidates: batch.candidates,
        upload: (candidate) => uploadWorkPhoto(
          workOrderId, candidate.photoId, candidate.phase, candidate.file,
        ),
        commit: (photos) => saveWorkReport(
          workOrderId, batch.commitIdempotencyKey, { ...reportDraft, photos },
        ),
        register: registerPhotoRecovery,
        onPhotoUploaded: (_candidate, evidence) =>
          checkpointQueuedWorkPhoto(batch.batchId, evidence),
        onCommitted: () => removeQueuedWorkPhotoBatch(batch.batchId),
      })
      setOrder(updated)
      setMessage('บันทึกรายงานและภาพหลักฐานครบชุดแล้ว')
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : 'บันทึกรายงานไม่สำเร็จ'
      setMessage(`${detail} · หากมีคิวรูป ให้เปิดศูนย์ซิงก์เพื่อ Retry`)
    } finally { setBusy(false) }
  }

  const completionSummary = useMemo(
    () => completions.filter((item) => item.status === 'EXCEPTION').length,
    [completions],
  )

  if (loading) return <p className="loading-inline">กำลังโหลด Work Order…</p>
  if (!order) return <section className="empty-state"><h1>ไม่พบ Work Order</h1><p>ระบบไม่เปิดเผยงานคนละสวนหรือที่ไม่มีสิทธิ์</p></section>

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Phase 4 · Work execution" title={order.title} description={`${order.workOrderId} · ข้อมูลจำลองเท่านั้น`} />
      <article className="work-detail-card">
        <div className="work-card__heading"><span className={`work-priority work-priority--${order.priority.toLowerCase()}`}>{order.priority === 'URGENT' ? 'เร่งด่วน' : 'ปกติ'}</span><span className={`work-status work-status--${order.status.toLowerCase()}`}>{workStatusLabels[order.status]}{order.isPaused ? ' · พักอยู่' : ''}</span></div>
        <p>{order.description}</p>
        <dl className="work-card__meta"><div><dt>ประเภท</dt><dd>{order.careType ? careTypeLabels[order.careType] : order.category}</dd></div><div><dt>Target</dt><dd>{order.target.kind} · {order.target.positionIds.length} ต้น</dd></div><div><dt>Version</dt><dd>{order.version}</dd></div>{order.sourceDiseaseIncidentId ? <div><dt>ต้นทาง</dt><dd><Link to={`/disease/${order.sourceDiseaseIncidentId}`}>Disease Incident {order.sourceDiseaseIncidentId}</Link></dd></div> : null}</dl>
        <div className="target-code-list">{order.target.positionIds.map((id) => <code key={id}>{id}</code>)}</div>
        {order.sourceDiseaseIncidentId ? <p className="field-helper">Treatment Work Order นี้ล็อก Farm/Position จาก Disease Incident ต้นทาง และตรวจสอบลิงก์ซ้ำด้วย idempotency</p> : null}
      </article>

      {canAssign && order.status === 'DRAFT' && order.assignedUserId ? <section className="workflow-panel" aria-labelledby="treatment-assign-title">
        <h2 id="treatment-assign-title">มอบหมายงานตาม Assignee suggestion</h2>
        <p><code>{order.assignedUserId}</code> · ข้อมูลบัญชีจำลองในสวนปัจจุบัน</p>
        <button className="primary-action" disabled={busy} onClick={() => void act({ type: 'ASSIGN', assignedUserId: order.assignedUserId! })} type="button">มอบหมายงานรักษา</button>
      </section> : null}

      {order.instructionPhotos.length > 0 ? (
        <section className="workflow-panel" aria-labelledby="instruction-photo-title">
          <h2 id="instruction-photo-title">รูปประกอบจากผู้มอบหมายงาน</h2>
          <p>ใช้เป็นข้อมูลอ้างอิงประกอบคำสั่งงาน ไม่ใช่หลักฐานว่าคนงานทำงานเสร็จแล้ว</p>
          <div className="work-photo-gallery">
            {order.instructionPhotos.map((photo, index) => (
              <figure key={photo.photoId}>
                {photoUrls[photo.photoId]
                  ? <img alt={`รูปประกอบใบงาน ${index + 1}`} src={photoUrls[photo.photoId]} />
                  : <div className="photo-preview-unavailable">ยังเปิดตัวอย่างรูปไม่ได้</div>}
                <figcaption>รูปประกอบ {index + 1} · {photo.note}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {isAssignee ? <section className="workflow-panel" aria-labelledby="worker-actions-title">
        <h2 id="worker-actions-title">การปฏิบัติงาน</h2>
        <div className="form-actions">
          {order.status === 'ASSIGNED' ? <button disabled={busy} onClick={() => void act({ type: 'ACCEPT' })}>รับงาน</button> : null}
          {order.status === 'ACCEPTED' || order.status === 'REWORK' ? <button disabled={busy} onClick={() => void act({ type: 'START' })}>เริ่มงาน</button> : null}
          {order.status === 'IN_PROGRESS' && !order.isPaused ? <button disabled={busy} onClick={() => void act({ type: 'PAUSE' })}>พักงาน</button> : null}
          {order.status === 'IN_PROGRESS' && order.isPaused ? <button disabled={busy} onClick={() => void act({ type: 'RESUME' })}>ทำงานต่อ</button> : null}
          {order.status === 'IN_PROGRESS' && order.report ? <button className="primary-action" disabled={busy || order.isPaused} onClick={() => void act({ type: 'SUBMIT' })}>ส่งตรวจ</button> : null}
        </div>
        {order.target.kind === 'TREE' && ['ACCEPTED', 'IN_PROGRESS'].includes(order.status) ? <div className="qr-confirm-box">
          <strong>{targetConfirmed ? 'ยืนยันต้นเป้าหมายแล้ว' : 'ต้องยืนยันต้นเป้าหมาย'}</strong>
          <p>Mismatch จะหยุด action และไม่เปลี่ยน target อัตโนมัติ</p>
          <Link className="secondary-action" to={`/scan?expected=${expectedPositionId}&workOrder=${order.workOrderId}`}>เปิด QR/Manual confirmation</Link>
        </div> : null}
      </section> : null}

      {isAssignee && order.status === 'IN_PROGRESS' ? <section className="workflow-panel" aria-labelledby="report-title">
        <h2 id="report-title">รายงานผลและหลักฐาน</h2>
        <label>บันทึกผล<textarea onChange={(event) => setNotes(event.target.value)} value={notes} /></label>
        <div className="form-grid"><label>วัสดุ<input onChange={(event) => setMaterialName(event.target.value)} value={materialName} /></label><label>ปริมาณ<input inputMode="decimal" onChange={(event) => setQuantity(event.target.value)} value={quantity} /></label><label>หน่วย<input onChange={(event) => setUnit(event.target.value)} value={unit} /></label></div>
        <div className="photo-input-grid"><label>ภาพก่อนทำงาน<input accept="image/jpeg,image/png,image/webp,image/heic,image/heif" capture="environment" onChange={(event) => setBeforeFile(event.target.files?.[0])} type="file" /></label><label>ภาพหลังทำงาน<input accept="image/jpeg,image/png,image/webp,image/heic,image/heif" capture="environment" onChange={(event) => setAfterFile(event.target.files?.[0])} type="file" /></label></div>
        <p className="field-helper">ภาพจะถูกย่อไม่เกิน 1600px, บีบอัดเป็น WebP และลบ EXIF/GPS ก่อนอัปโหลด; หาก HEIC เปิดไม่ได้ให้ตั้ง iPhone เป็น Most Compatible/JPEG</p>
        <div className="completion-list"><h3>ผลรายต้น · Exception {completionSummary}</h3>{completions.map((item) => <div className="completion-row" key={item.positionId}><code>{item.positionId}</code><select aria-label={`ผลของ ${item.positionId}`} onChange={(event) => setCompletions((current) => current.map((candidate) => candidate.positionId === item.positionId ? { ...candidate, status: event.target.value as PerTreeCompletion['status'] } : candidate))} value={item.status}><option value="SUCCESS">สำเร็จ</option><option value="EXCEPTION">Exception</option></select>{item.status === 'EXCEPTION' ? <input aria-label={`เหตุผลของ ${item.positionId}`} onChange={(event) => setCompletions((current) => current.map((candidate) => candidate.positionId === item.positionId ? { ...candidate, exceptionReason: event.target.value } : candidate))} placeholder="เหตุผลที่ตรวจสอบได้" value={item.exceptionReason} /> : null}</div>)}</div>
        <button className="primary-action" disabled={busy || order.isPaused || !targetConfirmed} onClick={() => void saveReport()} type="button">บันทึกรายงานครบชุด</button>
      </section> : null}

      {order.report?.photos.length ? (
        <section className="workflow-panel" aria-labelledby="report-photo-title">
          <h2 id="report-photo-title">รูปหลักฐานที่คนงานส่ง</h2>
          <div className="work-photo-gallery">
            {order.report.photos.map((photo) => (
              <figure key={photo.photoId}>
                {photoUrls[photo.photoId]
                  ? <img alt={photo.phase === 'BEFORE' ? 'ภาพก่อนทำงาน' : 'ภาพหลังทำงาน'} src={photoUrls[photo.photoId]} />
                  : <div className="photo-preview-unavailable">ยังเปิดตัวอย่างรูปไม่ได้</div>}
                <figcaption>{photo.phase === 'BEFORE' ? 'ก่อนทำงาน' : 'หลังทำงาน'} · {photo.note}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {canReview && order.status === 'SUBMITTED' ? <section className="workflow-panel" aria-labelledby="review-title"><h2 id="review-title">Manager/Agronomist verification</h2><label>เหตุผลกรณี Reject/Rework<input onChange={(event) => setReason(event.target.value)} value={reason} /></label><div className="form-actions"><button className="primary-action" disabled={busy} onClick={() => void act({ type: 'VERIFY' })}>ตรวจรับ</button><button disabled={busy} onClick={() => void act({ type: 'REQUEST_REWORK', reason })}>ให้แก้</button><button disabled={busy} onClick={() => void act({ type: 'REJECT', reason })}>ปฏิเสธ</button></div></section> : null}
      {canReview && (order.status === 'VERIFIED' || order.status === 'REJECTED') ? <button className="primary-action" disabled={busy} onClick={() => void act({ type: 'CLOSE' })}>ปิดงาน</button> : null}
      {message ? <p className="scan-message" role="status">{message}</p> : null}

      <section className="audit-timeline" aria-labelledby="work-audit-title"><h2 id="work-audit-title">Audit Timeline</h2>{order.audit.length === 0 ? <p>ยังไม่มี event หลัง seed</p> : <ol>{order.audit.map((event) => <li key={event.eventId}><strong>{event.eventType}</strong><span>{event.actorDisplayName} · v{event.workVersion}</span><p>{event.reason}</p></li>)}</ol>}</section>
    </section>
  )
}
