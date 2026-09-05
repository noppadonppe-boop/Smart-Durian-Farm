import { getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { randomUUID } from 'node:crypto'

import { validateMasterAdminUpdate } from './masterAdminPolicy.mjs'

getApps()[0] ?? initializeApp()

const dataRoot = 'durian-smartfarm/root'

function asHttpsError(error) {
  if (error instanceof HttpsError) return error
  const message = error instanceof Error ? error.message : 'แก้ไขสิทธิ์ MasterAdmin ไม่สำเร็จ'
  return new HttpsError('failed-precondition', message)
}

export const updateMasterAdminAccess = onCall(
  { region: 'asia-southeast1', enforceAppCheck: false },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'กรุณาเข้าสู่ระบบ MasterAdmin ใหม่')

    const firestore = getFirestore()
    const auth = getAuth()
    const rootReference = firestore.doc(dataRoot)
    const rootSnapshot = await rootReference.get()
    const seedOwnerUid = rootSnapshot.exists && typeof rootSnapshot.get('seedOwnerUid') === 'string'
      ? rootSnapshot.get('seedOwnerUid')
      : undefined
    const trustedActor = request.auth.token.masterAdmin === true || request.auth.uid === seedOwnerUid
    if (!trustedActor) {
      throw new HttpsError('permission-denied', 'เฉพาะ MasterAdmin ที่ยืนยันจากระบบเท่านั้นที่แก้ไขสิทธิ์นี้ได้')
    }

    let input
    try {
      input = validateMasterAdminUpdate(request.data, request.auth.uid, seedOwnerUid)
    } catch (error) {
      throw new HttpsError('invalid-argument', error instanceof Error ? error.message : 'ข้อมูลคำขอไม่ถูกต้อง')
    }

    const targetUser = await auth.getUser(input.uid).catch(() => {
      throw new HttpsError('not-found', 'ไม่พบบัญชี Firebase Authentication ของผู้ใช้นี้')
    })
    const previousClaims = targetUser.customClaims ?? {}
    const nextClaims = { ...previousClaims }
    if (input.masterAdmin) nextClaims.masterAdmin = true
    else delete nextClaims.masterAdmin

    await auth.setCustomUserClaims(input.uid, nextClaims)
    try {
      await firestore.runTransaction(async (transaction) => {
        const profileReference = firestore.doc(`${dataRoot}/users/${input.uid}`)
        const requestReference = firestore.doc(`${dataRoot}/accessRequests/${input.uid}`)
        const operationId = `master_admin_${input.uid}_${randomUUID()}`
        const globalAuditReference = firestore.doc(`${dataRoot}/adminAuditEvents/${operationId}`)
        const [profileSnapshot, accessRequestSnapshot] = await Promise.all([
          transaction.get(profileReference),
          transaction.get(requestReference),
        ])
        if (!profileSnapshot.exists) throw new Error('ไม่พบ User Profile ของผู้ใช้นี้')
        if (profileSnapshot.get('status') !== 'approved') {
          throw new Error('แก้ไข MasterAdmin ได้เฉพาะผู้ใช้ที่อนุมัติแล้ว')
        }

        const beforeRoles = Array.isArray(profileSnapshot.get('role'))
          ? profileSnapshot.get('role')
          : []
        const displayName = [profileSnapshot.get('firstName'), profileSnapshot.get('lastName')]
          .filter((value) => typeof value === 'string' && value)
          .join(' ') || input.uid

        if (input.masterAdmin) {
          transaction.update(profileReference, {
            role: ['MasterAdmin'],
            position: 'ผู้ดูแลระบบ',
            updatedAt: FieldValue.serverTimestamp(),
          })
        } else {
          if (!accessRequestSnapshot.exists || accessRequestSnapshot.get('status') !== 'APPROVED') {
            throw new Error('ไม่พบ Access Request ที่อนุมัติแล้วสำหรับกำหนด Role หลังปลดสิทธิ์')
          }

          const organizationReference = firestore.doc(`${dataRoot}/organizations/${input.organizationId}`)
          const farmReference = firestore.doc(
            `${dataRoot}/organizations/${input.organizationId}/farms/${input.farmId}`,
          )
          const organizationMemberReference = firestore.doc(
            `${dataRoot}/organizations/${input.organizationId}/members/${input.uid}`,
          )
          const farmMemberReference = firestore.doc(
            `${dataRoot}/organizations/${input.organizationId}/farms/${input.farmId}/members/${input.uid}`,
          )
          const [organizationSnapshot, farmSnapshot, organizationMemberSnapshot, farmMemberSnapshot] =
            await Promise.all([
              transaction.get(organizationReference),
              transaction.get(farmReference),
              transaction.get(organizationMemberReference),
              transaction.get(farmMemberReference),
            ])
          if (!organizationSnapshot.exists || !farmSnapshot.exists) {
            throw new Error('ไม่พบ Organization หรือ Farm ที่เลือก')
          }
          if (farmSnapshot.get('status') !== 'ACTIVE') {
            throw new Error('กำหนด Role หลังปลดสิทธิ์ได้เฉพาะสวนที่อยู่ในสถานะ ACTIVE')
          }

          const currentVersion = typeof farmMemberSnapshot.get('version') === 'number'
            ? farmMemberSnapshot.get('version')
            : 0
          const memberAuditId = `${operationId}_role`
          transaction.set(organizationMemberReference, {
            organizationId: input.organizationId,
            userId: input.uid,
            status: 'ACTIVE',
            isOwner: input.fallbackRole === 'ORG_OWNER' || organizationMemberSnapshot.get('isOwner') === true,
            classification: organizationSnapshot.get('classification'),
            exampleData: organizationSnapshot.get('exampleData') === true,
            ...(!organizationMemberSnapshot.exists ? { createdAt: FieldValue.serverTimestamp() } : {}),
            updatedAt: FieldValue.serverTimestamp(),
          }, { merge: true })
          transaction.set(farmMemberReference, {
            membershipType: 'FARM',
            organizationId: input.organizationId,
            farmId: input.farmId,
            userId: input.uid,
            displayName,
            role: input.fallbackRole,
            status: 'ACTIVE',
            version: currentVersion + 1,
            auditEventId: memberAuditId,
            classification: farmSnapshot.get('classification'),
            exampleData: farmSnapshot.get('exampleData') === true,
            ...(!farmMemberSnapshot.exists ? { createdAt: FieldValue.serverTimestamp() } : {}),
            updatedAt: FieldValue.serverTimestamp(),
          }, { merge: true })
          transaction.set(
            firestore.doc(`${dataRoot}/organizations/${input.organizationId}/farms/${input.farmId}/auditEvents/${memberAuditId}`),
            {
              auditEventId: memberAuditId,
              organizationId: input.organizationId,
              farmId: input.farmId,
              actorUserId: request.auth.uid,
              targetUserId: input.uid,
              targetDisplayName: displayName,
              eventType: 'MASTER_ADMIN_REVOKED_ROLE_ASSIGNED',
              beforeRole: 'MasterAdmin',
              afterRole: input.fallbackRole,
              beforeStatus: 'ACTIVE',
              afterStatus: 'ACTIVE',
              membershipVersion: currentVersion + 1,
              createdAt: FieldValue.serverTimestamp(),
            },
          )
          transaction.update(profileReference, {
            role: [input.fallbackRole],
            position: 'ผู้ใช้งานที่ได้รับอนุมัติ',
            assignedProjects: [input.farmId],
            updatedAt: FieldValue.serverTimestamp(),
          })
          transaction.update(requestReference, {
            organizationId: input.organizationId,
            farmId: input.farmId,
            assignedRole: input.fallbackRole,
            resolvedAt: FieldValue.serverTimestamp(),
            resolvedBy: request.auth.uid,
            updatedAt: FieldValue.serverTimestamp(),
          })
        }

        transaction.set(globalAuditReference, {
          auditEventId: operationId,
          actorUserId: request.auth.uid,
          targetUserId: input.uid,
          targetDisplayName: displayName,
          eventType: input.masterAdmin ? 'MASTER_ADMIN_GRANTED' : 'MASTER_ADMIN_REVOKED',
          beforeRoles,
          afterRoles: input.masterAdmin ? ['MasterAdmin'] : [input.fallbackRole],
          createdAt: FieldValue.serverTimestamp(),
        })
      })
    } catch (error) {
      try {
        await auth.setCustomUserClaims(input.uid, previousClaims)
      } catch (restoreError) {
        console.error('CRITICAL: restore MasterAdmin claims failed', {
          targetUid: input.uid,
          restoreError,
        })
        throw new HttpsError(
          'internal',
          'สิทธิ์ Firebase และโปรไฟล์อาจไม่สอดคล้องกัน กรุณาหยุดแก้สิทธิ์ผู้ใช้นี้และตรวจ Audit/Custom Claims',
        )
      }
      throw asHttpsError(error)
    }

    return { success: true }
  },
)
