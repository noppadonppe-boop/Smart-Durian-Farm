export type DataAdapterMode = 'mock' | 'firebase-emulator' | 'firebase-live'
export type AuthAdapterMode = 'mock' | 'firebase-emulator' | 'firebase-live'

export interface AppEnvironment {
  dataAdapter: DataAdapterMode
  authAdapter: AuthAdapterMode
  qrBaseUrl: string
  firebase: {
    projectId: string
    apiKey: string
    authDomain: string
    appId: string
    messagingSenderId: string
    storageBucket: string
    storageReady: boolean
    liveAuthDemoUserId: string
    liveAuthAllowedPhoneHashes: readonly string[]
    liveAuthAllowlistSalt: string
    liveAuthAllowlistIterations: number
    authEmulatorHost: string
    firestoreEmulatorHost: string
    storageEmulatorHost: string
  }
}

function adapterMode(value: string | undefined): DataAdapterMode {
  if (value === 'firebase-emulator') return 'firebase-emulator'
  if (value === 'mock') return 'mock'
  return 'firebase-live'
}

function authAdapterMode(
  value: string | undefined,
  dataAdapter: DataAdapterMode,
): AuthAdapterMode {
  if (dataAdapter === 'firebase-emulator') return 'firebase-emulator'
  if (dataAdapter === 'firebase-live') return 'firebase-live'
  return value === 'firebase-live' ? 'firebase-live' : 'mock'
}

function commaSeparatedValues(value: string | undefined): readonly string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

const dataAdapter = adapterMode(import.meta.env.VITE_DATA_ADAPTER)

export const appEnvironment: AppEnvironment = Object.freeze({
  dataAdapter,
  authAdapter: authAdapterMode(import.meta.env.VITE_AUTH_ADAPTER, dataAdapter),
  qrBaseUrl: import.meta.env.VITE_QR_BASE_URL ?? 'https://durian-smartfarm.web.app',
  firebase: {
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'durian-smartfarm',
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
    authDomain:
      import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'durian-smartfarm.firebaseapp.com',
    appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
    storageBucket:
      import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ??
      'durian-smartfarm.appspot.com',
    storageReady: import.meta.env.VITE_FIREBASE_STORAGE_READY === 'true',
    liveAuthDemoUserId:
      import.meta.env.VITE_FIREBASE_LIVE_AUTH_DEMO_USER_ID ?? '',
    liveAuthAllowedPhoneHashes: commaSeparatedValues(
      import.meta.env.VITE_FIREBASE_LIVE_AUTH_ALLOWED_PHONE_HASHES,
    ),
    liveAuthAllowlistSalt:
      import.meta.env.VITE_FIREBASE_LIVE_AUTH_ALLOWLIST_SALT ?? '',
    liveAuthAllowlistIterations: positiveInteger(
      import.meta.env.VITE_FIREBASE_LIVE_AUTH_ALLOWLIST_ITERATIONS,
      310_000,
    ),
    authEmulatorHost:
      import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099',
    firestoreEmulatorHost:
      import.meta.env.VITE_FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080',
    storageEmulatorHost:
      import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST ?? '127.0.0.1:9199',
  },
})
