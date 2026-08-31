import type { FarmContext } from '../domain/farm'

export interface FarmContextReader {
  getCurrentFarm(): FarmContext
}

export interface AuthenticationShellIdentity {
  displayName: string
  roleLabel: string
  source: 'mock'
}

export interface FoundationAdapters {
  farmContext: FarmContextReader
  identity: AuthenticationShellIdentity
}
