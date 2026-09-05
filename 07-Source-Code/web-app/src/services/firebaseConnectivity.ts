import { getDocFromServer } from 'firebase/firestore'

import type { SyncState } from '../domain/farm'
import { createFirebaseLiveClients } from '../infrastructure/firebase/firebaseClient'
import { rootDocument } from '../infrastructure/firebase/firebaseDataRoot'

export const firebaseConnectivityCheckIntervalMs = 60_000
export const firebaseConnectivityTimeoutMs = 10_000

export interface FirebaseConnectivityResult {
  syncState: SyncState
  checkedAt: Date
  detail: string
}

export async function probeFirebaseConnectivity(
  timeoutMs = firebaseConnectivityTimeoutMs,
): Promise<FirebaseConnectivityResult> {
  const checkedAt = new Date()
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { syncState: 'offline', checkedAt, detail: 'อุปกรณ์ไม่ได้เชื่อมต่อเครือข่าย' }
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined
  try {
    const { firestore } = createFirebaseLiveClients()
    await Promise.race([
      getDocFromServer(rootDocument(firestore)),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Firebase timeout')), timeoutMs)
      }),
    ])
    return { syncState: 'synced', checkedAt, detail: 'เชื่อมต่อ Firebase ได้' }
  } catch {
    return { syncState: 'offline', checkedAt, detail: 'ติดต่อ Firebase ไม่สำเร็จ' }
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId)
  }
}
