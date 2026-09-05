import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../infrastructure/firebase/firebaseClient', () => ({
  createFirebaseLiveClients: () => ({ firestore: {} }),
}))

vi.mock('../infrastructure/firebase/firebaseDataRoot', () => ({
  rootDocument: () => ({}),
}))

const getDocFromServer = vi.fn()
vi.mock('firebase/firestore', () => ({ getDocFromServer }))

afterEach(() => {
  vi.unstubAllGlobals()
  getDocFromServer.mockReset()
})

describe('probeFirebaseConnectivity', () => {
  it('reports offline immediately when the browser network is unavailable', async () => {
    vi.stubGlobal('navigator', { onLine: false })
    const { probeFirebaseConnectivity } = await import('./firebaseConnectivity')
    await expect(probeFirebaseConnectivity()).resolves.toMatchObject({
      syncState: 'offline',
      detail: 'อุปกรณ์ไม่ได้เชื่อมต่อเครือข่าย',
    })
    expect(getDocFromServer).not.toHaveBeenCalled()
  })

  it('reports online only after Firebase responds', async () => {
    vi.stubGlobal('navigator', { onLine: true })
    getDocFromServer.mockResolvedValueOnce({})
    const { probeFirebaseConnectivity } = await import('./firebaseConnectivity')
    await expect(probeFirebaseConnectivity()).resolves.toMatchObject({
      syncState: 'synced',
      detail: 'เชื่อมต่อ Firebase ได้',
    })
  })
})
