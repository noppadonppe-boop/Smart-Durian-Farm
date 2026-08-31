import { connect } from 'node:net'

const endpoints = [
  ['Authentication', 9099],
  ['Firestore', 8080],
  ['Storage', 9199],
]

function checkPort(name, port) {
  return new Promise((resolve, reject) => {
    const socket = connect({ host: '127.0.0.1', port })
    const timeout = setTimeout(() => {
      socket.destroy()
      reject(new Error(`${name} emulator timed out on port ${port}`))
    }, 5_000)

    socket.once('connect', () => {
      clearTimeout(timeout)
      socket.end()
      resolve(`${name}:${port}`)
    })
    socket.once('error', (error) => {
      clearTimeout(timeout)
      reject(new Error(`${name} emulator unavailable on port ${port}: ${error.message}`))
    })
  })
}

const results = await Promise.all(
  endpoints.map(([name, port]) => checkPort(name, port)),
)
console.log(`Firebase Local Emulator smoke passed: ${results.join(', ')}`)
