import {
  browserLocalPersistence,
  GoogleAuthProvider,
  onAuthStateChanged,
  RecaptchaVerifier,
  setPersistence,
  signInWithPopup,
  signInWithPhoneNumber,
  signOut,
  type Auth,
  type ConfirmationResult,
  type User,
} from 'firebase/auth'

import type {
  PhoneOtpChallenge,
  PhoneOtpGateway,
} from '../../adapters/contracts'
import type { AuthenticatedIdentity } from '../../domain/farm'

function errorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return undefined
  }
  return typeof error.code === 'string' ? error.code : undefined
}

export function phoneOtpErrorMessage(
  error: unknown,
): string {
  const code = errorCode(error)
  switch (code) {
    case 'auth/invalid-phone-number':
      return 'รูปแบบหมายเลขโทรศัพท์ไม่ถูกต้อง กรุณาใช้รหัสประเทศ เช่น +66 ตามด้วยหมายเลข'
    case 'auth/invalid-verification-code':
      return 'รหัส OTP ไม่ถูกต้อง กรุณาตรวจรหัสล่าสุดแล้วลองใหม่'
    case 'auth/code-expired':
    case 'auth/session-expired':
      return 'รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่'
    case 'auth/too-many-requests':
      return 'ขอรหัสบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่'
    case 'auth/network-request-failed':
    case 'auth/operation-not-supported-in-this-environment':
      return 'ติดต่อ Firebase Authentication ไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่'
    case 'auth/operation-not-allowed':
      return 'Phone Authentication ยังไม่พร้อมใช้งานในสภาพแวดล้อมนี้'
    case 'auth/app-not-authorized':
    case 'auth/unauthorized-domain':
      return 'โดเมนที่เปิดแอปยังไม่ได้รับอนุญาตสำหรับ Phone Auth กรุณาเปิดผ่าน HTTPS บนโดเมน Hosting ที่เพิ่มไว้ใน Authorized domains'
    case 'auth/captcha-check-failed':
    case 'auth/invalid-app-credential':
    case 'auth/missing-app-credential':
      return 'ตรวจสอบ reCAPTCHA ไม่สำเร็จ กรุณาเปิดผ่าน HTTPS บนโดเมน Hosting ที่ได้รับอนุญาตแล้วลองใหม่'
    case 'auth/billing-not-enabled':
      return 'Firebase project ยังไม่พร้อมส่ง SMS จริง กรุณาตรวจ Billing และโควตา Phone Auth'
    case 'auth/quota-exceeded':
      return 'โควตาการส่ง SMS ของ Firebase หมดแล้ว กรุณาตรวจ Usage/Billing ก่อนลองใหม่'
    default:
      return `ไม่สามารถส่งหรือยืนยัน OTP ผ่าน Firebase ได้ กรุณาตรวจการตั้งค่า Phone Auth แล้วลองใหม่${code ? ` (รหัส: ${code})` : ''}`
  }
}

function googleAuthErrorMessage(error: unknown): string {
  const code = errorCode(error)
  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'หน้าต่าง Google Sign-In ถูกปิดก่อนเข้าสู่ระบบ'
    case 'auth/popup-blocked':
      return 'เบราว์เซอร์บล็อกหน้าต่าง Google Sign-In กรุณาอนุญาต Popup แล้วลองใหม่'
    case 'auth/operation-not-allowed':
      return 'ยังไม่ได้เปิด Google Sign-In ใน Firebase Authentication ของ Production project'
    case 'auth/unauthorized-domain':
    case 'auth/app-not-authorized':
      return 'โดเมนที่เปิดแอปยังไม่ได้รับอนุญาตสำหรับ Google Sign-In ใน Firebase Authentication'
    case 'auth/account-exists-with-different-credential':
      return 'บัญชี Google นี้มีวิธีเข้าสู่ระบบอื่นอยู่แล้ว กรุณาใช้วิธีที่ผูกไว้กับ Firebase'
    case 'auth/network-request-failed':
      return 'ติดต่อ Firebase Authentication ไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่'
    default:
      return `ไม่สามารถเข้าสู่ Firebase Production ด้วย Google ได้${code ? ` (รหัส: ${code})` : ''}`
  }
}

export function livePhoneAuthHostError(hostname: string): string | undefined {
  const normalized = hostname.trim().toLowerCase()
  if (
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized === '[::1]'
  ) {
    return 'Firebase Phone Auth ไม่รองรับการส่ง SMS จริงจาก localhost หรือ 127.0.0.1 กรุณาเปิดแอปผ่าน HTTPS บนโดเมน Hosting ที่ได้รับอนุญาต'
  }
  return undefined
}

export function normalizePhoneNumber(value: string): string {
  const normalized = value.replace(/[\s()-]/gu, '')
  if (/^0\d{9}$/u.test(normalized)) return `+66${normalized.slice(1)}`
  if (/^66\d{9}$/u.test(normalized)) return `+${normalized}`
  return normalized
}

function maskPhone(phoneNumber: string): string {
  return `${phoneNumber.slice(0, 4)}••••${phoneNumber.slice(-3)}`
}

function identityFromUser(
  user: User,
  source: AuthenticatedIdentity['source'],
  mappedUserId?: string,
): AuthenticatedIdentity {
  const phone = user.phoneNumber ?? '+10000000000'
  return {
    userId: mappedUserId ?? user.uid,
    displayName:
      user.displayName ??
      'ผู้ใช้ยืนยันผ่าน Firebase',
    maskedPhone: maskPhone(phone),
    source,
  }
}

interface FirebasePhoneOtpGatewayOptions {
  allowedPhoneHashes?: readonly string[]
  phoneAllowlistSalt?: string
  phoneAllowlistIterations?: number
  mappedUserId?: string
}

