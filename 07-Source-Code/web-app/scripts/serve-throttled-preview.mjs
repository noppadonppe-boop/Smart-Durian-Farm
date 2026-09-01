import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { dirname, extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const distRoot = resolve(appRoot, 'dist')
const port = 4186
const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
])

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url ?? '/', `http://${request.headers.host}`).pathname)
    const requestedPath = resolve(distRoot, `.${pathname}`)
    if (requestedPath !== distRoot && !requestedPath.startsWith(`${distRoot}${sep}`)) {
      response.writeHead(403).end('Forbidden')
      return
    }
    let filePath = requestedPath
    try {
      if ((await stat(filePath)).isDirectory()) filePath = resolve(filePath, 'index.html')
    } catch {
      filePath = extname(pathname) ? requestedPath : resolve(distRoot, 'index.html')
    }
    const body = await readFile(filePath)
    setTimeout(() => {
      response.writeHead(200, {
        'Cache-Control': 'no-store',
        'Content-Type': contentTypes.get(extname(filePath)) ?? 'application/octet-stream',
        'X-KDOMS-Test-Network': 'SIMULATED-250MS-LATENCY',
      })
      response.end(body)
    }, 250)
  } catch {
    response.writeHead(404).end('Not found')
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Throttled local preview: http://127.0.0.1:${port}/ (250 ms response latency)`)
})
