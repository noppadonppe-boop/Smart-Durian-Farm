import type {
  MembershipChangeInput,
  Phase6Adapters,
  PhoneOtpChallenge,
  PhoneOtpGateway,
} from '../contracts'
import type {
  AuthenticatedIdentity,
  CanonicalRole,
  FarmAccess,
  FarmMember,
  FarmStatus,
  MembershipAuditEvent,
  MembershipStatus,
} from '../../domain/farm'
import demoSeed from '../../demo/phase2-demo-seed.json'
import type { TreePositionDetail } from '../../domain/treeRegister'
import { MockTreeRegisterRepository } from './mockTreeRegisterRepository'
import { MockWorkCareDiseaseRepository } from './mockWorkCareDiseaseRepository'
import { MockCommercialTraceabilityRepository } from './mockCommercialTraceabilityRepository'
import { MockOperationalHardeningRepository } from './mockOperationalHardeningRepository'
import { MockDiseaseAnalysisRepository } from './mockDiseaseAnalysisRepository'

interface DemoMembership {
  farmId: string
  role: CanonicalRole
  status: MembershipStatus
  version: number
}

interface DemoUser {
  userId: string
  displayName: string
  phoneNumber: string
  mockOtp: string
  isOrganizationOwner: boolean
  memberships: DemoMembership[]
}

interface DemoFarm {
  farmId: string
  farmCode: string
  farmSequence: string
  farmName: string
  status: FarmStatus
}

function normalizedPhone(value: string): string {
  return value.replace(/[\s()-]/gu, '')
}

export function maskDemoPhone(phoneNumber: string): string {
  return `${phoneNumber.slice(0, 4)}••••${phoneNumber.slice(-3)}`
}

const seedUsers = demoSeed.users as DemoUser[]
const seedFarms = demoSeed.farms as DemoFarm[]

class MockPhoneOtpGateway implements PhoneOtpGateway {
  private identity: AuthenticatedIdentity | null = null
  private readonly listeners = new Set<(identity: AuthenticatedIdentity | null) => void>()

  constructor(private readonly users: DemoUser[]) {}

  subscribe(listener: (identity: AuthenticatedIdentity | null) => void): () => void {
    this.listeners.add(listener)
    queueMicrotask(() => listener(this.identity))
    return () => this.listeners.delete(listener)
  }

  requestOtp(phoneNumber: string): Promise<PhoneOtpChallenge> {
    const phone = normalizedPhone(phoneNumber)
    const user = this.users.find((candidate) => candidate.phoneNumber === phone)
    if (!user) {
      return Promise.reject(
        new Error('ใช้ได้เฉพาะหมายเลขทดสอบที่แสดงในหน้านี้เท่านั้น'),
      )
    }

    return Promise.resolve({ challengeId: `mock:${user.userId}`, phoneNumber: phone })
  }

  verifyOtp(
    challenge: PhoneOtpChallenge,
    code: string,
  ): Promise<AuthenticatedIdentity> {
    const user = this.users.find(
      (candidate) =>
        candidate.phoneNumber === challenge.phoneNumber && candidate.mockOtp === code,
    )
    if (!user) throw new Error('รหัส OTP จำลองไม่ถูกต้อง')

    this.identity = {
      userId: user.userId,
      displayName: user.displayName,
      maskedPhone: maskDemoPhone(user.phoneNumber),
      source: 'mock',
    }
    this.listeners.forEach((listener) => listener(this.identity))
    return Promise.resolve(this.identity)
  }

  signOut(): Promise<void> {
    this.identity = null
    this.listeners.forEach((listener) => listener(null))
    return Promise.resolve()
  }
}

class MockPhase2Repository {
  private readonly auditEvents: MembershipAuditEvent[] = []

  constructor(
    private readonly users: DemoUser[],
    private readonly farms: DemoFarm[],
  ) {}

