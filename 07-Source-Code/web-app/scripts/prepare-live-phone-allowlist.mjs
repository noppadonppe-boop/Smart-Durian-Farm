import { pbkdf2Sync, randomBytes } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const candidates = ['.env', '.env.firebase-live.local']
const rawKey = 'FIREBASE_LIVE_AUTH_ALLOWED_PHONE_NUMBERS'
const legacyRawKey = 'VITE_FIREBASE_LIVE_AUTH_ALLOWED_PHONE_NUMBERS'
const hashKey = 'VITE_FIREBASE_LIVE_AUTH_ALLOWED_PHONE_HASHES'
const saltKey = 'VITE_FIREBASE_LIVE_AUTH_ALLOWLIST_SALT'
const iterationsKey = 'VITE_FIREBASE_LIVE_AUTH_ALLOWLIST_ITERATIONS'
const iterations = 310_000

function parseEnv(text) {
  const result = new Map()
  for (const line of text.split(/\r?\n/u)) {
    const separator = line.indexOf('=')
    if (separator < 1 || line.trimStart().startsWith('#')) continue
    result.set(line.slice(0, separator).trim(), line.slice(separator + 1).trim())
  }
  return result
}

function normalizePhoneNumber(value) {
  const normalized = value.replace(/[\s()-]/gu, '')
  if (/^0\d{9}$/u.test(normalized)) return `+66${normalized.slice(1)}`
  if (/^66\d{9}$/u.test(normalized)) return `+${normalized}`
  return normalized
}

function upsert(text, key, value) {
  const lines = text.split(/\r?\n/u)
  const replacement = `${key}=${value}`
  const index = lines.findIndex((line) => line.startsWith(`${key}=`))
  if (index >= 0) lines[index] = replacement
  else lines.push(replacement)
  return lines.join('\n')
}

function removeKey(text, key) {
  return text
    .split(/\r?\n/u)
    .filter((line) => !line.startsWith(`${key}=`))
    .join('\n')
}

const files = []
for (const candidate of candidates) {
  const path = resolve(root, candidate)
  try {
    const text = await readFile(path, 'utf8')
    files.push({ path, text, env: parseEnv(text) })
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
}

const source = files.find(
  ({ env }) => env.get(rawKey) || env.get(legacyRawKey),
)
if (!source) {
  throw new Error(
    `Missing ${rawKey} in an ignored local env file; live Phone Auth build stopped`,
  )
}

const phoneNumbers = [
  ...new Set(
    (source.env.get(rawKey) ?? source.env.get(legacyRawKey) ?? '')
      .split(',')
      .map((value) => normalizePhoneNumber(value.trim()))
      .filter(Boolean),
  ),
]
if (
  phoneNumbers.length === 0 ||
  phoneNumbers.some((value) => !/^\+[1-9]\d{7,14}$/u.test(value))
) {
  throw new Error('Live Phone Auth allowlist is empty or contains an invalid number')
}

const existingSalt = source.env.get(saltKey)
const salt = existingSalt && /^[A-Za-z0-9_-]{20,}$/u.test(existingSalt)
  ? existingSalt
  : randomBytes(16).toString('base64url')
const saltBytes = Buffer.from(salt, 'base64url')
const hashes = phoneNumbers.map((phoneNumber) =>
  pbkdf2Sync(phoneNumber, saltBytes, iterations, 32, 'sha256').toString('base64url'),
)

let updated = removeKey(source.text, legacyRawKey)
updated = upsert(updated, rawKey, phoneNumbers.join(','))
updated = upsert(updated, hashKey, hashes.join(','))
updated = upsert(updated, saltKey, salt)
updated = upsert(updated, iterationsKey, String(iterations))
await writeFile(source.path, `${updated.trimEnd()}\n`, 'utf8')

console.log(`Prepared ${phoneNumbers.length} PBKDF2 allowlist entries without exposing raw phone numbers to Vite.`)
