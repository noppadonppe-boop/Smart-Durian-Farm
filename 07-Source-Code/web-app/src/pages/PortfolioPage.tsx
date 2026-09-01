import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
import type { PortfolioDashboard } from '../domain/operationalHardening'
import { PageHeader } from './PageHeader'

export function PortfolioPage() {
  const { currentFarm, getPortfolioDashboard } = usePhase2()
  const [portfolio, setPortfolio] = useState<PortfolioDashboard>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    if (!currentFarm?.isOrganizationOwner) return () => undefined
    void getPortfolioDashboard()
      .then((result) => { if (active) setPortfolio(result) })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'อ่าน Portfolio ไม่สำเร็จ')
      })
    return () => { active = false }
  }, [currentFarm?.isOrganizationOwner, getPortfolioDashboard])

  if (!currentFarm?.isOrganizationOwner) return <section className="page-stack">
    <PageHeader eyebrow="Least privilege" title="ไม่มีสิทธิ์เปิดภาพรวมหลายสวน" description="Portfolio Dashboard ใช้ได้เฉพาะ ORG_OWNER และไม่อนุมานสิทธิ์จากการ Sign-in" />
    <Link to="/">กลับหน้าหลัก</Link>
  </section>

  return <section className="page-stack dashboard-page">
    <PageHeader eyebrow="Organization-scoped · Owner only" title="ภาพรวมหลายสวน" description="รวมเฉพาะสวนที่บัญชีนี้มี membership; fixture สวนซ่อนต้องไม่ปรากฏ" />
    <div className="field-validation-banner" role="note"><strong>SIMULATED/TEST ONLY</strong><span>ไม่มี Cross-Farm transfer และไม่มีข้อมูลจริง</span></div>
    {error ? <div className="form-error" role="alert">{error}</div> : null}
    {!portfolio && !error ? <div className="loading-inline" role="status">กำลังรวมข้อมูลเฉพาะสวนที่ได้รับสิทธิ์…</div> : null}
    {portfolio ? <>
      <div className="portfolio-totals" aria-label="Portfolio totals">
        <article><small>สวนที่มีสิทธิ์</small><strong>{portfolio.farmCount}</strong></article>
        <article><small>โรคเร่งด่วน</small><strong>{portfolio.totals.urgentDiseaseCount}</strong></article>
        <article><small>งานเกินกำหนด</small><strong>{portfolio.totals.overdueWorkCount}</strong></article>
        <article><small>Inventory warning</small><strong>{portfolio.totals.inventoryWarningCount}</strong></article>
      </div>
      <div className="portfolio-farms">
        {portfolio.farms.map((farm) => <article key={farm.farmId}>
          <span className="status-pill">{farm.farmCode}</span><h2>{farm.farmName}</h2>
          <p>เร่งด่วน {farm.urgentDiseaseCount} · งานเกิน {farm.overdueWorkCount} · Harvest {farm.harvestAvailableKg} kg</p>
          <small>ยอดขาย {farm.salesGrossBaht.toLocaleString('th-TH')} · ค้าง {farm.salesOutstandingBaht.toLocaleString('th-TH')} บาท</small>
        </article>)}
      </div>
      <p className="security-evidence">Security evidence: unauthorized fixture และตัวระบุของสวนที่ไม่มีสิทธิ์ไม่ปรากฏในผลลัพธ์</p>
    </> : null}
  </section>
}
