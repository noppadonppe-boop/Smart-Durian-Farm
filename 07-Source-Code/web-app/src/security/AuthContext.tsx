import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { User as FirebaseUser } from 'firebase/auth'

import { appEnvironment } from '../config/environment'
import type { UserProfile } from '../domain/auth'

interface AuthContextValue {
  firebaseUser: FirebaseUser | null
  userProfile: UserProfile | null
  isSystemAdmin: boolean
  loading: boolean
  profileError: string | undefined
  refreshProfile: () => Promise<void>
  pendingUsersCount: number
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

type AuthRuntime = ReturnType<
  typeof import('../infrastructure/firebase/firebaseAuthProfileRuntime').createFirebaseAuthProfileRuntime
>

const liveDataRoot = ['durian-smartfarm', 'root'] as const

export function AuthProvider({ children }: { children: ReactNode }) {
  const [runtime, setRuntime] = useState<AuthRuntime>()
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isSystemAdmin, setIsSystemAdmin] = useState(false)
  const [profileError, setProfileError] = useState<string>()
  const [loading, setLoading] = useState(
    () => appEnvironment.authAdapter === 'firebase-live',
  )
  const [pendingUsersCount, setPendingUsersCount] = useState(0)

  useEffect(() => {
    if (appEnvironment.authAdapter !== 'firebase-live') return undefined

    let active = true
    void import('../infrastructure/firebase/firebaseAuthProfileRuntime')
      .then(({ createFirebaseAuthProfileRuntime }) => {
        if (!active) return
        setRuntime(createFirebaseAuthProfileRuntime())
      })
      .catch(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const fetchProfile = useCallback(async (user: FirebaseUser) => {
    if (!runtime) {
      setUserProfile(null)
      setIsSystemAdmin(false)
      setPendingUsersCount(0)
      return
    }

    setProfileError(undefined)

    const [profileResult, rootResult, tokenResult] = await Promise.allSettled([
      runtime.getDoc(runtime.doc(runtime.firestore, ...liveDataRoot, 'users', user.uid)),
      runtime.getDoc(runtime.doc(runtime.firestore, ...liveDataRoot)),
      runtime.getIdTokenResult(user, true),
    ])

    let profile = profileResult.status === 'fulfilled' && profileResult.value.exists()
      ? profileResult.value.data() as UserProfile
      : null

    // Read the earlier email-keyed profile during migration, but never use its
    // MasterAdmin string as a server-side authorization signal.
    if (!profile && user.email) {
      try {
        const legacy = await runtime.getDoc(
          runtime.doc(runtime.firestore, ...liveDataRoot, 'users', user.email),
        )
        if (legacy.exists() && legacy.data().uid === user.uid) {
          profile = legacy.data() as UserProfile
        }
      } catch {
        // A missing/denied legacy profile is expected for new accounts.
      }
    }

    const rootData: unknown = rootResult.status === 'fulfilled' && rootResult.value.exists()
      ? rootResult.value.data()
      : undefined
    const rootOwnerUid = typeof rootData === 'object'
      && rootData !== null
      && 'seedOwnerUid' in rootData
      && typeof rootData.seedOwnerUid === 'string'
      ? rootData.seedOwnerUid
      : undefined
    const hasMasterAdminClaim = tokenResult.status === 'fulfilled'
      && tokenResult.value.claims.masterAdmin === true

    const systemAdmin = hasMasterAdminClaim || rootOwnerUid === user.uid
    setUserProfile(profile)
    setIsSystemAdmin(systemAdmin)
    if (!systemAdmin) setPendingUsersCount(0)
  }, [runtime])

  useEffect(() => {
    if (!runtime || !isSystemAdmin) {
      return undefined
    }
    return runtime.onSnapshot(
      runtime.query(
        runtime.collection(runtime.firestore, ...liveDataRoot, 'accessRequests'),
        runtime.where('status', '==', 'PENDING'),
      ),
      (snapshot) => setPendingUsersCount(snapshot.size),
      (error) => setProfileError(`โหลดจำนวนคำขอเข้าใช้งานไม่สำเร็จ: ${error.message}`),
    )
  }, [isSystemAdmin, runtime])

  const refreshProfile = useCallback(async () => {
    if (firebaseUser) {
      await fetchProfile(firebaseUser)
    }
  }, [fetchProfile, firebaseUser])

  useEffect(() => {
    if (!runtime) {
      return undefined
    }

    const unsubscribe = runtime.onAuthStateChanged(runtime.auth, (user) => {
      setFirebaseUser(user)
      if (user) {
        setProfileError(undefined)
        void import('../services/accessRequestService')
          .then(({ ensureFirebaseAccessRequest }) => ensureFirebaseAccessRequest(user))
          .then(() => fetchProfile(user))
          .catch((error: unknown) => {
            console.error('สร้างคำขอเข้าใช้งาน Firebase ไม่สำเร็จ', error)
            setUserProfile(null)
            setProfileError(
              `สร้าง User Profile/คำขอเข้าใช้งานไม่สำเร็จ: ${
                error instanceof Error ? error.message : String(error)
              }`,
            )
          })
          .finally(() => setLoading(false))
      } else {
        setUserProfile(null)
        setIsSystemAdmin(false)
        setPendingUsersCount(0)
        setProfileError(undefined)
        setLoading(false)
      }
    })
    return () => unsubscribe()
  }, [runtime, fetchProfile])

  const value = {
    firebaseUser,
    userProfile,
    isSystemAdmin,
    loading,
    profileError,
    refreshProfile,
    pendingUsersCount,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
