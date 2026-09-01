import { useState, type FormEvent } from 'react'

import { usePhase2 } from '../app/usePhase2'
import type { ProductionMockSeedResult } from '../adapters/contracts'

const productionProjectId = 'durian-smartfarm'

export function ProductionSeedPanel({ bootstrap = false }: { bootstrap?: boolean }) {
  const { identity, mode, seedProductionMockData } = usePhase2()
  const [confirmation, setConfirmation] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [result, setResult] = useState<ProductionMockSeedResult>()

  if (mode !== 'firebase-live' || identity?.source !== 'firebase-live') return null

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(undefined)
    setResult(undefined)
    try {
      setResult(await seedProductionMockData())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Seed ข้อมูลไป Firebase ไม่สำเร็จ')
    } finally {
      setBusy(false)
    }
  }

  const ready = confirmation.trim() === productionProjectId && acknowledged

  return (
    <section className="workflow-panel" aria-labelledby="production-seed-title">
      <div className="section-heading">
        <div>
          <span className="status-pill">Firebase Production · Owner Seed</span>
          <h2 id="production-seed-title">
            {bootstrap ? 'สร้างข้อมูลเริ่มต้นใน Firebase' : 'Seed Mock Data ทุกเมนู'}
          </h2>
        </div>
      </div>
      <p>
        เขียนข้อมูลจำลองแบบ deterministic ใต้ <code>durian-smartfarm/root</code>
        โดยไม่สร้างโฟลเดอร์แยกตามผู้ใช้ และไม่ลบ document อื่นที่มีอยู่
      </p>
      <form onSubmit={(event) => void submit(event)}>
        <label htmlFor={bootstrap ? 'bootstrap-project-confirmation' : 'project-confirmation'}>
          พิมพ์ชื่อ Project เพื่อยืนยัน
          <input
            autoComplete="off"
            id={bootstrap ? 'bootstrap-project-confirmation' : 'project-confirmation'}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder={productionProjectId}
            value={confirmation}
          />
        </label>
        <label className="checkbox-row">
          <input
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
            type="checkbox"
          />
          รับทราบว่าข้อมูลทั้งหมดเป็น SIMULATED/TEST ONLY ใน Firebase Production
        </label>
        <button className="primary-action" disabled={!ready || busy} type="submit">
          {busy ? 'กำลัง Seed และตรวจสิทธิ์…' : 'Seed Mock Data ไป Firebase'}
        </button>
      </form>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {result ? <p className="success-notice" role="status">
        Seed สำเร็จ {result.recordCount} records ใน {result.modules.length} โมดูล · {result.rootPath}
        {result.storageUploadsSkipped > 0
          ? ` · ข้ามไฟล์รูป ${result.storageUploadsSkipped} ไฟล์ เพราะ Storage ยังไม่เปิดใช้งาน`
          : ''}
      </p> : null}
      <small>
        ปุ่มนี้ใช้ได้เฉพาะบัญชี Phone Auth ที่เป็น Seed Owner; anonymous และผู้ใช้ทั่วไปยึดสิทธิ์ Seed ไม่ได้
      </small>
    </section>
  )
}
