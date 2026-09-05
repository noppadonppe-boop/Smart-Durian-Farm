import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProfilePage } from './ProfilePage'

const { mockUpdateUserProfile, mockRefreshProfile } = vi.hoisted(() => ({
  mockUpdateUserProfile: vi.fn(),
  mockRefreshProfile: vi.fn(),
}))

vi.mock('../services/accessRequestService', () => ({
  updateUserProfile: (...args: unknown[]) => mockUpdateUserProfile(...args),
}))

vi.mock('../security/AuthContext', () => ({
  useAuth: () => ({
    firebaseUser: { uid: 'user-123', phoneNumber: '+66812345678', email: null },
    userProfile: {
      uid: 'user-123',
      firstName: 'ผู้ใช้ยืนยันผ่าน',
      lastName: 'Firebase',
      phoneNumber: '+66812345678',
      role: ['WORKER'],
      status: 'approved',
    },
    refreshProfile: mockRefreshProfile,
    loading: false,
  }),
}))

vi.mock('../app/usePhase2', () => ({
  usePhase2: () => ({
    identity: { displayName: '081-234-5678' },
    currentFarm: {
      farmId: 'farm-01',
      farmName: 'สวนสาธิตเหนือ',
      farmCode: 'DEMO-F01',
      role: 'WORKER',
    },
    authMode: 'firebase-live',
    signOut: vi.fn(),
  }),
}))

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders profile fields and clears placeholder names', () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'โปรไฟล์และข้อมูลส่วนตัว' })).toBeInTheDocument()
    const firstNameInput = screen.getByLabelText(/ชื่อ/u) as HTMLInputElement
    const lastNameInput = screen.getByLabelText(/นามสกุล/u) as HTMLInputElement
    const phoneInput = screen.getByLabelText(/หมายเลขโทรศัพท์/u) as HTMLInputElement

    // Placeholder names are cleared so the user can easily enter their real name
    expect(firstNameInput.value).toBe('')
    expect(lastNameInput.value).toBe('')
    expect(phoneInput.value).toBe('081-234-5678')
  })

  it('submits updated profile names and refreshes profile', async () => {
    mockUpdateUserProfile.mockResolvedValueOnce(undefined)
    mockRefreshProfile.mockResolvedValueOnce(undefined)

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    )

    const firstNameInput = screen.getByLabelText(/ชื่อ/u)
    const lastNameInput = screen.getByLabelText(/นามสกุล/u)
    const submitButton = screen.getByRole('button', { name: 'บันทึกข้อมูล' })

    fireEvent.change(firstNameInput, { target: { value: 'สมชาย' } })
    fireEvent.change(lastNameInput, { target: { value: 'ใจดี' } })
    fireEvent.submit(submitButton.closest('form')!)

    await waitFor(() => {
      expect(mockUpdateUserProfile).toHaveBeenCalledWith({
        uid: 'user-123',
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        phoneNumber: '081-234-5678',
      })
      expect(mockRefreshProfile).toHaveBeenCalled()
    })
    expect(await screen.findByText('✓ บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว')).toBeInTheDocument()
  })
})
