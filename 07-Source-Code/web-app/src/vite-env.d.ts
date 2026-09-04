/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_ADAPTER?: string
  readonly VITE_AUTH_ADAPTER?: string
  readonly VITE_QR_BASE_URL?: string
  readonly VITE_FIREBASE_PROJECT_ID?: string
  readonly VITE_FIREBASE_API_KEY?: string
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string
  readonly VITE_FIREBASE_APP_ID?: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string
  readonly VITE_FIREBASE_STORAGE_READY?: string
  readonly VITE_FIREBASE_LIVE_AUTH_ALLOWED_PHONE_HASHES?: string
  readonly VITE_FIREBASE_LIVE_AUTH_ALLOWLIST_SALT?: string
  readonly VITE_FIREBASE_LIVE_AUTH_ALLOWLIST_ITERATIONS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
