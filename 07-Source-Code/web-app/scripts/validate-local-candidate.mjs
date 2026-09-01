import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repositoryRoot = path.resolve(appRoot, '..', '..')
const pnpmCli = process.env.npm_execpath

if (!pnpmCli) throw new Error('Run this validator through pnpm validate:local-candidate')

const pnpmCommand = process.execPath
const pnpmArgs = (script) => [pnpmCli, script]

const steps = [
  ['ESLint', pnpmCommand, pnpmArgs('lint'), appRoot],
  ['TypeScript strict', pnpmCommand, pnpmArgs('typecheck'), appRoot],
  ['Unit/component tests', pnpmCommand, pnpmArgs('test'), appRoot],
  ['Deterministic seed', pnpmCommand, pnpmArgs('test:seed:emulator'), appRoot],
  ['Firebase Emulator/security tests', pnpmCommand, pnpmArgs('test:emulator'), appRoot],
  ['Mock-only build/PWA', pnpmCommand, pnpmArgs('build:mock'), appRoot],
  ['Performance budget', pnpmCommand, pnpmArgs('performance:budget'), appRoot],
  ['Offline runtime scan', pnpmCommand, pnpmArgs('smoke:offline'), appRoot],
  ['Git whitespace check', 'git', ['diff', '--check'], repositoryRoot],
]

for (const [label, command, args, cwd] of steps) {
  console.log(`\n=== ${label} ===`)
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

console.log('\nPASS Local Candidate full validation — SIMULATED/TEST ONLY')
