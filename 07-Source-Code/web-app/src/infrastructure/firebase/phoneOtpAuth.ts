import {
  onAuthStateChanged,
  RecaptchaVerifier,
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
import demoSeed from '../../demo/phase2-demo-seed.json'

const allowedTestPhones = new Set(
  demoSeed.users.map((user) => user.phoneNumber),
)

function normalizePhone(value: string): string {
  return value.replace(/[\s()-]/gu, '')
}

function maskPhone(phoneNumber: string): string {
  return `${phoneNumber.slice(0, 4)}••••${phoneNumber.slice(-3)}`
}

function identityFromUser(user: User): AuthenticatedIdentity {
  const phone = user.phoneNumber ?? '+10000000000'
  return {
    userId: user.uid,
    displayName: user.displayName ?? 'ผู้ใช้ทดสอบ Firebase Emulator',
    maskedPhone: maskPhone(phone),
    source: 'firebase-emulator',
  }
}

export class FirebaseEmulatorPhoneOtpGateway implements PhoneOtpGateway {
  private confirmation: ConfirmationResult | undefined
  private verifier: RecaptchaVerifier | undefined
  private challengeId: string | undefined

  constructor(private readonly auth: Auth) {}

  subscribe(listener: (identity: AuthenticatedIdentity | null) => void): () => void {
    return onAuthStateChanged(this.auth, (user) => {
      listener(user ? identityFromUser(user) : null)
    })
  }

  async requestOtp(
    phoneNumber: string,
    verifierContainerId: string,
  ): Promise<PhoneOtpChallenge> {
    const normalized = normalizePhone(phoneNumber)
    if (!allowedTestPhones.has(normalized)) {
      throw new Error('ระยะ Local/Emulator อนุญาตเฉพาะหมายเลขทดสอบจำลองที่กำหนดไว้')
    }

    this.verifier?.clear()
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
  }

  async verifyOtp(
    challenge: PhoneOtpChallenge,
    code: string,
  ): Promise<AuthenticatedIdentity> {
    if (!this.confirmation || challenge.challengeId !== this.challengeId) {
      throw new Error('คำขอ OTP หมดอายุ กรุณาขอรหัสใหม่')
    }
    if (!/^\d{6}$/u.test(code)) throw new Error('OTP ต้องเป็นตัวเลข 6 หลัก')

    const credential = await this.confirmation.confirm(code)
    this.verifier?.clear()
    this.verifier = undefined
    this.confirmation = undefined
    this.challengeId = undefined
    return identityFromUser(credential.user)
  }

  async signOut(): Promise<void> {
    await signOut(this.auth)
  }
}
