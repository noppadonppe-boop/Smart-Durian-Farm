import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth'
import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from 'firebase/firestore'
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import {
  connectStorageEmulator,
  getStorage,
  type FirebaseStorage,
} from 'firebase/storage'

import { appEnvironment, type AppEnvironment } from '../../config/environment'

export interface FirebaseEmulatorClients {
  app: FirebaseApp
  auth: Auth
  firestore: Firestore
  storage: FirebaseStorage
}

let clients: FirebaseEmulatorClients | undefined

function isLoopbackHost(host: string): boolean {
  return host === '127.0.0.1' || host === 'localhost' || host === '::1'
}

function splitHost(value: string): [host: string, port: number] {
  const separator = value.lastIndexOf(':')
  const host = value.slice(0, separator)
  const port = Number(value.slice(separator + 1))

  if (!host || !Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid emulator host: ${value}`)
  }

  return [host, port]
}

export function createFirebaseEmulatorClients(
  environment: AppEnvironment = appEnvironment,
): FirebaseEmulatorClients {
  if (environment.dataAdapter !== 'firebase-emulator') {
    throw new Error(
      'Firebase clients are disabled. Set VITE_DATA_ADAPTER=firebase-emulator explicitly.',
    )
  }

  if (environment.firebase.projectId !== 'demo-smart-durian') {
    throw new Error('Local development allows only the demo-smart-durian emulator project.')
  }

  const [authHost] = splitHost(environment.firebase.authEmulatorHost)
  const [firestoreHost, firestorePort] = splitHost(
    environment.firebase.firestoreEmulatorHost,
  )
  const [storageHost, storagePort] = splitHost(
    environment.firebase.storageEmulatorHost,
  )
  if (![authHost, firestoreHost, storageHost].every(isLoopbackHost)) {
    throw new Error('Firebase services must use local loopback emulators in this phase.')
  }

  if (clients) return clients

  const app =
    getApps()[0] ??
    initializeApp({
      projectId: environment.firebase.projectId,
      apiKey: environment.firebase.apiKey,
      authDomain: environment.firebase.authDomain,
      storageBucket: environment.firebase.storageBucket,
    })
  const auth = getAuth(app)
  const firestore = getFirestore(app)
  const storage = getStorage(app)

  connectAuthEmulator(
    auth,
    `http://${environment.firebase.authEmulatorHost}`,
    { disableWarnings: true },
  )
  connectFirestoreEmulator(firestore, firestoreHost, firestorePort)
  connectStorageEmulator(storage, storageHost, storagePort)

  clients = { app, auth, firestore, storage }
  return clients
}
