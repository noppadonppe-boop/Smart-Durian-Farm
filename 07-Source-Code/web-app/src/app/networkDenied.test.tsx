import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, vi } from 'vitest'

import { routes } from './router'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('network-denied foundation smoke', () => {
  it('keeps the offline-critical shell interactive without a runtime request or console error', async () => {
    const fetchMock = vi.fn(() => Promise.reject(new Error('Network denied')))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    const router = createMemoryRouter(routes, { initialEntries: ['/'] })

    render(<RouterProvider router={router} />)
    await user.click(screen.getByRole('button', { name: /ซิงก์แล้ว/u }))

    expect(
      screen.getByText('กำลังใช้ shell แบบออฟไลน์ — หน้านี้ไม่ร้องขอข้อมูลภายนอก'),
    ).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(consoleError).not.toHaveBeenCalled()
  })
})
