import demoSeed from './phase2-demo-seed.json'

interface DemoAccountSeed {
  displayName: string
  phoneNumber: string
  mockOtp: string
  isOrganizationOwner: boolean
}

export const demoAccounts = (demoSeed.users as DemoAccountSeed[]).map((user) => ({
  displayName: user.displayName,
  phoneNumber: user.phoneNumber,
  otp: user.mockOtp,
  isOrganizationOwner: user.isOrganizationOwner,
}))

export const developmentAdminAccount = demoAccounts.find(
  (account) => account.isOrganizationOwner,
)
