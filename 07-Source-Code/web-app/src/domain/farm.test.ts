import { permissionsFor, type FarmAccess } from './farm'

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
