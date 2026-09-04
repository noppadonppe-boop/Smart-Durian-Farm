import {
  getIdTokenResult,
  onAuthStateChanged,
} from 'firebase/auth'
import {
  doc,
  getDoc,
} from 'firebase/firestore'

import { createFirebaseLiveClients } from './firebaseClient'

export function createFirebaseAuthProfileRuntime() {
  const clients = createFirebaseLiveClients()
  return {
    auth: clients.auth,
    firestore: clients.firestore,
    doc,
    getDoc,
    getIdTokenResult,
    onAuthStateChanged,
  }
}