function decodeBase64Url(value: string): ArrayBuffer {
  const base64 = value.replace(/-/gu, '+').replace(/_/gu, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes.buffer
}

function encodeBase64Url(value: ArrayBuffer): string {
  const binary = Array.from(new Uint8Array(value), (byte) =>
    String.fromCharCode(byte),
  ).join('')
  return btoa(binary)
    .replace(/\+/gu, '-')
    .replace(/\//gu, '_')
    .replace(/=+$/gu, '')
}

export async function phoneAllowlistDigest(
  phoneNumber: string,
  salt: string,
  iterations = 310_000,
): Promise<string> {
  if (!salt || !Number.isInteger(iterations) || iterations < 1) {
    throw new Error('การตั้งค่า allowlist สำหรับ Phone Auth ไม่ถูกต้อง')
  }
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(normalizePhoneNumber(phoneNumber)),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: decodeBase64Url(salt),
      iterations,
    },
    key,
    256,
  )
  return encodeBase64Url(bits)
}

class FirebasePhoneOtpGateway implements PhoneOtpGateway {
  private confirmation: ConfirmationResult | undefined
  private verifier: RecaptchaVerifier | undefined
  private challengeId: string | undefined

  private readonly allowedPhoneHashes: ReadonlySet<string> | undefined

  constructor(
    private readonly auth: Auth,
    private readonly options: FirebasePhoneOtpGatewayOptions,
  ) {
    this.allowedPhoneHashes = options.allowedPhoneHashes?.length
      ? new Set(options.allowedPhoneHashes)
      : undefined
  }

  private clearChallenge(): void {
    this.verifier?.clear()
    this.verifier = undefined
    this.confirmation = undefined
    this.challengeId = undefined
  }

  subscribe(listener: (identity: AuthenticatedIdentity | null) => void): () => void {
    return onAuthStateChanged(this.auth, (user) => {
      listener(
        user
          ? identityFromUser(
              user,
              'firebase-live',
              this.options.mappedUserId,
            )
          : null,
      )
    })
  }

  async requestOtp(
    phoneNumber: string,
    verifierContainerId: string,
  ): Promise<PhoneOtpChallenge> {
    const normalized = normalizePhoneNumber(phoneNumber)
    if (!/^\+[1-9]\d{7,14}$/u.test(normalized)) {
      throw new Error('รูปแบบหมายเลขโทรศัพท์ไม่ถูกต้อง กรุณากรอกเบอร์ไทย 10 หลักหรือรูปแบบ +66')
    }
    if (!this.allowedPhoneHashes?.size || !this.options.phoneAllowlistSalt) {
      throw new Error('ยังไม่ได้เตรียมชุดอนุญาตหมายเลขสำหรับ Firebase Phone Auth')
    }
    const digest = await phoneAllowlistDigest(
      normalized,
      this.options.phoneAllowlistSalt,
      this.options.phoneAllowlistIterations,
    )
    if (!this.allowedPhoneHashes.has(digest)) {
      throw new Error('หมายเลขนี้ไม่ได้รับอนุญาตให้เข้าสู่ระบบ')
    }

    const hostError =
      typeof window !== 'undefined'
        ? livePhoneAuthHostError(window.location.hostname)
        : undefined
    if (hostError) throw new Error(hostError)

    try {
      this.clearChallenge()
      this.verifier = new RecaptchaVerifier(this.auth, verifierContainerId, {
        size: 'invisible',
      })
      this.confirmation = await signInWithPhoneNumber(
        this.auth,
        normalized,
        this.verifier,
      )
      this.challengeId = crypto.randomUUID()
      return { challengeId: this.challengeId, phoneNumber: normalized }
    } catch (error) {
      this.clearChallenge()
      throw new Error(phoneOtpErrorMessage(error), { cause: error })
    }
  }

  async verifyOtp(
    challenge: PhoneOtpChallenge,
    code: string,
  ): Promise<AuthenticatedIdentity> {
    if (!this.confirmation || challenge.challengeId !== this.challengeId) {
      throw new Error('คำขอ OTP หมดอายุ กรุณาขอรหัสใหม่')
    }
    if (!/^\d{6}$/u.test(code)) throw new Error('OTP ต้องเป็นตัวเลข 6 หลัก')

    try {
      const credential = await this.confirmation.confirm(code)
      this.clearChallenge()
      return identityFromUser(
        credential.user,
        'firebase-live',
        this.options.mappedUserId,
      )
    } catch (error) {
      const code = errorCode(error)
      if (code === 'auth/code-expired' || code === 'auth/session-expired') {
        this.clearChallenge()
      }
      throw new Error(phoneOtpErrorMessage(error), { cause: error })
    }
  }

  async signInWithGoogle(): Promise<AuthenticatedIdentity> {
    try {
      await setPersistence(this.auth, browserLocalPersistence)
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      const result = await signInWithPopup(this.auth, provider)
      return identityFromUser(result.user, 'firebase-live', this.options.mappedUserId)
    } catch (error) {
      throw new Error(googleAuthErrorMessage(error), { cause: error })
    }
  }

  cancelOtp(): void {
    this.clearChallenge()
  }

  async signOut(): Promise<void> {
    this.clearChallenge()
    await signOut(this.auth)
  }
}

export class FirebaseLivePhoneOtpGateway extends FirebasePhoneOtpGateway {
  constructor(
    auth: Auth,
    allowedPhoneHashes: readonly string[],
    phoneAllowlistSalt: string,
    phoneAllowlistIterations: number,
    mappedUserId?: string,
  ) {
    super(auth, {
      allowedPhoneHashes,
      phoneAllowlistSalt,
      phoneAllowlistIterations,
      mappedUserId,
    })
  }
}
