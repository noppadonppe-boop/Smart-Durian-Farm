import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore'

import type {
  MembershipChangeInput,
  Phase2Repository,
} from '../../adapters/contracts'
import {
  isCanonicalRole,
  isFarmStatus,
  isMembershipStatus,
  type FarmAccess,
  type FarmMember,
  type MembershipAuditEvent,
  type MembershipStatus,
} from '../../domain/farm'

function requiredString(data: DocumentData, field: string): string {
  const value: unknown = data[field]
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Invalid emulator document field: ${field}`)
  }
  return value
}

function memberFromData(data: DocumentData): FarmMember {
  const role: unknown = data.role
  const status: unknown = data.status
  const version: unknown = data.version
  if (!isCanonicalRole(role) || !isMembershipStatus(status)) {
    throw new Error('Invalid role or membership status in emulator document')
  }
  if (typeof version !== 'number' || !Number.isInteger(version)) {
    throw new Error('Invalid membership version in emulator document')
  }

  return {
    organizationId: requiredString(data, 'organizationId'),
    farmId: requiredString(data, 'farmId'),
    userId: requiredString(data, 'userId'),
    displayName: requiredString(data, 'displayName'),
    maskedPhone: requiredString(data, 'maskedPhone'),
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

export class FirebasePhase2Repository implements Phase2Repository {
  constructor(private readonly firestore: Firestore) {}

  async listFarmAccess(userId: string): Promise<readonly FarmAccess[]> {
    const membershipQuery = query(
      collectionGroup(this.firestore, 'members'),
      where('membershipType', '==', 'FARM'),
      where('userId', '==', userId),
      where('status', '==', 'ACTIVE'),
    )
    const membershipSnapshot = await getDocs(membershipQuery)

    return Promise.all(
      membershipSnapshot.docs.map(async (membershipDocument) => {
        const member = memberFromData(membershipDocument.data())
        const farmReference = doc(
          this.firestore,
          'organizations',
          member.organizationId,
          'farms',
          member.farmId,
        )
        const organizationReference = doc(
          this.firestore,
          'organizations',
          member.organizationId,
        )
        const organizationMemberReference = doc(
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
          throw new Error('ข้อมูลสมาชิกอ้างถึงสวนหรือองค์กรที่ไม่มีใน Emulator')
        }

        const farm = farmDocument.data()
        const organization = organizationDocument.data()
        const farmStatus: unknown = farm.status
        if (!isFarmStatus(farmStatus)) throw new Error('Invalid farm status')

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
          isMock: true,
        }
      }),
    )
  }

  async listFarmMembers(
    organizationId: string,
    farmId: string,
  ): Promise<readonly FarmMember[]> {
    const snapshot = await getDocs(
      collection(
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
    const membershipReference = doc(
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
    const auditReference = doc(
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
      createdAtLabel: 'บันทึกใน Firebase Emulator แล้ว',
    }
  }

  async listMembershipAudit(
    organizationId: string,
    farmId: string,
  ): Promise<readonly MembershipAuditEvent[]> {
    const snapshot = await getDocs(
      query(
        collection(
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

    return snapshot.docs.map((eventDocument) => {
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
        throw new Error('Invalid audit event in emulator document')
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
          : 'รอเวลา Emulator',
      }
    })
  }
}
