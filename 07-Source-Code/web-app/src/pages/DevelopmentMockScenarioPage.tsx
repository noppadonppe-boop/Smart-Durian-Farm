import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
import { PageHeader } from './PageHeader'

const developmentScenarios = [
  'DEFAULT', 'EMPTY', 'ERROR', 'LARGE_LIST', 'OFFLINE', 'CONFLICT', 'PERMISSION_DENIED',
] as const

type DevelopmentScenario = (typeof developmentScenarios)[number]

const scenarioLabels: Record<DevelopmentScenario, string> = {
  DEFAULT: 'Default',
  EMPTY: 'Empty',
  ERROR: 'Error',
  LARGE_LIST: 'Large-list',
  OFFLINE: 'Offline',
  CONFLICT: 'Conflict',
  PERMISSION_DENIED: 'Permission Denied',
}
const scenarioDescriptions: Record<DevelopmentScenario, string> = {
  DEFAULT: 'เปิด deterministic baseline และเข้า Workflow Disease จริงใน Mock Data',
  EMPTY: 'ตรวจ Empty state โดยไม่สร้างหรือแก้ข้อมูลใน Repository',
  ERROR: 'จำลองการโหลดล้มเหลวที่ UI boundary',
  LARGE_LIST: 'สร้างรายการสังเคราะห์ 60 รายการเพื่อตรวจการเลื่อนและ Responsive',
  OFFLINE: 'จำลองรายการ Pending ที่รักษา Farm scope และ idempotency key',
  CONFLICT: 'เปรียบเทียบ mock version ก่อนส่งให้คนตัดสินใจ',
  PERMISSION_DENIED: 'ปฏิเสธการอ่านข้อมูลต่างสวนโดยไม่แสดง payload',
}
function storageKey(farmId: string): string {
  return `kdoms:development-scenario:${farmId}`
}
export function DevelopmentMockScenarioPage() {
  const { currentFarm } = usePhase2()
  const [scenario, setScenario] = useState<DevelopmentScenario>(() => {
    if (!currentFarm) return 'DEFAULT'
    const saved = sessionStorage.getItem(storageKey(currentFarm.farmId))
    return developmentScenarios.includes(saved as DevelopmentScenario)
      ? saved as DevelopmentScenario
      : 'DEFAULT'
  })
  const [resetCount, setResetCount] = useState(0)

  const choose = (next: DevelopmentScenario) => {
    setScenario(next)
    if (currentFarm) sessionStorage.setItem(storageKey(currentFarm.farmId), next)
  }

  const reset = () => {
    if (currentFarm) sessionStorage.removeItem(storageKey(currentFarm.farmId))
    setScenario('DEFAULT')
    setResetCount((current) => current + 1)
  }

  const largeList = useMemo(() => Array.from({ length: 60 }, (_, index) => ({
    id: `scenario_${String(index + 1).padStart(3, '0')}`,
    label: `Synthetic case ${String(index + 1).padStart(2, '0')}`,
  })), [])

  if (!import.meta.env.DEV) return null
  if (!currentFarm) return null

  return <section className="page-stack">
    <PageHeader eyebrow="Development only" title="Mock Scenario Center" description="UI harness สำหรับ Mock-first development เท่านั้น · ไม่ใช่ Physical Device/Field evidence" backTo="/more" />
    <aside className="field-validation-banner"><strong>SIMULATED/TEST ONLY</strong><span>Scenario นี้อยู่ในหน่วยความจำ/Session ของ {currentFarm.farmCode}; ไม่แตะ External Resource และไม่รวมใน Production route</span></aside>

    <section className="scenario-picker" aria-labelledby="scenario-picker-title">
      <div><h2 id="scenario-picker-title">เลือกสถานการณ์</h2><p>Farm switch ใช้ key คนละชุด จึงไม่ค้างข้อมูลจากสวนเดิม</p></div>
      <div className="scenario-options">{developmentScenarios.map((value) => <button aria-pressed={scenario === value} className={scenario === value ? 'status-filter status-filter--active' : 'status-filter'} key={value} onClick={() => choose(value)} type="button">{scenarioLabels[value]}</button>)}</div>
      <button className="secondary-action" onClick={reset} type="button">Reset deterministic baseline</button>
      <small>Reset count ในรอบนี้: {resetCount}</small>
    </section>

    <section className="scenario-stage" aria-live="polite">
      <span className="status-pill">{scenarioLabels[scenario]}</span>
      <h2>{scenarioDescriptions[scenario]}</h2>
      {scenario === 'DEFAULT' ? <><p>Baseline พร้อมสำหรับ Disease Incident → Synthetic Photo → Treatment Work Order → Work Verification/Audit</p><Link className="primary-action" to="/disease">เปิด Disease Mock Demo</Link></> : null}
      {scenario === 'EMPTY' ? <article className="empty-state"><h3>ยังไม่มีรายการ</h3><p>Empty mock collection · {currentFarm.farmCode}</p></article> : null}
      {scenario === 'ERROR' ? <p className="form-error" role="alert">SIMULATED/TEST ONLY — โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่</p> : null}
      {scenario === 'LARGE_LIST' ? <div className="scenario-large-list">{largeList.map((item) => <article key={item.id}><strong>{item.label}</strong><small>{item.id} · {currentFarm.farmCode}</small></article>)}</div> : null}
      {scenario === 'OFFLINE' ? <div className="scenario-data-card"><strong>Pending · Offline</strong><code>idem_{currentFarm.farmId}_scenario_001</code><p>Retry ใช้ key เดิมและห้ามย้าย Farm scope</p><Link to="/sync">เปิด Sync Center</Link></div> : null}
      {scenario === 'CONFLICT' ? <div className="scenario-compare"><article><strong>Mock v3</strong><p>ข้อสังเกตจำลองจาก Offline queue</p></article><article><strong>Server v4</strong><p>ค่า Master จำลองที่ใหม่กว่า</p></article><p>ต้อง Review ก่อน Resolve; ห้ามเขียนทับเงียบ ๆ</p></div> : null}
      {scenario === 'PERMISSION_DENIED' ? <div className="scenario-data-card scenario-data-card--denied"><strong>Permission Denied</strong><p>Cross-Farm access ถูกปฏิเสธ · ไม่มี payload จากสวนเป้าหมาย</p></div> : null}
    </section>
  </section>
}
