import { useEffect, useState, type FormEvent } from 'react'

import { usePhase2 } from '../app/usePhase2'

interface DemoAccount {
  displayName: string
  phoneNumber: string
  otp: string
  isOrganizationOwner: boolean
}

export function SignInPage() {
  const {
    mode,
    authMode,
    developmentAdminSignInAvailable,
    authError,
    otpChallenge,
    requestOtp,
    verifyOtp,
    cancelOtp,
    signInAsDevelopmentAdmin,
  } = usePhase2()
  const [demoAccounts, setDemoAccounts] = useState<readonly DemoAccount[]>([])
  const [phoneNumber, setPhoneNumber] = useState(
    authMode === 'firebase-live' ? '' : '+16505550101',
  )
  const [otp, setOtp] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (authMode === 'firebase-live') {
      return undefined
    }
    let active = true
    void import('../../scripts/seed-data/demoAccounts').then(({ demoAccounts: accounts }) => {
      if (!active) return
      setDemoAccounts(accounts)
    })
    return () => { active = false }
  }, [authMode])

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

  const openDevelopmentAdmin = async () => {
    setSubmitting(true)
    try {
      await signInAsDevelopmentAdmin()
    } catch {
      // The provider exposes the Thai error message in authError.
    } finally {
      setSubmitting(false)
    }
  }

  const resendOtp = async () => {
    if (!otpChallenge) return
    setSubmitting(true)
    setOtp('')
    try {
      await requestOtp(otpChallenge.phoneNumber)
    } catch {
      // The provider exposes the Thai error message in authError.
    } finally {
      setSubmitting(false)
    }
  }

  const changePhoneNumber = () => {
    cancelOtp()
    setOtp('')
  }

  return (
    <main className="auth-page" id="main-content">
      <section className="auth-card" aria-labelledby="sign-in-title">
        <div className="brand-mark auth-card__mark" aria-hidden="true">
          ท
        </div>
        <span className="status-pill">
          {authMode === 'firebase-live'
            ? mode === 'firebase-live'
              ? 'Firebase Production · Shared Data Root'
              : 'Firebase Phone Auth จริง · Mock Data'
            : authMode === 'firebase-emulator'
              ? 'โหมดพัฒนา · ข้อมูลจำลอง'
              : 'โหมดพัฒนา · Mock Data'}
        </span>
        <h1 id="sign-in-title">เข้าสู่ Smart Durian Farm</h1>
        <p>
          {authMode === 'firebase-live'
            ? mode === 'firebase-live'
              ? 'ยืนยันตัวตนด้วย OTP ทาง SMS แล้วอ่านและเขียนข้อมูลจาก Firebase Production โดยตรง'
              : 'ยืนยันตัวตนด้วย OTP ทาง SMS จาก Firebase จริง แล้วเปิดข้อมูลจำลองในเครื่องเท่านั้น'
            : authMode === 'firebase-emulator'
              ? 'เข้าสู่ระบบด้วยหมายเลขทดสอบ โดยไม่มีการส่ง SMS จริง'
              : 'เปิดแอปด้วยข้อมูลจำลองได้ทันที ไม่ต้องมี Firebase และไม่มีการส่ง SMS จริง'}
        </p>

        {developmentAdminSignInAvailable ? (
          <section className="auth-quick-start" aria-label="เข้าสู่ระบบสำหรับผู้ดูแล">
            <button
              className="primary-action"
              disabled={submitting}
              onClick={() => void openDevelopmentAdmin()}
              type="button"
            >
              {submitting ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบโดยผู้ดูแล'}
            </button>
            <small>
              เฉพาะเครื่องพัฒนา · ไม่ใช้ OTP · สิทธิ์ ORG_OWNER กับข้อมูล{' '}
              SIMULATED/TEST ONLY ทุกโมดูล และไม่เข้าถึง Firebase Production
            </small>
          </section>
        ) : null}

        {!otpChallenge ? (
          <form className="auth-form" onSubmit={(event) => void submitPhone(event)}>
            <label htmlFor="phone-number">
              {authMode === 'firebase-live' ? 'หมายเลขโทรศัพท์' : 'หมายเลขโทรศัพท์ทดสอบ'}
            </label>
            <input
              autoComplete="tel"
              id="phone-number"
              inputMode="tel"
              onChange={(event) => setPhoneNumber(event.target.value)}
              required
              type="tel"
              value={phoneNumber}
            />
            {authMode === 'firebase-live' ? (
              <small>
                เมื่อกดส่ง OTP หมายเลขจะถูกส่งให้ Google Firebase เพื่อป้องกันการทุจริต
                และอาจมีค่าบริการ SMS ตามผู้ให้บริการ
              </small>
            ) : null}
            <button className={authMode === 'mock' ? 'secondary-action' : 'primary-action'} disabled={submitting} type="submit">
              {submitting
                ? 'กำลังขอรหัส…'
                : authMode === 'firebase-live'
                  ? 'ส่ง OTP ทาง SMS'
                  : 'ขอรหัส OTP ทดสอบ'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={(event) => void submitOtp(event)}>
            <span className="auth-summary">
              ส่งคำขอไปยัง <code>{otpChallenge.phoneNumber}</code>
            </span>
            <small>
              {authMode === 'firebase-live'
                ? 'กรอกรหัส 6 หลักจาก SMS ที่ Firebase ส่งให้หมายเลขนี้'
                : authMode === 'firebase-emulator'
                  ? 'กรอกรหัส OTP ทดสอบที่ระบบแสดงให้ แล้วนำมากรอกด้านล่าง'
                  : 'ใช้รหัส OTP จำลองของบัญชีทดสอบที่เลือก'}
            </small>
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
            <div className="form-actions">
              <button className="primary-action" disabled={submitting} type="submit">
                {submitting ? 'กำลังตรวจ…' : 'ยืนยัน OTP'}
              </button>
              <button
                className="secondary-action"
                disabled={submitting}
                onClick={() => void resendOtp()}
                type="button"
              >
                ขอรหัสใหม่
              </button>
              <button
                className="secondary-action"
                disabled={submitting}
                onClick={changePhoneNumber}
                type="button"
              >
                เปลี่ยนหมายเลข
              </button>
            </div>
          </form>
        )}

        {authError ? <div className="form-error" role="alert">{authError}</div> : null}
        <div id="firebase-recaptcha-container" />

        {authMode !== 'firebase-live' ? <details className="demo-accounts">
          <summary>ดูบัญชีทดสอบ</summary>
          <div>
            {demoAccounts.map((account) => (
              <button
                key={account.phoneNumber}
                onClick={() => {
                  setPhoneNumber(account.phoneNumber)
                  if (authMode === 'mock') setOtp(account.otp)
                }}
                type="button"
              >
                <strong>{account.displayName}</strong>
                <code>{account.phoneNumber}</code>
                <span>{authMode === 'mock' ? `OTP ${account.otp}` : 'OTP สำหรับการทดสอบ'}</span>
              </button>
            ))}
          </div>
        </details> : null}

        <small className="auth-boundary">
          โหมดปัจจุบัน:{' '}
          {authMode === 'firebase-live'
            ? mode === 'firebase-live'
              ? 'Firebase Authentication + Firestore Production · durian-smartfarm/root'
              : 'Firebase Authentication จริง · ข้อมูลแอปยังเป็น Mock'
            : authMode === 'firebase-emulator'
              ? 'ข้อมูลจำลองสำหรับทดสอบ'
              : 'Mock สำหรับทดสอบออฟไลน์'}
        </small>
      </section>
    </main>
  )
}
