import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RouteErrorPage } from './RouteErrorPage'
import { isModuleLoadError, refreshAppVersion } from './routeRecovery'

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers() })

describe('route recovery after a deployment', () => {
  it('shows a recovery action when a lazy route chunk is missing', async () => {
    const router = createMemoryRouter([{
      path: '/', ErrorBoundary: RouteErrorPage,
      children: [{ path: 'trees', lazy: () => Promise.reject(new TypeError('Failed to fetch dynamically imported module: SIMULATED/TEST ONLY')) }],
    }], { initialEntries: ['/trees'] })
    render(<RouterProvider router={router} />)
    expect(await screen.findByRole('heading', { name: 'โหลดหน้านี้ไม่สำเร็จ' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'โหลดหน้าใหม่' })).toBeInTheDocument()
    expect(screen.queryByText(/Unexpected Application Error/u)).not.toBeInTheDocument()
    vi.stubGlobal('navigator', { onLine: false })
    fireEvent.click(screen.getByRole('button', { name: 'โหลดหน้าใหม่' }))
    expect(screen.getByRole('alert')).toHaveTextContent('ยังไม่มีการเชื่อมต่ออินเทอร์เน็ต')
    router.dispose()
  })

  it('recognizes browser module errors without classifying all errors as deployment failures', () => {
    expect(isModuleLoadError(new TypeError('Importing a module script failed.'))).toBe(true)
    expect(isModuleLoadError(new TypeError('error loading dynamically imported module'))).toBe(true)
    expect(isModuleLoadError(new Error('permission denied'))).toBe(false)
  })

  it('checks the installed worker without clearing user storage', async () => {
    const update = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { serviceWorker: { getRegistration: vi.fn().mockResolvedValue({ update }) } })
    await refreshAppVersion()
    expect(update).toHaveBeenCalledOnce()
  })

  it('allows recovery if the worker update fails or never completes', async () => {
    vi.stubGlobal('navigator', { serviceWorker: { getRegistration: vi.fn().mockRejectedValue(new Error('SIMULATED offline')) } })
    await expect(refreshAppVersion()).resolves.toBeUndefined()
    vi.useFakeTimers()
    vi.stubGlobal('navigator', { serviceWorker: { getRegistration: () => new Promise(() => {}) } })
    const pending = refreshAppVersion()
    await vi.advanceTimersByTimeAsync(5000)
    await expect(pending).resolves.toBeUndefined()
  })
})
