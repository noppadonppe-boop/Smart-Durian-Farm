import type {
  ChangeFarmStatusInput,
  CreateFarmInput,
  MembershipChangeInput,
  Phase6Adapters,
  PhoneOtpChallenge,
  PhoneOtpGateway,
  UpdateFarmProfileInput,
  WorkCareDiseaseRepository,
  OperationalHardeningRepository,
} from '../contracts'
import type {
  AuthenticatedIdentity,
  CanonicalRole,
  FarmAccess,
  FarmArchiveReadiness,
  FarmAuditEvent,
  FarmAuditEventType,
  FarmManagementContext,
  FarmMember,
  FarmMutationResult,
  FarmProfile,
  MembershipAuditEvent,
  MembershipStatus,
} from '../../domain/farm'
import {
  assertOrganizationOwner,
  deriveFarmCode,
  farmAuditSnapshot,
  isValidFarmStatusTransition,
  normalizeFarmProfileDraft,
} from '../../domain/farm'
import demoSeed from '../../demo/phase2-demo-seed.json'
import type { TreePositionDetail } from '../../domain/treeRegister'
import { MockTreeRegisterRepository } from './mockTreeRegisterRepository'
import { MockWorkCareDiseaseRepository } from './mockWorkCareDiseaseRepository'
import { MockCommercialTraceabilityRepository } from './mockCommercialTraceabilityRepository'
import { MockOperationalHardeningRepository } from './mockOperationalHardeningRepository'
import { MockDiseaseAnalysisRepository } from './mockDiseaseAnalysisRepository'
import { MockAnnualCycleRepository } from './mockAnnualCycleRepository'
import { MockManagementReportingRepository } from './mockManagementReportingRepository'
import type { AuthAdapterMode } from '../../config/environment'

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

type DemoFarm = Omit<FarmProfile, 'organizationId'>

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

  cancelOtp(): void {
    // Mock challenges have no external resource to release.
  }

  signOut(): Promise<void> {
    this.identity = null
    this.listeners.forEach((listener) => listener(null))
    return Promise.resolve()
  }
}

class MockPhase2Repository {
  private readonly membershipAuditEvents: MembershipAuditEvent[] = []
  private readonly farmAuditEvents: FarmAuditEvent[] = []
  private readonly farmOperations = new Map<string, {
    operationType: 'CREATE' | 'UPDATE_PROFILE' | 'CHANGE_STATUS'
    farmId: string
    result: FarmMutationResult
  }>()

  constructor(
    private readonly users: DemoUser[],
    private readonly farms: DemoFarm[],
    private readonly workRepository: WorkCareDiseaseRepository,
    private readonly operationalRepository: OperationalHardeningRepository,
  ) {
    for (const farm of farms) {
      const current = this.profileFromFarm(farm)
      const created: FarmProfile = {
        ...current,
        status: 'ACTIVE',
        version: 1,
        updatedAtLabel: current.createdAtLabel,
        updatedBy: current.createdBy,
      }
      const createdSnapshot = farmAuditSnapshot(created)
      this.farmAuditEvents.push({
        auditEventId: `audit_seed_farm_created_${farm.farmSequence.toLowerCase()}`,
        organizationId: current.organizationId,
        farmId: current.farmId,
        actorUserId: 'system_demo',
        actorDisplayName: 'ระบบข้อมูลจำลอง',
        eventType: 'FARM_CREATED',
        before: null,
        after: createdSnapshot,
        farmVersion: 1,
        idempotencyKey: `seed-create-${farm.farmSequence.toLowerCase()}`,
        createdAtLabel: current.createdAtLabel,
        classification: 'SIMULATED/TEST ONLY',
        exampleData: true,
      })
      if (current.status !== 'ACTIVE') {
        this.farmAuditEvents.unshift({
          auditEventId: `audit_seed_farm_status_${farm.farmSequence.toLowerCase()}`,
          organizationId: current.organizationId,
          farmId: current.farmId,
          actorUserId: 'system_demo',
          actorDisplayName: 'ระบบข้อมูลจำลอง',
          eventType: current.status === 'SUSPENDED' ? 'FARM_SUSPENDED' : 'FARM_ARCHIVED',
          before: createdSnapshot,
          after: farmAuditSnapshot(current),
          farmVersion: current.version,
          idempotencyKey: `seed-status-${farm.farmSequence.toLowerCase()}`,
          createdAtLabel: current.updatedAtLabel,
          classification: 'SIMULATED/TEST ONLY',
          exampleData: true,
        })
      }
    }
  }

