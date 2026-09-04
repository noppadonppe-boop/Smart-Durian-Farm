import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'

import type { UserProfile } from '../domain/auth'
import { createFirebaseLiveClients } from '../infrastructure/firebase/firebaseClient'
import { rootDoc } from '../infrastructure/firebase/firebaseDataRoot'

function clients() {
  return createFirebaseLiveClients()
}

async function ensureOwnPendingProfile(user: User, supplied?: {
  firstName: string
  lastName: string
  position: string
}): Promise<void> {
  const { firestore } = clients()
  const profileReference = rootDoc(firestore, 'users', user.uid)
  if ((await getDoc(profileReference)).exists()) return

  const displayParts = (user.displayName ?? '').trim().split(/\s+/u).filter(Boolean)
  const profile: Omit<UserProfile, 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> } = {
    uid: user.uid,
    email: user.email ?? '',
    firstName: supplied?.firstName ?? displayParts[0] ?? '',
    lastName: supplied?.lastName ?? displayParts.slice(1).join(' '),
    position: supplied?.position ?? 'ผู้ใช้งาน',
    role: ['WORKER'],
    status: 'pending',
    assignedProjects: [],
    createdAt: serverTimestamp(),
    ...(user.photoURL ? { photoURL: user.photoURL } : {}),
    isFirstUser: false,
  }
  await setDoc(profileReference, profile)
}

export const authService = {
  async logActivity(action: string, email: string) {
    try {
      const { auth, firestore } = clients()
      const logReference = doc(
        firestore,
        'durian-smartfarm',
        'root',
        'activityLogs',
        `${Date.now()}_${auth.currentUser?.uid ?? 'unknown'}`,
      )
      await setDoc(logReference, {
        action,
        actorUserId: auth.currentUser?.uid ?? '',
        email,
        timestamp: serverTimestamp(),
      })
    } catch (error) {
      console.warn('Activity log failed non-blocking:', error)
    }
  },

  async loginWithEmail(email: string, password: string): Promise<void> {
    const { auth } = clients()
    await setPersistence(auth, browserLocalPersistence)
    const credential = await signInWithEmailAndPassword(auth, email, password)
    await ensureOwnPendingProfile(credential.user)
    void this.logActivity('LOGIN', email)
  },

  async loginWithGoogle(): Promise<void> {
    const { auth } = clients()
    await setPersistence(auth, browserLocalPersistence)
    const credential = await signInWithPopup(auth, new GoogleAuthProvider())
    await ensureOwnPendingProfile(credential.user)
    void this.logActivity('LOGIN', credential.user.email ?? '')
  },

  async registerWithEmail(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    position: string,
  ): Promise<void> {
    const { auth } = clients()
    await setPersistence(auth, browserLocalPersistence)
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    await ensureOwnPendingProfile(credential.user, { firstName, lastName, position })
    void this.logActivity('REGISTER', email)
  },

  async logout(): Promise<void> {
    await firebaseSignOut(clients().auth)
  },
}
