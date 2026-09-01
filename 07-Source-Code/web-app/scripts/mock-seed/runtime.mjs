import { readFile } from 'node:fs/promises'

export const projectId = 'demo-smart-durian'
export const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099'
export const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080'
export const storageHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST ?? '127.0.0.1:9199'

const loopbackHosts = new Set(['127.0.0.1', 'localhost', '::1'])

function splitHost(value) {
  const separator = value.lastIndexOf(':')
  const host = value.slice(0, separator)
  const port = Number(value.slice(separator + 1))
  if (!loopbackHosts.has(host) || !Number.isInteger(port) || port <= 0) {
    throw new Error(`Refusing non-local Firebase target: ${value}`)
  }
  return { host, port }
}

export function assertLocalEmulatorBoundary() {
  if (process.env.GCLOUD_PROJECT && process.env.GCLOUD_PROJECT !== projectId) {
    throw new Error(`Refusing project ${process.env.GCLOUD_PROJECT}; only ${projectId} is allowed`)
  }
  splitHost(authHost)
  splitHost(firestoreHost)
  splitHost(storageHost)
}

export function firestoreConnection() {
  return splitHost(firestoreHost)
}

export function storageConnection() {
  return splitHost(storageHost)
}

async function loadJson(relativePath) {
  return JSON.parse(await readFile(new URL(relativePath, import.meta.url), 'utf8'))
}

export async function loadMockPacks() {
  const [foundation, annualCycles, work, commercial, operations, diseaseAnalysis] = await Promise.all([
    loadJson('../../src/demo/phase2-demo-seed.json'),
    loadJson('../../src/demo/annual-cycle-mock-data-pack-v1.0.json'),
    loadJson('../../src/demo/phase4-mock-data-pack-v1.0.json'),
    loadJson('../../src/demo/phase5-mock-data-pack-v1.0.json'),
    loadJson('../../src/demo/phase6-mock-data-pack-v1.0.json'),
    loadJson('../../src/demo/disease-analysis-p1-mock-data-pack-v1.0.json'),
  ])
  return { foundation, annualCycles, work, commercial, operations, diseaseAnalysis }
}

async function jsonResponse(response) {
  const payload = await response.json()
  if (!response.ok) throw new Error(JSON.stringify(payload))
  return payload
}

async function authenticateTestPhone(phoneNumber) {
  const baseUrl = `http://${authHost}`
  const send = await jsonResponse(await fetch(
    `${baseUrl}/identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=demo-api-key-not-a-secret`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phoneNumber, recaptchaToken: 'emulator-seed-token' }),
    },
  ))
  const verificationPayload = await jsonResponse(await fetch(
    `${baseUrl}/emulator/v1/projects/${projectId}/verificationCodes`,
  ))
  const verification = verificationPayload.verificationCodes.find(
    (candidate) => candidate.sessionInfo === send.sessionInfo,
  )
  if (!verification) throw new Error(`OTP not found for ${phoneNumber}`)

  return jsonResponse(await fetch(
    `${baseUrl}/identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber?key=demo-api-key-not-a-secret`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionInfo: send.sessionInfo, code: verification.code }),
    },
  ))
}

export async function resetAndSeedAuthentication(users) {
  const response = await fetch(
    `http://${authHost}/emulator/v1/projects/${projectId}/accounts`,
    { method: 'DELETE' },
  )
  if (!response.ok) throw new Error(`Authentication Emulator reset failed: ${response.status}`)

  const mappings = new Map()
  for (const user of users) {
    const auth = await authenticateTestPhone(user.phoneNumber)
    mappings.set(user.userId, { ...user, firebaseUserId: auth.localId })
  }
  return mappings
}

export function uidFor(userMappings, logicalUserId) {
  return userMappings.get(logicalUserId)?.firebaseUserId ?? logicalUserId
}

export function assertMockPack(pack, label) {
  const metadata = pack.metadata
  if (
    metadata?.classification !== 'SIMULATED/TEST ONLY' ||
    metadata?.deterministic !== true ||
    metadata?.resettable !== true ||
    metadata?.productionUseAllowed === true
  ) {
    throw new Error(`${label} is not an approved deterministic Mock Data Pack`)
  }
}