  private assertOrganizationScope(context: FarmManagementContext): void {
    if (
      context.organizationId !== demoSeed.organization.organizationId ||
      context.organizationCode !== demoSeed.organization.organizationCode
    ) {
      throw new Error('ปฏิเสธ Organization scope ที่ไม่ตรงกับบริบทที่ยืนยันแล้ว')
    }
  }

  private requireOwner(context: FarmManagementContext): DemoUser {
    this.assertOrganizationScope(context)
    assertOrganizationOwner(context)
    const actor = this.users.find((candidate) => candidate.userId === context.actor.userId)
    if (!actor?.isOrganizationOwner) {
      throw new Error('เฉพาะ ORG_OWNER เท่านั้นที่จัดการสวนได้')
    }
    return actor
  }

  private profileFromFarm(farm: DemoFarm): FarmProfile {
    return {
      organizationId: demoSeed.organization.organizationId,
      ...structuredClone(farm),
    }
  }

  private farmAccessFor(user: DemoUser, farm: DemoFarm): FarmAccess | undefined {
    const membership = user.memberships.find(
      (candidate) => candidate.farmId === farm.farmId && candidate.status === 'ACTIVE',
    )
    if (!membership) return undefined
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
  }

  private operationKey(context: FarmManagementContext, idempotencyKey: string): string {
    const normalized = idempotencyKey.trim()
    if (!normalized || normalized.length > 128) {
      throw new Error('Idempotency key ต้องมี 1–128 ตัวอักษร')
    }
    return `${context.organizationId}:${context.actor.userId}:${normalized}`
  }

  private retryResult(
    context: FarmManagementContext,
    idempotencyKey: string,
    operationType: 'CREATE' | 'UPDATE_PROFILE' | 'CHANGE_STATUS',
    farmId?: string,
  ): FarmMutationResult | undefined {
    const existing = this.farmOperations.get(this.operationKey(context, idempotencyKey))
    if (!existing) return undefined
    if (existing.operationType !== operationType || (farmId && existing.farmId !== farmId)) {
      throw new Error('Idempotency key นี้ถูกใช้กับคำสั่งอื่นแล้ว')
    }
    return structuredClone({ ...existing.result, wasRetry: true })
  }

  private rememberOperation(
    context: FarmManagementContext,
    idempotencyKey: string,
    operationType: 'CREATE' | 'UPDATE_PROFILE' | 'CHANGE_STATUS',
    result: FarmMutationResult,
  ): FarmMutationResult {
    this.farmOperations.set(this.operationKey(context, idempotencyKey), {
      operationType,
      farmId: result.profile.farmId,
      result: structuredClone(result),
    })
    return structuredClone(result)
  }

  private createFarmAudit(
    context: FarmManagementContext,
    idempotencyKey: string,
    eventType: FarmAuditEventType,
    before: FarmProfile | null,
    after: FarmProfile,
  ): FarmAuditEvent {
    const event: FarmAuditEvent = {
      auditEventId: `audit_farm_${crypto.randomUUID()}`,
      organizationId: context.organizationId,
      farmId: after.farmId,
      actorUserId: context.actor.userId,
      actorDisplayName: context.actor.displayName,
      eventType,
      before: before ? farmAuditSnapshot(before) : null,
      after: farmAuditSnapshot(after),
      farmVersion: after.version,
      idempotencyKey,
      createdAtLabel: 'เมื่อสักครู่ · เวลาจำลองในเครื่อง',
      classification: 'SIMULATED/TEST ONLY',
      exampleData: true,
    }
    this.farmAuditEvents.unshift(event)
    return event
  }

  listFarmAccess(userId: string): Promise<readonly FarmAccess[]> {
    const user = this.users.find((candidate) => candidate.userId === userId)
    if (!user) return Promise.resolve([])

    return Promise.resolve(
      this.farms.flatMap((farm) => this.farmAccessFor(user, farm) ?? []),
    )
  }

  async listFarmProfiles(context: FarmManagementContext): Promise<readonly FarmProfile[]> {
    this.requireOwner(context)
    return Promise.resolve(this.farms.map((farm) => this.profileFromFarm(farm)))
  }

  async getFarmProfile(
    context: FarmManagementContext,
    farmId: string,
  ): Promise<FarmProfile | undefined> {
    this.assertOrganizationScope(context)
    const actor = this.users.find((candidate) => candidate.userId === context.actor.userId)
    const farm = this.farms.find((candidate) => candidate.farmId === farmId)
    if (!actor || !farm) return Promise.resolve(undefined)
    const hasMembership = actor.memberships.some(
      (membership) => membership.farmId === farmId && membership.status === 'ACTIVE',
    )
    if (!actor.isOrganizationOwner && !hasMembership) return Promise.resolve(undefined)
    return Promise.resolve(this.profileFromFarm(farm))
  }

