import { useMemo, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
import {
  canManageTreeRegister,
  previewTreeRegisterCsv,
  treeRegisterCsvHeaders,
  type TreeImportPreview,
  type TreeImportResult,
} from '../domain/treeRegister'
import { PageHeader } from './PageHeader'

export function TreeImportPage() {
  const { currentFarm, importTreePositions } = usePhase2()
  const [csv, setCsv] = useState('')
  const [fileName, setFileName] = useState('')
  const [preview, setPreview] = useState<TreeImportPreview>()
  const [result, setResult] = useState<TreeImportResult>()
  const [error, setError] = useState<string>()
  const [saving, setSaving] = useState(false)

  const canCommit = useMemo(
    () => Boolean(
      preview?.headerValid &&
      preview.candidates.length > 0 &&
      preview.rejects.length === 0,
    ),
    [preview],
  )

  if (!currentFarm) return null
  if (!canManageTreeRegister(currentFarm)) {
    return <section className="page-stack"><PageHeader eyebrow="Read only" title="ไม่มีสิทธิ์นำเข้า CSV" description="เฉพาะเจ้าขององค์กรหรือผู้จัดการสวนเท่านั้น" /><Link to="/trees">กลับทะเบียนต้น</Link></section>
  }

  const loadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.item(0)
    if (!file) return
    setError(undefined)
    setResult(undefined)
    setPreview(undefined)
    try {
      const content = await file.text()
      setCsv(content)
      setFileName(file.name)
    } catch {
      setError('อ่านไฟล์ CSV ไม่สำเร็จ ไฟล์เดิมในเครื่องไม่ได้ถูกแก้ไข')
    }
  }

  const runPreview = () => {
    setError(undefined)
    setResult(undefined)
    const next = previewTreeRegisterCsv(
      csv,
      currentFarm.organizationCode,
      currentFarm.farmSequence,
    )
    setPreview(next)
  }

  const commit = async () => {
    if (!preview || !canCommit) return
    setSaving(true)
    setError(undefined)
    try {
      setResult(await importTreePositions(preview.idempotencyKey, preview.candidates))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Import ไม่สำเร็จและไม่มีข้อมูลบางส่วนถูกสร้าง')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Phase 3 · Atomic CSV Import"
        title="ตรวจและนำเข้าทะเบียนต้น"
        description={`รับเฉพาะ FIELD_DATA ของ ${currentFarm.farmCode}; EXAMPLE template จะถูกปฏิเสธ`}
      />

      <div className="import-safety" role="note">
        <strong>Preview ก่อนเขียนทุกครั้ง</strong>
        <span>ถ้ามีแม้แต่หนึ่งแถวผิดหรือ Tag เคยถูกใช้ ระบบยกเลิกทั้งชุดและไม่สร้าง partial records</span>
      </div>

      <section className="import-source" aria-labelledby="import-source-title">
        <h2 id="import-source-title">1. เลือกไฟล์หรือวาง CSV</h2>
        <label className="file-input">ไฟล์ CSV<input accept=".csv,text/csv" onChange={(event) => void loadFile(event)} type="file" /></label>
        {fileName ? <small>ไฟล์ที่เลือก: {fileName}</small> : null}
        <label>
          เนื้อหา CSV ({treeRegisterCsvHeaders.length} columns)
          <textarea onChange={(event) => { setCsv(event.target.value); setPreview(undefined); setResult(undefined) }} placeholder="วาง header และแถว FIELD_DATA ที่นี่" rows={10} value={csv} />
        </label>
        <button className="primary-action" disabled={!csv.trim()} onClick={runPreview} type="button">ตรวจ Preview และ Duplicate</button>
      </section>

      {preview ? (
        <section className="import-preview" aria-labelledby="import-preview-title">
          <h2 id="import-preview-title">2. ผลตรวจ Preview</h2>
          <div className="import-metrics">
            <div><strong>{preview.totalRows}</strong><span>แถวทั้งหมด</span></div>
            <div><strong>{preview.candidates.length}</strong><span>ผ่าน</span></div>
            <div><strong>{preview.rejects.length}</strong><span>ปฏิเสธ</span></div>
          </div>
          <code className="idempotency-key">Retry key: {preview.idempotencyKey}</code>
          {preview.rejects.length > 0 ? (
            <div className="reject-report" role="alert">
              <h3>Reject report — ยังไม่เขียนข้อมูล</h3>
              {preview.rejects.map((reject) => (
                <article key={`${reject.sourceRow}-${reject.tagCode}`}>
                  <strong>แถว {reject.sourceRow}{reject.tagCode ? ` · ${reject.tagCode}` : ''}</strong>
                  <ul>{reject.errors.map((item) => <li key={item}>{item}</li>)}</ul>
                </article>
              ))}
            </div>
          ) : (
            <div className="success-notice" role="status">ทุกแถวผ่านการตรวจฝั่งผู้ใช้ พร้อมให้ Rules ตรวจซ้ำก่อนเขียนแบบ atomic</div>
          )}
          <button className="primary-action" disabled={!canCommit || saving} onClick={() => void commit()} type="button">{saving ? 'กำลังนำเข้า…' : `ยืนยันนำเข้า ${preview.candidates.length} ตำแหน่ง`}</button>
        </section>
      ) : null}

      {error ? <div className="form-error" role="alert">{error}</div> : null}
      {result ? (
        <div className="success-notice" role="status">
          <strong>{result.wasRetry ? 'ตรวจพบการ Retry เดิม — ไม่สร้างข้อมูลซ้ำ' : `นำเข้าสำเร็จ ${result.importedCount} ตำแหน่ง`}</strong>
          <span>Idempotency key: {result.idempotencyKey}</span>
          <Link to="/trees">เปิดทะเบียนต้น</Link>
        </div>
      ) : null}
    </section>
  )
}
