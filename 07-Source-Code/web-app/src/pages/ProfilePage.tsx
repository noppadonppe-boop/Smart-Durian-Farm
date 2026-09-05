import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../security/AuthContext'
import { usePhase2 } from '../app/usePhase2'
import { formatPhoneNumber } from '../domain/auth'
import { roleLabels } from '../domain/farm'
import { updateUserProfile } from '../services/accessRequestService'
import { PageHeader } from './PageHeader'

export function ProfilePage() {
  const { firebaseUser, userProfile, refreshProfile, loading: authLoading } = useAuth()
  const { identity, currentFarm, authMode, signOut } = usePhase2()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string>()
  const [errorMessage, setErrorMessage] = useState<string>()

  useEffect(() => {
    if (userProfile) {
      const isPlaceholderFirst = userProfile.firstName === 'ผู้ใช้ยืนยันผ่าน'
      const isPlaceholderLast = userProfile.lastName === 'Firebase'
      setFirstName(isPlaceholderFirst ? '' : userProfile.firstName || '')
      setLastName(isPlaceholderLast ? '' : userProfile.lastName || '')
      const phone = userProfile.phoneNumber || firebaseUser?.phoneNumber || ''
      setPhoneNumber(formatPhoneNumber(phone))
    } else if (firebaseUser) {
      const phone = firebaseUser.phoneNumber || ''
      setPhoneNumber(formatPhoneNumber(phone))
    }
  }, [userProfile?.uid, firebaseUser?.uid])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSuccessMessage(undefined)
    setErrorMessage(undefined)

    const trimmedFirst = firstName.trim()
    const trimmedLast = lastName.trim()
    if (!trimmedFirst) {
      setErrorMessage('กรุณาระบุชื่อ')
      return
    }

    const uid = userProfile?.uid || firebaseUser?.uid
    if (!uid) {
      setErrorMessage('ไม่พบข้อมูลบัญชีผู้ใช้งาน')
      return
    }

    setSaving(true)
    try {
      await updateUserProfile({
        uid,
        firstName: trimmedFirst,
        lastName: trimmedLast,
        phoneNumber: phoneNumber.trim() || undefined,
      })
      await refreshProfile()
      setSuccessMessage('บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'บันทึกข้อมูลโปรไฟล์ไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading && !userProfile && !firebaseUser) {
    return (
      <section className="page-stack">
        <PageHeader
          eyebrow="User Profile"
          title="ข้อมูลโปรไฟล์"
          description="กำลังโหลดข้อมูลบัญชีผู้ใช้…"
        />
      </section>
    )
  }

  const isPhoneLogin = Boolean(firebaseUser?.phoneNumber)
  const displayAvatar = userProfile?.photoURL ? (
    <img
      src={userProfile.photoURL}
      alt="Profile avatar"
      style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }}
    />
  ) : (
    <div
      style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: '#2d6a4f',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.75rem',
        fontWeight: 'bold',
      }}
      aria-hidden="true"
    >
      {firstName ? firstName.charAt(0) : userProfile?.email ? userProfile.email.charAt(0).toUpperCase() : '👤'}
    </div>
  )

  const currentRole = userProfile?.role?.length
    ? userProfile.role.join(', ')
    : currentFarm
    ? roleLabels[currentFarm.role]
    : 'ผู้ใช้งาน'

  return (
    <section className="page-stack" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <PageHeader
        eyebrow="Account & Profile"
        title="โปรไฟล์และข้อมูลส่วนตัว"
        description="ตรวจสอบและแก้ไขชื่อ-นามสกุล ข้อมูลติดต่อ และสถานะบัญชีของคุณ"
      />

      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '1.5rem',
          display: 'flex',
          gap: '1.5rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        {displayAvatar}
        <div style={{ flex: 1, minWidth: '240px' }}>
          <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', color: '#1b4332' }}>
            {firstName || lastName
              ? `${firstName} ${lastName}`.trim()
              : phoneNumber
              ? phoneNumber
              : identity?.displayName || 'ผู้ใช้งาน'}
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.875rem', color: '#64748b' }}>
            <span
              style={{
                background: '#dcfce7',
                color: '#166534',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 500,
                fontSize: '0.75rem',
              }}
            >
              {currentRole}
            </span>
            <span>·</span>
            <span>
              เข้าสู่ระบบผ่าน: {isPhoneLogin ? '📱 เบอร์โทรศัพท์ (OTP)' : authMode === 'firebase-live' ? '🔐 Google Account' : '🧪 ข้อมูลจำลอง (Mock)'}
            </span>
          </div>
          {currentFarm && (
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#475569' }}>
              สวนปัจจุบัน: <strong>{currentFarm.farmName}</strong> ({currentFarm.farmCode})
            </p>
          )}
        </div>
      </div>

      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: '#1e293b' }}>แก้ไขข้อมูลส่วนตัว</h3>

        {successMessage && (
          <div
            role="status"
            style={{
              background: '#f0fdf4',
              color: '#15803d',
              border: '1px solid #bbf7d0',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              marginBottom: '1rem',
              fontSize: '0.9rem',
            }}
          >
            ✓ {successMessage}
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            style={{
              background: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              marginBottom: '1rem',
              fontSize: '0.9rem',
            }}
          >
            ✕ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            <label style={{ display: 'grid', gap: '0.35rem', fontWeight: 500, fontSize: '0.9rem' }}>
              <span>
                ชื่อ <span style={{ color: '#dc2626' }}>*</span>
              </span>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="ระบุชื่อ เช่น สมชาย"
                required
                disabled={saving}
                style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                }}
              />
            </label>

            <label style={{ display: 'grid', gap: '0.35rem', fontWeight: 500, fontSize: '0.9rem' }}>
              <span>นามสกุล</span>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="ระบุนามสกุล เช่น ใจดี"
                disabled={saving}
                style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                }}
              />
            </label>
          </div>

          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            <label style={{ display: 'grid', gap: '0.35rem', fontWeight: 500, fontSize: '0.9rem' }}>
              <span>
                หมายเลขโทรศัพท์ {isPhoneLogin && <small style={{ color: '#16a34a', fontWeight: 'normal' }}>(ยืนยันผ่าน OTP แล้ว)</small>}
              </span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="เช่น 081-234-5678"
                disabled={saving || isPhoneLogin}
                style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  background: isPhoneLogin ? '#f8fafc' : '#fff',
                }}
              />
            </label>

            <label style={{ display: 'grid', gap: '0.35rem', fontWeight: 500, fontSize: '0.9rem' }}>
              <span>อีเมล</span>
              <input
                type="email"
                value={userProfile?.email || firebaseUser?.email || ''}
                readOnly
                disabled
                placeholder="ยังไม่ได้ระบุอีเมล"
                style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  background: '#f8fafc',
                  color: '#64748b',
                }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className="primary-action"
              type="submit"
              disabled={saving}
              style={{ minWidth: '130px' }}
            >
              {saving ? 'กำลังบันทึก…' : 'บันทึกข้อมูล'}
            </button>
            <Link
              to="/"
              className="secondary-action"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
            >
              กลับสู่หน้าหลัก
            </Link>
          </div>
        </form>
      </div>

      <div
        style={{
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '1rem',
          fontSize: '0.85rem',
          color: '#64748b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <span>
          UID: <code style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '2px 4px', borderRadius: '4px' }}>{userProfile?.uid || firebaseUser?.uid || '-'}</code>
        </span>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('คุณต้องการออกจากระบบหรือไม่?')) {
              void signOut()
            }
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#dc2626',
            cursor: 'pointer',
            padding: 0,
            textDecoration: 'underline',
          }}
        >
          ออกจากระบบ
        </button>
      </div>
    </section>
  )
}
