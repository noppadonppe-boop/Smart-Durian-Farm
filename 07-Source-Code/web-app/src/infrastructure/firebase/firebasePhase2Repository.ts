import {
  collectionGroup,
  getDoc,
  getDocs,
  getDocsFromServer,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
  type DocumentData,
  type Firestore,
  type Transaction,
} from 'firebase/firestore'

import type {
  ChangeFarmStatusInput,
  CreateFarmInput,
  MembershipChangeInput,
  Phase2Repository,
  UpdateFarmProfileInput,
} from '../../adapters/contracts'
import {
  assertOrganizationOwner,
  deriveFarmCode,
  farmAuditEventTypes,
  farmAuditSnapshot,
  isCanonicalRole,
  isFarmStatus,
  isMembershipStatus,
  isValidFarmStatusTransition,
  normalizeFarmProfileDraft,
  type FarmAccess,
  type FarmArchiveReadiness,
  type FarmAuditEvent,
  type FarmAuditEventType,
  type FarmDataClassification,
  type FarmManagementContext,
  type FarmMember,
  type FarmMutationResult,
  type FarmProfile,
  type MembershipAuditEvent,
  type MembershipStatus,
} from '../../domain/farm'
import { rootCollection, rootDoc } from './firebaseDataRoot'

function requiredString(data: DocumentData, field: string): string {
  const value: unknown = data[field]
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Invalid Firebase document field: ${field}`)
  }
  return value
}

function stringField(data: DocumentData, field: string): string {
  const value: unknown = data[field]
  if (typeof value !== 'string') throw new Error(`Invalid Firebase document field: ${field}`)
  return value
}

function nullableMonth(data: DocumentData, field: string): number | null {
  const value: unknown = data[field]
  if (value === null) return null
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 12) {
    throw new Error(`Invalid Farm Profile month field: ${field}`)
  }
  return value
}

function timestampLabel(value: unknown): string {
  return value instanceof Timestamp
    ? new Intl.DateTimeFormat('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(value.toDate())
    : 'รอเวลาในข้อมูลจำลอง'
}

function dataClassification(data: DocumentData): {
  classification: FarmDataClassification
  exampleData: boolean
} {
  if (data.classification === 'SIMULATED/TEST ONLY' && data.exampleData === true) {
    return { classification: 'SIMULATED/TEST ONLY', exampleData: true }
  }
  if (data.classification === 'OPERATIONAL' && data.exampleData === false) {
    return { classification: 'OPERATIONAL', exampleData: false }
  }
  throw new Error('Farm Profile มี classification/exampleData ไม่สอดคล้องกัน')
}

function profileFromData(data: DocumentData): FarmProfile {
  const status: unknown = data.status
  const version: unknown = data.version
  if (!isFarmStatus(status) || typeof version !== 'number' || !Number.isInteger(version)) {
    throw new Error('Invalid Farm Profile status or version')
  }
  const classification = dataClassification(data)
  return {
    organizationId: requiredString(data, 'organizationId'),
    farmId: requiredString(data, 'farmId'),
    farmCode: requiredString(data, 'farmCode'),
    farmSequence: requiredString(data, 'farmSequence'),
    farmName: requiredString(data, 'farmName'),
    province: stringField(data, 'province'),
    district: stringField(data, 'district'),
    subdistrict: stringField(data, 'subdistrict'),
    locationNote: stringField(data, 'locationNote'),
    timezone: requiredString(data, 'timezone'),
    seasonStartMonth: nullableMonth(data, 'seasonStartMonth'),
    seasonEndMonth: nullableMonth(data, 'seasonEndMonth'),
    seasonNote: stringField(data, 'seasonNote'),
    status,
    notes: stringField(data, 'notes'),
    version,
    createdAtLabel: timestampLabel(data.createdAt),
    updatedAtLabel: timestampLabel(data.updatedAt),
    createdBy: requiredString(data, 'createdBy'),
    updatedBy: requiredString(data, 'updatedBy'),
    ...classification,
  }
}

export function isOperationalFarmProfile(
  profile: Pick<FarmProfile, 'classification' | 'exampleData'>,
): boolean {
  return profile.classification === 'OPERATIONAL' && profile.exampleData === false
}

async function readFarmProfiles(
  firestore: Firestore,
  organizationId: string,
): Promise<readonly FarmProfile[]> {
  const snapshot = await getDocs(query(
    rootCollection(
      firestore,
      'organizations',
      organizationId,
      'farms',
    ),
    orderBy('farmSequence', 'asc'),
  ))
  return snapshot.docs.map((farmDocument) => profileFromData(farmDocument.data()))
}

/**
 * The user-management farm selector must use the same Firebase Farm Profile
 * source as Farm Management, but it must never expose DEMO/mock profiles.
 */
export async function listOperationalFarmProfiles(
  firestore: Firestore,
  organizationId: string,
): Promise<readonly FarmProfile[]> {
  const profiles = await readFarmProfiles(firestore, organizationId)
  return profiles.filter(isOperationalFarmProfile)
}

function farmAuditFromData(data: DocumentData): FarmAuditEvent {
  const eventType: unknown = data.eventType
  if (!farmAuditEventTypes.includes(eventType as FarmAuditEventType)) {
    throw new Error('Invalid Farm Audit event type')
  }
  const after = data.after as FarmAuditEvent['after'] | undefined
  const before = data.before as FarmAuditEvent['before'] | undefined
  if (!after || typeof after !== 'object' || (before !== null && typeof before !== 'object')) {
    throw new Error('Invalid Farm Audit before/after snapshot')
  }
  const classification = dataClassification(data)
  return {
    auditEventId: requiredString(data, 'auditEventId'),
    organizationId: requiredString(data, 'organizationId'),
    farmId: requiredString(data, 'farmId'),
    actorUserId: requiredString(data, 'actorUserId'),
    actorDisplayName: requiredString(data, 'actorDisplayName'),
    eventType: eventType as FarmAuditEventType,
    before: before ?? null,
    after,
    farmVersion: Number(data.farmVersion),
    idempotencyKey: requiredString(data, 'idempotencyKey'),
    createdAtLabel: timestampLabel(data.createdAt),
    ...classification,
  }
}

function normalizedIdempotencyKey(value: string): string {
  const normalized = value.trim()
  if (!/^[A-Za-z0-9_-]{8,128}$/u.test(normalized)) {
    throw new Error('Idempotency key ต้องมี 8–128 ตัวอักษรและใช้ A–Z, a–z, 0–9, _ หรือ -')
  }
  return normalized
}

export function memberFromData(data: DocumentData): FarmMember {
  const role: unknown = data.role
  const status: unknown = data.status
  const version: unknown = data.version
  if (!isCanonicalRole(role) || !isMembershipStatus(status)) {
    throw new Error('Invalid role or membership status in test data')
  }
  if (typeof version !== 'number' || !Number.isInteger(version)) {
    throw new Error('Invalid membership version in test data')
  }

  return {
    organizationId: requiredString(data, 'organizationId'),
    farmId: requiredString(data, 'farmId'),
    userId: requiredString(data, 'userId'),
    displayName: requiredString(data, 'displayName'),
    // Google/email accounts may not have a phone number. The membership
    // contract requires a string, but an empty string is a valid value.
    maskedPhone: stringField(data, 'maskedPhone'),
    role,
    status,
    version,
  }
}

function eventType(
  beforeStatus: MembershipStatus,
  afterStatus: MembershipStatus,
): MembershipAuditEvent['eventType'] {
  if (beforeStatus === 'REVOKED' && afterStatus === 'ACTIVE') {
    return 'MEMBERSHIP_RESTORED'
  }
  return afterStatus === 'REVOKED' ? 'MEMBERSHIP_REVOKED' : 'ROLE_CHANGED'
}

async function retryResultFromOperation(
  transaction: Transaction,
  firestore: Firestore,
  context: FarmManagementContext,
  operationData: DocumentData,
  expectedOperationType: 'CREATE' | 'UPDATE_PROFILE' | 'CHANGE_STATUS',
  expectedFarmId?: string,
): Promise<FarmMutationResult> {
  const operationType = requiredString(operationData, 'operationType')
  const farmId = requiredString(operationData, 'farmId')
  if (
    operationType !== expectedOperationType ||
    operationData.actorUserId !== context.actor.userId ||
    operationData.organizationId !== context.organizationId ||
    (expectedFarmId && farmId !== expectedFarmId)
  ) {
    throw new Error('Idempotency key นี้ถูกใช้กับคำสั่งอื่นแล้ว')
  }
  const auditEventId = requiredString(operationData, 'auditEventId')
  const [farmDocument, auditDocument] = await Promise.all([
    transaction.get(rootDoc(
      firestore,
      'organizations',
      context.organizationId,
      'farms',
      farmId,
    )),
    transaction.get(rootDoc(
      firestore,
      'organizations',
      context.organizationId,
      'farms',
      farmId,
      'auditEvents',
      auditEventId,
    )),
  ])
  if (!farmDocument.exists() || !auditDocument.exists()) {
    throw new Error('พบ operation เดิมแต่ Farm/Audit ไม่ครบถ้วน กรุณาหยุดและตรวจข้อมูล')
  }
  return {
    profile: profileFromData(farmDocument.data()),
    auditEvent: farmAuditFromData(auditDocument.data()),
    wasRetry: true,
  }
}

export class FirebasePhase2Repository implements Phase2Repository {
  private readonly classification: FarmDataClassification

  constructor(
    private readonly firestore: Firestore,
    private readonly exampleData = true,
    private readonly timeLabel = 'Firebase',
  ) {
    this.classification = exampleData ? 'SIMULATED/TEST ONLY' : 'OPERATIONAL'
  }

  async listFarmAccess(userId: string): Promise<readonly FarmAccess[]> {
    const membershipQuery = query(
      collectionGroup(this.firestore, 'members'),
      where('membershipType', '==', 'FARM'),
      where('userId', '==', userId),
      where('status', '==', 'ACTIVE'),
    )
    const membershipSnapshot = await getDocs(membershipQuery)

    const farms = await Promise.all(
      membershipSnapshot.docs.map(async (membershipDocument) => {
        const member = memberFromData(membershipDocument.data())
        const farmReference = rootDoc(
          this.firestore,
          'organizations',
          member.organizationId,
          'farms',
          member.farmId,
        )
        const organizationReference = rootDoc(
          this.firestore,
          'organizations',
          member.organizationId,
        )
        const organizationMemberReference = rootDoc(
          this.firestore,
          'organizations',
          member.organizationId,
          'members',
          userId,
        )
        const [farmDocument, organizationDocument, organizationMemberDocument] =
          await Promise.all([
            getDoc(farmReference),
            getDoc(organizationReference),
            getDoc(organizationMemberReference),
          ])
        if (!farmDocument.exists() || !organizationDocument.exists()) {
          throw new Error('ข้อมูลสมาชิกอ้างถึงสวนหรือองค์กรที่ไม่มีใน Firebase')
        }

        const farm = farmDocument.data()
        const organization = organizationDocument.data()
        const farmStatus: unknown = farm.status
        if (!isFarmStatus(farmStatus)) throw new Error('Invalid farm status')

        const classification = dataClassification(farm)
        return {
          organizationId: member.organizationId,
          organizationName: requiredString(organization, 'organizationName'),
          organizationCode: requiredString(organization, 'organizationCode'),
          farmId: member.farmId,
          farmCode: requiredString(farm, 'farmCode'),
          farmSequence: requiredString(farm, 'farmSequence'),
          farmName: requiredString(farm, 'farmName'),
          farmStatus,
          membershipStatus: member.status,
          role: member.role,
          isOrganizationOwner:
            organizationMemberDocument.exists() &&
            organizationMemberDocument.data().isOwner === true,
          isMock: classification.exampleData,
        }
      }),
    )
    return this.exampleData ? farms : farms.filter((farm) => !farm.isMock)
  }

  async listFarmProfiles(
    context: FarmManagementContext,
  ): Promise<readonly FarmProfile[]> {
    assertOrganizationOwner(context)
    const profiles = await readFarmProfiles(this.firestore, context.organizationId)
    return this.exampleData ? profiles : profiles.filter(isOperationalFarmProfile)
  }

  async getFarmProfile(
    context: FarmManagementContext,
    farmId: string,
  ): Promise<FarmProfile | undefined> {
    const snapshot = await getDoc(rootDoc(
      this.firestore,
      'organizations',
      context.organizationId,
      'farms',
      farmId,
    ))
    return snapshot.exists() ? profileFromData(snapshot.data()) : undefined
  }

  async createFarm(input: CreateFarmInput): Promise<FarmMutationResult> {
    assertOrganizationOwner(input.context)
    const idempotencyKey = normalizedIdempotencyKey(input.idempotencyKey)
    const draft = normalizeFarmProfileDraft(input.draft)
    const farmCode = deriveFarmCode(
      input.context.organizationCode,
      draft.farmSequence,
    )
    const operationReference = rootDoc(
      this.firestore,
      'organizations',
      input.context.organizationId,
      'farmOperations',
      idempotencyKey,
    )
    const existingOperation = await getDoc(operationReference)
    if (!existingOperation.exists()) {
      const existingFarmSnapshot = await getDocs(query(
        rootCollection(
          this.firestore,
          'organizations',
          input.context.organizationId,
          'farms',
        ),
        where('farmSequence', '==', draft.farmSequence),
        limit(1),
      ))
      if (!existingFarmSnapshot.empty) {
        throw new Error(`Farm Sequence หรือ Farm Code ${farmCode} ถูกใช้แล้วใน Organization นี้`)
      }
    }

    const farmId = `farm_${crypto.randomUUID().replaceAll('-', '')}`
    const auditEventId = `audit_farm_${crypto.randomUUID()}`
    const farmReference = rootDoc(
      this.firestore,
      'organizations',
      input.context.organizationId,
      'farms',
      farmId,
    )
    const guardReference = rootDoc(
      this.firestore,
      'organizations',
      input.context.organizationId,
      'farmSequenceGuards',
      draft.farmSequence,
    )
    const auditReference = rootDoc(
      this.firestore,
      'organizations',
      input.context.organizationId,
      'farms',
      farmId,
      'auditEvents',
      auditEventId,
    )
    const ownerMembershipReference = rootDoc(
      this.firestore,
      'organizations',
      input.context.organizationId,
      'farms',
      farmId,
      'members',
      input.context.actor.userId,
    )

    return runTransaction(this.firestore, async (transaction) => {
      const operationDocument = await transaction.get(operationReference)
      if (operationDocument.exists()) {
        return retryResultFromOperation(
          transaction,
          this.firestore,
          input.context,
          operationDocument.data(),
          'CREATE',
        )
      }
      const guardDocument = await transaction.get(guardReference)
      if (guardDocument.exists()) {
        throw new Error(`Farm Sequence หรือ Farm Code ${farmCode} ถูกใช้แล้วใน Organization นี้`)
      }

      const timestampText = this.timeLabel
      const profile: FarmProfile = {
        organizationId: input.context.organizationId,
        farmId,
        ...draft,
        farmCode,
        status: 'ACTIVE',
        version: 1,
        createdAtLabel: timestampText,
        updatedAtLabel: timestampText,
        createdBy: input.context.actor.userId,
        updatedBy: input.context.actor.userId,
        classification: this.classification,
        exampleData: this.exampleData,
      }
      const auditEvent: FarmAuditEvent = {
        auditEventId,
        organizationId: input.context.organizationId,
        farmId,
        actorUserId: input.context.actor.userId,
        actorDisplayName: input.context.actor.displayName,
        eventType: 'FARM_CREATED',
        before: null,
        after: farmAuditSnapshot(profile),
        farmVersion: 1,
        idempotencyKey,
        createdAtLabel: timestampText,
        classification: this.classification,
        exampleData: this.exampleData,
      }

      transaction.set(farmReference, {
        recordType: 'FARM_PROFILE',
        organizationId: input.context.organizationId,
        farmId,
        ...draft,
        farmCode,
        status: 'ACTIVE',
        version: 1,
        createdBy: input.context.actor.userId,
        updatedBy: input.context.actor.userId,
        classification: this.classification,
        exampleData: this.exampleData,
        lastAuditEventId: auditEventId,
        lastOperationId: idempotencyKey,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      transaction.set(ownerMembershipReference, {
        membershipType: 'FARM',
        organizationId: input.context.organizationId,
        farmId,
        userId: input.context.actor.userId,
        displayName: input.context.actor.displayName,
        maskedPhone: input.context.actor.maskedPhone,
        role: 'ORG_OWNER',
        status: 'ACTIVE',
        version: 1,
        auditEventId,
        classification: this.classification,
        exampleData: this.exampleData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      transaction.set(guardReference, {
        organizationId: input.context.organizationId,
        farmId,
        farmSequence: draft.farmSequence,
        farmCode,
        classification: this.classification,
        exampleData: this.exampleData,
        createdAt: serverTimestamp(),
      })
      transaction.set(auditReference, {
        auditEventId: auditEvent.auditEventId,
        organizationId: auditEvent.organizationId,
        farmId: auditEvent.farmId,
        actorUserId: auditEvent.actorUserId,
        actorDisplayName: auditEvent.actorDisplayName,
        eventType: auditEvent.eventType,
        before: auditEvent.before,
        after: auditEvent.after,
        farmVersion: auditEvent.farmVersion,
        idempotencyKey: auditEvent.idempotencyKey,
        classification: auditEvent.classification,
        exampleData: auditEvent.exampleData,
        createdAt: serverTimestamp(),
      })
      transaction.set(operationReference, {
        recordType: 'FARM_OPERATION',
        organizationId: input.context.organizationId,
        operationId: idempotencyKey,
        operationType: 'CREATE',
        actorUserId: input.context.actor.userId,
        farmId,
        auditEventId,
        classification: this.classification,
        exampleData: this.exampleData,
        createdAt: serverTimestamp(),
      })
      return { profile, auditEvent, wasRetry: false }
    })
  }

  async updateFarmProfile(input: UpdateFarmProfileInput): Promise<FarmMutationResult> {
    assertOrganizationOwner(input.context)
    const idempotencyKey = normalizedIdempotencyKey(input.idempotencyKey)
    const draft = normalizeFarmProfileDraft(input.draft)
    const auditEventId = `audit_farm_${crypto.randomUUID()}`
    const operationReference = rootDoc(
      this.firestore,
      'organizations',
      input.context.organizationId,
      'farmOperations',
      idempotencyKey,
    )
    const farmReference = rootDoc(
      this.firestore,
      'organizations',
      input.context.organizationId,
      'farms',
      input.farmId,
    )
    const auditReference = rootDoc(
      this.firestore,
      'organizations',
      input.context.organizationId,
      'farms',
      input.farmId,
      'auditEvents',
      auditEventId,
    )

    return runTransaction(this.firestore, async (transaction) => {
      const operationDocument = await transaction.get(operationReference)
      if (operationDocument.exists()) {
        return retryResultFromOperation(
          transaction,
          this.firestore,
          input.context,
          operationDocument.data(),
          'UPDATE_PROFILE',
          input.farmId,
        )
      }
      const farmDocument = await transaction.get(farmReference)
      if (!farmDocument.exists()) throw new Error('ไม่พบ Farm Profile ใน Organization นี้')
      const before = profileFromData(farmDocument.data())
      if (draft.farmSequence !== before.farmSequence) {
        throw new Error('Farm Sequence และ Farm Code เปลี่ยนไม่ได้หลังสร้าง')
      }
      const timestampText = this.timeLabel
      const profile: FarmProfile = {
        ...before,
        ...draft,
        farmSequence: before.farmSequence,
        farmCode: before.farmCode,
        version: before.version + 1,
        updatedAtLabel: timestampText,
        updatedBy: input.context.actor.userId,
      }
      const auditEvent: FarmAuditEvent = {
        auditEventId,
        organizationId: input.context.organizationId,
        farmId: input.farmId,
        actorUserId: input.context.actor.userId,
        actorDisplayName: input.context.actor.displayName,
        eventType: 'FARM_PROFILE_UPDATED',
        before: farmAuditSnapshot(before),
        after: farmAuditSnapshot(profile),
        farmVersion: profile.version,
        idempotencyKey,
        createdAtLabel: timestampText,
        classification: before.classification,
        exampleData: before.exampleData,
      }
      transaction.update(farmReference, {
        farmName: profile.farmName,
        province: profile.province,
        district: profile.district,
        subdistrict: profile.subdistrict,
        locationNote: profile.locationNote,
        timezone: profile.timezone,
        seasonStartMonth: profile.seasonStartMonth,
        seasonEndMonth: profile.seasonEndMonth,
        seasonNote: profile.seasonNote,
        notes: profile.notes,
        version: profile.version,
        updatedBy: profile.updatedBy,
        updatedAt: serverTimestamp(),
        lastAuditEventId: auditEventId,
        lastOperationId: idempotencyKey,
      })
      transaction.set(auditReference, {
        auditEventId: auditEvent.auditEventId,
        organizationId: auditEvent.organizationId,
        farmId: auditEvent.farmId,
        actorUserId: auditEvent.actorUserId,
        actorDisplayName: auditEvent.actorDisplayName,
        eventType: auditEvent.eventType,
        before: auditEvent.before,
        after: auditEvent.after,
        farmVersion: auditEvent.farmVersion,
        idempotencyKey: auditEvent.idempotencyKey,
        classification: auditEvent.classification,
        exampleData: auditEvent.exampleData,
        createdAt: serverTimestamp(),
      })
      transaction.set(operationReference, {
        recordType: 'FARM_OPERATION',
        organizationId: input.context.organizationId,
        operationId: idempotencyKey,
        operationType: 'UPDATE_PROFILE',
        actorUserId: input.context.actor.userId,
        farmId: input.farmId,
        auditEventId,
        classification: before.classification,
        exampleData: before.exampleData,
        createdAt: serverTimestamp(),
      })
      return { profile, auditEvent, wasRetry: false }
    })
  }

  async getFarmArchiveReadiness(
    context: FarmManagementContext,
    farmId: string,
  ): Promise<FarmArchiveReadiness> {
    assertOrganizationOwner(context)
    const [workSnapshot, operationSnapshot] = await Promise.all([
      getDocs(query(
        rootCollection(
          this.firestore,
          'organizations',
          context.organizationId,
          'farms',
          farmId,
          'workOrders',
        ),
        where('organizationId', '==', context.organizationId),
        where('farmId', '==', farmId),
      )),
      getDocs(rootCollection(
        this.firestore,
        'organizations',
        context.organizationId,
        'farms',
        farmId,
        'offlineOperations',
      )),
    ])
    const openWorkOrders = workSnapshot.docs.flatMap((workDocument) => {
      const data = workDocument.data()
      return data.status === 'CLOSED' ? [] : [{
        kind: 'OPEN_WORK_ORDER' as const,
        recordId: requiredString(data, 'workOrderId'),
        label: requiredString(data, 'title'),
        status: requiredString(data, 'status'),
      }]
    })
    const pendingOperations = operationSnapshot.docs.flatMap((operationDocument) => {
      const data = operationDocument.data()
      return data.status === 'SYNCED' ? [] : [{
        kind: 'PENDING_OPERATION' as const,
        recordId: requiredString(data, 'operationId'),
        label: requiredString(data, 'kind'),
        status: requiredString(data, 'status'),
      }]
    })
    return {
      organizationId: context.organizationId,
      farmId,
      openWorkOrders,
      pendingOperations,
      canArchive: openWorkOrders.length === 0 && pendingOperations.length === 0,
    }
  }

  async changeFarmStatus(input: ChangeFarmStatusInput): Promise<FarmMutationResult> {
    assertOrganizationOwner(input.context)
    const idempotencyKey = normalizedIdempotencyKey(input.idempotencyKey)
    if (input.nextStatus === 'ARCHIVED') {
      const readiness = await this.getFarmArchiveReadiness(input.context, input.farmId)
      const pendingCount = readiness.pendingOperations.length + input.knownPendingOperationIds.length
      if (readiness.openWorkOrders.length > 0 || pendingCount > 0) {
        throw new Error(
          `ยัง Archive ไม่ได้: มีงานเปิด ${readiness.openWorkOrders.length} งาน และรายการ Pending ${pendingCount} รายการ`,
        )
      }
    }
    const auditEventId = `audit_farm_${crypto.randomUUID()}`
    const operationReference = rootDoc(
      this.firestore,
      'organizations',
      input.context.organizationId,
      'farmOperations',
      idempotencyKey,
    )
    const farmReference = rootDoc(
      this.firestore,
      'organizations',
      input.context.organizationId,
      'farms',
      input.farmId,
    )
    const auditReference = rootDoc(
      this.firestore,
      'organizations',
      input.context.organizationId,
      'farms',
      input.farmId,
      'auditEvents',
      auditEventId,
    )

    return runTransaction(this.firestore, async (transaction) => {
      const operationDocument = await transaction.get(operationReference)
      if (operationDocument.exists()) {
        return retryResultFromOperation(
          transaction,
          this.firestore,
          input.context,
          operationDocument.data(),
          'CHANGE_STATUS',
          input.farmId,
        )
      }
      const farmDocument = await transaction.get(farmReference)
      if (!farmDocument.exists()) throw new Error('ไม่พบ Farm Profile ใน Organization นี้')
      const before = profileFromData(farmDocument.data())
      if (!isValidFarmStatusTransition(before.status, input.nextStatus)) {
        throw new Error(`ไม่อนุญาตเปลี่ยนสถานะจาก ${before.status} เป็น ${input.nextStatus}`)
      }
      const timestampText = this.timeLabel
      const profile: FarmProfile = {
        ...before,
        status: input.nextStatus,
        version: before.version + 1,
        updatedAtLabel: timestampText,
        updatedBy: input.context.actor.userId,
      }
      const nextEventType: FarmAuditEventType = input.nextStatus === 'SUSPENDED'
        ? 'FARM_SUSPENDED'
        : input.nextStatus === 'ACTIVE'
          ? 'FARM_REACTIVATED'
          : 'FARM_ARCHIVED'
      const auditEvent: FarmAuditEvent = {
        auditEventId,
        organizationId: input.context.organizationId,
        farmId: input.farmId,
        actorUserId: input.context.actor.userId,
        actorDisplayName: input.context.actor.displayName,
        eventType: nextEventType,
        before: farmAuditSnapshot(before),
        after: farmAuditSnapshot(profile),
        farmVersion: profile.version,
        idempotencyKey,
        createdAtLabel: timestampText,
        classification: before.classification,
        exampleData: before.exampleData,
      }
      transaction.update(farmReference, {
        status: profile.status,
        version: profile.version,
        updatedBy: profile.updatedBy,
        updatedAt: serverTimestamp(),
        lastAuditEventId: auditEventId,
        lastOperationId: idempotencyKey,
      })
      transaction.set(auditReference, {
        auditEventId: auditEvent.auditEventId,
        organizationId: auditEvent.organizationId,
        farmId: auditEvent.farmId,
        actorUserId: auditEvent.actorUserId,
        actorDisplayName: auditEvent.actorDisplayName,
        eventType: auditEvent.eventType,
        before: auditEvent.before,
        after: auditEvent.after,
        farmVersion: auditEvent.farmVersion,
        idempotencyKey: auditEvent.idempotencyKey,
        classification: auditEvent.classification,
        exampleData: auditEvent.exampleData,
        createdAt: serverTimestamp(),
      })
      transaction.set(operationReference, {
        recordType: 'FARM_OPERATION',
        organizationId: input.context.organizationId,
        operationId: idempotencyKey,
        operationType: 'CHANGE_STATUS',
        actorUserId: input.context.actor.userId,
        farmId: input.farmId,
        auditEventId,
        classification: before.classification,
        exampleData: before.exampleData,
        createdAt: serverTimestamp(),
      })
      return { profile, auditEvent, wasRetry: false }
    })
  }

  async listFarmAudit(
    context: FarmManagementContext,
    farmId: string,
  ): Promise<readonly FarmAuditEvent[]> {
    assertOrganizationOwner(context)
    const snapshot = await getDocs(query(
      rootCollection(
        this.firestore,
        'organizations',
        context.organizationId,
        'farms',
        farmId,
        'auditEvents',
      ),
      orderBy('createdAt', 'desc'),
      limit(100),
    ))
    return snapshot.docs
      .filter((eventDocument) => farmAuditEventTypes.includes(
        eventDocument.data().eventType as FarmAuditEventType,
      ))
      .map((eventDocument) => farmAuditFromData(eventDocument.data()))
  }

  async listFarmMembers(
    organizationId: string,
    farmId: string,
  ): Promise<readonly FarmMember[]> {
    const snapshot = await getDocsFromServer(
      rootCollection(
        this.firestore,
        'organizations',
        organizationId,
        'farms',
        farmId,
        'members',
      ),
    )
    return snapshot.docs.map((memberDocument) => memberFromData(memberDocument.data()))
  }

  async changeFarmMembership(input: MembershipChangeInput): Promise<MembershipAuditEvent> {
    const membershipReference = rootDoc(
      this.firestore,
      'organizations',
      input.organizationId,
      'farms',
      input.farmId,
      'members',
      input.targetUserId,
    )
    const membershipDocument = await getDoc(membershipReference)
    if (!membershipDocument.exists()) throw new Error('ไม่พบสมาชิกในสวนนี้')
    const current = memberFromData(membershipDocument.data())
    if (current.userId === input.actor.userId) {
      throw new Error('ไม่อนุญาตให้เปลี่ยนสิทธิ์ของบัญชีที่กำลังใช้งาน')
    }

    const nextVersion = current.version + 1
    const auditEventId = `audit_${crypto.randomUUID()}`
    const auditReference = rootDoc(
      this.firestore,
      'organizations',
      input.organizationId,
      'farms',
      input.farmId,
      'auditEvents',
      auditEventId,
    )
    const nextEventType = eventType(current.status, input.nextStatus)
    const batch = writeBatch(this.firestore)
    batch.update(membershipReference, {
      role: input.nextRole,
      status: input.nextStatus,
      version: nextVersion,
      auditEventId,
      updatedAt: serverTimestamp(),
    })
    batch.set(auditReference, {
      auditEventId,
      organizationId: input.organizationId,
      farmId: input.farmId,
      actorUserId: input.actor.userId,
      actorDisplayName: input.actor.displayName,
      targetUserId: current.userId,
      targetDisplayName: current.displayName,
      eventType: nextEventType,
      beforeRole: current.role,
      afterRole: input.nextRole,
      beforeStatus: current.status,
      afterStatus: input.nextStatus,
      membershipVersion: nextVersion,
      createdAt: serverTimestamp(),
    })
    await batch.commit()

    return {
      auditEventId,
      organizationId: input.organizationId,
      farmId: input.farmId,
      actorUserId: input.actor.userId,
      actorDisplayName: input.actor.displayName,
      targetUserId: current.userId,
      targetDisplayName: current.displayName,
      eventType: nextEventType,
      beforeRole: current.role,
      afterRole: input.nextRole,
      beforeStatus: current.status,
      afterStatus: input.nextStatus,
      membershipVersion: nextVersion,
      createdAtLabel: this.timeLabel,
    }
  }

  async listMembershipAudit(
    organizationId: string,
    farmId: string,
  ): Promise<readonly MembershipAuditEvent[]> {
    const snapshot = await getDocs(
      query(
        rootCollection(
          this.firestore,
          'organizations',
          organizationId,
          'farms',
          farmId,
          'auditEvents',
        ),
        orderBy('createdAt', 'desc'),
        limit(50),
      ),
    )

    return snapshot.docs
      .filter((eventDocument) => [
        'ROLE_CHANGED',
        'MEMBERSHIP_REVOKED',
        'MEMBERSHIP_RESTORED',
      ].includes(String(eventDocument.data().eventType)))
      .map((eventDocument) => {
      const data = eventDocument.data()
      const beforeRole: unknown = data.beforeRole
      const afterRole: unknown = data.afterRole
      const beforeStatus: unknown = data.beforeStatus
      const afterStatus: unknown = data.afterStatus
      const event: unknown = data.eventType
      if (
        !isCanonicalRole(beforeRole) ||
        !isCanonicalRole(afterRole) ||
        !isMembershipStatus(beforeStatus) ||
        !isMembershipStatus(afterStatus) ||
        (event !== 'ROLE_CHANGED' &&
          event !== 'MEMBERSHIP_REVOKED' &&
          event !== 'MEMBERSHIP_RESTORED')
      ) {
        throw new Error('Invalid audit event in test data')
      }

        return {
        auditEventId: requiredString(data, 'auditEventId'),
        organizationId: requiredString(data, 'organizationId'),
        farmId: requiredString(data, 'farmId'),
        actorUserId: requiredString(data, 'actorUserId'),
        actorDisplayName: requiredString(data, 'actorDisplayName'),
        targetUserId: requiredString(data, 'targetUserId'),
        targetDisplayName: requiredString(data, 'targetDisplayName'),
        eventType: event,
        beforeRole,
        afterRole,
        beforeStatus,
        afterStatus,
        membershipVersion: Number(data.membershipVersion),
        createdAtLabel: data.createdAt instanceof Timestamp
          ? new Intl.DateTimeFormat('th-TH', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(data.createdAt.toDate())
          : 'รอเวลาในข้อมูลจำลอง',
        }
      })
  }
}