  async createFarm(input: CreateFarmInput): Promise<FarmMutationResult> {
    await Promise.resolve()
    const actor = this.requireOwner(input.context)
    const retry = this.retryResult(input.context, input.idempotencyKey, 'CREATE')
    if (retry) return retry
    const draft = normalizeFarmProfileDraft(input.draft)
    const farmCode = deriveFarmCode(input.context.organizationCode, draft.farmSequence)
    if (this.farms.some(
      (farm) => farm.farmSequence === draft.farmSequence || farm.farmCode === farmCode,
    )) {
      throw new Error(`Farm Sequence หรือ Farm Code ${farmCode} ถูกใช้แล้วใน Organization นี้`)
    }

    const timestampLabel = 'เมื่อสักครู่ · เวลาจำลองในเครื่อง'
    const profile: FarmProfile = {
      organizationId: input.context.organizationId,
      farmId: `farm_${crypto.randomUUID().replaceAll('-', '')}`,
      ...draft,
      farmCode,
      status: 'ACTIVE',
      version: 1,
      createdAtLabel: timestampLabel,
      updatedAtLabel: timestampLabel,
      createdBy: input.context.actor.userId,
      updatedBy: input.context.actor.userId,
      classification: 'SIMULATED/TEST ONLY',
      exampleData: true,
    }
    const { organizationId, ...farm } = profile
    void organizationId
    this.farms.push(farm)
    actor.memberships.push({
      farmId: profile.farmId,
      role: 'ORG_OWNER',
      status: 'ACTIVE',
      version: 1,
    })
    const auditEvent = this.createFarmAudit(
      input.context,
      input.idempotencyKey,
      'FARM_CREATED',
      null,
      profile,
    )
    return this.rememberOperation(input.context, input.idempotencyKey, 'CREATE', {
      profile,
      auditEvent,
      wasRetry: false,
    })
  }

  async updateFarmProfile(input: UpdateFarmProfileInput): Promise<FarmMutationResult> {
    await Promise.resolve()
    this.requireOwner(input.context)
    const retry = this.retryResult(
      input.context,
      input.idempotencyKey,
      'UPDATE_PROFILE',
      input.farmId,
    )
    if (retry) return retry
    const farm = this.farms.find((candidate) => candidate.farmId === input.farmId)
    if (!farm) throw new Error('ไม่พบ Farm Profile ใน Organization นี้')
    const before = this.profileFromFarm(farm)
    const draft = normalizeFarmProfileDraft(input.draft)
    if (draft.farmSequence !== farm.farmSequence) {
      throw new Error('Farm Sequence และ Farm Code เปลี่ยนไม่ได้หลังสร้าง')
    }
    Object.assign(farm, {
      ...draft,
      farmSequence: before.farmSequence,
      farmCode: before.farmCode,
      version: before.version + 1,
      updatedAtLabel: 'เมื่อสักครู่ · เวลาจำลองในเครื่อง',
      updatedBy: input.context.actor.userId,
    })
    const profile = this.profileFromFarm(farm)
    const auditEvent = this.createFarmAudit(
      input.context,
      input.idempotencyKey,
      'FARM_PROFILE_UPDATED',
      before,
      profile,
    )
    return this.rememberOperation(input.context, input.idempotencyKey, 'UPDATE_PROFILE', {
      profile,
      auditEvent,
      wasRetry: false,
    })
  }

  async getFarmArchiveReadiness(
    context: FarmManagementContext,
    farmId: string,
  ): Promise<FarmArchiveReadiness> {
    const actor = this.requireOwner(context)
    const farm = this.farms.find((candidate) => candidate.farmId === farmId)
    if (!farm) throw new Error('ไม่พบ Farm Profile ใน Organization นี้')
    const access = this.farmAccessFor(actor, farm)
    if (!access) throw new Error('Farm นี้ไม่มี Owner membership ที่ใช้งานอยู่')
    const [workOrders, offlineOperations] = await Promise.all([
      this.workRepository.listWorkOrders({ actor: context.actor, farm: access }),
      this.operationalRepository.listOfflineOperations({ actor: context.actor, farm: access }),
    ])
    const openWorkOrders = workOrders
      .filter((work) => work.status !== 'CLOSED')
      .map((work) => ({
        kind: 'OPEN_WORK_ORDER' as const,
        recordId: work.workOrderId,
        label: work.title,
        status: work.status,
      }))
    const pendingOperations = offlineOperations
      .filter((operation) => operation.status !== 'SYNCED')
      .map((operation) => ({
        kind: 'PENDING_OPERATION' as const,
        recordId: operation.operationId,
        label: operation.kind,
        status: operation.status,
      }))
    return {
      organizationId: context.organizationId,
      farmId,
      openWorkOrders,
      pendingOperations,
      canArchive: openWorkOrders.length === 0 && pendingOperations.length === 0,
    }
  }

