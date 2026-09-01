import { appEnvironment } from '../config/environment'
import type { Phase6Adapters } from './contracts'

export async function createRuntimeAdapters(): Promise<Phase6Adapters> {
  if (appEnvironment.dataAdapter === 'mock') {
    const { createMockPhase2Adapters } = await import('./mock/mockFoundationAdapters')
    return createMockPhase2Adapters()
  }

  const [
    { createFirebaseEmulatorClients },
    { FirebasePhase2Repository },
    { FirebaseTreeRegisterRepository },
    { FirebaseWorkCareDiseaseRepository },
    { FirebaseCommercialTraceabilityRepository },
    { FirebaseOperationalHardeningRepository },
    { FirebaseDiseaseAnalysisRepository },
    { FirebaseEmulatorPhoneOtpGateway },
  ] = await Promise.all([
    import('../infrastructure/firebase/firebaseClient'),
    import('../infrastructure/firebase/firebasePhase2Repository'),
    import('../infrastructure/firebase/firebaseTreeRegisterRepository'),
    import('../infrastructure/firebase/firebaseWorkCareDiseaseRepository'),
    import('../infrastructure/firebase/firebaseCommercialTraceabilityRepository'),
    import('../infrastructure/firebase/firebaseOperationalHardeningRepository'),
    import('../infrastructure/firebase/firebaseDiseaseAnalysisRepository'),
    import('../infrastructure/firebase/phoneOtpAuth'),
  ])
  const clients = createFirebaseEmulatorClients()
  const treeRepository = new FirebaseTreeRegisterRepository(clients.firestore)
  const workRepository = new FirebaseWorkCareDiseaseRepository(clients.firestore, clients.storage)
  return {
    auth: new FirebaseEmulatorPhoneOtpGateway(clients.auth),
    repository: new FirebasePhase2Repository(clients.firestore),
    treeRepository,
    workRepository,
    commercialRepository: new FirebaseCommercialTraceabilityRepository(clients.firestore),
    operationalRepository: new FirebaseOperationalHardeningRepository(clients.firestore),
    diseaseAnalysisRepository: new FirebaseDiseaseAnalysisRepository(
      clients.firestore,
      workRepository,
      treeRepository,
    ),
    mode: 'firebase-emulator',
  }
}
