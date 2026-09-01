import { createContext, useContext } from 'react'

import type { Phase2ContextValue } from './Phase2Context'

export const Phase2Context = createContext<Phase2ContextValue | undefined>(undefined)

export function usePhase2(): Phase2ContextValue {
  const context = useContext(Phase2Context)
  if (!context) throw new Error('usePhase2 must be used within Phase2Provider')
  return context
}