  listFarmAccess(userId: string): Promise<readonly FarmAccess[]> {
    const user = this.users.find((candidate) => candidate.userId === userId)
    if (!user) return Promise.resolve([])

    return Promise.resolve(
      user.memberships
        .filter((membership) => membership.status === 'ACTIVE')
        .map((membership) => {
        const farm = this.farms.find((candidate) => candidate.farmId === membership.farmId)
        if (!farm) throw new Error(`Demo farm not found: ${membership.farmId}`)

        return {
          organizationId: demoSeed.organization.organizationId,
          organizationName: demoSeed.organization.organizationName,
          organizationCode: demoSeed.organization.organizationCode,
          farmId: farm.farmId,
          farmCode: farm.farmCode,
          farmSequence: farm.farmSequence,
          farmName: farm.farmName,
          farmStatus: farm.status,
          membershipStatus: membership.status,
          role: membership.role,
          isOrganizationOwner: user.isOrganizationOwner,
          isMock: true,
          }
        }),
    )
  }

  listFarmMembers(
    organizationId: string,
    farmId: string,
  ): Promise<readonly FarmMember[]> {
    if (organizationId !== demoSeed.organization.organizationId) {
      return Promise.resolve([])
    }

    return Promise.resolve(
      this.users.flatMap((user) => {
        const membership = user.memberships.find((candidate) => candidate.farmId === farmId)
        if (!membership) return []
        return [
          {
            organizationId,
            farmId,
            userId: user.userId,
            displayName: user.displayName,
            maskedPhone: maskDemoPhone(user.phoneNumber),
            role: membership.role,
            status: membership.status,
            version: membership.version,
          },
        ]
      }),
    )
  }

  changeFarmMembership(input: MembershipChangeInput): Promise<MembershipAuditEvent> {
    const actor = this.users.find((candidate) => candidate.userId === input.actor.userId)
    if (!actor?.isOrganizationOwner) {
      throw new Error('เฉพาะเจ้าขององค์กรเท่านั้นที่เปลี่ยนสิทธิ์สมาชิกได้ใน Phase 2')
    }

    const target = this.users.find((candidate) => candidate.userId === input.targetUserId)
    const membership = target?.memberships.find(
      (candidate) => candidate.farmId === input.farmId,
    )
    if (!target || !membership) throw new Error('ไม่พบสมาชิกในสวนนี้')
    if (target.userId === actor.userId) {
      throw new Error('ไม่อนุญาตให้เปลี่ยนสิทธิ์ของบัญชีที่กำลังใช้งาน')
    }

    const beforeRole = membership.role
    const beforeStatus = membership.status
    membership.role = input.nextRole
    membership.status = input.nextStatus
    membership.version += 1

    const eventType =
      beforeStatus === 'REVOKED' && input.nextStatus === 'ACTIVE'
        ? 'MEMBERSHIP_RESTORED'
        : input.nextStatus === 'REVOKED'
          ? 'MEMBERSHIP_REVOKED'
          : 'ROLE_CHANGED'
    const event: MembershipAuditEvent = {
      auditEventId: `audit_demo_${crypto.randomUUID()}`,
      organizationId: input.organizationId,
      farmId: input.farmId,
      actorUserId: actor.userId,
      actorDisplayName: actor.displayName,
      targetUserId: target.userId,
      targetDisplayName: target.displayName,
      eventType,
      beforeRole,
      afterRole: membership.role,
      beforeStatus,
      afterStatus: membership.status,
      membershipVersion: membership.version,
      createdAtLabel: 'เมื่อสักครู่ · เวลาจำลองในเครื่อง',
    }
    this.auditEvents.unshift(event)
    return Promise.resolve(event)
  }

  listMembershipAudit(
    organizationId: string,
    farmId: string,
  ): Promise<readonly MembershipAuditEvent[]> {
    return Promise.resolve(
      this.auditEvents.filter(
        (event) =>
          event.organizationId === organizationId && event.farmId === farmId,
      ),
    )
  }
}

export function createMockPhase2Adapters(): Phase6Adapters {
  const users = structuredClone(seedUsers)
  const farms = structuredClone(seedFarms)
  const treeRepository = new MockTreeRegisterRepository(
    structuredClone(demoSeed.treePositions) as unknown as TreePositionDetail[],
  )
  const workRepository = new MockWorkCareDiseaseRepository()
  return {
    auth: new MockPhoneOtpGateway(users),
    repository: new MockPhase2Repository(users, farms),
    treeRepository,
    workRepository,
    commercialRepository: new MockCommercialTraceabilityRepository(),
    operationalRepository: new MockOperationalHardeningRepository(),
    diseaseAnalysisRepository: new MockDiseaseAnalysisRepository(workRepository, treeRepository),
    mode: 'mock',
  }
}
