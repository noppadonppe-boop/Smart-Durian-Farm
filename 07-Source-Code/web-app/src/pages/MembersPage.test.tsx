import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { mkdirSync, writeFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MembersPage } from './MembersPage'

const state = vi.hoisted(() => ({
  identity: { userId: 'SIM-owner' },
  currentFarm: { organizationId: 'SIM-org', farmId: 'SIM-farm', farmCode: 'SIM-F01', farmName: 'SIMULATED/TEST ONLY', farmStatus: 'ACTIVE', isOrganizationOwner: true, role: 'ORG_OWNER' },
  listFarmMembers: vi.fn(), changeFarmMembership: vi.fn(),
}))
vi.mock('../app/usePhase2', () => ({ usePhase2: () => state }))
const member = (id: string) => ({
  userId: id, organizationId: 'SIM-org', farmId: 'SIM-farm', displayName: `SIMULATED ${id}`, maskedPhone: '',
  role: 'WORKER', status: 'ACTIVE', version: 1,
})
const view = () => <MemoryRouter><MembersPage /></MemoryRouter>
async function flush() { await act(async () => { await Promise.resolve() }) }

describe('MembersPage cross-device refresh (SIMULATED/TEST ONLY)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    state.currentFarm = { ...state.currentFarm, farmId: 'SIM-farm', isOrganizationOwner: true }
    state.listFarmMembers.mockReset().mockResolvedValue([member('SIM-a')])
  })
  afterEach(() => { cleanup(); vi.useRealTimers() })

  it('updates the count and cards on focus, polling and manual refresh', async () => {
    const { container } = render(view())
    await flush()
    expect(screen.getByText(/สมาชิกทั้งหมด 1 คน/u)).toBeInTheDocument()
    state.listFarmMembers.mockResolvedValue([member('SIM-a'), member('SIM-b')])
    fireEvent(window, new Event('focus'))
    await flush()
    expect(container.querySelectorAll('.member-card')).toHaveLength(2)
    expect(screen.getByText(/สมาชิกทั้งหมด 2 คน/u)).toBeInTheDocument()
    state.listFarmMembers.mockResolvedValue([member('SIM-a'), member('SIM-b'), member('SIM-c')])
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000) })
    expect(screen.getByText(/สมาชิกทั้งหมด 3 คน/u)).toBeInTheDocument()
    if (process.env.KDOMS_RESPONSIVE_FIXTURE === '1') {
      mkdirSync('outputs', { recursive: true })
      writeFileSync('outputs/members-fixture.html', container.innerHTML)
    }
    state.listFarmMembers.mockResolvedValue([])
    fireEvent.click(screen.getByRole('button', { name: 'อัปเดตสมาชิก' }))
    await flush()
    expect(container.querySelectorAll('.member-card')).toHaveLength(0)
    expect(screen.getByText(/สมาชิกทั้งหมด 0 คน/u)).toBeInTheDocument()
  })

  it('keeps a failed refresh explicit and recovers when the connection returns', async () => {
    render(view())
    await flush()
    state.listFarmMembers.mockRejectedValue(new Error('SIMULATED offline'))
    fireEvent(window, new Event('online'))
    await flush()
    expect(screen.getByRole('alert')).toHaveTextContent('SIMULATED offline')
    expect(screen.getByText(/ข้อมูลอาจไม่เป็นปัจจุบัน/u)).toBeInTheDocument()
    state.listFarmMembers.mockResolvedValue([member('SIM-a'), member('SIM-b')])
    fireEvent(window, new Event('online'))
    await flush()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText(/สมาชิกทั้งหมด 2 คน/u)).toBeInTheDocument()
  })

  it('ignores delayed results from the old farm and cleans up listeners', async () => {
    let resolveOld!: (value: unknown) => void
    state.listFarmMembers.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve }))
    const { rerender, unmount } = render(view())
    state.currentFarm = { ...state.currentFarm, farmId: 'SIM-other' }
    state.listFarmMembers.mockResolvedValue([member('SIM-new')])
    rerender(view())
    await flush()
    resolveOld([member('SIM-old')])
    await flush()
    expect(screen.queryByText('SIMULATED SIM-old')).not.toBeInTheDocument()
    expect(screen.getByText('SIMULATED SIM-new')).toBeInTheDocument()
    unmount()
    const count = state.listFarmMembers.mock.calls.length
    fireEvent(window, new Event('focus'))
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000) })
    expect(state.listFarmMembers).toHaveBeenCalledTimes(count)
  })

  it('does not fetch members without management permission', async () => {
    state.currentFarm = { ...state.currentFarm, isOrganizationOwner: false }
    render(view())
    await flush()
    expect(state.listFarmMembers).not.toHaveBeenCalled()
  })
})
