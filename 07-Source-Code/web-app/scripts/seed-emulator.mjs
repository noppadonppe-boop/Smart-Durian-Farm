import { readFile } from 'node:fs/promises'

import { initializeTestEnvironment } from '@firebase/rules-unit-testing'

import { seeders } from './mock-seed/modules.mjs'
import {
  assertLocalEmulatorBoundary,
  firestoreConnection,
  loadMockPacks,
  projectId,
  resetAndSeedAuthentication,
  storageConnection,
} from './mock-seed/runtime.mjs'
import { verifySeed } from './mock-seed/verify.mjs'

const moduleOrder = ['foundation', 'trees', 'work', 'commercial', 'operations', 'disease-analysis']
const rootSegments = ['durian-smartfarm', 'root']
const dependencies = Object.freeze({
  foundation: [],
  trees: ['foundation'],
  work: ['trees'],
  commercial: ['work'],
  operations: ['commercial'],
  'disease-analysis': ['work'],
})

function requestedModule() {
  const index = process.argv.indexOf('--module')
  const value = index >= 0 ? process.argv[index + 1] : 'all'
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

assertLocalEmulatorBoundary()
const requested = requestedModule()
const modules = resolveModules(requested)
const packs = await loadMockPacks()
const firestoreRules = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8')
const storageRules = await readFile(new URL('../storage.rules', import.meta.url), 'utf8')
const { host, port } = firestoreConnection()
const { host: storageEmulatorHost, port: storageEmulatorPort } = storageConnection()
const environment = await initializeTestEnvironment({
  projectId,
  firestore: { rules: firestoreRules, host, port },
  storage: {
    rules: storageRules,
    host: storageEmulatorHost,
    port: storageEmulatorPort,
  },
})

try {
  await environment.clearFirestore()
  await environment.clearStorage()
  const userMappings = await resetAndSeedAuthentication(packs.foundation.users)
  const results = {}
  await environment.withSecurityRulesDisabled(async (context) => {
    const seedContext = {
      firestore: context.firestore(),
      storage: context.storage(),
      packs,
      rootSegments,
      userMappings,
    }
    for (const moduleName of modules) {
      results[moduleName] = await seeders[moduleName](seedContext)
    }
    const verifiedRecords = await verifySeed({ ...seedContext, modules, results })
    console.log(
      `Verified ${verifiedRecords} deterministic seed records across ${modules.length} modules.`,
    )
  })
  console.log(JSON.stringify({
    projectId,
    target: requested,
    modules,
    classification: 'SIMULATED/TEST ONLY',
    authAccounts: userMappings.size,
    results,
  }, null, 2))
} finally {
  await environment.cleanup()
}
