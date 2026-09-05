import {
  getIdTokenResult,
  onAuthStateChanged,
} from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'

import { createFirebaseLiveClients } from './firebaseClient'

export function createFirebaseAuthProfileRuntime() {
  const clients = createFirebaseLiveClients()
  return {
    auth: clients.auth,
    firestore: clients.firestore,
    collection,
    doc,
    getDoc,
    getIdTokenResult,
    onAuthStateChanged,
    onSnapshot,
    query,
    where,
  }
}
