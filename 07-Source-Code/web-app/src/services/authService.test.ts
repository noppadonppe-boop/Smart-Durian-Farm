import { describe, expect, it } from 'vitest'

import { authenticationErrorMessage } from './authService'

describe('authenticationErrorMessage', () => {
  it.each([
    'auth/invalid-credential',
    'auth/user-not-found',
    'auth/wrong-password',
  ])('does not disclose which email credential failed for %s', (code) => {
    expect(authenticationErrorMessage({ code })).toBe('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
  })

  it('explains an unauthorized Firebase domain', () => {
    expect(authenticationErrorMessage({ code: 'auth/unauthorized-domain' }))
      .toBe('โดเมนนี้ยังไม่ได้รับอนุญาตใน Firebase Authentication')
  })

  it('keeps a useful fallback error message', () => {
    expect(authenticationErrorMessage(new Error('permission-denied')))
      .toBe('permission-denied')
  })
})
