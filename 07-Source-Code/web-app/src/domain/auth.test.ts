import { describe, expect, it } from 'vitest'
import { formatPhoneNumber } from './auth'

describe('formatPhoneNumber', () => {
  it('formats +66 numbers into Thai 08x-xxx-xxxx pattern', () => {
    expect(formatPhoneNumber('+66812345678')).toBe('081-234-5678')
    expect(formatPhoneNumber('+66987654321')).toBe('098-765-4321')
    expect(formatPhoneNumber('+6621234567')).toBe('02-123-4567')
  })

  it('formats 66 numbers without plus prefix', () => {
    expect(formatPhoneNumber('66812345678')).toBe('081-234-5678')
  })

  it('formats 10-digit 08x numbers', () => {
    expect(formatPhoneNumber('0812345678')).toBe('081-234-5678')
  })

  it('returns empty string for null or undefined or empty', () => {
    expect(formatPhoneNumber(null)).toBe('')
    expect(formatPhoneNumber(undefined)).toBe('')
    expect(formatPhoneNumber('')).toBe('')
    expect(formatPhoneNumber('   ')).toBe('')
  })

  it('preserves masked or non-standard international numbers', () => {
    expect(formatPhoneNumber('+668••••567')).toBe('+668••••567')
    expect(formatPhoneNumber('+14155552671')).toBe('+14155552671')
  })
})