  async changeFarmStatus(input: ChangeFarmStatusInput): Promise<FarmMutationResult> {
    this.requireOwner(input.context)
    const retry = this.retryResult(
      input.context,
      input.idempotencyKey,
      'CHANGE_STATUS',
      input.farmId,
    )
    if (retry) return retry
    const farm = this.farms.find((candidate) => candidate.farmId === input.farmId)
    if (!farm) throw new Error('ไม่พบ Farm Profile ใน Organization นี้')
    if (!isValidFarmStatusTransition(farm.status, input.nextStatus)) {
      throw new Error(`ไม่อนุญาตเปลี่ยนสถานะจาก ${farm.status} เป็น ${input.nextStatus}`)
    }
    if (input.nextStatus === 'ARCHIVED') {
      const readiness = await this.getFarmArchiveReadiness(input.context, input.farmId)
      const pendingCount = readiness.pendingOperations.length + input.knownPendingOperationIds.length
      if (readiness.openWorkOrders.length > 0 || pendingCount > 0) {
        throw new Error(
          `ยัง Archive ไม่ได้: มีงานเปิด ${readiness.openWorkOrders.length} งาน และรายการ Pending ${pendingCount} รายการ`,
        )
      }
    }

    const before = this.profileFromFarm(farm)
    farm.status = input.nextStatus
    farm.version += 1
    farm.updatedAtLabel = 'เมื่อสักครู่ · เวลาจำลองในเครื่อง'
    farm.updatedBy = input.context.actor.userId
    const profile = this.profileFromFarm(farm)
    const eventType: FarmAuditEventType = input.nextStatus === 'SUSPENDED'
      ? 'FARM_SUSPENDED'
      : input.nextStatus === 'ACTIVE'
        ? 'FARM_REACTIVATED'
        : 'FARM_ARCHIVED'
    const auditEvent = this.createFarmAudit(
      input.context,
      input.idempotencyKey,
      eventType,
      before,
      profile,
    )
    return this.rememberOperation(input.context, input.idempotencyKey, 'CHANGE_STATUS', {
      profile,
      auditEvent,
      wasRetry: false,
    })
  }

  listFarmAudit(
    context: FarmManagementContext,
    farmId: string,
  ): Promise<readonly FarmAuditEvent[]> {
    this.requireOwner(context)
    return Promise.resolve(this.farmAuditEvents
      .filter((event) => event.farmId === farmId)
      .map((event) => structuredClone(event)))
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
    this.membershipAuditEvents.unshift(event)
    return Promise.resolve(event)
  }

  listMembershipAudit(
    organizationId: string,
    farmId: string,
  ): Promise<readonly MembershipAuditEvent[]> {
    return Promise.resolve(
      this.membershipAuditEvents.filter(
        (event) =>
          event.organizationId === organizationId && event.farmId === farmId,
      ),
    )
  }
}

interface CreateMockAdaptersOptions {
  auth?: PhoneOtpGateway
  authMode?: AuthAdapterMode
}

export function createMockPhase2Adapters(
  options: CreateMockAdaptersOptions = {},
): Phase6Adapters {
  const users = structuredClone(seedUsers)
  const farms = structuredClone(seedFarms)
  const treeRepository = new MockTreeRegisterRepository(
    structuredClone(demoSeed.treePositions) as unknown as TreePositionDetail[],
  )
  const workRepository = new MockWorkCareDiseaseRepository()
  const operationalRepository = new MockOperationalHardeningRepository()
  const annualCycleRepository = new MockAnnualCycleRepository()
  return {
    auth: options.auth ?? new MockPhoneOtpGateway(users),
    repository: new MockPhase2Repository(
      users,
      farms,
      workRepository,
      operationalRepository,
    ),
    treeRepository,
    workRepository,
    commercialRepository: new MockCommercialTraceabilityRepository(annualCycleRepository),
    operationalRepository,
    diseaseAnalysisRepository: new MockDiseaseAnalysisRepository(workRepository, treeRepository),
    annualCycleRepository,
    managementReportingRepository: new MockManagementReportingRepository(),
    mode: 'mock',
    authMode: options.authMode ?? 'mock',
  }
}
