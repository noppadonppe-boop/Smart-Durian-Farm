import { readdir, readFile } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const distRoot = fileURLToPath(new URL('../dist/', import.meta.url))
const textExtensions = new Set(['.html', '.js', '.css', '.webmanifest', '.json'])
const forbiddenPatterns = [
  { label: 'external src/href', pattern: /\b(?:src|href)=["'](?:https?:)?\/\//giu },
  {
    label: 'external CSS import/url',
    pattern: /(?:@import\s+|url\(\s*)["']?(?:https?:)?\/\//giu,
  },
  { label: 'external runtime request', pattern: /\b(?:fetch|import)\s*\(\s*["'](?:https?:)?\/\//giu },
]

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name)
      return entry.isDirectory() ? collectFiles(path) : [path]
    }),
  )
  return files.flat()
}

const files = (await collectFiles(distRoot)).filter((file) =>
  textExtensions.has(extname(file)),
)
const findings = []

for (const file of files) {
  const contents = await readFile(file, 'utf8')
  for (const { label, pattern } of forbiddenPatterns) {
    pattern.lastIndex = 0
    if (pattern.test(contents)) {
      findings.push(`${relative(distRoot, file)}: ${label}`)
    }
  }
}

if (findings.length > 0) {
  console.error('External runtime dependency found in production output:')
  findings.forEach((finding) => console.error(`- ${finding}`))
  process.exitCode = 1
} else {
  console.log(`Offline runtime scan passed: ${files.length} local build files checked.`)
}
