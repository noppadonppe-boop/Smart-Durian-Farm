import { AuthPendingPage } from '../pages/AuthPendingPage'
import { UserManagementPage } from '../pages/UserManagementPage'
import { ProtectedRoute } from '../security/ProtectedRoute'

export function PendingProtectedRoute() {
  return (
    <ProtectedRoute requireApproved={false}>
      <AuthPendingPage />
    </ProtectedRoute>
  )
}

export function AdminProtectedRoute() {
  return (
    <ProtectedRoute requireSystemAdmin>
      <UserManagementPage />
    </ProtectedRoute>
  )
}
