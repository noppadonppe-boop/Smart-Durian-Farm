import demoSeed from './phase2-demo-seed.json'

interface DemoAccountSeed {
  displayName: string
  phoneNumber: string
  mockOtp: string
}

export const demoAccounts = (demoSeed.users as DemoAccountSeed[]).map((user) => ({
  displayName: user.displayName,
  phoneNumber: user.phoneNumber,
  otp: user.mockOtp,
}))
