const projectId = 'demo-smart-durian'
const host = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099'
const baseUrl = `http://${host}`

interface VerificationCode {
  phoneNumber: string
  sessionInfo: string
  code: string
}

async function responseJson(response: Response): Promise<Record<string, unknown>> {
  const payload = (await response.json()) as Record<string, unknown>
  if (!response.ok) throw new Error(JSON.stringify(payload))
  return payload
}

beforeEach(async () => {
  await fetch(`${baseUrl}/emulator/v1/projects/${projectId}/accounts`, {
    method: 'DELETE',
  })
})

describe('Firebase Authentication Emulator phone OTP', () => {
  it('requests and verifies an OTP without sending a real SMS', async () => {
    const phoneNumber = '+16505550101'
    const sendPayload = await responseJson(
      await fetch(
        `${baseUrl}/identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=demo-api-key-not-a-secret`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ phoneNumber, recaptchaToken: 'emulator-test-token' }),
        },
      ),
    )
    expect(typeof sendPayload.sessionInfo).toBe('string')

    const codePayload = await responseJson(
      await fetch(`${baseUrl}/emulator/v1/projects/${projectId}/verificationCodes`),
    )
    const verificationCodes = codePayload.verificationCodes as VerificationCode[]
    const verification = verificationCodes.find(
      (candidate) => candidate.sessionInfo === sendPayload.sessionInfo,
    )
    expect(verification?.phoneNumber).toBe(phoneNumber)
    expect(verification?.code).toMatch(/^\d{6}$/u)

    const signInPayload = await responseJson(
      await fetch(
        `${baseUrl}/identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber?key=demo-api-key-not-a-secret`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            sessionInfo: sendPayload.sessionInfo,
            code: verification?.code,
          }),
        },
      ),
    )
    expect(signInPayload.phoneNumber).toBe(phoneNumber)
    expect(typeof signInPayload.localId).toBe('string')
    expect(typeof signInPayload.idToken).toBe('string')
  })
})
