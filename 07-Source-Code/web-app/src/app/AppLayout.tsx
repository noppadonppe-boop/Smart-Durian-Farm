import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
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
import { PendingTaskBadge } from '../components/PendingTaskBadge'
import {
  firebaseConnectivityCheckIntervalMs,
  probeFirebaseConnectivity,
} from '../services/firebaseConnectivity'

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
    pendingOperations,
    listOfflineOperations,
    syncOfflineOperation,
    listQueuedWorkPhotoBatches,
    retryQueuedWorkPhotoBatch,
    signOut,
  } = usePhase2()
  const [syncState, setSyncState] = useState<SyncState>('synced')
  const [connectivityDetail, setConnectivityDetail] = useState('กำลังตรวจสอบ Firebase')
  const [lastConnectivityCheck, setLastConnectivityCheck] = useState<Date>()
  const [checkingConnectivity, setCheckingConnectivity] = useState(false)
  const checkingConnectivityRef = useRef(false)
  const automaticReplayRef = useRef(false)
  const [colorScheme, setColorScheme] = useState<'system' | 'light' | 'dark'>('system')
  const {
    userProfile,
    isSystemAdmin,
    loading: authLoading,
    pendingUsersCount,
  } = useAuth()
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

  const checkConnectivity = useCallback(async () => {
    if (checkingConnectivityRef.current) return
    checkingConnectivityRef.current = true
    setCheckingConnectivity(true)
    try {
      const result = await probeFirebaseConnectivity()
      setSyncState(result.syncState)
      setConnectivityDetail(result.detail)
      setLastConnectivityCheck(result.checkedAt)
    } finally {
      checkingConnectivityRef.current = false
      setCheckingConnectivity(false)
    }
  }, [])

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return
    const markOffline = () => {
      setSyncState('offline')
      setConnectivityDetail('อุปกรณ์ไม่ได้เชื่อมต่อเครือข่าย')
      setLastConnectivityCheck(new Date())
    }
    const checkOnline = () => { void checkConnectivity() }
    void checkConnectivity()
    const intervalId = window.setInterval(() => { void checkConnectivity() }, firebaseConnectivityCheckIntervalMs)
    window.addEventListener('offline', markOffline)
    window.addEventListener('online', checkOnline)
    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('offline', markOffline)
      window.removeEventListener('online', checkOnline)
    }
  }, [checkConnectivity])

  useEffect(() => {
    if (syncState !== 'synced' || !identity || !farm || !lastConnectivityCheck) return
    if (automaticReplayRef.current) return
    automaticReplayRef.current = true
    let active = true
    const replay = async () => {
      try {
        const operations = await listOfflineOperations()
        for (const operation of operations.filter((item) => item.status === 'PENDING')) {
          if (!active) return
          try {
            await syncOfflineOperation(operation.operationId)
          } catch {
            // เก็บรายการเดิมและลองรายการถัดไป เพื่อไม่ให้คิวหนึ่งบล็อกทั้งสวน
          }
        }
        const photoBatches = await listQueuedWorkPhotoBatches()
        for (const batch of photoBatches) {
          if (!active) return
          try {
            await retryQueuedWorkPhotoBatch(batch.batchId)
          } catch {
            // เก็บ binary batch เดิมไว้ Retry รอบถัดไป
          }
        }
      } finally {
        automaticReplayRef.current = false
      }
    }
    void replay()
    return () => {
      active = false
      automaticReplayRef.current = false
    }
  }, [
    farm,
    identity,
    lastConnectivityCheck,
    listOfflineOperations,
    listQueuedWorkPhotoBatches,
    retryQueuedWorkPhotoBatch,
    syncOfflineOperation,
    syncState,
  ])

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
                KDOMS · Firebase Live
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
              onClick={() => { void checkConnectivity() }}
            >
              <span aria-hidden="true">●</span>
              <span className="sync-control__label">
                {checkingConnectivity
                  ? 'กำลังตรวจ Firebase…'
                  : syncState === 'synced'
                  ? currentPendingCount > 0
                    ? `ซิงก์ · ค้าง ${currentPendingCount}`
                    : 'ซิงก์แล้ว'
                  : `ออฟไลน์ · ค้าง ${currentPendingCount}`}
              </span>
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
            <div className="profile-control">
              <NavLink
                aria-label="โปรไฟล์และข้อมูลส่วนตัว"
                className="profile-control__link"
                to="/profile"
                title="โปรไฟล์และข้อมูลส่วนตัว"
              >
                {userProfile?.photoURL ? (
                  <img src={userProfile.photoURL} alt="" />
                ) : (
                  <span>{userProfile?.firstName ? userProfile.firstName.charAt(0) : '👤'}</span>
                )}
              </NavLink>
            </div>
          </div>
        </div>

        <div className="operational-banner" role="status">
          Firebase Live · ข้อมูล Operational อยู่ที่ durian-smartfarm/root และแยกตาม Farm
        </div>
      </header>

      <aside className="app-sidebar" aria-label="เมนูหลักบนจอใหญ่">
        <nav>
          <div className="identity-card" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <span>{userProfile ? `${userProfile.firstName} ${userProfile.lastName}`.trim() : identity.displayName}</span>
            <small>{userProfile ? userProfile.role.join(', ') : (farm ? roleLabels[farm.role] : '')}</small>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', alignItems: 'center' }}>
              <NavLink to="/profile" style={{ fontSize: '0.78rem', color: '#2d6a4f', textDecoration: 'underline' }}>
                แก้ไขโปรไฟล์
              </NavLink>
              <button onClick={() => void signOut()} type="button">ออกจากระบบ</button>
            </div>
          </div>
          {navigationItems.map((item) => (
            <NavLink className={navigationClass} end={item.to === '/'} key={item.to} to={item.to}>
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
              {isSystemAdmin && item.to === '/more' ? (
                <PendingTaskBadge count={pendingUsersCount} />
              ) : null}
            </NavLink>
          ))}
        </nav>
        <div className="app-sidebar__footer">
          <nav aria-label="เมนูผู้ดูแลและคู่มือ">
            {(isSystemAdmin || farm.isOrganizationOwner) && (
              <NavLink className={navigationClass} to="/farm-management">
                <span aria-hidden="true">🏡</span>
                จัดการสวน
              </NavLink>
            )}
            {isSystemAdmin && (
              <NavLink className={navigationClass} to="/user-management">
                <span aria-hidden="true">👥</span>
                จัดการผู้ใช้งาน
                <PendingTaskBadge count={pendingUsersCount} />
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
        <Outlet key={farm?.farmId ?? 'no-farm'} context={{
          farm,
          syncState,
          permissions,
          checkConnectivity,
          checkingConnectivity,
          connectivityDetail,
          lastConnectivityCheck,
        }} />
      </main>

      <nav className="app-bottom-nav" aria-label="เมนูหลักบนมือถือ">
        {navigationItems.map((item) => (
          <NavLink className={navigationClass} end={item.to === '/'} key={item.to} to={item.to}>
            <span aria-hidden="true">{item.icon}</span>
            <small>{item.shortLabel}</small>
            {isSystemAdmin && item.to === '/more' ? (
              <PendingTaskBadge count={pendingUsersCount} placement="corner" />
            ) : null}
          </NavLink>
        ))}
      </nav>
      <Suspense fallback={null}>
        <PendingFarmSwitchDialog />
      </Suspense>
    </div>
  )
}
