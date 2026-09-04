import { getApps, initializeApp, applicationDefault } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

import { seeders } from './mock-seed/modules.mjs'
import { loadMockPacks } from './mock-seed/load-packs.mjs'

const productionProjectId = 'durian-smartfarm'
const rootSegments = ['durian-smartfarm', 'root']
const moduleOrder = ['foundation', 'annual-cycles', 'trees', 'work', 'commercial', 'management-reporting', 'operations', 'disease-analysis']
const dependencies = Object.freeze({
  foundation: [],
  'annual-cycles': ['foundation'],
  trees: ['foundation'],
  work: ['trees'],
  commercial: ['work', 'annual-cycles'],
  'management-reporting': ['commercial', 'annual-cycles'],
  operations: ['commercial'],
  'disease-analysis': ['work'],
})

function argument(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function hasFlag(name) {
  return process.argv.includes(name)
}

function requestedModule() {
  const value = argument('--module') ?? 'all'
  if (value !== 'all' && !moduleOrder.includes(value)) {
    throw new Error(`Unknown seed module: ${value}. Use ${moduleOrder.join(', ')} or all.`)
  }
  return value
}

function resolveModules(requested) {
  if (requested === 'all') return moduleOrder
  const selected = new Set()
  const visit = (name) => {
    for (const dependency of dependencies[name]) visit(dependency)
    selected.add(name)
  }
  visit(requested)
  return moduleOrder.filter((name) => selected.has(name))
}

function adminSeedSdk(app) {
  let bucket
  const storageBucket = () => {
    bucket ??= getStorage(app).bucket()
    return bucket
  }
  return Object.freeze({
    production: true,
    doc: (parent, ...segments) => {
      if (parent?.path && parent?.firestore) {
        return parent.firestore.doc([parent.path, ...segments].join('/'))
      }
      return parent.doc(segments.join('/'))
    },
    serverTimestamp: () => FieldValue.serverTimestamp(),
    setDoc: (reference, data, options) => reference.set(data, options ?? {}),
    ref: (_storage, path) => ({ bucket: storageBucket(), path }),
    uploadBytes: async (reference, bytes, metadata) => reference.bucket.file(reference.path).save(
      Buffer.from(bytes),
      {
        resumable: false,
        metadata: {
          contentType: metadata?.contentType,
          metadata: metadata?.customMetadata,
        },
      },
    ),
  })
}

function userMappingsForProduction(packs, ownerUid) {
  if (!ownerUid || !/^[A-Za-z0-9:_-]{6,128}$/u.test(ownerUid)) {
    throw new Error('ต้องระบุ --owner-uid เป็น Firebase Auth UID ที่ถูกต้อง')
  }
  const owner = packs.foundation.users.find((user) => user.isOrganizationOwner)
  if (!owner) throw new Error('ไม่พบ Owner ใน seed data')
  return new Map(packs.foundation.users.map((user) => [
    user.userId,
    { ...user, firebaseUserId: user.userId === owner.userId ? ownerUid : user.userId },
  ]))
}

function initializeProductionApp() {
  const configuredProject = argument('--project') ?? process.env.FIREBASE_PROJECT_ID ?? process.env.GCLOUD_PROJECT
  if (configuredProject !== productionProjectId) {
    throw new Error(`ปฏิเสธ Firebase project: ต้องระบุ --project ${productionProjectId} เท่านั้น`)
  }
  if (getApps().length > 0) return getApps()[0]
  return initializeApp({
    credential: applicationDefault(),
    projectId: productionProjectId,
    storageBucket: `${productionProjectId}.appspot.com`,
  })
}

const requested = requestedModule()
const modules = resolveModules(requested)
const packs = await loadMockPacks()
const ownerUid = argument('--owner-uid')

console.log(JSON.stringify({
  projectId: productionProjectId,
  target: requested,
  modules,
  ownerUid: ownerUid ? `${ownerUid.slice(0, 4)}…` : null,
  mode: hasFlag('--confirm-production') ? 'WRITE' : 'DRY_RUN',
}, null, 2))

if (!hasFlag('--confirm-production')) {
  console.log('Dry run: ระบุ --confirm-production เมื่อตรวจสอบ project และ owner UID แล้วจึงจะเขียนข้อมูล')
  process.exit(0)
}

if (!hasFlag('--confirm-production-seed')) {
  throw new Error('การเขียน Production ต้องยืนยันเพิ่มด้วย --confirm-production-seed')
}

const app = initializeProductionApp()
const firestore = getFirestore(app)
const storage = getStorage(app)
const userMappings = userMappingsForProduction(packs, ownerUid)
const seedContext = {
  firestore,
  storage,
  packs,
  rootSegments,
  userMappings,
  sdk: adminSeedSdk(app),
}
const results = {}
for (const moduleName of modules) {
  results[moduleName] = await seeders[moduleName](seedContext)
}

console.log(JSON.stringify({
  projectId: productionProjectId,
  target: requested,
  modules,
  classification: 'SIMULATED/TEST ONLY',
  exampleData: true,
  authOwnerUid: ownerUid,
  results,
}, null, 2))
