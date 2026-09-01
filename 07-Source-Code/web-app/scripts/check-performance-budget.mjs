import { readdir, readFile, stat } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const distRoot = join(appRoot, 'dist')
const [manifest, budget] = await Promise.all([
  readFile(join(distRoot, '.vite', 'manifest.json'), 'utf8').then(JSON.parse),
  readFile(join(appRoot, 'src', 'config', 'phase6-performance-budget.json'), 'utf8').then(JSON.parse),
])

const entry = Object.values(manifest).find((item) => item.isEntry)
if (!entry) throw new Error('ไม่พบ entry ใน Vite manifest')

const initialFiles = new Set()
function collectInitial(item) {
  if (item.file) initialFiles.add(item.file)
  for (const cssFile of item.css ?? []) initialFiles.add(cssFile)
  for (const importedKey of item.imports ?? []) {
    const imported = manifest[importedKey]
    if (imported) collectInitial(imported)
  }
}
collectInitial(entry)

async function totalBytes(files) {
  let total = 0
  for (const file of files) total += (await stat(join(distRoot, file))).size
  return total
}

const initialJavaScriptFiles = [...initialFiles].filter((file) => file.endsWith('.js'))
const initialCssFiles = [...initialFiles].filter((file) => file.endsWith('.css'))
const initialJavaScriptBytes = await totalBytes(initialJavaScriptFiles)
const initialCssBytes = await totalBytes(initialCssFiles)

async function runtimeFiles(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name)
    if (entry.isDirectory()) {
      if (entry.name !== '.vite') files.push(...await runtimeFiles(fullPath))
    } else if (/\.(?:css|html|js|svg|webmanifest)$/u.test(entry.name)) {
      files.push(relative(distRoot, fullPath))
    }
  }
  return files
}
const totalPrecacheBytes = await totalBytes(await runtimeFiles(distRoot))

const checks = [
  ['Initial JavaScript', initialJavaScriptBytes, budget.initialJavaScriptBytes],
  ['Initial CSS', initialCssBytes, budget.initialCssBytes],
  ['Total offline runtime', totalPrecacheBytes, budget.totalPrecacheBytes],
]
for (const [label, actual, limit] of checks) {
  const status = actual <= limit ? 'PASS' : 'FAIL'
  console.log(`${status} ${label}: ${actual} / ${limit} bytes`)
  if (actual > limit) process.exitCode = 1
}

if (process.exitCode) throw new Error('Phase 6 performance budget ไม่ผ่าน')
