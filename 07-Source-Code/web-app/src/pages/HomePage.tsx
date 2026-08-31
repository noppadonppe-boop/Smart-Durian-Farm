import { Link, useOutletContext } from 'react-router-dom'

import type { FarmContext, SyncState } from '../domain/farm'
import { PageHeader } from './PageHeader'

interface LayoutContext {
  farm: FarmContext
  syncState: SyncState
}

export function HomePage() {
  const { farm, syncState } = useOutletContext<LayoutContext>()

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Foundation shell"
        title="ฐานระบบพร้อมสำหรับต่อยอด"
        description="โครงสร้างหน้าจอ เส้นทาง และขอบเขต adapter สำหรับ Phase ถัดไป โดยยังไม่มี business feature จริง"
      />

      <article className="hero-card">
        <div>
          <span className="status-pill">{syncState === 'synced' ? 'พร้อมใช้งานในเครื่อง' : 'โหมดออฟไลน์'}</span>
          <h2>ถูกสวนก่อนเริ่มทุกงาน</h2>
          <p>
            บริบทปัจจุบันคือ <strong>{farm.farmName}</strong> รหัส{' '}
            <code>{farm.farmCode}</code> ซึ่งเป็นข้อมูลจำลอง
          </p>
        </div>
        <Link className="primary-action" to="/scan">
          เปิด Scan shell
        </Link>
      </article>

      <div className="foundation-grid" aria-label="Foundation readiness">
        <article className="foundation-card">
          <span aria-hidden="true">▦</span>
          <h2>5 เส้นทางหลัก</h2>
          <p>Home, Work, Scan, Trees และ More ใช้ layout เดียวกัน</p>
        </article>
        <article className="foundation-card">
          <span aria-hidden="true">⌁</span>
          <h2>Mock adapter</h2>
          <p>UI ไม่ผูกกับ Firebase โดยตรงและไม่มี network request ตอนเริ่มระบบ</p>
        </article>
        <article className="foundation-card">
          <span aria-hidden="true">◇</span>
          <h2>Offline-ready shell</h2>
          <p>ไฟล์ runtime เป็น local bundle ไม่มี external CDN</p>
        </article>
      </div>

      <section className="phase-boundary" aria-labelledby="phase-boundary-title">
        <h2 id="phase-boundary-title">ขอบเขต Phase 1</h2>
        <ul>
          <li>Authentication เป็น shell จำลอง ยังไม่มี sign-in จริง</li>
          <li>ยังไม่มี Farm switch, CRUD, QR camera หรือ permission enforcement</li>
          <li>Firebase ใช้ได้เฉพาะ Local Emulator เมื่อเปิด adapter อย่างชัดเจน</li>
        </ul>
      </section>
    </section>
  )
}
