import type { User } from 'firebase/auth'
import {
  runTransaction,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore'

import type { AccessRequestRecord } from '../domain/auth'
import type { CanonicalRole } from '../domain/farm'
import { createFirebaseLiveClients } from '../infrastructure/firebase/firebaseClient'
import { rootDoc, rootDocument } from '../infrastructure/firebase/firebaseDataRoot'

export interface AccessRequestResolutionInput {
  uid: string
  organizationId: string
  farmId: string
  role: CanonicalRole
}

export type UserAccessUpdateInput = AccessRequestResolutionInput

function displayNameForUser(user: User): string {
  const displayName = user.displayName?.trim()
  if (displayName) return displayName
  if (user.email) return user.email
  return 'ผู้ใช้ยืนยันผ่าน Firebase'
}

function maskPhone(phoneNumber: string | null): string {
  if (!phoneNumber) return ''
  if (phoneNumber.length < 8) return '••••'
  return `${phoneNumber.slice(0, 4)}••••${phoneNumber.slice(-3)}`
}

function profileName(displayName: string): { firstName: string; lastName: string } {
  const parts = displayName.split(/\s+/u).filter(Boolean)
  return {
    firstName: parts[0] ?? 'ผู้ใช้งาน',
    lastName: parts.slice(1).join(' '),
  }
}

export async function ensureFirebaseAccessRequest(user: User): Promise<void> {
  const { firestore } = createFirebaseLiveClients()
  const profileReference = rootDoc(firestore, 'users', user.uid)
  const requestReference = rootDoc(firestore, 'accessRequests', user.uid)
  const displayName = displayNameForUser(user)
  const names = profileName(displayName)

  await runTransaction(firestore, async (transaction) => {
    const [profileSnapshot, requestSnapshot] = await Promise.all([
      transaction.get(profileReference),
      transaction.get(requestReference),
    ])
    if (!profileSnapshot.exists()) {
      transaction.set(profileReference, {
        uid: user.uid,
        email: user.email ?? '',
        firstName: names.firstName,
        lastName: names.lastName,
        position: 'รอผู้ดูแลกำหนดสิทธิ์',
        role: ['WORKER'],
        status: 'pending',
        assignedProjects: [],
        createdAt: serverTimestamp(),
        ...(user.photoURL ? { photoURL: user.photoURL } : {}),
        isFirstUser: false,
      })
    }
    const existingProfileStatus = profileSnapshot.exists()
      ? (profileSnapshot.data() as { status?: unknown }).status
      : undefined
    if (!requestSnapshot.exists() && existingProfileStatus !== 'approved' && existingProfileStatus !== 'rejected') {
      transaction.set(requestReference, {
        requestId: user.uid,
        uid: user.uid,
        email: user.email ?? '',
        displayName,
        maskedPhone: maskPhone(user.phoneNumber),
        providerIds: [...new Set(user.providerData.map((provider) => provider.providerId))],
        status: 'PENDING',
        requestedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(user.photoURL ? { photoURL: user.photoURL } : {}),
      })
    }
  })
}

function requiredString(data: DocumentData, field: string): string {
  const value: unknown = data[field]
  if (typeof value !== 'string' || !value) {
    throw new Error(`ข้อมูล Firebase ขาด ${field}`)
  }
  return value
}

function optionalString(data: DocumentData | undefined, field: string): string | undefined {
  const value: unknown = data?.[field]
  return typeof value === 'string' && value ? value : undefined
}

export async function approveFirebaseAccessRequest(
  input: AccessRequestResolutionInput,
): Promise<void> {
  const { auth, firestore } = createFirebaseLiveClients()
  const admin = auth.currentUser
  if (!admin) throw new Error('กรุณาเข้าสู่ระบบ MasterAdmin ใหม่')

  const requestReference = rootDoc(firestore, 'accessRequests', input.uid)
  const profileReference = rootDoc(firestore, 'users', input.uid)
  const organizationReference = rootDoc(firestore, 'organizations', input.organizationId)
  const organizationMemberReference = rootDoc(
    firestore, 'organizations', input.organizationId, 'members', input.uid,
  )
  const farmReference = rootDoc(
    firestore, 'organizations', input.organizationId, 'farms', input.farmId,
  )
  const farmMemberReference = rootDoc(
    firestore, 'organizations', input.organizationId, 'farms', input.farmId,
    'members', input.uid,
  )

  await runTransaction(firestore, async (transaction) => {
    const [requestSnapshot, profileSnapshot, organizationSnapshot, farmSnapshot,
      organizationMemberSnapshot, farmMemberSnapshot] = await Promise.all([
      transaction.get(requestReference),
      transaction.get(profileReference),
      transaction.get(organizationReference),
      transaction.get(farmReference),
      transaction.get(organizationMemberReference),
      transaction.get(farmMemberReference),
    ])
    if (!requestSnapshot.exists() || !profileSnapshot.exists()) {
      throw new Error('ไม่พบคำขอหรือ User Profile ของผู้ใช้นี้')
    }
    if (!organizationSnapshot.exists() || !farmSnapshot.exists()) {
      throw new Error('ไม่พบ Organization หรือ Farm ที่เลือก')
    }

    const request = requestSnapshot.data() as AccessRequestRecord
    if (request.status !== 'PENDING') {
      if (
        request.status === 'APPROVED'
        && request.organizationId === input.organizationId
        && request.farmId === input.farmId
        && request.assignedRole === input.role
      ) return
      throw new Error('คำขอนี้ถูกดำเนินการแล้ว กรุณาโหลดรายการใหม่')
    }

    const organization = organizationSnapshot.data()
    const farm = farmSnapshot.data()
    if (farm.status !== 'ACTIVE') {
      throw new Error('สวนที่เลือกไม่ได้อยู่ในสถานะ ACTIVE กรุณาเลือกสวนที่เปิดใช้งาน')
    }
    const classification = requiredString(farm, 'classification')
    const exampleData: unknown = farm.exampleData
    if (typeof exampleData !== 'boolean') throw new Error('Farm ไม่มี data classification ที่ถูกต้อง')
    if (organization.organizationId !== input.organizationId || farm.farmId !== input.farmId) {
      throw new Error('Organization/Farm scope ไม่ตรงกับเอกสารที่เลือก')
    }

    const auditEventId = `access_${input.uid}`
    const displayName = request.displayName || input.uid
    const existingOrganizationMember = organizationMemberSnapshot.exists()
      ? organizationMemberSnapshot.data()
      : undefined
    const existingFarmMember = farmMemberSnapshot.exists()
      ? farmMemberSnapshot.data()
      : undefined
    const isOwner = input.role === 'ORG_OWNER' || existingOrganizationMember?.isOwner === true

    transaction.set(organizationMemberReference, {
      organizationId: input.organizationId,
      userId: input.uid,
      status: 'ACTIVE',
      isOwner,
      classification: requiredString(organization, 'classification'),
      exampleData: organization.exampleData === true,
      ...(!existingOrganizationMember ? { createdAt: serverTimestamp() } : {}),
      updatedAt: serverTimestamp(),
    }, { merge: true })

    if (!existingFarmMember) {
      transaction.set(farmMemberReference, {
        membershipType: 'FARM',
        organizationId: input.organizationId,
        farmId: input.farmId,
        userId: input.uid,
        displayName,
        maskedPhone: request.maskedPhone ?? '',
        role: input.role,
        status: 'ACTIVE',
        version: 1,
        auditEventId,
        classification,
        exampleData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      transaction.set(rootDoc(
        firestore, 'organizations', input.organizationId, 'farms', input.farmId,
        'auditEvents', auditEventId,
      ), {
        auditEventId,
        organizationId: input.organizationId,
        farmId: input.farmId,
        actorUserId: admin.uid,
        actorDisplayName: admin.displayName ?? admin.email ?? 'MasterAdmin',
        targetUserId: input.uid,
        targetDisplayName: displayName,
        eventType: 'MEMBERSHIP_ASSIGNED',
        beforeRole: null,
        afterRole: input.role,
        beforeStatus: null,
        afterStatus: 'ACTIVE',
        membershipVersion: 1,
        createdAt: serverTimestamp(),
      })
    } else if (existingFarmMember.role !== input.role || existingFarmMember.status !== 'ACTIVE') {
      throw new Error('ผู้ใช้นี้มี Membership เดิมที่ต่างจากคำขอ กรุณาจัดการจากหน้าสมาชิกสวน')
    }

    transaction.update(profileReference, {
      role: [input.role],
      status: 'approved',
      position: 'ผู้ใช้งานที่ได้รับอนุมัติ',
      assignedProjects: [input.farmId],
      updatedAt: serverTimestamp(),
    })
    transaction.update(requestReference, {
      status: 'APPROVED',
      organizationId: input.organizationId,
      farmId: input.farmId,
      assignedRole: input.role,
      resolvedAt: serverTimestamp(),
      resolvedBy: admin.uid,
      updatedAt: serverTimestamp(),
    })
  })
}

export async function updateFirebaseUserAccess(
  input: UserAccessUpdateInput,
): Promise<void> {
  const { auth, firestore } = createFirebaseLiveClients()
  const admin = auth.currentUser
  if (!admin) throw new Error('กรุณาเข้าสู่ระบบ MasterAdmin ใหม่')
  const adminToken = await admin.getIdTokenResult()
  const hasMasterAdminClaim = adminToken.claims.masterAdmin === true

  const requestReference = rootDoc(firestore, 'accessRequests', input.uid)
  const profileReference = rootDoc(firestore, 'users', input.uid)
  const rootReference = rootDocument(firestore)
  const operationId = `access_change_${input.uid}_${crypto.randomUUID()}`

  await runTransaction(firestore, async (transaction) => {
    const [requestSnapshot, profileSnapshot, rootSnapshot] = await Promise.all([
      transaction.get(requestReference),
      transaction.get(profileReference),
      transaction.get(rootReference),
    ])
    if (!requestSnapshot.exists() || !profileSnapshot.exists()) {
      throw new Error('ไม่พบคำขอหรือ User Profile ของผู้ใช้นี้')
    }
    const rootOwnerUid = rootSnapshot.exists()
      ? optionalString(rootSnapshot.data(), 'seedOwnerUid')
      : undefined
    if (!hasMasterAdminClaim && rootOwnerUid !== admin.uid) {
      throw new Error('เฉพาะ MasterAdmin ที่ยืนยันจากระบบเท่านั้นที่แก้ไขสิทธิ์ผู้ใช้ได้')
    }

    const request = requestSnapshot.data() as AccessRequestRecord
    const profile = profileSnapshot.data() as { role?: unknown }
    if (request.status !== 'APPROVED') {
      throw new Error('แก้ไขสิทธิ์ได้เฉพาะผู้ใช้ที่อนุมัติแล้ว')
    }
    if (Array.isArray(profile.role) && profile.role.includes('MasterAdmin')) {
      throw new Error('ไม่อนุญาตให้แก้ไข MasterAdmin จากหน้าจัดการผู้ใช้')
    }

    const oldOrganizationId = requiredString(request, 'organizationId')
    const oldFarmId = requiredString(request, 'farmId')
    const oldFarmMemberReference = rootDoc(
      firestore, 'organizations', oldOrganizationId, 'farms', oldFarmId,
      'members', input.uid,
    )
    const oldOrganizationMemberReference = rootDoc(
      firestore, 'organizations', oldOrganizationId, 'members', input.uid,
    )
    const targetOrganizationReference = rootDoc(
      firestore, 'organizations', input.organizationId,
    )
    const targetFarmReference = rootDoc(
      firestore, 'organizations', input.organizationId, 'farms', input.farmId,
    )
    const targetOrganizationMemberReference = rootDoc(
      firestore, 'organizations', input.organizationId, 'members', input.uid,
    )
    const targetFarmMemberReference = rootDoc(
      firestore, 'organizations', input.organizationId, 'farms', input.farmId,
      'members', input.uid,
    )

    const movingFarm = oldOrganizationId !== input.organizationId || oldFarmId !== input.farmId
    const [targetOrganizationSnapshot, targetFarmSnapshot, targetOrganizationMemberSnapshot,
      targetFarmMemberSnapshot, oldFarmMemberSnapshot, oldOrganizationMemberSnapshot] =
      await Promise.all([
        transaction.get(targetOrganizationReference),
        transaction.get(targetFarmReference),
        transaction.get(targetOrganizationMemberReference),
        transaction.get(targetFarmMemberReference),
        movingFarm ? transaction.get(oldFarmMemberReference) : transaction.get(targetFarmMemberReference),
        oldOrganizationId !== input.organizationId
          ? transaction.get(oldOrganizationMemberReference)
          : transaction.get(targetOrganizationMemberReference),
      ])

    if (!targetOrganizationSnapshot.exists() || !targetFarmSnapshot.exists()) {
      throw new Error('ไม่พบ Organization หรือ Farm ปลายทาง')
    }
    const organization = targetOrganizationSnapshot.data()
    const farm = targetFarmSnapshot.data()
    if (farm.status !== 'ACTIVE') {
      throw new Error('ย้ายผู้ใช้ได้เฉพาะสวนที่อยู่ในสถานะ ACTIVE')
    }
    if (
      !movingFarm
      && request.assignedRole === input.role
      && targetFarmMemberSnapshot.exists()
      && targetFarmMemberSnapshot.data().status === 'ACTIVE'
    ) return

    const displayName = request.displayName || input.uid
    const maskedPhone = request.maskedPhone ?? ''

    if (movingFarm && oldFarmMemberSnapshot.exists()) {
      const oldMember = oldFarmMemberSnapshot.data()
      const oldVersion = typeof oldMember.version === 'number' ? oldMember.version : 1
      const oldRole = optionalString(oldMember, 'role') ?? request.assignedRole ?? 'WORKER'
      const oldStatus = optionalString(oldMember, 'status') ?? 'ACTIVE'
      const revokeAuditEventId = `${operationId}_revoke`
      transaction.update(oldFarmMemberReference, {
        status: 'REVOKED',
        version: oldVersion + 1,
        auditEventId: revokeAuditEventId,
        updatedAt: serverTimestamp(),
      })
      transaction.set(rootDoc(
        firestore, 'organizations', oldOrganizationId, 'farms', oldFarmId,
        'auditEvents', revokeAuditEventId,
      ), {
        auditEventId: revokeAuditEventId,
        organizationId: oldOrganizationId,
        farmId: oldFarmId,
        actorUserId: admin.uid,
        actorDisplayName: admin.displayName ?? admin.email ?? 'MasterAdmin',
        targetUserId: input.uid,
        targetDisplayName: displayName,
        eventType: 'MEMBERSHIP_REVOKED',
        beforeRole: oldRole,
        afterRole: oldRole,
        beforeStatus: oldStatus,
        afterStatus: 'REVOKED',
        membershipVersion: oldVersion + 1,
        createdAt: serverTimestamp(),
      })
    }

    if (oldOrganizationId !== input.organizationId && oldOrganizationMemberSnapshot.exists()) {
      transaction.update(oldOrganizationMemberReference, {
        status: 'REVOKED',
        isOwner: false,
        updatedAt: serverTimestamp(),
      })
    }

    const existingOrganizationMember = targetOrganizationMemberSnapshot.exists()
      ? targetOrganizationMemberSnapshot.data()
      : undefined
    transaction.set(targetOrganizationMemberReference, {
      organizationId: input.organizationId,
      userId: input.uid,
      status: 'ACTIVE',
      isOwner: input.role === 'ORG_OWNER' || existingOrganizationMember?.isOwner === true,
      classification: requiredString(organization, 'classification'),
      exampleData: organization.exampleData === true,
      ...(!existingOrganizationMember ? { createdAt: serverTimestamp() } : {}),
      updatedAt: serverTimestamp(),
    }, { merge: true })

    const existingTargetMember = targetFarmMemberSnapshot.exists()
      ? targetFarmMemberSnapshot.data()
      : undefined
    const existingTargetRole = optionalString(existingTargetMember, 'role')
    const existingTargetStatus = optionalString(existingTargetMember, 'status')
    const targetMembershipUnchanged = existingTargetRole === input.role
      && existingTargetStatus === 'ACTIVE'
    const targetVersion = existingTargetMember && typeof existingTargetMember.version === 'number'
      ? existingTargetMember.version + 1
      : 1
    const targetAuditEventId = `${operationId}_assign`
    const targetEventType = !existingTargetMember
      ? 'MEMBERSHIP_ASSIGNED'
      : existingTargetMember.status === 'REVOKED'
        ? 'MEMBERSHIP_RESTORED'
        : 'ROLE_CHANGED'
    if (!targetMembershipUnchanged) {
      transaction.set(targetFarmMemberReference, {
        membershipType: 'FARM',
        organizationId: input.organizationId,
        farmId: input.farmId,
        userId: input.uid,
        displayName,
        maskedPhone,
        role: input.role,
        status: 'ACTIVE',
        version: targetVersion,
        auditEventId: targetAuditEventId,
        classification: requiredString(farm, 'classification'),
        exampleData: farm.exampleData === true,
        ...(!existingTargetMember ? { createdAt: serverTimestamp() } : {}),
        updatedAt: serverTimestamp(),
      }, { merge: true })
      transaction.set(rootDoc(
        firestore, 'organizations', input.organizationId, 'farms', input.farmId,
        'auditEvents', targetAuditEventId,
      ), {
        auditEventId: targetAuditEventId,
        organizationId: input.organizationId,
        farmId: input.farmId,
        actorUserId: admin.uid,
        actorDisplayName: admin.displayName ?? admin.email ?? 'MasterAdmin',
        targetUserId: input.uid,
        targetDisplayName: displayName,
        eventType: targetEventType,
        beforeRole: existingTargetRole ?? null,
        afterRole: input.role,
        beforeStatus: existingTargetStatus ?? null,
        afterStatus: 'ACTIVE',
        membershipVersion: targetVersion,
        createdAt: serverTimestamp(),
      })
    }

    transaction.update(profileReference, {
      role: [input.role],
      status: 'approved',
      position: 'ผู้ใช้งานที่ได้รับอนุมัติ',
      assignedProjects: [input.farmId],
      updatedAt: serverTimestamp(),
    })
    transaction.update(requestReference, {
      organizationId: input.organizationId,
      farmId: input.farmId,
      assignedRole: input.role,
      resolvedAt: serverTimestamp(),
      resolvedBy: admin.uid,
      updatedAt: serverTimestamp(),
    })
  })
}

export async function rejectFirebaseAccessRequest(
  uid: string,
  rejectionReason: string,
): Promise<void> {
  const reason = rejectionReason.trim()
  if (!reason) throw new Error('กรุณาระบุเหตุผลที่ปฏิเสธ')
  const { auth, firestore } = createFirebaseLiveClients()
  const admin = auth.currentUser
  if (!admin) throw new Error('กรุณาเข้าสู่ระบบ MasterAdmin ใหม่')
  const requestReference = rootDoc(firestore, 'accessRequests', uid)
  const profileReference = rootDoc(firestore, 'users', uid)
  await runTransaction(firestore, async (transaction) => {
    const [requestSnapshot, profileSnapshot] = await Promise.all([
      transaction.get(requestReference),
      transaction.get(profileReference),
    ])
    if (!requestSnapshot.exists() || !profileSnapshot.exists()) {
      throw new Error('ไม่พบคำขอหรือ User Profile ของผู้ใช้นี้')
    }
    if (requestSnapshot.data().status !== 'PENDING') {
      throw new Error('คำขอนี้ถูกดำเนินการแล้ว กรุณาโหลดรายการใหม่')
    }
    transaction.update(profileReference, {
      status: 'rejected',
      updatedAt: serverTimestamp(),
    })
    transaction.update(requestReference, {
      status: 'REJECTED',
      rejectionReason: reason,
      resolvedAt: serverTimestamp(),
      resolvedBy: admin.uid,
      updatedAt: serverTimestamp(),
    })
  })
}
