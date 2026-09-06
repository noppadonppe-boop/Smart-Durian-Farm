export function isModuleLoadError(error: unknown): boolean {
  return error instanceof Error && /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|Loading chunk .+ failed/iu.test(error.message)
}

// Ask the installed worker to check for a release before reloading. A failed
// network request must not leave the recovery button waiting indefinitely.
export async function refreshAppVersion(): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  let timeout: ReturnType<typeof setTimeout> | undefined
  let stopListening: (() => void) | undefined
  try {
    await Promise.race([
      navigator.serviceWorker.getRegistration().then(async (registration) => {
        if (!registration) return
        await registration.update()
        const worker = registration.installing ?? registration.waiting
        if (!worker || worker.state === 'activated' || worker.state === 'redundant') return
        await new Promise<void>((resolve) => {
          const finish = () => {
            if (worker.state === 'activated' || worker.state === 'redundant') {
              worker.removeEventListener('statechange', finish)
              resolve()
            }
          }
          worker.addEventListener('statechange', finish)
          stopListening = () => worker.removeEventListener('statechange', finish)
          finish()
        })
      }),
      new Promise<void>((resolve) => { timeout = setTimeout(resolve, 5000) }),
    ])
  } catch {
    // Reload remains available even when a browser blocks worker updates.
  } finally {
    clearTimeout(timeout)
    stopListening?.()
  }
}


