import { useState, type FormEvent } from 'react'

import { usePhase2 } from '../app/usePhase2'
import { demoAccounts } from '../demo/demoAccounts'

export function SignInPage() {
  const {
    mode,
    authError,
    otpChallenge,
    requestOtp,
    verifyOtp,
    signInWithMockAccount,
  } = usePhase2()
  const [phoneNumber, setPhoneNumber] = useState(demoAccounts[0]?.phoneNumber ?? '')
  const [otp, setOtp] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const primaryDemoAccount = demoAccounts[0]

  const submitPhone = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      await requestOtp(phoneNumber)
    } catch {
      // The provider exposes the Thai error message in authError.
    } finally {
      setSubmitting(false)
    }
  }

  const submitOtp = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      await verifyOtp(otp)
    } catch {
      // The provider exposes the Thai error message in authError.
    } finally {
      setSubmitting(false)
    }
  }

  const openMockDemo = async () => {
    if (!primaryDemoAccount) return
    setSubmitting(true)
    try {
      await signInWithMockAccount(
        primaryDemoAccount.phoneNumber,
        primaryDemoAccount.otp,
      )
    } catch {
      // The provider exposes the Thai error message in authError.
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page" id="main-content">
      <section className="auth-card" aria-labelledby="sign-in-title">
        <div className="brand-mark auth-card__mark" aria-hidden="true">
          ท
        </div>
        <span className="status-pill">โหมดพัฒนา · Mock Data</span>
        <h1 id="sign-in-title">เข้าสู่ Smart Durian Farm</h1>
        <p>
          เปิดแอปด้วยข้อมูลจำลองได้ทันที ไม่ต้องมี Firebase และไม่มีการส่ง SMS จริง
        </p>

        {mode === 'mock' ? (
          <section className="auth-quick-start" aria-label="เปิดแอปสาธิต">
            <button
              className="primary-action"
              disabled={submitting}
              onClick={() => void openMockDemo()}
              type="button"
            >
              {submitting ? 'กำลังเปิดข้อมูลจำลอง…' : 'เปิดแอปสาธิตทันที'}
            </button>
            <small>ใช้บัญชีเจ้าของสวนจำลองและโหลดข้อมูลครบทุกโมดูลในเครื่อง</small>
          </section>
        ) : null}

        {!otpChallenge ? (
          <form className="auth-form" onSubmit={(event) => void submitPhone(event)}>
            <label htmlFor="phone-number">หมายเลขโทรศัพท์ทดสอบ</label>
            <input
              autoComplete="tel"
              id="phone-number"
              inputMode="tel"
              onChange={(event) => setPhoneNumber(event.target.value)}
              required
              type="tel"
              value={phoneNumber}
            />
            <button className={mode === 'mock' ? 'secondary-action' : 'primary-action'} disabled={submitting} type="submit">
              {submitting ? 'กำลังขอรหัส…' : 'ขอรหัส OTP ทดสอบ'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={(event) => void submitOtp(event)}>
            <span className="auth-summary">
              ส่งคำขอไปยัง <code>{otpChallenge.phoneNumber}</code>
            </span>
            <label htmlFor="otp-code">รหัส OTP 6 หลัก</label>
            <input
              autoComplete="one-time-code"
              id="otp-code"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => setOtp(event.target.value.replace(/\D/gu, ''))}
              pattern="[0-9]{6}"
              required
              type="text"
              value={otp}
            />
            <button className={mode === 'mock' ? 'secondary-action' : 'primary-action'} disabled={submitting} type="submit">
              {submitting ? 'กำลังตรวจ…' : 'ยืนยัน OTP'}
            </button>
          </form>
        )}

        {authError ? <div className="form-error" role="alert">{authError}</div> : null}
        <div id="firebase-recaptcha-container" />

        <details className="demo-accounts">
          <summary>ดูบัญชีทดสอบ</summary>
          <div>
            {demoAccounts.map((account) => (
              <button
                key={account.phoneNumber}
                onClick={() => {
                  setPhoneNumber(account.phoneNumber)
                  if (mode === 'mock') setOtp(account.otp)
                }}
                type="button"
              >
                <strong>{account.displayName}</strong>
                <code>{account.phoneNumber}</code>
                <span>{mode === 'mock' ? `OTP ${account.otp}` : 'ดู OTP ใน Emulator'}</span>
              </button>
            ))}
          </div>
        </details>

        <small className="auth-boundary">
          โหมดปัจจุบัน: {mode === 'firebase-emulator' ? 'Firebase Emulator' : 'Mock สำหรับทดสอบออฟไลน์'}
        </small>
      </section>
    </main>
  )
}
