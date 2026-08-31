import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

import { mockFoundationAdapters } from '../adapters/mock/mockFoundationAdapters'
import type { SyncState } from '../domain/farm'
import { navigationItems } from './navigation'

function navigationClass({ isActive }: { isActive: boolean }): string {
  return isActive ? 'app-nav__link app-nav__link--active' : 'app-nav__link'
}

export function AppLayout() {
  const farm = mockFoundationAdapters.farmContext.getCurrentFarm()
  const identity = mockFoundationAdapters.identity
  const [syncState, setSyncState] = useState<SyncState>('synced')

  const toggleSyncState = () => {
    setSyncState((current) => (current === 'synced' ? 'offline' : 'synced'))
  }

  return (
    <div className="app-frame">
      <a className="skip-link" href="#main-content">
        ข้ามไปเนื้อหาหลัก
      </a>

      <header className="app-header">
        <div className="brand-block">
          <span className="brand-mark" aria-hidden="true">
            ท
          </span>
          <div>
            <strong>Smart Durian Farm</strong>
            <span>KDOMS · Phase 1 Foundation</span>
          </div>
        </div>

        <div className="context-row" aria-label="บริบทสวนปัจจุบัน">
          <div className="farm-context">
            <span>สวนปัจจุบัน</span>
            <strong>{farm.farmName}</strong>
            <code>{farm.farmCode}</code>
          </div>
          <button
            className={`sync-control sync-control--${syncState}`}
            type="button"
            aria-pressed={syncState === 'offline'}
            onClick={toggleSyncState}
          >
            <span aria-hidden="true">●</span>
            {syncState === 'synced' ? 'ซิงก์แล้ว' : 'ออฟไลน์ · ไม่มีรายการค้าง'}
          </button>
        </div>

        <div className="mock-banner" role="status">
          ข้อมูลจำลองเท่านั้น · ไม่เชื่อม Firebase production
        </div>
      </header>

      <aside className="app-sidebar" aria-label="เมนูหลักบนจอใหญ่">
        <nav>
          {navigationItems.map((item) => (
            <NavLink className={navigationClass} end={item.to === '/'} key={item.to} to={item.to}>
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="identity-card">
          <span>{identity.displayName}</span>
          <small>{identity.roleLabel}</small>
        </div>
      </aside>

      <main className="app-main" id="main-content" tabIndex={-1}>
        {syncState === 'offline' ? (
          <div className="offline-notice" role="status">
            กำลังใช้ shell แบบออฟไลน์ — หน้านี้ไม่ร้องขอข้อมูลภายนอก
          </div>
        ) : null}
        <Outlet context={{ farm, syncState }} />
      </main>

      <nav className="app-bottom-nav" aria-label="เมนูหลักบนมือถือ">
        {navigationItems.map((item) => (
          <NavLink className={navigationClass} end={item.to === '/'} key={item.to} to={item.to}>
            <span aria-hidden="true">{item.icon}</span>
            <small>{item.shortLabel}</small>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
