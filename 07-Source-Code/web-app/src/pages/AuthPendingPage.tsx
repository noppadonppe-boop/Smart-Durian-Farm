import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { authService } from '../services/authService'
import { useAuth } from '../security/AuthContext'

export function AuthPendingPage() {
  const navigate = useNavigate()
  const { userProfile } = useAuth()

  useEffect(() => {
    if (userProfile?.status === 'approved') {
      void navigate('/')
    }
  }, [userProfile, navigate])

  const handleLogout = async (): Promise<void> => {
    await authService.logout()
    void navigate('/login')
  }

  return (
    <main className="auth-page" id="main-content">
      <section className="auth-card">
        <h1>รอการอนุมัติ</h1>
        <p>บัญชีของคุณกำลังรอการอนุมัติจากผู้ดูแลระบบ กรุณากลับมาตรวจสอบอีกครั้งในภายหลัง</p>
        <button className="secondary-action" onClick={() => void handleLogout()}>ออกจากระบบ</button>
      </section>
    </main>
  )
}
