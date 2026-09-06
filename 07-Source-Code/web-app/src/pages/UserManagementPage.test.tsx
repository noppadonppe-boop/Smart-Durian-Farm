import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdirSync, writeFileSync } from 'node:fs'
import { UserManagementPage } from './UserManagementPage'

const mocks = vi.hoisted(() => ({
  admin: true,
  firestore: {},
  listeners: new Map<string, { next: (snapshot: unknown) => void; error: (error: Error) => void }>(),
  unsubscribe: vi.fn(),
  scrollIntoView: vi.fn(),
  showModal: vi.fn(function (this: HTMLDialogElement) { this.open = true }),
  closeDialog: vi.fn(function (this: HTMLDialogElement) { this.open = false }),
}))

vi.mock('../security/AuthContext', () => ({ useAuth: () => ({ isSystemAdmin: mocks.admin, firebaseUser: { uid: 'SIM-admin' } }) }))
vi.mock('../app/usePhase2', () => ({ usePhase2: () => ({ currentFarm: null }) }))
vi.mock('../infrastructure/firebase/firebaseClient', () => ({ createFirebaseLiveClients: () => ({ firestore: mocks.firestore }) }))
vi.mock('../infrastructure/firebase/firebaseDataRoot', () => ({ rootCollection: (_db: unknown, name: string) => name, rootDoc: vi.fn() }))
vi.mock('../infrastructure/firebase/firebasePhase2Repository', () => ({ listOperationalFarmProfiles: vi.fn() }))
vi.mock('../services/accessRequestService', () => ({
  adminUpdateUserProfile: vi.fn(), approveFirebaseAccessRequest: vi.fn(), rejectFirebaseAccessRequest: vi.fn(),
  updateFirebaseMasterAdminAccess: vi.fn(), updateFirebaseUserAccess: vi.fn(),
}))
vi.mock('firebase/firestore', () => ({
  query: (name: string) => name,
  deleteDoc: vi.fn(),
  onSnapshot: (name: string, options: unknown, next: (snapshot: unknown) => void, error: (error: Error) => void) => {
    expect(options).toEqual({ includeMetadataChanges: true })
    mocks.listeners.set(name, { next, error })
    return mocks.unsubscribe
  },
}))

// SIMULATED/TEST ONLY. No live Firebase reads or writes.
const profile = (uid: string, email = `${uid}@example.invalid`) => ({
  uid, email, firstName: `SIMULATED ${uid}`, lastName: 'TEST ONLY', position: 'สมาชิกจำลอง',
  role: ['WORKER'], status: 'approved', assignedProjects: [],
})
const users = [
  { id: 'SIM-a', data: () => profile('SIM-a') },
  { id: 'SIM-legacy-a', data: () => profile('SIM-a') },
  { id: 'SIM-b', data: () => profile('SIM-b', '') },
]
const requests = [
  { id: 'SIM-b', data: () => ({ uid: 'SIM-b', requestId: 'SIM-b', status: 'PENDING', displayName: 'SIMULATED B' }) },
  { id: 'SIM-c', data: () => ({ uid: 'SIM-c', requestId: 'SIM-c', status: 'PENDING', displayName: 'SIMULATED C' }) },
]
function emit(name: string, docs: unknown[], fromCache = false) {
  act(() => mocks.listeners.get(name)!.next({ docs, metadata: { fromCache } }))
}
function loadDirectory() {
  emit('users', users)
  emit('accessRequests', requests)
}

