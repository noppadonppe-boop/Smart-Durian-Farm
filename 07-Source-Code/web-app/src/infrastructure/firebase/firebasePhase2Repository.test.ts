import { describe, expect, it } from 'vitest'

import { isOperationalFarmProfile, memberFromData } from './firebasePhase2Repository'

describe('FirebasePhase2Repository membership parsing', () => {
  it('accepts an empty maskedPhone for Google and email accounts', () => {
    expect(memberFromData({
      organizationId: 'org_cmg001',
      farmId: 'farm_active_01',
      userId: 'user_google_01',
      displayName: 'Google User',
      maskedPhone: '',
      role: 'FARM_MANAGER',
      status: 'ACTIVE',
      version: 1,
    })).toMatchObject({
      userId: 'user_google_01',
      maskedPhone: '',
      role: 'FARM_MANAGER',
    })
  })
})

describe('FirebasePhase2Repository Farm Profile classification', () => {
  it('keeps only trusted Operational profiles out of the production selector', () => {
    expect(isOperationalFarmProfile({
      classification: 'OPERATIONAL',
      exampleData: false,
    })).toBe(true)
    expect(isOperationalFarmProfile({
      classification: 'SIMULATED/TEST ONLY',
      exampleData: true,
    })).toBe(false)
    expect(isOperationalFarmProfile({
      classification: 'OPERATIONAL',
      exampleData: true,
    })).toBe(false)
  })
})
