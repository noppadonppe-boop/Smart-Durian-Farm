import { appEnvironment } from '../config/environment'
import type { Phase6Adapters } from './contracts'

export async function createRuntimeAdapters(): Promise<Phase6Adapters> {
  if (appEnvironment.dataAdapter === 'firebase-live') {
    const [
      { createFirebaseLiveClients },
      { FirebasePhase2Repository },
      { FirebaseTreeRegisterRepository },
      { FirebaseTreeQrAssetRepository },
      { FirebaseWorkCareDiseaseRepository },
      { FirebaseCommercialTraceabilityRepository },
      { FirebaseOperationalHardeningRepository },
      { FirebaseDiseaseAnalysisRepository },
      { FirebaseLivePhoneOtpGateway },
      { FirebaseAnnualCycleRepository },
      { FirebaseManagementReportingRepository },
    ] = await Promise.all([
      import('../infrastructure/firebase/firebaseClient'),
      import('../infrastructure/firebase/firebasePhase2Repository'),
      import('../infrastructure/firebase/firebaseTreeRegisterRepository'),
      import('../infrastructure/firebase/firebaseTreeQrAssetRepository'),
      import('../infrastructure/firebase/firebaseWorkCareDiseaseRepository'),
      import('../infrastructure/firebase/firebaseCommercialTraceabilityRepository'),
      import('../infrastructure/firebase/firebaseOperationalHardeningRepository'),
      import('../infrastructure/firebase/firebaseDiseaseAnalysisRepository'),
      import('../infrastructure/firebase/phoneOtpAuth'),
      import('../infrastructure/firebase/firebaseAnnualCycleRepository'),
      import('../infrastructure/firebase/firebaseManagementReportingRepository'),
    ])
    const clients = createFirebaseLiveClients()
    const treeRepository = new FirebaseTreeRegisterRepository(clients.firestore, false)
    const treeQrAssetRepository = new FirebaseTreeQrAssetRepository(clients.firestore, clients.storage, false)
    const workRepository = new FirebaseWorkCareDiseaseRepository(clients.firestore, clients.storage, false, 'Firebase')
    return {
      auth: new FirebaseLivePhoneOtpGateway(
        clients.auth,
        appEnvironment.firebase.liveAuthAllowedPhoneHashes,
        appEnvironment.firebase.liveAuthAllowlistSalt,
        appEnvironment.firebase.liveAuthAllowlistIterations,
      ),
      repository: new FirebasePhase2Repository(clients.firestore, false),
      treeRepository,
      treeQrAssetRepository,
      workRepository,
      commercialRepository: new FirebaseCommercialTraceabilityRepository(clients.firestore, true, false),
      operationalRepository: new FirebaseOperationalHardeningRepository(clients.firestore, false),
      diseaseAnalysisRepository: new FirebaseDiseaseAnalysisRepository(
        clients.firestore,
        workRepository,
        treeRepository,
        false,
      ),
      annualCycleRepository: new FirebaseAnnualCycleRepository(clients.firestore, false),
      managementReportingRepository: new FirebaseManagementReportingRepository(clients.firestore, false),
      mode: 'firebase-live',
      authMode: 'firebase-live',
    }
  }

  if (appEnvironment.dataAdapter === 'mock') {
    const testModulePath = './mock/mockFoundationAdapters.ts'
    const { createMockPhase2Adapters } = await import(
      /* @vite-ignore */ testModulePath
    ) as typeof import('./mock/mockFoundationAdapters')
    return createMockPhase2Adapters()
  }

  throw new Error('โหมดข้อมูลที่ไม่ใช่ Firebase Live ถูกปิดใช้งานใน browser build')
}
