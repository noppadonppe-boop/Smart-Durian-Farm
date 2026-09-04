import type { User } from 'firebase/auth'
import {
  runTransaction,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore'

import type { AccessRequestRecord } from '../domain/auth'
import type { CanonicalRole } from '../domain/farm'
import { createFirebaseLiveClients } from '../infrastructure/firebase/firebaseClient'
import { rootDoc } from '../infrastructure/firebase/firebaseDataRoot'

export interface AccessRequestResolutionInput {
  uid: string
  organizationId: string
  farmId: string
  role: CanonicalRole
}

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
