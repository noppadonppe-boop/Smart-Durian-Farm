import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'

import { routes } from './router'

function renderApp(initialEntry = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [initialEntry] })
  render(<RouterProvider router={router} />)
  return router
}

describe('Smart Durian Foundation shell', () => {
  it('shows farm context and mock-data boundary', () => {
    renderApp()

    expect(screen.getAllByText('สวนสาธิต — ข้อมูลจำลอง').length).toBeGreaterThan(0)
    expect(screen.getAllByText('DEMO-F01').length).toBeGreaterThan(0)
    expect(
      screen.getByText('ข้อมูลจำลองเท่านั้น · ไม่เชื่อม Firebase production'),
    ).toBeInTheDocument()
  })

  it('navigates between main routes', async () => {
    const user = userEvent.setup()
    renderApp()

    const workLinks = screen.getAllByRole('link', { name: /งาน/u })
    await user.click(workLinks[workLinks.length - 1]!)

    expect(screen.getByRole('heading', { name: 'งาน', level: 1 })).toBeInTheDocument()
  })

  it('renders the permanent QR route shell without resolving data', () => {
    renderApp('/t/pos_demo_01')

    expect(screen.getByText('pos_demo_01')).toBeInTheDocument()
    expect(
      screen.getByText(/ไม่มีการร้องขอ backend ใน Phase 1/u),
    ).toBeInTheDocument()
  })
})
