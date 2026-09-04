import { getDoc, runTransaction, serverTimestamp } from 'firebase/firestore'

import { appEnvironment } from '../config/environment'
import {
  deriveFarmCode,
  normalizeFarmProfileDraft,
  type AuthenticatedIdentity,
  type FarmProfileDraft,
} from '../domain/farm'
import { createFirebaseLiveClients } from '../infrastructure/firebase/firebaseClient'
import { rootDoc, rootDocument } from '../infrastructure/firebase/firebaseDataRoot'
import { FirebasePhase2Repository } from '../infrastructure/firebase/firebasePhase2Repository'

export interface OperationalWorkspaceInput {
  organizationName: string
  organizationCode: string
  farmName: string
  farmSequence: string
  province: string
  district: string
  subdistrict: string
  locationNote: string
}

export interface OperationalWorkspaceResult {
  organizationId: string
  farmId: string
  farmCode: string
}

export interface TestSeedResult {
  modules: readonly string[]
  skippedStorageUploads: boolean
  counts: Record<string, unknown>
}

function normalizeOrganizationName(value: string): string {
  const normalized = value.trim()
  if (normalized.length < 2 || normalized.length > 100) {
    throw new Error('ชื่อองค์กรต้องมี 2–100 ตัวอักษร')
  }
  return normalized
}

function normalizeOrganizationCode(value: string): string {
  const normalized = value.trim().toUpperCase()
  if (!/^[A-Z0-9]{2,10}$/u.test(normalized)) {
    throw new Error('Organization Code ต้องเป็น A–Z/0–9 จำนวน 2–10 ตัว เช่น KDOMS')
  }
  if (normalized === 'DEMO' || normalized === 'TEST') {
    throw new Error('ข้อมูลใช้งานจริงห้ามใช้ Organization Code ที่สื่อว่าเป็นข้อมูลทดสอบ')
  }
  return normalized
}

function identityForCurrentUser(): AuthenticatedIdentity {
  const { auth } = createFirebaseLiveClients()
  const user = auth.currentUser
  if (!user) throw new Error('กรุณาเข้าสู่ระบบ Firebase Live ก่อน')
  const phone = user.phoneNumber ?? ''
  return {
    userId: user.uid,
    displayName: user.displayName?.trim() || user.email || 'ผู้ดูแลระบบ',
    maskedPhone: phone
      ? `${phone.slice(0, 4)}••••${phone.slice(-3)}`
      : 'Firebase Admin',
    source: 'firebase-live',
  }
}

