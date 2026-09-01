import type { Firestore } from 'firebase/firestore'
import type { FirebaseStorage } from 'firebase/storage'

import type {
  ProductionMockSeeder,
  ProductionMockSeedResult,
} from '../../adapters/contracts'
import { appEnvironment } from '../../config/environment'
import foundationPack from '../../demo/phase2-demo-seed.json'
import workPack from '../../demo/phase4-mock-data-pack-v1.0.json'
import commercialPack from '../../demo/phase5-mock-data-pack-v1.0.json'
import operationsPack from '../../demo/phase6-mock-data-pack-v1.0.json'
import diseaseAnalysisPack from '../../demo/disease-analysis-p1-mock-data-pack-v1.0.json'
import type { AuthenticatedIdentity } from '../../domain/farm'
import { firebaseDataRootSegments } from './firebaseDataRoot'

// @ts-expect-error The shared browser/Node seeder is JavaScript and intentionally has no declaration file.
import { seeders } from '../../../scripts/mock-seed/modules.mjs'

const moduleOrder = [
  'foundation',
  'trees',
  'work',
  'commercial',
  'operations',
  'disease-analysis',
] as const

interface SeedUserMapping {
  userId: string
  firebaseUserId: string
  displayName: string
  phoneNumber: string
  mockOtp: string
  isOrganizationOwner: boolean
  memberships: typeof foundationPack.users[number]['memberships']
}

type SeedModuleResult = Record<string, number>
type SeedModuleName = typeof moduleOrder[number]

interface SeedRuntimeContext {
  firestore: Firestore
  storage: FirebaseStorage
  rootSegments: string[]
  packs: {
    foundation: typeof foundationPack
    work: typeof workPack
    commercial: typeof commercialPack
    operations: typeof operationsPack
    diseaseAnalysis: typeof diseaseAnalysisPack
  }
  userMappings: Map<string, SeedUserMapping>
  skipStorageUploads: boolean
}

const productionSeeders = seeders as unknown as Record<
  SeedModuleName,
  (context: SeedRuntimeContext) => Promise<SeedModuleResult>
>

export class FirebaseProductionMockSeeder implements ProductionMockSeeder {
  constructor(
    private readonly firestore: Firestore,
    private readonly storage: FirebaseStorage,
  ) {}

  async seed(actor: AuthenticatedIdentity): Promise<ProductionMockSeedResult> {
    if (
      appEnvironment.dataAdapter !== 'firebase-live' ||
      appEnvironment.firebase.projectId !== 'durian-smartfarm'
    ) {
      throw new Error('ปุ่ม Seed ใช้ได้เฉพาะ Firebase Production project durian-smartfarm')
    }
    if (actor.source !== 'firebase-live') {
      throw new Error('ต้องยืนยันตัวตนด้วย Firebase Phone Auth ก่อน Seed ข้อมูล')
    }

    const userMappings = new Map<string, SeedUserMapping>()
    for (const user of foundationPack.users) {
      userMappings.set(user.userId, {
        ...user,
        firebaseUserId: user.isOrganizationOwner ? actor.userId : user.userId,
      })
    }

    const context = {
      firestore: this.firestore,
      storage: this.storage,
      rootSegments: [...firebaseDataRootSegments],
      packs: {
        foundation: foundationPack,
        work: workPack,
        commercial: commercialPack,
        operations: operationsPack,
        diseaseAnalysis: diseaseAnalysisPack,
      },
      userMappings,
      skipStorageUploads: !appEnvironment.firebase.storageReady,
    }
    const results: Record<string, SeedModuleResult> = {}
    for (const moduleName of moduleOrder) {
      results[moduleName] = await productionSeeders[moduleName](context)
    }

    const recordCount = Object.values(results).reduce(
      (total, result) => total + Object.values(result).reduce(
        (subtotal, count) => subtotal + count,
        0,
      ),
      0,
    )
    return {
      projectId: 'durian-smartfarm',
      rootPath: 'durian-smartfarm/root',
      classification: 'SIMULATED/TEST ONLY',
      modules: moduleOrder,
      recordCount,
      storageUploadsSkipped: appEnvironment.firebase.storageReady ? 0 : 3,
    }
  }
}
