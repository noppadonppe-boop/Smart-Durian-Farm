import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../security/AuthContext'
import { authenticationErrorMessage, authService } from '../services/authService'

function errorCode(reason: unknown): string | undefined {
  if (typeof reason !== 'object' || reason === null || !('code' in reason)) return undefined
  const code = (reason as { code?: unknown }).code
  return typeof code === 'string' ? code : undefined
}

function redirectPath(state: unknown): string {
  if (typeof state !== 'object' || state === null || !('from' in state)) return '/'
  const from = (state as { from?: unknown }).from
  if (typeof from !== 'object' || from === null || !('pathname' in from)) return '/'
  const pathname = (from as { pathname?: unknown }).pathname
  return typeof pathname === 'string' && pathname.startsWith('/') ? pathname : '/'
}

export function AuthLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  
  const { userProfile, refreshProfile } = useAuth()

  useEffect(() => {
    if (userProfile?.status === 'pending') {
      void navigate('/pending', { replace: true })
    } else if (userProfile?.status === 'approved') {
      void navigate(redirectPath(location.state), { replace: true })
    }
  }, [userProfile, navigate, location.state])

  const handleEmailLogin = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setSubmitting(true)
    setErrorMsg('')
    try {
      await authService.loginWithEmail(email, password)
      await refreshProfile()
    } catch (reason) {
      setErrorMsg(authenticationErrorMessage(reason))
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogleLogin = async (): Promise<void> => {
    setSubmitting(true)
    setErrorMsg('')
    try {
      await authService.loginWithGoogle()
      await refreshProfile()
    } catch (reason) {
      if (errorCode(reason) !== 'auth/popup-closed-by-user') {
        setErrorMsg(authenticationErrorMessage(reason))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page" id="main-content">
      <section className="auth-card" aria-labelledby="sign-in-title">
        <div className="brand-mark auth-card__mark" aria-hidden="true">ท</div>
        <h1 id="sign-in-title">เข้าสู่ระบบ Smart Durian Farm</h1>
        
        <form className="auth-form" onSubmit={(event) => void handleEmailLogin(event)}>
          <label htmlFor="email">อีเมล</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <label htmlFor="password">รหัสผ่าน</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button className="primary-action" disabled={submitting} type="submit">
            {submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div style={{ margin: '1rem 0', textAlign: 'center' }}>หรือ</div>

        <button 
          className="secondary-action" 
          disabled={submitting} 
          onClick={() => void handleGoogleLogin()} 
          type="button"
          style={{ width: '100%' }}
        >
          {submitting ? 'กำลังโหลด...' : 'เข้าสู่ระบบด้วย Google'}
        </button>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button className="text-action" onClick={() => void navigate('/register')} type="button" style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}>
            สมัครสมาชิกใหม่
          </button>
        </div>

        {errorMsg || userProfile?.status === 'rejected' ? (
          <div className="form-error" role="alert">
            {errorMsg || 'บัญชีของคุณถูกระงับการใช้งาน'}
          </div>
        ) : null}
      </section>
    </main>
  )
}
