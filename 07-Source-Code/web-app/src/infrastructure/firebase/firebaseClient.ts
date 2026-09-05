import { getAuth, type Auth } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore'
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

import { appEnvironment, type AppEnvironment } from '../../config/environment'

export interface FirebaseLiveClients {
  app: FirebaseApp
  auth: Auth
  firestore: Firestore
  storage: FirebaseStorage
}

let liveClients: FirebaseLiveClients | undefined

export function createFirebaseLiveClients(
  environment: AppEnvironment = appEnvironment,
): FirebaseLiveClients {
  if (environment.dataAdapter !== 'firebase-live') {
    throw new Error('Firebase Production data is disabled. Set VITE_DATA_ADAPTER=firebase-live explicitly.')
  }
  if (
    !environment.firebase.projectId ||
    environment.firebase.projectId === 'demo-smart-durian' ||
    !environment.firebase.apiKey ||
    !environment.firebase.authDomain ||
    !environment.firebase.appId ||
    !environment.firebase.storageBucket
  ) {
    throw new Error('Firebase Production config ต้องมีค่าครบถ้วน (projectId, apiKey, authDomain, appId, storageBucket)')
  }
  if (liveClients) return liveClients

  const appName = 'kdoms-production'
  const app =
    getApps().find((candidate) => candidate.name === appName) ??
    initializeApp(
      {
        projectId: environment.firebase.projectId,
        apiKey: environment.firebase.apiKey,
        authDomain: environment.firebase.authDomain,
        appId: environment.firebase.appId,
        messagingSenderId: environment.firebase.messagingSenderId,
        storageBucket: environment.firebase.storageBucket,
      },
      appName,
    )
  const auth = getAuth(app)
  auth.languageCode = 'th'
  liveClients = {
    app,
    auth,
    firestore: initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    }),
    storage: getStorage(app),
  }
  return liveClients
}