describe('UserManagementPage directory consistency', () => {
  beforeEach(() => {
    mocks.admin = true; mocks.listeners.clear(); vi.clearAllMocks()
    Element.prototype.scrollIntoView = mocks.scrollIntoView
    HTMLDialogElement.prototype.showModal = mocks.showModal
    HTMLDialogElement.prototype.close = mocks.closeDialog
  })
  afterEach(cleanup)

  it('counts rendered rows, includes profile-less requests and explains hidden duplicates', () => {
    const { container } = render(<UserManagementPage />)
    loadDirectory()
    expect(container.querySelectorAll('tbody tr')).toHaveLength(3)
    expect(screen.getByText(/แสดง 3 รายการ.*ซ่อนรายการซ้ำ 1 รายการ.*รออนุมัติ 2 รายการ/u)).toBeInTheDocument()
    expect(container.querySelectorAll('.user-management-row--pending')).toHaveLength(2)
    if (process.env.KDOMS_RESPONSIVE_FIXTURE === '1') {
      mkdirSync('outputs', { recursive: true })
      writeFileSync('outputs/user-management-fixture.html', container.innerHTML)
    }
    fireEvent.click(screen.getByRole('checkbox'))
    expect(container.querySelectorAll('tbody tr')).toHaveLength(4)
    expect(screen.getByText(/แสดง 4 รายการ.*ซ่อนรายการซ้ำ 0 รายการ/u)).toBeInTheDocument()
  })

  it('labels cached data and waits for both server snapshots, including metadata-only updates', () => {
    render(<UserManagementPage />)
    expect(screen.getByRole('status')).toHaveTextContent('กำลังอัปเดต')
    emit('users', users, true)
    emit('accessRequests', requests, true)
    expect(screen.getByRole('status')).toHaveTextContent('ข้อมูลที่บันทึกไว้ในเครื่อง')
    emit('users', users)
    expect(screen.getByRole('status')).toHaveTextContent('ข้อมูลที่บันทึกไว้ในเครื่อง')
    emit('accessRequests', requests)
    expect(screen.getByRole('status')).toHaveTextContent('อัปเดตจากเซิร์ฟเวอร์แล้ว')
    emit('users', [...users, { id: 'SIM-d', data: () => profile('SIM-d') }])
    expect(screen.getByText(/แสดง 4 รายการ/u)).toBeInTheDocument()
  })

  it('reports listener failures and resubscribes on refresh without duplicating rows', () => {
    const { container, unmount } = render(<UserManagementPage />)
    loadDirectory()
    act(() => mocks.listeners.get('users')!.error(new Error('SIMULATED permission-denied')))
    expect(screen.getByRole('alert')).toHaveTextContent('โหลดรายชื่อสมาชิกไม่สำเร็จ')
    expect(screen.getByRole('status')).toHaveTextContent('อาจไม่ครบ')
    fireEvent.click(screen.getByRole('button', { name: 'อัปเดตรายชื่อ' }))
    expect(mocks.unsubscribe).toHaveBeenCalledTimes(2)
    loadDirectory()
    expect(container.querySelectorAll('tbody tr')).toHaveLength(3)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    unmount()
    expect(mocks.unsubscribe).toHaveBeenCalledTimes(4)
  })

  it('does not subscribe to member data for non-admin users', () => {
    mocks.admin = false
    render(<UserManagementPage />)
    expect(screen.getByText('ไม่มีสิทธิ์เข้าถึง')).toBeInTheDocument()
    expect(mocks.listeners.size).toBe(0)
  })

  it('opens the access editor as a modal and closes it on cancel', () => {
    const { container } = render(<UserManagementPage />)
    emit('users', users)
    emit('accessRequests', [{ id: 'SIM-a', data: () => ({ uid: 'SIM-a', status: 'APPROVED', assignedRole: 'WORKER' }) }])
    fireEvent.click(screen.getAllByRole('button', { name: 'แก้ไขสิทธิ์' })[0]!)
    const dialog = screen.getByRole('dialog', { name: 'แก้ไขสิทธิ์และย้ายสวน' })
    expect(dialog).toHaveAttribute('open')
    expect(mocks.showModal).toHaveBeenCalledOnce()
    expect(screen.getByLabelText('Role ใหม่')).toHaveValue('WORKER')
    if (process.env.KDOMS_RESPONSIVE_FIXTURE === '1') {
      mkdirSync('outputs', { recursive: true })
      writeFileSync('outputs/user-access-dialog-fixture.html', container.innerHTML)
    }
    fireEvent.click(screen.getByRole('button', { name: 'ยกเลิก' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(mocks.closeDialog).toHaveBeenCalled()
  })

  it('brings the rejection into view when no approved request exists', () => {
    render(<UserManagementPage />)
    loadDirectory()
    fireEvent.click(screen.getByRole('button', { name: 'แก้ไขสิทธิ์' }))
    const error = screen.getByRole('alert')
    expect(error).toHaveTextContent('ไม่พบ Access Request ที่อนุมัติแล้ว')
    expect(error).toHaveFocus()
    expect(mocks.scrollIntoView).toHaveBeenCalledWith({ block: 'center' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
