// Mock implementations are test doubles only; AppEnvironment below is always Live.
export type DataAdapterMode = 'mock' | 'firebase-live'
export type AuthAdapterMode = 'mock' | 'firebase-live'

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
    liveAuthAllowedPhoneHashes: readonly string[]
    liveAuthAllowlistSalt: string
    liveAuthAllowlistIterations: number
  }
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

export const appEnvironment: AppEnvironment = Object.freeze({
  dataAdapter: 'firebase-live',
  authAdapter: 'firebase-live',
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
    liveAuthAllowedPhoneHashes: commaSeparatedValues(
      import.meta.env.VITE_FIREBASE_LIVE_AUTH_ALLOWED_PHONE_HASHES,
    ),
    liveAuthAllowlistSalt:
      import.meta.env.VITE_FIREBASE_LIVE_AUTH_ALLOWLIST_SALT ?? '',
    liveAuthAllowlistIterations: positiveInteger(
      import.meta.env.VITE_FIREBASE_LIVE_AUTH_ALLOWLIST_ITERATIONS,
      310_000,
    ),
  },
})
