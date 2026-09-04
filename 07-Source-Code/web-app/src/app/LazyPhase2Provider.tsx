import { lazy, Suspense } from 'react'

import { RouteLoading } from './RouteLoading'

const Phase2Provider = lazy(async () => ({
  default: (await import('./Phase2Context')).Phase2Provider,
}))

export function LazyPhase2Provider() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Phase2Provider />
    </Suspense>
  )
}
