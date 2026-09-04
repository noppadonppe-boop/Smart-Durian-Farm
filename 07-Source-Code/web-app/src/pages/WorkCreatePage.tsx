import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
import { OrchardTargetSelector } from '../components/OrchardTargetSelector'
import {
  navigationIntentFromState,
  positionIdsForAnchor,
  selectionFromNavigationState,
  selectionZoneCodes,
  type OrchardSelectionMode,
} from '../domain/orchardLayout'
import {
  careTypeLabels,
  type CareEventType,
  type WorkCategory,
  type WorkTargetKind,
} from '../domain/workCareDisease'
import type { TreePositionSummary } from '../domain/treeRegister'
import { uploadAndCommitWorkPhotoBatch } from '../services/workPhotoRecovery'
import { PageHeader } from './PageHeader'

export function WorkCreatePage() {
  const {
    mode,
    currentFarm,
    listTreePositions,
    createWorkOrder,
    performWorkAction,
    uploadWorkPhoto,
    saveWorkInstructionPhotos,
    registerPhotoRecovery,
    queueWorkPhotoBinaryBatch,
    checkpointQueuedWorkPhoto,
    removeQueuedWorkPhotoBatch,
  } = usePhase2()
  const isProduction = mode === 'firebase-live' && !currentFarm?.isMock
  const navigate = useNavigate()
  const location = useLocation()
  const [trees, setTrees] = useState<readonly TreePositionSummary[]>([])
  const [title, setTitle] = useState(isProduction ? 'ตรวจดูแลต้น' : 'ตรวจดูแลต้นจำลอง')
  const [description, setDescription] = useState(isProduction ? 'บันทึกงานดูแลตามแผน' : 'SIMULATED/TEST ONLY — งาน Phase 4 จำลอง')
  const [category, setCategory] = useState<WorkCategory>('CARE')
  const [careType, setCareType] = useState<CareEventType>('INSPECTION')
  const [targetKind, setTargetKind] = useState<WorkTargetKind>('TREE')
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([])
  const [assignedUserId, setAssignedUserId] = useState(isProduction ? '' : 'user_demo_worker_02')
  const [dueDate, setDueDate] = useState(isProduction ? new Date().toISOString().slice(0, 10) : '2026-09-05')
  const [priority, setPriority] = useState<'NORMAL' | 'URGENT'>('NORMAL')
  const [instructionFiles, setInstructionFiles] = useState<readonly File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    void listTreePositions().then((items) => {
      const active = items.filter((item) => item.positionStatus === 'ACTIVE')
      setTrees(active)
      const requested = currentFarm
        ? selectionFromNavigationState(location.state, currentFarm.farmId)
        : []
      const intent = currentFarm
        ? navigationIntentFromState(location.state, currentFarm.farmId)
        : undefined
      const validRequested = requested.filter((positionId) => (
        active.some((position) => position.positionId === positionId)
      ))
      setSelectedIds(validRequested.length > 0 ? validRequested : active[0] ? [active[0].positionId] : [])
      setTargetKind(validRequested.length > 1 ? 'TREE_SET' : 'TREE')
      if (intent === 'WORK_GENERAL') {
        setCategory('GENERAL')
        setTitle('งานทั่วไปจากตำแหน่งที่เลือก')
      } else if (intent === 'WORK_CARE') {
        setCategory('CARE')
        setCareType('INSPECTION')
        setTitle('ตรวจดูแลต้นจากตำแหน่งที่เลือก')
      }
    })
  }, [currentFarm, listTreePositions, location.state])

  const selectedTrees = useMemo(
    () => trees.filter((tree) => selectedIds.includes(tree.positionId)),
    [selectedIds, trees],
  )

  const disabledTargetReason = (tree: TreePositionSummary): string | undefined => {
    if (tree.currentCycle.treeStatus !== 'empty') return undefined
    if (category === 'GENERAL' || (category === 'CARE' && careType === 'INSPECTION')) return undefined
    return 'ตำแหน่งไม่มีต้น ใช้ได้เฉพาะงานทั่วไปหรืองานตรวจตำแหน่ง'
  }

  const selectionMode: OrchardSelectionMode = targetKind === 'TREE'
    ? 'SINGLE'
    : targetKind === 'ROW'
      ? 'ROW'
      : targetKind === 'ZONE'
        ? 'ZONE'
        : 'MULTIPLE'

  const changeTargetKind = (next: WorkTargetKind) => {
    setTargetKind(next)
    const anchor = selectedTrees.find((tree) => !disabledTargetReason(tree))
      ?? trees.find((tree) => !disabledTargetReason(tree))
    if (!anchor) {
      setSelectedIds([])
      return
    }
    const mode: OrchardSelectionMode = next === 'TREE'
      ? 'SINGLE'
      : next === 'ROW'
        ? 'ROW'
        : next === 'ZONE'
          ? 'ZONE'
          : 'MULTIPLE'
    if (mode === 'MULTIPLE') {
      setSelectedIds((current) => current.filter((positionId) => (
        trees.some((tree) => tree.positionId === positionId && !disabledTargetReason(tree))
      )))
      return
    }
    setSelectedIds(positionIdsForAnchor(trees, anchor.positionId, mode, (tree) => !disabledTargetReason(tree)))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(undefined)
    setSubmitting(true)
    let createdWorkOrderId: string | undefined
    try {
      const baseTree = selectedTrees[0]
      if (!baseTree) throw new Error('ต้องเลือกต้นเป้าหมาย')
      if (selectedTrees.some((tree) => disabledTargetReason(tree))) {
        throw new Error('มีตำแหน่งที่ไม่รองรับงานประเภทนี้ กรุณาเลือกเป้าหมายใหม่')
      }
      if (isProduction && !assignedUserId.trim()) {
        throw new Error('ต้องระบุผู้ปฏิบัติงานก่อนมอบหมาย')
      }
      const positionIds = targetKind === 'TREE' ? [baseTree.positionId] : selectedIds
      const zoneCodes = selectionZoneCodes(trees, positionIds)
      const created = await createWorkOrder(crypto.randomUUID(), {
        title,
        description,
        category,
        careType: category === 'CARE' ? careType : null,
        priority,
        target: {
          kind: targetKind,
          zoneCode: baseTree.zoneCode,
          zoneCodes,
          rowCode: targetKind === 'ZONE' || targetKind === 'TREE_SET' ? null : baseTree.rowCode,
          positionIds,
        },
        dueDate,
        assignedUserId: null,
      })
      createdWorkOrderId = created.workOrderId
      if (instructionFiles.length > 0) {
        if (!currentFarm) throw new Error('ไม่พบสวนปัจจุบัน')
        const candidates = instructionFiles.map((file) => ({
          photoId: `photo_instruction_${crypto.randomUUID().replaceAll('-', '')}`,
          phase: 'INSTRUCTION' as const,
          file,
        }))
        const batch = await queueWorkPhotoBinaryBatch({
          workOrderId: created.workOrderId,
          kind: 'INSTRUCTION',
          commitIdempotencyKey: crypto.randomUUID(),
          candidates,
        })
        await uploadAndCommitWorkPhotoBatch({
          mode,
          farm: currentFarm,
          workOrderId: created.workOrderId,
          candidates: batch.candidates,
          upload: (candidate) => uploadWorkPhoto(
            created.workOrderId, candidate.photoId, candidate.phase, candidate.file,
          ),
          commit: (photos) => saveWorkInstructionPhotos(
            created.workOrderId, batch.commitIdempotencyKey, photos,
          ),
          register: registerPhotoRecovery,
          onPhotoUploaded: (_candidate, evidence) =>
            checkpointQueuedWorkPhoto(batch.batchId, evidence),
          onCommitted: () => removeQueuedWorkPhotoBatch(batch.batchId),
        })
      }
      const assigned = await performWorkAction(created.workOrderId, crypto.randomUUID(), {
        type: 'ASSIGN', assignedUserId,
      })
      void navigate(`/work/${assigned.workOrderId}`)
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : 'สร้างงานไม่สำเร็จ'
      setError(createdWorkOrderId
        ? `สร้างใบงานร่าง ${createdWorkOrderId} แล้ว แต่แนบรูปหรือมอบหมายไม่สำเร็จ: ${detail} · หากมีคิวรูป ให้เปิดศูนย์ซิงก์เพื่อ Retry`
        : detail)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Phase 4 · Create Work"
        title={isProduction ? 'สร้าง Work Order' : 'สร้าง Work Order จำลอง'}
        description="Target ถูก snapshot ด้วย opaque Position IDs และผูกกับสวนปัจจุบัน"
      />
      <form className="work-form" onSubmit={(event) => void submit(event)}>
        <label>ชื่องาน<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label>รายละเอียด<textarea value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <label>รูปประกอบใบงาน (ไม่บังคับ สูงสุด 3 รูป)
          <input
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            capture="environment"
            multiple
            onChange={(event) => {
              const files = Array.from(event.target.files ?? [])
              if (files.length > 3) {
                setInstructionFiles(files.slice(0, 3))
                setError('เลือกได้สูงสุด 3 รูป ระบบเก็บเฉพาะ 3 รูปแรก')
                return
              }
              setInstructionFiles(files)
              setError(undefined)
            }}
            type="file"
          />
          <small>ระบบจะย่อภาพไม่เกิน 1600px, บีบอัดเป็น WebP และลบ EXIF/GPS ก่อนอัปโหลด; หาก HEIC เปิดไม่ได้ให้ใช้ Most Compatible/JPEG</small>
        </label>
        {instructionFiles.length > 0 ? (
          <p className="field-helper">เลือกแล้ว {instructionFiles.length} รูป: {instructionFiles.map((file) => file.name).join(', ')}</p>
        ) : null}
        <div className="form-grid">
          <label>Category
            <select value={category} onChange={(event) => setCategory(event.target.value as WorkCategory)}>
              <option value="GENERAL">งานทั่วไป</option>
              <option value="CARE">งานดูแลต้น</option>
              <option value="DISEASE_FOLLOW_UP">ติดตามโรค</option>
            </select>
          </label>
          {category === 'CARE' ? (
            <label>Care type
              <select value={careType} onChange={(event) => setCareType(event.target.value as CareEventType)}>
                {Object.entries(careTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          ) : null}
          <label>Target
            <select value={targetKind} onChange={(event) => changeTargetKind(event.target.value as WorkTargetKind)}>
              <option value="TREE">ต้นเดียว</option>
              <option value="TREE_SET">ชุดต้น</option>
              <option value="ROW">แถว</option>
              <option value="ZONE">โซน</option>
            </select>
          </label>
          <label>Priority
            <select value={priority} onChange={(event) => setPriority(event.target.value as 'NORMAL' | 'URGENT')}>
              <option value="NORMAL">ปกติ</option><option value="URGENT">เร่งด่วน</option>
            </select>
          </label>
          <label>กำหนดส่ง
            <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required />
          </label>
          <label>Assigned user ID
            <input required={isProduction} value={assignedUserId} onChange={(event) => setAssignedUserId(event.target.value)} />
          </label>
        </div>

        {currentFarm ? <OrchardTargetSelector
          defaultView={selectionMode === 'SINGLE' ? 'PLAN' : 'CHECKLIST'}
          disabledReason={disabledTargetReason}
          farm={currentFarm}
          key={`${currentFarm.farmId}:${selectionMode}`}
          onChange={setSelectedIds}
          positions={trees}
          selectedPositionIds={selectedIds}
          selectionMode={selectionMode}
          title="เลือกเป้าหมายของใบงาน"
        /> : null}
        {category === 'CARE' && careType === 'CHEMICAL' ? (
          <p className="form-warning">สารเคมีจะคงสถานะ Pending Specialist และไม่มีคำแนะนำอัตโนมัติ</p>
        ) : null}
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <div className="form-actions">
          <button className="primary-action" disabled={submitting} type="submit">
            {submitting ? 'กำลังสร้าง…' : isProduction ? 'สร้างและมอบหมายงาน' : 'สร้างและมอบหมายงานจำลอง'}
          </button>
        </div>
      </form>
    </section>
  )
}
