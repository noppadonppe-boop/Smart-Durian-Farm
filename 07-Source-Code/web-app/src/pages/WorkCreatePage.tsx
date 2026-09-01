import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
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
  const navigate = useNavigate()
  const [trees, setTrees] = useState<readonly TreePositionSummary[]>([])
  const [title, setTitle] = useState('ตรวจดูแลต้นจำลอง')
  const [description, setDescription] = useState('SIMULATED/TEST ONLY — งาน Phase 4 จำลอง')
  const [category, setCategory] = useState<WorkCategory>('CARE')
  const [careType, setCareType] = useState<CareEventType>('INSPECTION')
  const [targetKind, setTargetKind] = useState<WorkTargetKind>('TREE')
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([])
  const [assignedUserId, setAssignedUserId] = useState('user_demo_worker_02')
  const [priority, setPriority] = useState<'NORMAL' | 'URGENT'>('NORMAL')
  const [instructionFiles, setInstructionFiles] = useState<readonly File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    void listTreePositions().then((items) => {
      const active = items.filter((item) => item.positionStatus === 'ACTIVE')
      setTrees(active)
      setSelectedIds(active[0] ? [active[0].positionId] : [])
    })
  }, [currentFarm?.farmId, listTreePositions])

  const selectedTrees = useMemo(
    () => trees.filter((tree) => selectedIds.includes(tree.positionId)),
    [selectedIds, trees],
  )

  const toggleTree = (positionId: string) => {
    setSelectedIds((current) => {
      if (targetKind === 'TREE') return [positionId]
      return current.includes(positionId)
        ? current.filter((id) => id !== positionId)
        : [...current, positionId]
    })
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(undefined)
    setSubmitting(true)
    let createdWorkOrderId: string | undefined
    try {
      const baseTree = selectedTrees[0]
      if (!baseTree) throw new Error('ต้องเลือกต้นเป้าหมาย')
      const positionIds = targetKind === 'TREE' ? [baseTree.positionId] : selectedIds
      const created = await createWorkOrder(crypto.randomUUID(), {
        title,
        description,
        category,
        careType: category === 'CARE' ? careType : null,
        priority,
        target: {
          kind: targetKind,
          zoneCode: baseTree.zoneCode,
          rowCode: targetKind === 'ZONE' || targetKind === 'TREE_SET' ? null : baseTree.rowCode,
          positionIds,
        },
        dueDate: '2026-09-05',
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
        title="สร้าง Work Order จำลอง"
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
            <select value={targetKind} onChange={(event) => {
              const next = event.target.value as WorkTargetKind
              setTargetKind(next)
              if (next === 'TREE' && selectedIds[0]) setSelectedIds([selectedIds[0]])
            }}>
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
          <label>Assigned user ID
            <input value={assignedUserId} onChange={(event) => setAssignedUserId(event.target.value)} />
          </label>
        </div>

        <fieldset className="target-picker">
          <legend>เลือก Position จากสวน {currentFarm?.farmCode}</legend>
          {trees.map((tree) => (
            <label key={tree.positionId}>
              <input
                checked={selectedIds.includes(tree.positionId)}
                onChange={() => toggleTree(tree.positionId)}
                type={targetKind === 'TREE' ? 'radio' : 'checkbox'}
              />
              <code>{tree.tagCode}</code> · {tree.positionId}
            </label>
          ))}
        </fieldset>
        {category === 'CARE' && careType === 'CHEMICAL' ? (
          <p className="form-warning">สารเคมีจะคงสถานะ Pending Specialist และไม่มีคำแนะนำอัตโนมัติ</p>
        ) : null}
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <div className="form-actions">
          <button className="primary-action" disabled={submitting} type="submit">
            {submitting ? 'กำลังสร้าง…' : 'สร้างและมอบหมายงานจำลอง'}
          </button>
        </div>
      </form>
    </section>
  )
}
