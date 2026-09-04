import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { authService } from '../services/authService'

function messageFromError(reason: unknown): string {
  return reason instanceof Error && reason.message
    ? reason.message
    : 'เกิดข้อผิดพลาดในการสมัครสมาชิก'
}

export function AuthRegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [position, setPosition] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const navigate = useNavigate()

  const handleRegister = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setSubmitting(true)
    setErrorMsg('')
    try {
      await authService.registerWithEmail(email, password, firstName, lastName, position)
      void navigate('/')
    } catch (reason) {
      setErrorMsg(messageFromError(reason))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page" id="main-content">
      <section className="auth-card" aria-labelledby="register-title">
        <h1 id="register-title">สมัครสมาชิก</h1>
        <form className="auth-form" onSubmit={(event) => void handleRegister(event)}>
          <label>ชื่อ</label>
          <input required value={firstName} onChange={e => setFirstName(e.target.value)} />
          
          <label>นามสกุล</label>
          <input required value={lastName} onChange={e => setLastName(e.target.value)} />
          
          <label>ตำแหน่ง</label>
          <input required value={position} onChange={e => setPosition(e.target.value)} />

          <label>อีเมล</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          
          <label>รหัสผ่าน</label>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} />

          <button className="primary-action" disabled={submitting} type="submit">
            {submitting ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
          </button>
          <button className="secondary-action" type="button" onClick={() => void navigate('/login')} style={{ marginTop: '0.5rem' }}>
            กลับไปหน้าเข้าสู่ระบบ
          </button>
        </form>
        {errorMsg && <div className="form-error" role="alert">{errorMsg}</div>}
      </section>
    </main>
  )
}