export async function bootstrapOperationalWorkspace(
  input: OperationalWorkspaceInput,
): Promise<OperationalWorkspaceResult> {
  const organizationName = normalizeOrganizationName(input.organizationName)
  const organizationCode = normalizeOrganizationCode(input.organizationCode)
  const organizationId = `org_${organizationCode.toLowerCase()}`
  const farmDraft: FarmProfileDraft = normalizeFarmProfileDraft({
    farmName: input.farmName,
    farmSequence: input.farmSequence,
    province: input.province,
    district: input.district,
    subdistrict: input.subdistrict,
    locationNote: input.locationNote,
    timezone: 'Asia/Bangkok',
    seasonStartMonth: null,
    seasonEndMonth: null,
    seasonNote: '',
    notes: '',
  })
  const identity = identityForCurrentUser()
  const { auth, firestore } = createFirebaseLiveClients()
  const user = auth.currentUser!
  const rootReference = rootDocument(firestore)
  const organizationReference = rootDoc(firestore, 'organizations', organizationId)
  const organizationMemberReference = rootDoc(
    firestore,
    'organizations',
    organizationId,
    'members',
    user.uid,
  )
  const profileReference = rootDoc(firestore, 'users', user.uid)
  const appMetaReference = rootDoc(firestore, 'appMeta', 'config')

  await runTransaction(firestore, async (transaction) => {
    const [rootSnapshot, organizationSnapshot, memberSnapshot, profileSnapshot] =
      await Promise.all([
        transaction.get(rootReference),
        transaction.get(organizationReference),
        transaction.get(organizationMemberReference),
        transaction.get(profileReference),
      ])

    if (organizationSnapshot.exists()) {
      const existing = organizationSnapshot.data()
      if (existing.organizationCode !== organizationCode || existing.exampleData !== false) {
        throw new Error('Organization Code นี้ถูกใช้โดยข้อมูลประเภทอื่นแล้ว')
      }
    }

    transaction.set(rootReference, {
      projectId: 'durian-smartfarm',
      documentName: 'root',
      schemaVersion: '2.1.0',
      layout: 'ROOT_ORGANIZATION_FARM_MENU',
      menuCategories: [
        'foundation',
        'trees',
        'work',
        'care',
        'disease',
        'commercial',
        'operations',
        'disease-analysis',
        'annual-cycles',
        'management-reporting',
        'audit',
      ],
      ...(!rootSnapshot.exists() ? { seedOwnerUid: user.uid } : {}),
      classification: 'OPERATIONAL',
      exampleData: false,
      operationalEnabled: true,
      updatedAt: serverTimestamp(),
    }, { merge: true })

    if (!organizationSnapshot.exists()) {
      transaction.set(organizationReference, {
        organizationId,
        organizationName,
        organizationCode,
        status: 'ACTIVE',
        classification: 'OPERATIONAL',
        exampleData: false,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }

    transaction.set(organizationMemberReference, {
      organizationId,
      userId: user.uid,
      status: 'ACTIVE',
      isOwner: true,
      classification: 'OPERATIONAL',
      exampleData: false,
      ...(!memberSnapshot.exists() ? { createdAt: serverTimestamp() } : {}),
      updatedAt: serverTimestamp(),
    }, { merge: true })

    const displayParts = (user.displayName ?? '').trim().split(/\s+/u).filter(Boolean)
    transaction.set(profileReference, {
      uid: user.uid,
      email: user.email ?? '',
      firstName: displayParts[0] ?? 'ผู้ดูแล',
      lastName: displayParts.slice(1).join(' '),
      position: 'ผู้ดูแลระบบ',
      role: ['MasterAdmin', 'ORG_OWNER'],
      status: 'approved',
      assignedProjects: [organizationId],
      ...(!profileSnapshot.exists() ? { createdAt: serverTimestamp() } : {}),
      ...(user.photoURL ? { photoURL: user.photoURL } : {}),
      isFirstUser: !rootSnapshot.exists(),
      updatedAt: serverTimestamp(),
    }, { merge: true })

    transaction.set(appMetaReference, {
      operationalEnabled: true,
      productionProjectId: 'durian-smartfarm',
      updatedAt: serverTimestamp(),
    }, { merge: true })
  })

  const repository = new FirebasePhase2Repository(firestore, false)
  const result = await repository.createFarm({
    context: {
      actor: identity,
      organizationId,
      organizationCode,
      isOrganizationOwner: true,
    },
    idempotencyKey: `bootstrap_${organizationCode}_${farmDraft.farmSequence}`,
    draft: farmDraft,
  })

  return {
    organizationId,
    farmId: result.profile.farmId,
    farmCode: deriveFarmCode(organizationCode, farmDraft.farmSequence),
  }
}

export async function seedFirebaseLiveTestPack(): Promise<TestSeedResult> {
  const identity = identityForCurrentUser()
  const { firestore, storage } = createFirebaseLiveClients()
  if (!(await getDoc(rootDocument(firestore))).exists()) {
    throw new Error('กรุณาสร้างพื้นที่ใช้งานจริงก่อน Seed ชุดทดสอบ')
  }

  const [
    seedModule,
    foundation,
    annualCycles,
    work,
    commercial,
    operations,
    diseaseAnalysis,
    managementReporting,
  ] = await Promise.all([
    // JavaScript module is shared with the Admin SDK seed script.
    import('../../scripts/mock-seed/modules.mjs'),
    import('../../scripts/seed-data/phase2-demo-seed.json'),
    import('../../scripts/seed-data/annual-cycle-mock-data-pack-v1.0.json'),
    import('../../scripts/seed-data/phase4-mock-data-pack-v1.0.json'),
    import('../../scripts/seed-data/phase5-mock-data-pack-v1.0.json'),
    import('../../scripts/seed-data/phase6-mock-data-pack-v1.0.json'),
    import('../../scripts/seed-data/disease-analysis-p1-mock-data-pack-v1.0.json'),
    import('../../scripts/seed-data/management-reporting-mock-data-pack-v1.0.json'),
  ])

  const packs = {
    foundation: foundation.default,
    annualCycles: annualCycles.default,
    work: work.default,
    commercial: commercial.default,
    operations: operations.default,
    diseaseAnalysis: diseaseAnalysis.default,
    managementReporting: managementReporting.default,
  }
  const users = packs.foundation.users
  const userMappings = new Map(users.map((candidate) => [
    candidate.userId,
    {
      ...candidate,
      firebaseUserId: candidate.isOrganizationOwner ? identity.userId : candidate.userId,
    },
  ]))
  const moduleOrder = [
    'foundation',
    'annual-cycles',
    'trees',
    'work',
    'commercial',
    'management-reporting',
    'operations',
    'disease-analysis',
  ] as const
  const counts: Record<string, unknown> = {}
  const seeders = seedModule.seeders as Record<
    string,
    (context: Record<string, unknown>) => Promise<unknown>
  >
  const context = {
    firestore,
    storage,
    packs,
    rootSegments: ['durian-smartfarm', 'root'],
    userMappings,
    skipRootDocument: true,
    skipStorageUploads: !appEnvironment.firebase.storageReady,
  }

  for (const moduleName of moduleOrder) {
    const seed = seeders[moduleName]
    if (!seed) throw new Error(`ไม่พบ Seeder สำหรับ ${moduleName}`)
    counts[moduleName] = await seed(context)
  }

  return {
    modules: moduleOrder,
    skippedStorageUploads: !appEnvironment.firebase.storageReady,
    counts,
  }
}
