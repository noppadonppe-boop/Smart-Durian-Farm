import { appEnvironment } from './environment'

describe('environment contract', () => {
  it('defaults to mock data and demo-only Firebase identifiers', () => {
    expect(appEnvironment.dataAdapter).toBe('mock')
    expect(appEnvironment.firebase.projectId).toBe('demo-smart-durian')
    expect(appEnvironment.firebase.apiKey).toContain('not-a-secret')
  })
})
