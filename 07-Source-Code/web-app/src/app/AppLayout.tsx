import { lazy, Suspense, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import {
  farmStatusLabels,
  permissionsFor,
  roleLabels,
  type SyncState,
} from '../domain/farm'
import { usePhase2 } from './usePhase2'
import { navigationItems, userManualNavigationItem } from './navigation'
import { useAuth } from '../security/AuthContext'

const NoFarmPage = lazy(async () => ({
  default: (await import('../pages/NoFarmPage')).NoFarmPage,
}))
const SignInPage = lazy(async () => ({
  default: (await import('../pages/SignInPage')).SignInPage,
}))
const AnnualCycleSwitcher = lazy(async () => ({
  default: (await import('./AnnualCycleSwitcher')).AnnualCycleSwitcher,
}))
const FarmSwitcher = lazy(async () => ({
  default: (await import('./FarmSwitcher')).FarmSwitcher,
}))
const PendingFarmSwitchDialog = lazy(async () => ({
  default: (await import('./FarmSwitcher')).PendingFarmSwitchDialog,
}))
const FirebaseAdminPage = lazy(async () => ({
  default: (await import('../pages/FirebaseAdminPage')).FirebaseAdminPage,
}))

function AuthPageFallback() {
  return (
    <main className="auth-page" id="main-content">
      <section aria-live="polite" className="loading-state">
        <span aria-hidden="true" />
        <h1>กำลังเปิดหน้าสำหรับบัญชีนี้</h1>
      </section>
    </main>
  )
}

function navigationClass({ isActive }: { isActive: boolean }): string {
  return isActive ? 'app-nav__link app-nav__link--active' : 'app-nav__link'
}

export function AppLayout() {
  const {
    identity,
    currentFarm: farm,
    farmsLoading,
    mode,
    authMode,
    pendingOperations,
    signOut,
  } = usePhase2()
  const [syncState, setSyncState] = useState<SyncState>('synced')
  const [colorScheme, setColorScheme] = useState<'system' | 'light' | 'dark'>('system')
  const { userProfile, isSystemAdmin, loading: authLoading } = useAuth()
  const location = useLocation()

  useEffect(() => {
    const main = document.getElementById('main-content')
    if (main) {
      main.scrollTop = 0
    }
  }, [location.pathname])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = colorScheme
    root.style.colorScheme = colorScheme === 'system'
      ? 'light dark'
      : colorScheme

    return () => {
      delete root.dataset.theme
      root.style.removeProperty('color-scheme')
    }
  }, [colorScheme])

  const toggleSyncState = () => {
    setSyncState((current) => (current === 'synced' ? 'offline' : 'synced'))
  }

  if (identity === undefined || farmsLoading) {
    return (
      <main className="auth-page" id="main-content">
        <section aria-live="polite" className="loading-state">
          <span aria-hidden="true" />
          <h1>กำลังตรวจสิทธิ์การเข้าใช้</h1>
          <p>กำลังอ่าน Authentication และ Farm membership ตามขอบเขตที่ตั้งค่าไว้</p>
        </section>
      </main>
    )
  }

  if (!identity) {
    return (
      <Suspense fallback={<AuthPageFallback />}>
        <SignInPage />
      </Suspense>
    )
  }
  if (!farm && authLoading) {
    return <AuthPageFallback />
  }
  if (!farm && isSystemAdmin) {
    return (
      <main className="app-main firebase-admin-standalone" id="main-content">
        <Suspense fallback={<AuthPageFallback />}>
          <FirebaseAdminPage />
        </Suspense>
      </main>
    )
  }
  if (!farm) {
    return (
      <Suspense fallback={<AuthPageFallback />}>
        <NoFarmPage />
      </Suspense>
    )
  }

  const permissions = farm ? permissionsFor(farm) : { isReadOnly: false, allowedActions: [] }
  const currentPendingCount = farm ? pendingOperations.filter(
    (operation) => operation.farmId === farm.farmId,
  ).length : 0

  return (
    <div className="app-frame">
      <a className="skip-link" href="#main-content">
        ข้ามไปเนื้อหาหลัก
      </a>

      <header className="app-header">
        <div className="app-header__bar">
          <div className="brand-block">
            <span className="brand-mark" aria-hidden="true">
              ท
            </span>
            <div className="brand-text">
              <strong>Smart Durian Farm</strong>
              <span className="brand-env">
                KDOMS · {mode === 'firebase-live'
                  ? 'Firebase Live'
                  : authMode === 'firebase-live'
                  ? 'Phone Auth'
                  : 'Mock'}
              </span>
            </div>
          </div>

          <div className="context-row" aria-label="บริบทสวนปัจจุบัน">
            <Suspense fallback={<div className="farm-switcher" aria-busy="true">กำลังโหลดสวน…</div>}>
              <FarmSwitcher />
            </Suspense>
            <Suspense fallback={<div className="annual-cycle-switcher" aria-busy="true">กำลังโหลดรอบปี…</div>}>
              <AnnualCycleSwitcher />
            </Suspense>
            <button
              className={`sync-control sync-control--${syncState}`}
              type="button"
              aria-pressed={syncState === 'offline'}
              onClick={toggleSyncState}
            >
              <span aria-hidden="true">●</span>
              {syncState === 'synced'
                ? currentPendingCount > 0
                  ? `ซิงก์ · ค้าง ${currentPendingCount}`
                  : 'ซิงก์แล้ว'
                : `ออฟไลน์ · ค้าง ${currentPendingCount}`}
            </button>
            <button
              aria-label={`ธีมปัจจุบัน: ${colorScheme === 'system' ? 'อัตโนมัติ' : colorScheme === 'dark' ? 'มืด' : 'สว่าง'} · กดเพื่อเปลี่ยน`}
              className="theme-control"
              onClick={() => setColorScheme((current) => current === 'system'
                ? 'dark'
                : current === 'dark' ? 'light' : 'system')}
              title="เปลี่ยนธีมสี"
              type="button"
            >
              <span aria-hidden="true">◐</span>
            </button>
            {userProfile?.photoURL && (
              <div style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '0.5rem' }}>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', borderRadius: '50%', overflow: 'hidden', width: '32px', height: '32px' }}
                  onClick={() => {
                    if (confirm('กด OK เพื่อออกจากระบบ')) {
                      void signOut()
                    }
                  }}
                  title="โปรไฟล์ (กดเพื่อออกจากระบบ)"
                >
                  <img src={userProfile.photoURL} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className={mode === 'firebase-live' && farm && !farm.isMock ? 'operational-banner' : 'mock-banner'} role="status">
          {mode === 'firebase-live' && farm && !farm.isMock
            ? 'Firebase Live · ข้อมูล Operational อยู่ที่ durian-smartfarm/root และแยกตาม Farm'
            : mode === 'firebase-live'
              ? <>Firebase Live · SIMULATED/TEST ONLY · สวนนี้เป็นชุดทดสอบที่แยกจากข้อมูลจริง</>
              : <>
                SIMULATED/TEST ONLY · ข้อมูลจำลองเท่านั้น ·{' '}{authMode === 'firebase-live'
                  ? 'Firebase Authentication จริง; Firestore/Storage ยังไม่ใช่ Production'
                  : 'ข้อมูลจำลองแยกจาก Production'}
              </>}
        </div>
      </header>

      <aside className="app-sidebar" aria-label="เมนูหลักบนจอใหญ่">
        <nav>
          <div className="identity-card" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <span>{userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : identity.displayName}</span>
            <small>{userProfile ? userProfile.role.join(', ') : (farm ? roleLabels[farm.role] : '')}</small>
            <button onClick={() => void signOut()} type="button">ออกจากระบบ</button>
          </div>
          {navigationItems.map((item) => (
            <NavLink className={navigationClass} end={item.to === '/'} key={item.to} to={item.to}>
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="app-sidebar__footer">
          <nav aria-label="เมนูผู้ดูแลและคู่มือ">
            {(isSystemAdmin || (authMode === 'mock' && Boolean(farm?.isOrganizationOwner))) && (
              <NavLink className={navigationClass} to="/farm-management">
                <span aria-hidden="true">🏡</span>
                จัดการสวน
              </NavLink>
            )}
            {isSystemAdmin && (
              <NavLink className={navigationClass} to="/user-management">
                <span aria-hidden="true">👥</span>
                จัดการผู้ใช้งาน
              </NavLink>
            )}
            <NavLink
              className={navigationClass}
              to={userManualNavigationItem.to}
            >
              <span aria-hidden="true">{userManualNavigationItem.icon}</span>
              {userManualNavigationItem.label}
            </NavLink>
          </nav>
        </div>
      </aside>

      <main className="app-main" id="main-content" tabIndex={-1}>
        {syncState === 'offline' ? (
          <div className="offline-notice" role="status">
            กำลังใช้ shell แบบออฟไลน์ — หน้านี้ไม่ร้องขอข้อมูลภายนอก
          </div>
        ) : null}
        {farm && farm.farmStatus !== 'ACTIVE' ? (
          <div className={`farm-state-notice farm-state-notice--${farm.farmStatus.toLowerCase()}`} role="status">
            สวนนี้อยู่ในสถานะ “{farmStatusLabels[farm.farmStatus]}” · เปิดดูได้ แต่การเขียนข้อมูลถูกระงับ
          </div>
        ) : farm && permissions.isReadOnly ? (
          <div className="farm-state-notice" role="status">
            สิทธิ์ {roleLabels[farm.role]} เป็นโหมดอ่านอย่างเดียวในสวนนี้
          </div>
        ) : null}
        <Outlet key={farm?.farmId ?? 'no-farm'} context={{ farm, syncState, permissions, toggleSyncState }} />
      </main>

      <nav className="app-bottom-nav" aria-label="เมนูหลักบนมือถือ">
        {navigationItems.map((item) => (
          <NavLink className={navigationClass} end={item.to === '/'} key={item.to} to={item.to}>
            <span aria-hidden="true">{item.icon}</span>
            <small>{item.shortLabel}</small>
          </NavLink>
        ))}
      </nav>
      <Suspense fallback={null}>
        <PendingFarmSwitchDialog />
      </Suspense>
    </div>
  )
}
