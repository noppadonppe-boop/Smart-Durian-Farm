import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
import { roleLabels, type FarmContext, type FarmPermissions, type SyncState } from '../domain/farm'
import type { FarmDashboardView } from '../domain/operationalHardening'
import { PageHeader } from './PageHeader'

interface LayoutContext {
  farm: FarmContext
  syncState: SyncState
  permissions: FarmPermissions
}

export function HomePage() {
  const { farm, syncState } = useOutletContext<LayoutContext>()
  const { getFarmDashboard } = usePhase2()
  const [dashboard, setDashboard] = useState<FarmDashboardView>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    void getFarmDashboard()
      .then((result) => { if (active) setDashboard(result) })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'อ่าน Dashboard ไม่สำเร็จ')
      })
    return () => { active = false }
  }, [farm.farmId, getFarmDashboard])

  return (
    <section className="page-stack dashboard-page">
      <PageHeader
        eyebrow="Local Mock Dashboard"
        title="ภาพรวมสวนที่เปิดอยู่"
        description="แสดงเฉพาะข้อมูลและหัวข้อที่บทบาทปัจจุบันได้รับสิทธิ์ พร้อมสถานะ Offline/Sync ที่มองเห็นได้"
      />

      <article className="hero-card">
        <div>
          <span className="status-pill">
            {syncState === 'synced' ? 'ข้อมูลจำลองพร้อมใช้งาน' : 'กำลังทำงานออฟไลน์'}
          </span>
          <h2>{farm.farmName}</h2>
          <p>รหัส <code>{farm.farmCode}</code> · {roleLabels[farm.role]} · Farm-scoped</p>
        </div>
        <div className="hero-actions">
          <Link className="primary-action" to="/sync">ศูนย์ซิงก์และ Conflict</Link>
          {farm.isOrganizationOwner ? <Link className="secondary-action" to="/portfolio">ภาพรวมหลายสวน</Link> : null}
        </div>
      </article>

      {error ? <div className="form-error" role="alert">{error}</div> : null}
      {!dashboard && !error ? <div className="loading-inline" role="status">กำลังคำนวณ Dashboard ตามสิทธิ์…</div> : null}
      {dashboard ? <>
        <div className="dashboard-grid" aria-label="Farm Dashboard metrics">
          {dashboard.visibility.treeHealth ? <article className="dashboard-card">
            <small>สุขภาพต้น</small><strong>{dashboard.snapshot.treeHealth.normal}</strong>
            <span>ปกติ · เฝ้าระวัง {dashboard.snapshot.treeHealth.watch} · ป่วย {dashboard.snapshot.treeHealth.sick}</span>
          </article> : null}
          {dashboard.visibility.disease ? <article className="dashboard-card dashboard-card--urgent">
            <small>โรคเร่งด่วน</small><strong>{dashboard.snapshot.urgentDiseaseCount}</strong><span>เคสที่ต้องเปิดดู</span>
          </article> : null}
          {dashboard.visibility.work ? <article className="dashboard-card">
            <small>งานเกินกำหนด / ใกล้ถึง</small><strong>{dashboard.snapshot.overdueWorkCount} / {dashboard.snapshot.upcomingWorkCount}</strong><span>รายการ</span>
          </article> : null}
          {dashboard.visibility.fruit ? <article className="dashboard-card">
            <small>จำนวนผล</small><strong>{dashboard.snapshot.fruitEstimate.count?.toLocaleString('th-TH') ?? 'UNKNOWN'}</strong><span>{dashboard.snapshot.fruitEstimate.quality} · fruit</span>
          </article> : null}
          {dashboard.visibility.harvest ? <article className="dashboard-card">
            <small>พร้อมจาก Harvest</small><strong>{dashboard.snapshot.harvestAvailableKg.toLocaleString('th-TH')}</strong><span>kg</span>
          </article> : null}
          {dashboard.visibility.inventory ? <article className="dashboard-card dashboard-card--warning">
            <small>Inventory warning</small><strong>{dashboard.snapshot.inventoryWarningCount}</strong><span>ต่ำ/ใกล้หมดอายุ</span>
          </article> : null}
          {dashboard.visibility.sales ? <article className="dashboard-card">
            <small>ยอดขาย / ค้าง</small><strong>{dashboard.snapshot.salesGrossBaht.toLocaleString('th-TH')}</strong><span>ค้าง {dashboard.snapshot.salesOutstandingBaht.toLocaleString('th-TH')} บาท</span>
          </article> : null}
        </div>
        <p className="dashboard-updated">คำนวณล่าสุด: {dashboard.snapshot.lastCalculatedAtLabel} · SIMULATED/TEST ONLY</p>
      </> : null}

      <section className="phase-boundary" aria-labelledby="phase-boundary-title">
        <h2 id="phase-boundary-title">โหมดพัฒนาในเครื่อง</h2>
        <ul>
          <li>Dashboard, Queue, Conflict, Audit และ Export พร้อมใช้ด้วยข้อมูลจำลอง</li>
          <li>Portfolio รวมเฉพาะสวนที่ Owner มี Farm access</li>
          <li>เปลี่ยนข้อมูลระหว่างทดสอบได้ และรีเซ็ตกลับชุดตั้งต้นได้</li>
          <li>ไม่มีการส่งข้อมูลออกไปยัง Firebase หรือบริการภายนอก</li>
        </ul>
      </section>
    </section>
  )
}
