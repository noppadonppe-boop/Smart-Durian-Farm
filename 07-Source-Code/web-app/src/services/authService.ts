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
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'

import type { UserProfile } from '../domain/auth'
import { createFirebaseLiveClients } from '../infrastructure/firebase/firebaseClient'
import { rootDoc } from '../infrastructure/firebase/firebaseDataRoot'
import { ensureFirebaseAccessRequest } from './accessRequestService'

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
  if ((await getDoc(profileReference)).exists()) {
    if (supplied) {
      await updateDoc(profileReference, {
        firstName: supplied.firstName.trim(),
        lastName: supplied.lastName.trim(),
        position: supplied.position.trim(),
        updatedAt: serverTimestamp(),
      })
    }
    return
  }

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

async function provisionUserProfile(user: User, supplied?: {
  firstName: string
  lastName: string
  position: string
}): Promise<UserProfile> {
  await ensureOwnPendingProfile(user, supplied)
  await ensureFirebaseAccessRequest(user)
  const { firestore } = clients()
  const snapshot = await getDoc(rootDoc(firestore, 'users', user.uid))
  if (!snapshot.exists()) {
    throw new Error('สร้าง User Profile ใน Firebase ไม่สำเร็จ')
  }
  return snapshot.data() as UserProfile
}

export function authenticationErrorMessage(reason: unknown): string {
  const code = typeof reason === 'object' && reason !== null && 'code' in reason
    ? String(reason.code)
    : undefined
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
    case 'auth/email-already-in-use':
      return 'อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบ'
    case 'auth/weak-password':
      return 'รหัสผ่านไม่ปลอดภัย กรุณาใช้รหัสผ่านอย่างน้อย 6 ตัวอักษร'
    case 'auth/invalid-email':
      return 'รูปแบบอีเมลไม่ถูกต้อง'
    case 'auth/popup-closed-by-user':
      return 'หน้าต่าง Google Sign-In ถูกปิดก่อนเข้าสู่ระบบ'
    case 'auth/popup-blocked':
      return 'เบราว์เซอร์บล็อกหน้าต่าง Google Sign-In กรุณาอนุญาต Popup'
    case 'auth/unauthorized-domain':
    case 'auth/app-not-authorized':
      return 'โดเมนนี้ยังไม่ได้รับอนุญาตใน Firebase Authentication'
    case 'auth/network-request-failed':
      return 'ติดต่อ Firebase Authentication ไม่ได้ กรุณาตรวจอินเทอร์เน็ต'
    default:
      return reason instanceof Error && reason.message
        ? reason.message
        : 'Firebase Authentication ทำงานไม่สำเร็จ'
  }
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

  async loginWithEmail(email: string, password: string): Promise<UserProfile> {
    const { auth } = clients()
    await setPersistence(auth, browserLocalPersistence)
    const credential = await signInWithEmailAndPassword(auth, email, password)
    const profile = await provisionUserProfile(credential.user)
    void this.logActivity('LOGIN', email)
    return profile
  },

  async loginWithGoogle(): Promise<UserProfile> {
    const { auth } = clients()
    await setPersistence(auth, browserLocalPersistence)
    const credential = await signInWithPopup(auth, new GoogleAuthProvider())
    const profile = await provisionUserProfile(credential.user)
    void this.logActivity('LOGIN', credential.user.email ?? '')
    return profile
  },

  async registerWithEmail(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    position: string,
  ): Promise<UserProfile> {
    const { auth } = clients()
    await setPersistence(auth, browserLocalPersistence)
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    const profile = await provisionUserProfile(
      credential.user,
      { firstName, lastName, position },
    )
    void this.logActivity('REGISTER', email)
    return profile
  },

  async logout(): Promise<void> {
    await firebaseSignOut(clients().auth)
  },
}
