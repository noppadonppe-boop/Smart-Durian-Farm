import {
  deriveFarmCode,
  isValidFarmStatusTransition,
  normalizeFarmProfileDraft,
  permissionsFor,
  type FarmAccess,
  type FarmProfileDraft,
} from './farm'

function access(overrides: Partial<FarmAccess> = {}): FarmAccess {
  return {
    organizationId: 'org_demo',
    organizationName: 'องค์กรจำลอง',
    organizationCode: 'DEMO',
    farmId: 'farm_demo',
    farmCode: 'DEMO-F01',
    farmSequence: 'F01',
    farmName: 'สวนจำลอง',
    farmStatus: 'ACTIVE',
    membershipStatus: 'ACTIVE',
    role: 'WORKER',
    isOrganizationOwner: false,
    isMock: true,
    ...overrides,
  }
}

describe('least-privilege farm permissions', () => {
  it('keeps worker operational access without admin or audit access', () => {
    expect(permissionsFor(access())).toEqual({
      canWriteOperationalData: true,
      canManageMemberships: false,
      canReadAudit: false,
      canExport: false,
      isReadOnly: false,
    })
  })

  it('gives organization owners membership access even with a farm-specific role', () => {
    const permissions = permissionsFor(
      access({ role: 'FARM_MANAGER', isOrganizationOwner: true }),
    )
    expect(permissions.canManageMemberships).toBe(true)
    expect(permissions.canReadAudit).toBe(true)
  })

  it.each(['SUSPENDED', 'ARCHIVED'] as const)(
    'makes a %s farm read-only',
    (farmStatus) => {
      expect(permissionsFor(access({ farmStatus })).isReadOnly).toBe(true)
      expect(permissionsFor(access({ farmStatus })).canWriteOperationalData).toBe(false)
    },
  )

  it.each(['VIEWER', 'AUDITOR'] as const)('keeps %s operational data read-only', (role) => {
    expect(permissionsFor(access({ role })).canWriteOperationalData).toBe(false)
  })
})

const validDraft: FarmProfileDraft = {
  farmName: 'สวนทดสอบ — ข้อมูลจำลอง',
  farmSequence: 'f05',
  province: 'TBD',
  district: '',
  subdistrict: '',
  locationNote: 'SIMULATED/TEST ONLY',
  timezone: 'Asia/Bangkok',
  seasonStartMonth: 1,
  seasonEndMonth: 7,
  seasonNote: 'ข้อมูลฤดูกาลจำลอง',
  notes: 'SIMULATED/TEST ONLY',
}

describe('Farm Profile validation and lifecycle', () => {
  it('normalizes Farm Sequence and derives Farm Code from the organization', () => {
    const normalized = normalizeFarmProfileDraft(validDraft)
    expect(normalized.farmSequence).toBe('F05')
    expect(deriveFarmCode('demo', normalized.farmSequence)).toBe('DEMO-F05')
  })

  it('requires season months as a pair and keeps them in range', () => {
    expect(() => normalizeFarmProfileDraft({
      ...validDraft,
      seasonEndMonth: null,
    })).toThrow(/กรอกเป็นคู่/u)
    expect(() => normalizeFarmProfileDraft({
      ...validDraft,
      seasonStartMonth: 0,
    })).toThrow(/1–12/u)
  })

  it('allows only approved status transitions and never reopens an archived Farm', () => {
    expect(isValidFarmStatusTransition('ACTIVE', 'SUSPENDED')).toBe(true)
    expect(isValidFarmStatusTransition('SUSPENDED', 'ACTIVE')).toBe(true)
    expect(isValidFarmStatusTransition('ACTIVE', 'ARCHIVED')).toBe(true)
    expect(isValidFarmStatusTransition('SUSPENDED', 'ARCHIVED')).toBe(true)
    expect(isValidFarmStatusTransition('ARCHIVED', 'ACTIVE')).toBe(false)
    expect(isValidFarmStatusTransition('ACTIVE', 'ACTIVE')).toBe(false)
  })
})
