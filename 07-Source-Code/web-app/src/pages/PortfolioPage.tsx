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
    <PageHeader eyebrow="Least privilege" title="ไม่มีสิทธิ์เปิดภาพรวมหลายสวน" description="Portfolio Dashboard ใช้ได้เฉพาะ ORG_OWNER และไม่อนุมานสิทธิ์จากการ Sign-in" backTo="/more" />
    <Link to="/">กลับหน้าหลัก</Link>
  </section>

  return <section className="page-stack dashboard-page">
    <PageHeader eyebrow="Organization-scoped · Owner only" title="ภาพรวมหลายสวน" description="รวมเฉพาะสวนใช้งานจริงที่บัญชีนี้มี membership" backTo="/more" />
    <div className="operational-data-banner" role="note"><strong>Firebase Production</strong><span>รวมข้อมูลตามสิทธิ์และไม่โอนข้ามสวน</span></div>
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
        {portfolio.farms.map(({ snapshot, financial }) => <article key={snapshot.farmId}>
          <span className="status-pill">{snapshot.farmCode}</span><h2>{snapshot.farmName}</h2>
          <p>เร่งด่วน {snapshot.urgentDiseaseCount} · งานเกิน {snapshot.overdueWorkCount} · Harvest {snapshot.harvestAvailableKg} kg</p>
          <small>ยอดขาย {financial.salesGrossBaht.toLocaleString('th-TH')} · ค้าง {financial.salesOutstandingBaht.toLocaleString('th-TH')} บาท · Owner only</small>
        </article>)}
      </div>
      <p className="security-evidence">สวนที่ไม่มีสิทธิ์จะไม่ปรากฏในผลลัพธ์</p>
    </> : null}
  </section>
}
