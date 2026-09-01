import { spawnSync } from 'node:child_process'

const [requestedCommand, ...args] = process.argv.slice(2)

if (!requestedCommand) {
  console.error('Usage: node scripts/run-with-mock-environment.mjs <command> [...args]')
  process.exit(2)
}

const pnpmCli = process.env.npm_execpath
const command = requestedCommand === 'pnpm' && pnpmCli ? process.execPath : requestedCommand
const commandArgs = requestedCommand === 'pnpm' && pnpmCli ? [pnpmCli, ...args] : args

const mockEnvironment = {
  ...process.env,
  VITE_DATA_ADAPTER: 'mock',
  VITE_AUTH_ADAPTER: 'mock',
  VITE_QR_BASE_URL: 'http://localhost:5173',
  VITE_FIREBASE_PROJECT_ID: 'demo-smart-durian',
  VITE_FIREBASE_API_KEY: 'demo-api-key-not-a-secret',
  VITE_FIREBASE_AUTH_DOMAIN: 'localhost',
  VITE_FIREBASE_STORAGE_BUCKET: 'demo-smart-durian.appspot.com',
  VITE_FIREBASE_STORAGE_READY: 'false',
  VITE_FIREBASE_MESSAGING_SENDER_ID: 'SIMULATED-TEST-ONLY',
  VITE_FIREBASE_APP_ID: 'SIMULATED-TEST-ONLY',
  VITE_FIREBASE_LIVE_AUTH_DEMO_USER_ID: '',
  VITE_FIREBASE_LIVE_AUTH_ALLOWED_PHONE_HASHES: '',
  VITE_FIREBASE_LIVE_AUTH_ALLOWLIST_SALT: '',
  VITE_FIREBASE_LIVE_AUTH_ALLOWLIST_ITERATIONS: '310000',
  VITE_FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
  VITE_FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
  VITE_FIREBASE_STORAGE_EMULATOR_HOST: '127.0.0.1:9199',
}

const result = spawnSync(command, commandArgs, {
  cwd: process.cwd(),
  env: mockEnvironment,
  stdio: 'inherit',
})

if (result.error) throw result.error
process.exit(result.status ?? 1)
