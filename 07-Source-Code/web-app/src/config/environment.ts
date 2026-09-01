export type DataAdapterMode = 'mock' | 'firebase-emulator'

export interface AppEnvironment {
  dataAdapter: DataAdapterMode
  qrBaseUrl: string
  firebase: {
    projectId: string
    apiKey: string
    authDomain: string
    storageBucket: string
    authEmulatorHost: string
    firestoreEmulatorHost: string
    storageEmulatorHost: string
  }
}

function adapterMode(value: string | undefined): DataAdapterMode {
  return value === 'firebase-emulator' ? 'firebase-emulator' : 'mock'
}

export const appEnvironment: AppEnvironment = Object.freeze({
  dataAdapter: adapterMode(import.meta.env.VITE_DATA_ADAPTER),
  qrBaseUrl: import.meta.env.VITE_QR_BASE_URL ?? 'http://localhost:5173',
  firebase: {
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'demo-smart-durian',
    apiKey:
      import.meta.env.VITE_FIREBASE_API_KEY ?? 'demo-api-key-not-a-secret',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'localhost',
    storageBucket:
      import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ??
      'demo-smart-durian.appspot.com',
    authEmulatorHost:
      import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099',
    firestoreEmulatorHost:
      import.meta.env.VITE_FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080',
    storageEmulatorHost:
      import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST ?? '127.0.0.1:9199',
  },
})
