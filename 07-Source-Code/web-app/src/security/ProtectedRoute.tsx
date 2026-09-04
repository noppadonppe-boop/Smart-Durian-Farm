import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import type { UserRole } from '../domain/auth'

interface ProtectedRouteProps {
  children: ReactNode
  requireApproved?: boolean
  requireRoles?: UserRole[]
}

export function ProtectedRoute({ 
  children, 
  requireApproved = true, 
  requireRoles 
}: ProtectedRouteProps) {
  const { firebaseUser, userProfile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <main className="auth-page" id="main-content">
        <section aria-live="polite" className="loading-state">
          <div className="spinner" />
          <h1>กำลังตรวจสอบสิทธิ์...</h1>
        </section>
      </main>
    )
  }

  if (!firebaseUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!userProfile) {
    return (
      <main className="auth-page" id="main-content">
        <section aria-live="polite" className="loading-state">
          <div className="spinner" />
          <h1>กำลังโหลดข้อมูลผู้ใช้...</h1>
        </section>
      </main>
    )
  }

  if (requireApproved) {
    if (userProfile.status === 'pending') {
      return <Navigate to="/pending" replace />
    }
    if (userProfile.status === 'rejected') {
      return <Navigate to="/login" replace />
    }
  }

  if (requireRoles && requireRoles.length > 0) {
    const hasRole = requireRoles.some(role => userProfile.role.includes(role))
    if (!hasRole) {
      return <Navigate to="/" replace />
    }
  }

  return <>{children}</>
}
