import {
  livePhoneAuthHostError,
  normalizePhoneNumber,
  phoneAllowlistDigest,
  phoneOtpErrorMessage,
} from './phoneOtpAuth'

describe('phoneOtpErrorMessage', () => {
  it.each([
    ['auth/invalid-phone-number', 'รูปแบบหมายเลขโทรศัพท์ไม่ถูกต้อง'],
    ['auth/invalid-verification-code', 'รหัส OTP ไม่ถูกต้อง'],
    ['auth/code-expired', 'รหัส OTP หมดอายุแล้ว'],
    ['auth/too-many-requests', 'ขอรหัสบ่อยเกินไป'],
    ['auth/network-request-failed', 'ติดต่อระบบยืนยันตัวตนสำหรับข้อมูลทดสอบไม่ได้'],
    ['auth/app-not-authorized', 'HTTPS บนโดเมน Hosting'],
    ['auth/invalid-app-credential', 'HTTPS บนโดเมน Hosting'],
    ['auth/billing-not-enabled', 'ตรวจ Billing และโควตา'],
  ])('maps %s to an actionable Thai message', (code, expected) => {
    expect(phoneOtpErrorMessage({ code })).toContain(expected)
  })

  it('does not expose an unknown Firebase error message', () => {
    const message = phoneOtpErrorMessage({
        code: 'auth/internal-error',
        message: 'sensitive implementation detail',
      }, 'live')
    expect(message).not.toContain('sensitive implementation detail')
    expect(message).toContain('รหัส: auth/internal-error')
  })

  it.each([
    ['0812345678', '+66812345678'],
    ['66 81 234 5678', '+66812345678'],
    ['+66 (81) 234-5678', '+66812345678'],
  ])('normalizes %s for Firebase Phone Auth', (input, expected) => {
    expect(normalizePhoneNumber(input)).toBe(expected)
  })

  it('uses a live Firebase message without mentioning Emulator', () => {
    expect(phoneOtpErrorMessage({ code: 'auth/network-request-failed' }, 'live')).toBe(
      'ติดต่อ Firebase Authentication ไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่',
    )
  })
})

describe('livePhoneAuthHostError', () => {
  it.each(['localhost', '127.0.0.1', '::1', '[::1]'])(
    'blocks real SMS from local host %s',
    (hostname) => {
      expect(livePhoneAuthHostError(hostname)).toContain('ไม่รองรับการส่ง SMS จริง')
    },
  )

  it('allows an HTTPS hosting hostname to continue', () => {
    expect(livePhoneAuthHostError('durian-smartfarm.web.app')).toBeUndefined()
  })
})

describe('phoneAllowlistDigest', () => {
  const salt = 'AAECAwQFBgcICQoLDA0ODw'

  it('creates a stable digest without returning the phone number', async () => {
    const first = await phoneAllowlistDigest('0812345678', salt, 1_000)
    const second = await phoneAllowlistDigest('+66812345678', salt, 1_000)

    expect(first).toBe(second)
    expect(first).not.toContain('0812345678')
    expect(first).not.toContain('+66812345678')
  })

  it('creates a different digest for another phone number', async () => {
    const first = await phoneAllowlistDigest('0812345678', salt, 1_000)
    const second = await phoneAllowlistDigest('0899999999', salt, 1_000)

    expect(first).not.toBe(second)
  })
})
