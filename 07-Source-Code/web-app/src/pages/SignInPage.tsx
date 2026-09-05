import { useState, type FormEvent } from 'react'

import { usePhase2 } from '../app/usePhase2'

export function SignInPage() {
  const {
    authError,
    otpChallenge,
    requestOtp,
    verifyOtp,
    cancelOtp,
    signInAsDevelopmentAdmin,
  } = usePhase2()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      if (otpChallenge) await verifyOtp(otp)
      else await requestOtp(phoneNumber)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page" id="main-content">
      <section className="auth-card">
        <span className="status-pill">Firebase Live</span>
        <h1>เข้าสู่ระบบ Smart Durian Farm</h1>
        <p>เข้าสู่ระบบด้วยบัญชี Google หรือหมายเลขโทรศัพท์ที่ได้รับอนุญาต</p>
        {authError ? <div className="form-error" role="alert">{authError}</div> : null}
        <button className="primary-action" disabled={submitting} onClick={() => void signInAsDevelopmentAdmin()} type="button">
          เข้าสู่ระบบด้วย Google
        </button>
        <form onSubmit={(event) => void submit(event)}>
          {otpChallenge ? (
            <label>รหัส OTP<input autoComplete="one-time-code" inputMode="numeric" onChange={(event) => setOtp(event.target.value)} required value={otp} /></label>
          ) : (
            <label>หมายเลขโทรศัพท์<input autoComplete="tel" onChange={(event) => setPhoneNumber(event.target.value)} required type="tel" value={phoneNumber} /></label>
          )}
          <button className="secondary-action" disabled={submitting} type="submit">
            {otpChallenge ? 'ยืนยัน OTP' : 'ขอรหัส OTP'}
          </button>
          {otpChallenge ? <button className="secondary-action" onClick={cancelOtp} type="button">ยกเลิก</button> : null}
        </form>
        <div id="firebase-recaptcha-container" />
      </section>
    </main>
  )
}
