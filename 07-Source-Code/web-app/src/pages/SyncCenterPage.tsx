import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
import type { SyncState } from '../domain/farm'
import {
  canReviewMasterConflict,
  type MasterDataConflict,
  type OfflineOperationRecord,
  type PhotoRecoveryRecord,
} from '../domain/operationalHardening'
import type { WorkPhotoBinaryBatch } from '../services/workPhotoBinaryQueue'
import { PageHeader } from './PageHeader'

const operationLabels = {
  PENDING: 'บันทึกในเครื่อง', SYNCING: 'กำลังซิงก์', SYNCED: 'ซิงก์แล้ว', CONFLICT: 'ข้อมูลขัดแย้ง',
} as const

interface LayoutContext {
  syncState: SyncState
  toggleSyncState: () => void
}

export function SyncCenterPage() {
  const { syncState, toggleSyncState } = useOutletContext<LayoutContext>()
  const {
    currentFarm,
    mode,
    listOfflineOperations,
    queueOfflineOperation,
    syncOfflineOperation,
    listMasterConflicts,
    resolveMasterConflict,
    listPhotoRecoveries,
    listQueuedWorkPhotoBatches,
    retryQueuedWorkPhotoBatch,
    cleanupOrphanPhoto,
    resetPhase6MockData,
  } = usePhase2()
  const [operations, setOperations] = useState<readonly OfflineOperationRecord[]>([])
  const [conflicts, setConflicts] = useState<readonly MasterDataConflict[]>([])
  const [photos, setPhotos] = useState<readonly PhotoRecoveryRecord[]>([])
  const [photoBatches, setPhotoBatches] = useState<readonly WorkPhotoBinaryBatch[]>([])
  const [message, setMessage] = useState<string>()
  const [error, setError] = useState<string>()

  const load = useCallback(async () => {
    const [nextOperations, nextConflicts, nextPhotos, nextPhotoBatches] = await Promise.all([
      listOfflineOperations(), listMasterConflicts(), listPhotoRecoveries(),
      listQueuedWorkPhotoBatches(),
    ])
    setOperations(nextOperations)
    setConflicts(nextConflicts)
    setPhotos(nextPhotos)
    setPhotoBatches(nextPhotoBatches)
  }, [listMasterConflicts, listOfflineOperations, listPhotoRecoveries, listQueuedWorkPhotoBatches])

  useEffect(() => {
    let active = true
    void Promise.all([
      listOfflineOperations(), listMasterConflicts(), listPhotoRecoveries(),
      listQueuedWorkPhotoBatches(),
    ])
      .then(([nextOperations, nextConflicts, nextPhotos, nextPhotoBatches]) => {
        if (active) {
          setOperations(nextOperations)
          setConflicts(nextConflicts)
          setPhotos(nextPhotos)
          setPhotoBatches(nextPhotoBatches)
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'อ่านสถานะ Offline ไม่สำเร็จ')
      })
    return () => { active = false }
  }, [
    currentFarm?.farmId,
    listMasterConflicts,
    listOfflineOperations,
    listPhotoRecoveries,
    listQueuedWorkPhotoBatches,
  ])

  if (!currentFarm) return null
  const run = (action: () => Promise<unknown>, success: string) => {
    setError(undefined); setMessage(undefined)
    void action().then(async () => { setMessage(success); await load() })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'ดำเนินการไม่สำเร็จ'))
  }

  const queueReport = () => {
    if (syncState !== 'offline') {
      setError('กรุณาเปลี่ยนเป็น “ออฟไลน์” ก่อน เพื่อจำลองการบันทึกในเครื่อง')
      return
    }
    run(() => queueOfflineOperation(`ui-offline-${crypto.randomUUID()}`, {
      kind: 'WORK_REPORT',
      label: `รายงานงานจำลอง · ${currentFarm.farmCode}`,
      targetId: 'work_demo_tree_000001',
      payloadFingerprint: 'c0ffee1234abcdef',
      requiredRoles: ['ORG_OWNER', 'FARM_MANAGER', 'WORKER'],
    }), 'บันทึกในเครื่องแล้ว — Farm scope ถูกล็อกและจะซิงก์เมื่อมีสัญญาณ')
  }

  const syncPending = () => {
    if (syncState === 'offline') {
      setError('ยังออฟไลน์อยู่ — เปลี่ยนเป็น “ซิงก์แล้ว” ก่อน Retry')
      return
    }
    const pending = operations.filter((item) => item.status === 'PENDING')
    run(async () => {
      for (const operation of pending) await syncOfflineOperation(operation.operationId)
    }, pending.length > 0 ? 'Retry สำเร็จโดยไม่สร้างเหตุการณ์ซ้ำ' : 'ไม่มีรายการ Pending ที่ต้อง Retry')
  }

  const openConflict = conflicts.find((conflict) => conflict.status === 'OPEN')
  const queuedPhotoBatch = photoBatches[0]
  const unresolvedWithoutBinary = photos.some((photo) =>
    ['FAILED', 'PENDING', 'ORPHANED'].includes(photo.status) &&
    !photoBatches.some((batch) => batch.candidates.some((candidate) => candidate.photoId === photo.photoId)),
  )
  const orphanPhoto = photos.find((photo) => photo.status === 'ORPHANED')

  return <section className="page-stack sync-center">
    <PageHeader eyebrow="Phase 6 · Offline hardening" title="ศูนย์ซิงก์ รูป และข้อมูลขัดแย้ง" description="รายการค้างส่งไม่ย้ายสวน, Retry ใช้ idempotency key เดิม และ Conflict ต้องมีผู้ตัดสิน" />
    <div className="sync-mode-card" role="status">
      <div><strong>{syncState === 'offline' ? 'ออฟไลน์' : 'ซิงก์แล้ว'}</strong><span>{syncState === 'offline' ? 'บันทึกลง Queue เท่านั้น' : 'พร้อม Retry รายการ Pending'}</span></div>
      <button className="secondary-action" type="button" onClick={toggleSyncState}>{syncState === 'offline' ? 'จำลองกลับออนไลน์' : 'จำลองสัญญาณขาด'}</button>
    </div>
    {error ? <div className="form-error" role="alert">{error}</div> : null}
    {message ? <div className="success-notice" role="status">{message}</div> : null}

    <section className="operational-panel"><div className="section-heading"><div><span className="status-pill">Queue</span><h2>Pending → Syncing → Synced/Conflict</h2></div></div>
      <div className="dialog-actions"><button className="primary-action" type="button" onClick={queueReport}>บันทึกรายงาน Offline จำลอง</button><button className="secondary-action" type="button" onClick={syncPending}>Retry Pending ทั้งหมด</button></div>
      <div className="queue-list">{operations.map((operation) => <article key={operation.operationId}>
        <span className={`sync-state sync-state--${operation.status.toLowerCase()}`}>{operationLabels[operation.status]}</span>
        <h3>{operation.label}</h3><p>{operation.kind} · target {operation.targetId}</p>
        <small>{currentFarm.farmCode} · attempt {operation.attemptCount} · {operation.idempotencyKey}</small>
        {operation.conflictReason ? <p className="form-error">{operation.conflictReason}</p> : null}
      </article>)}</div>
    </section>

    <section className="operational-panel"><div className="section-heading"><div><span className="status-pill">Master conflict</span><h2>ไม่กลบค่าที่ต่างกันแบบเงียบ ๆ</h2></div></div>
      {openConflict ? <article className="conflict-review-card">
        <h3>{openConflict.entityType} · {openConflict.fieldName}</h3>
        <div className="conflict-values"><p><small>Server</small><strong>{openConflict.serverValue}</strong></p><p><small>Device</small><strong>{openConflict.deviceValue}</strong></p></div>
        {canReviewMasterConflict(currentFarm) ? <div className="dialog-actions">
          <button className="primary-action" type="button" onClick={() => run(() => resolveMasterConflict(openConflict.conflictId, `resolve-ui-${crypto.randomUUID()}`, 'KEEP_SERVER', 'คงค่า Server เพราะมี Audit ล่าสุด'), 'บันทึก Correction และ Audit แล้ว')}>คงค่า Server</button>
          <button className="secondary-action" type="button" onClick={() => run(() => resolveMasterConflict(openConflict.conflictId, `escalate-ui-${crypto.randomUUID()}`, 'ESCALATE', 'ส่งให้ Owner ตรวจหลักฐานเพิ่มเติม'), 'ส่งต่อ Owner พร้อม Audit แล้ว')}>ส่งต่อ Owner</button>
        </div> : <p>บทบาทนี้อ่านได้ แต่ต้องให้ Owner/Manager ตัดสิน</p>}
      </article> : <p>ไม่มี Conflict ที่รอตัดสินในสวนนี้</p>}
    </section>

    <section className="operational-panel"><div className="section-heading"><div><span className="status-pill">Photo recovery</span><h2>กู้คืน Partial upload และจัดการ Orphan</h2></div></div>
      <p>Durable binary queue ใช้ IndexedDB เพื่อเก็บไฟล์ตามผู้ใช้และ Farm ได้นานสุด 7 วัน และ Retry ด้วย idempotency key เดิมหลังปิดหรือ reload แอป</p>
      <div className="photo-recovery-list">{photoBatches.map((batch) => <article key={batch.batchId}><strong>{batch.kind === 'INSTRUCTION' ? 'รูปประกอบใบงาน' : 'รูปส่งงาน BEFORE/AFTER'}</strong><span>{batch.candidates.length} รูป · uploaded checkpoint {batch.candidates.filter((candidate) => candidate.uploadedEvidence).length}</span><small>Work {batch.workOrderId} · หมดอายุ {new Date(batch.expiresAtIso).toLocaleString('th-TH')}</small></article>)}</div>
      <div className="photo-recovery-list">{photos.map((photo) => <article key={photo.recoveryId}><strong>{photo.photoId}</strong><span>{photo.phase} · {photo.status} · retry {photo.retryCount}</span><small>Work {photo.workOrderId} · {photo.lastError ?? 'ไม่มีข้อผิดพลาดค้าง'}</small></article>)}</div>
      {unresolvedWithoutBinary ? <p className="form-warning">มี recovery metadata ที่ไม่มี binary queue บนอุปกรณ์นี้ จึงห้ามเปลี่ยนเป็น UPLOADED จาก metadata อย่างเดียว ต้องใช้ไฟล์ต้นฉบับใหม่หรือให้ Owner ตรวจ Orphan</p> : null}
      <div className="dialog-actions">
        <button className="secondary-action" disabled={!queuedPhotoBatch || syncState === 'offline'} type="button" onClick={() => queuedPhotoBatch && run(() => retryQueuedWorkPhotoBatch(queuedPhotoBatch.batchId), 'Retry binary, ผูกรูปกับ Work และปิด recovery สำเร็จแล้ว')}>Retry ชุดรูปจากเครื่อง</button>
        <button className="secondary-action" disabled={!orphanPhoto || !canReviewMasterConflict(currentFarm)} type="button" onClick={() => orphanPhoto && run(() => cleanupOrphanPhoto(orphanPhoto.recoveryId, `cleanup-ui-${crypto.randomUUID()}`, 'ยืนยันว่าไม่มี Report อ้างถึงไฟล์จำลองนี้'), 'บันทึก cleanup จำลองแล้ว — ยังไม่ใช่การลบ Storage จริง')}>บันทึก cleanup จำลอง</button>
      </div>
      <small>การลบ Storage จริงต้องใช้ server lifecycle worker หลัง PA-1/PA-2 และ dual approval เท่านั้น</small>
    </section>

    {mode === 'mock' ? <section className="phase2-test-controls"><span className="status-pill">Resettable fixture</span><h2>รีเซ็ต Phase 6 Mock Data Pack</h2><p>คืน Queue/Conflict/Photo/Audit ไปยังค่าจำลองคงที่ ไม่แตะข้อมูลจริง</p><button className="secondary-action" type="button" onClick={() => run(resetPhase6MockData, 'Reset Phase 6 Pack v1.0.0 แล้ว')}>Reset Pack</button></section> : null}
  </section>
}
