import { useMemo, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
import {
  canManageTreeRegister,
  previewTreeRegisterCsv,
  splitTreeImportCandidates,
  treeImportBatchIdempotencyKey,
  treeRegisterImportBatchSize,
  type TreeImportPreview,
  type TreeImportResult,
} from '../domain/treeRegister'
import {
  downloadTreeRegisterTemplate,
  readTreeRegisterSpreadsheet,
} from '../services/treeRegisterSpreadsheet'
import { PageHeader } from './PageHeader'

export function TreeImportPage() {
  const { currentFarm, importTreePositions } = usePhase2()
  const [csv, setCsv] = useState('')
  const [fileName, setFileName] = useState('')
  const [fileDetail, setFileDetail] = useState('')
  const [preview, setPreview] = useState<TreeImportPreview>()
  const [result, setResult] = useState<TreeImportResult>()
  const [error, setError] = useState<string>()
  const [saving, setSaving] = useState(false)
  const [reading, setReading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{
    completedBatches: number
    totalBatches: number
    completedPositions: number
  }>()

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
    return <section className="page-stack"><PageHeader eyebrow="อ่านอย่างเดียว" title="ไม่มีสิทธิ์นำเข้าทะเบียนตำแหน่ง" description="เฉพาะเจ้าขององค์กรหรือผู้จัดการสวนเท่านั้น" /><Link to="/trees">กลับทะเบียนต้น</Link></section>
  }

  const loadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.item(0)
    if (!file) return
    setError(undefined)
    setResult(undefined)
    setPreview(undefined)
    setUploadProgress(undefined)
    setReading(true)
    try {
      const content = await readTreeRegisterSpreadsheet(file)
      setCsv(content.csvText)
      setFileName(file.name)
      setFileDetail(content.format === 'XLSX' ? `Excel · ชีต ${content.sheetName}` : 'CSV')
    } catch (cause) {
      setFileName('')
      setFileDetail('')
      setError(cause instanceof Error ? cause.message : 'อ่านไฟล์ไม่สำเร็จ ไฟล์เดิมในเครื่องไม่ได้ถูกแก้ไข')
    } finally {
      setReading(false)
    }
  }

  const runPreview = () => {
    setError(undefined)
    setResult(undefined)
    setUploadProgress(undefined)
    const next = previewTreeRegisterCsv(
      csv,
      currentFarm.organizationCode,
      currentFarm.farmSequence,
    )
    setPreview(next)
  }

  const downloadTemplate = () => {
    setError(undefined)
    try {
      downloadTreeRegisterTemplate(currentFarm)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'สร้างแม่แบบ Excel ไม่สำเร็จ')
    }
  }

  const commit = async () => {
    if (!preview || !canCommit) return
    setSaving(true)
    setError(undefined)
    setResult(undefined)
    const batches = splitTreeImportCandidates(preview.candidates)
    let completedBatches = 0
    let importedCount = 0
    let existingCount = 0
    let wasRetry = true
    const positionIds: string[] = []
    setUploadProgress({ completedBatches, totalBatches: batches.length, completedPositions: 0 })
    try {
      for (const [batchIndex, candidates] of batches.entries()) {
        const batchResult = await importTreePositions(
          treeImportBatchIdempotencyKey(preview.idempotencyKey, batchIndex),
          candidates,
        )
        importedCount += batchResult.importedCount
        existingCount += batchResult.existingCount
        wasRetry = wasRetry && batchResult.wasRetry
        positionIds.push(...batchResult.positionIds)
        completedBatches += 1
        setUploadProgress({
          completedBatches,
          totalBatches: batches.length,
          completedPositions: importedCount + existingCount,
        })
      }
      setResult({
        idempotencyKey: preview.idempotencyKey,
        importedCount,
        existingCount,
        positionIds,
        wasRetry,
      })
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : 'นำเข้าชุดปัจจุบันไม่สำเร็จ'
      setError(completedBatches > 0
        ? `หยุดหลังอัปโหลดสำเร็จ ${completedBatches} จาก ${batches.length} ชุด (${importedCount + existingCount} ตำแหน่ง): ${detail} กรุณาใช้ไฟล์เดิมกดยืนยันอีกครั้ง ระบบจะข้ามชุดที่สำเร็จแล้วโดยไม่สร้างข้อมูลซ้ำ`
        : detail)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="นำเข้าสเปรดชีตแบบครบชุด"
        title="ตรวจและนำเข้าทะเบียนต้น"
        description={`รับ Excel (.xlsx) หรือ CSV จาก Excel/Google Sheets เฉพาะข้อมูลภาคสนามของ ${currentFarm.farmCode}`}
      />

      <div className="operational-data-banner" role="note"><strong>นำเข้าข้อมูลภาคสนาม</strong><span>ไฟล์ที่ยืนยันจะเขียนลง Firebase ของ {currentFarm.farmCode} โปรดตรวจข้อมูลตัวอย่างและสำรองไฟล์ต้นฉบับไว้</span></div>

      <section className="template-panel" aria-labelledby="template-title">
        <div>
          <h2 id="template-title">เริ่มจากแม่แบบภาษาไทยของสวนปัจจุบัน</h2>
          <p>เปิดได้ทั้ง Microsoft Excel และ Google Sheets โดยไม่มีการเชื่อม Google API</p>
        </div>
        <button
          className="secondary-action"
          onClick={downloadTemplate}
          type="button"
        >
          ดาวน์โหลดแม่แบบ Excel ภาษาไทย
        </button>
        <ol>
          <li>กรอกชีต “ทะเบียนตำแหน่ง” โดยคงชื่อภาษาไทยและลำดับ 7 คอลัมน์ เริ่มจากรหัสโซน</li>
          <li>โซน/แถว/ต้นรับค่าแบบมีหรือไม่มีตัวอักษรนำหน้า เช่น Z01, Z1, 01, 1 แล้วระบบบันทึกเป็น Z01-R01-T01</li>
          <li>หากลงทะเบียนเฉพาะตำแหน่ง ให้กรอกเพียง 3 คอลัมน์แรกได้; รหัสป้ายจะสร้างอัตโนมัติและรอบปลูกเริ่มที่ 1</li>
          <li>ข้อมูลจะลงสวนปัจจุบันอัตโนมัติ จึงไม่ต้องกรอกประเภทข้อมูล รหัสองค์กร หรือลำดับสวน</li>
          <li>ถ้าใช้ Google Sheets ให้ดาวน์โหลดกลับเป็น Microsoft Excel (.xlsx) หรือ CSV</li>
          <li>อัปโหลดด้านล่างเพื่อตรวจตัวอย่างก่อนยืนยันทุกครั้ง; ไฟล์ภาษาอังกฤษรุ่นเดิมยังรองรับ</li>
        </ol>
      </section>

      <div className="import-safety" role="note">
        <strong>ตรวจตัวอย่างก่อนเขียนทุกครั้ง</strong>
        <span>นำเข้าได้ไม่จำกัดจำนวนแถว โดยระบบตรวจทั้งไฟล์ก่อนและอัปโหลดครั้งละ {treeRegisterImportBatchSize} ตำแหน่ง แต่ละชุดป้องกันข้อมูลซ้ำและเริ่มต่อได้ด้วยไฟล์เดิมหากการเชื่อมต่อหยุดกลางทาง</span>
      </div>

      <section className="import-source" aria-labelledby="import-source-title">
        <h2 id="import-source-title">1. เลือกไฟล์ Excel / CSV หรือวาง CSV</h2>
        <label className="file-input">
          ไฟล์ Excel (.xlsx) หรือ CSV (.csv)
          <input
            accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            disabled={reading}
            onChange={(event) => void loadFile(event)}
            type="file"
          />
        </label>
        {reading ? <small role="status">กำลังอ่านไฟล์…</small> : null}
        {fileName ? <small>ไฟล์ที่เลือก: {fileName} · {fileDetail}</small> : null}
        <label>
          ข้อมูลที่อ่านได้ (หัวคอลัมน์ตามแม่แบบ)
          <textarea onChange={(event) => { setCsv(event.target.value); setFileName(''); setFileDetail('วาง CSV'); setPreview(undefined); setResult(undefined); setUploadProgress(undefined) }} placeholder="วางหัวคอลัมน์ CSV และแถวข้อมูลภาคสนามที่นี่" rows={10} value={csv} />
        </label>
        <button className="primary-action" disabled={!csv.trim()} onClick={runPreview} type="button">ตรวจตัวอย่างและข้อมูลซ้ำ</button>
      </section>

      {preview ? (
        <section className="import-preview" aria-labelledby="import-preview-title">
          <h2 id="import-preview-title">2. ผลตรวจตัวอย่าง</h2>
          <div className="import-metrics">
            <div><strong>{preview.totalRows}</strong><span>แถวทั้งหมด</span></div>
            <div><strong>{preview.candidates.length}</strong><span>ผ่าน</span></div>
            <div><strong>{preview.rejects.length}</strong><span>ปฏิเสธ</span></div>
          </div>
          <code className="idempotency-key">รหัสป้องกันข้อมูลซ้ำ: {preview.idempotencyKey}</code>
          {preview.rejects.length > 0 ? (
            <div className="reject-report" role="alert">
              <h3>รายงานแถวที่ไม่ผ่าน — ยังไม่เขียนข้อมูล</h3>
              {preview.rejects.map((reject) => (
                <article key={`${reject.sourceRow}-${reject.tagCode}`}>
                  <strong>แถว {reject.sourceRow}{reject.tagCode ? ` · ${reject.tagCode}` : ''}</strong>
                  <ul>{reject.errors.map((item) => <li key={item}>{item}</li>)}</ul>
                </article>
              ))}
            </div>
          ) : preview.candidates.length > 0 ? (
            <div className="success-notice" role="status">ทุกแถวผ่านการตรวจ พร้อมให้กฎสิทธิ์ตรวจซ้ำก่อนเขียนแบบครบชุด</div>
          ) : (
            <div className="form-warning" role="status">ยังไม่มีแถวข้อมูลภาคสนามสำหรับนำเข้า กรุณากรอกข้อมูลตั้งแต่แถว 2</div>
          )}
          <button className="primary-action" disabled={!canCommit || saving} onClick={() => void commit()} type="button">{saving ? 'กำลังนำเข้า…' : `ยืนยันนำเข้า ${preview.candidates.length} ตำแหน่ง`}</button>
          {uploadProgress ? (
            <small role="status">
              อัปโหลดแล้ว {uploadProgress.completedPositions} จาก {preview.candidates.length} ตำแหน่ง · ชุด {uploadProgress.completedBatches} จาก {uploadProgress.totalBatches}
            </small>
          ) : null}
        </section>
      ) : null}

      {error ? <div className="form-error" role="alert">{error}</div> : null}
      {result ? (
        <div className="success-notice" role="status">
          <strong>{result.wasRetry ? `ตรวจพบไฟล์เดิมครบ ${result.existingCount} ตำแหน่ง — ไม่สร้างข้อมูลซ้ำ` : `นำเข้าสำเร็จครบ ${result.importedCount + result.existingCount} ตำแหน่ง`}</strong>
          {!result.wasRetry && result.existingCount > 0 ? <span>เริ่มต่อจากครั้งก่อน {result.existingCount} ตำแหน่ง และเพิ่มใหม่ {result.importedCount} ตำแหน่ง</span> : null}
          <span>รหัสป้องกันข้อมูลซ้ำ: {result.idempotencyKey}</span>
          <Link to="/trees">เปิดทะเบียนต้น</Link>
        </div>
      ) : null}
    </section>
  )
}
