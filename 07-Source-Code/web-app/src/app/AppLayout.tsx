import { lazy, Suspense, useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

import {
  farmStatusLabels,
  permissionsFor,
  roleLabels,
  type SyncState,
} from '../domain/farm'
import { usePhase2 } from './usePhase2'
import { navigationItems, userManualNavigationItem } from './navigation'

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
  if (!farm) {
    return (
      <Suspense fallback={<AuthPageFallback />}>
        <NoFarmPage />
      </Suspense>
    )
  }

  const permissions = permissionsFor(farm)
  const currentPendingCount = pendingOperations.filter(
    (operation) => operation.farmId === farm.farmId,
  ).length

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
            <span>
              KDOMS · {mode === 'firebase-live'
                ? 'Firebase Production · Shared Root Data'
                : authMode === 'firebase-live'
                ? 'Firebase Phone Auth · Mock Data'
                : mode === 'firebase-emulator'
                  ? 'Firebase Local Emulator'
                  : 'Local Mock Development'}
            </span>
          </div>
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
                ? `ซิงก์แล้ว · ค้าง ${currentPendingCount}`
                : 'ซิงก์แล้ว'
              : `ออฟไลน์ · ค้าง ${currentPendingCount}`}
          </button>
        </div>

        <div className={mode === 'firebase-live' && !farm.isMock ? 'operational-banner' : 'mock-banner'} role="status">
          {mode === 'firebase-live' && !farm.isMock
            ? 'TREE REGISTER · ข้อมูลภาคสนาม · Firebase durian-smartfarm/root · โมดูลอื่นที่ Seed ไว้ยังเป็น SIMULATED/TEST ONLY'
            : <>SIMULATED/TEST ONLY · ข้อมูลจำลองเท่านั้น ·{' '}{mode === 'firebase-live'
              ? 'Firebase Production · สวนปัจจุบันยังเป็นข้อมูล Seed/Mock'
              : authMode === 'firebase-live'
            ? 'Authentication เชื่อม Firebase จริง; ไม่เชื่อม Firestore/Storage จริง'
            : mode === 'firebase-emulator'
              ? 'Firebase Local Emulator · ไม่เชื่อม Production'
              : 'Mock offline adapter · ไม่เชื่อม Production'}</>}
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
        <div className="app-sidebar__footer">
          <div className="identity-card">
            <span>{identity.displayName}</span>
            <small>{roleLabels[farm.role]} · {identity.maskedPhone}</small>
            <button onClick={() => void signOut()} type="button">ออกจากระบบ</button>
          </div>
          <nav aria-label="คู่มือและความช่วยเหลือ">
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
        {farm.farmStatus !== 'ACTIVE' ? (
          <div className={`farm-state-notice farm-state-notice--${farm.farmStatus.toLowerCase()}`} role="status">
            สวนนี้อยู่ในสถานะ “{farmStatusLabels[farm.farmStatus]}” · เปิดดูได้ แต่การเขียนข้อมูลถูกระงับ
          </div>
        ) : permissions.isReadOnly ? (
          <div className="farm-state-notice" role="status">
            สิทธิ์ {roleLabels[farm.role]} เป็นโหมดอ่านอย่างเดียวในสวนนี้
          </div>
        ) : null}
        <Outlet key={farm.farmId} context={{ farm, syncState, permissions, toggleSyncState }} />
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
