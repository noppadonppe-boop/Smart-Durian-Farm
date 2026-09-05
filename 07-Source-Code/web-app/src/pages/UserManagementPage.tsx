import { useEffect, useState } from 'react'
import { onSnapshot, query, deleteDoc } from 'firebase/firestore'
import { createFirebaseLiveClients } from '../infrastructure/firebase/firebaseClient'
import { listOperationalFarmProfiles } from '../infrastructure/firebase/firebasePhase2Repository'
import { formatPhoneNumber, type AccessRequestRecord, type UserProfile } from '../domain/auth'
import { canonicalRoles, type CanonicalRole } from '../domain/farm'
import { usePhase2 } from '../app/usePhase2'
import { rootCollection, rootDoc } from '../infrastructure/firebase/firebaseDataRoot'
import { useAuth } from '../security/AuthContext'
import {
  adminUpdateUserProfile,
  approveFirebaseAccessRequest,
  rejectFirebaseAccessRequest,
  updateFirebaseMasterAdminAccess,
  updateFirebaseUserAccess,
} from '../services/accessRequestService'
import './UserManagementPage.css'

interface UserProfileWithDoc extends UserProfile {
  docId: string
}

interface FarmOption {
  organizationId: string
  organizationName: string
  farmId: string
  farmName: string
  label: string
  status?: string
}

interface RequestSelection {
  farmKey: string
  role: CanonicalRole
}

type EditableRole = CanonicalRole | 'MasterAdmin'

interface EditSelection {
  farmKey: string
  role: EditableRole
}

export function UserManagementPage() {
  const { isSystemAdmin } = useAuth()
  const { currentFarm } = usePhase2()
  const [users, setUsers] = useState<UserProfileWithDoc[]>([])
  const [accessRequests, setAccessRequests] = useState<AccessRequestRecord[]>([])
  const [farms, setFarms] = useState<FarmOption[]>([])
  const [farmDirectory, setFarmDirectory] = useState<FarmOption[]>([])
  const [requestSelections, setRequestSelections] = useState<Record<string, RequestSelection>>({})
  const [requestBusy, setRequestBusy] = useState<string>()
  const [requestError, setRequestError] = useState<string>()
  const [editingUser, setEditingUser] = useState<UserProfileWithDoc>()
  const [editingProfileUser, setEditingProfileUser] = useState<UserProfileWithDoc>()
  const [hideDuplicates, setHideDuplicates] = useState(true)
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
  })
  const [editSelection, setEditSelection] = useState<EditSelection>({
    farmKey: '',
    role: 'WORKER',
  })
  const { firestore } = createFirebaseLiveClients()

  useEffect(() => {
    const q = query(rootCollection(firestore, 'users'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData: UserProfileWithDoc[] = snapshot.docs.map(d => {
        const data = d.data() as UserProfile
        return {
          ...data,
          docId: d.id,
          uid: data.uid || d.id,
        }
      })
      setUsers(usersData)
    })
    return () => unsubscribe()
  }, [firestore])

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(rootCollection(firestore, 'accessRequests')),
      (snapshot) => {
        setAccessRequests(snapshot.docs.map((item) => item.data() as AccessRequestRecord))
      },
      (error) => setRequestError(`โหลดคำขออนุมัติไม่สำเร็จ: ${error.message}`),
    )
    return () => unsubscribe()
  }, [firestore])

  useEffect(() => {
    const fetchFarms = async () => {
      if (!currentFarm) {
        setFarmDirectory([])
        setFarms([])
        return
      }
      try {
        const profiles = await listOperationalFarmProfiles(firestore, currentFarm.organizationId)
        const directory = profiles.map((profile) => ({
          organizationId: profile.organizationId,
          organizationName: currentFarm.organizationName,
          farmId: profile.farmId,
          farmName: profile.farmName,
          label: `${profile.farmName} · ${currentFarm.organizationName}`,
          status: profile.status,
        }))
        setFarmDirectory(directory)
        setFarms(directory.filter((farm) => farm.status === 'ACTIVE'))
      } catch (err) {
        setRequestError(`โหลดรายการสวนไม่สำเร็จ: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    void fetchFarms()
  }, [currentFarm, firestore])

  const deleteUser = async (docId: string, displayName: string) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบรายการของ "${displayName}" (ID: ${docId}) ออกจากฐานข้อมูล?`)) {
      return
    }
    try {
      const ref = rootDoc(firestore, 'users', docId)
      await deleteDoc(ref)
      alert('ลบรายการเรียบร้อยแล้ว')
    } catch (error) {
      console.error('Delete failed', error)
      alert('ไม่สามารถลบรายการได้: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  const selectionFor = (uid: string): RequestSelection => requestSelections[uid] ?? {
    farmKey: farms[0] ? `${farms[0].organizationId}/${farms[0].farmId}` : '',
    role: 'WORKER',
  }

  const updateRequestSelection = (uid: string, updates: Partial<RequestSelection>) => {
    setRequestSelections((current) => ({
      ...current,
      [uid]: { ...selectionFor(uid), ...updates },
    }))
  }

  const assignedProjectNames = (assignedProjects?: string[]) => {
    if (!assignedProjects?.length) return 'ยังไม่ได้ Assign สวน'
    const names = assignedProjects.map((projectId) => {
      const farm = farmDirectory.find((item) => (
        item.farmId === projectId || `${item.organizationId}/${item.farmId}` === projectId
      ))
      if (farm) return farm.farmName
      const organization = farmDirectory.find((item) => item.organizationId === projectId)
      return organization ? `ทุกสวนใน ${organization.organizationName}` : 'สวนที่ยังไม่พบชื่อ'
    })
    return [...new Set(names)].join(', ')
  }

  const approveRequest = async (request: AccessRequestRecord) => {
    const selection = selectionFor(request.uid)
    const farm = farms.find(
      (item) => `${item.organizationId}/${item.farmId}` === selection.farmKey,
    )
    if (!farm) {
      setRequestError('กรุณาเลือกสวนก่อนอนุมัติ')
      return
    }
    setRequestBusy(request.uid)
    setRequestError(undefined)
    try {
      await approveFirebaseAccessRequest({
        uid: request.uid,
        organizationId: farm.organizationId,
        farmId: farm.farmId,
        role: selection.role,
      })
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'อนุมัติคำขอไม่สำเร็จ')
    } finally {
      setRequestBusy(undefined)
    }
  }

  const rejectRequest = async (request: AccessRequestRecord) => {
    const reason = window.prompt('ระบุเหตุผลที่ปฏิเสธคำขอ')
    if (reason === null) return
    setRequestBusy(request.uid)
    setRequestError(undefined)
    try {
      await rejectFirebaseAccessRequest(request.uid, reason)
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'ปฏิเสธคำขอไม่สำเร็จ')
    } finally {
      setRequestBusy(undefined)
    }
  }

  const startEditing = (user: UserProfileWithDoc) => {
    const request = accessRequests.find(
      (item) => item.uid === user.uid && item.status === 'APPROVED',
    )
    if (!request) {
      setRequestError('ไม่พบ Access Request ที่อนุมัติแล้วสำหรับผู้ใช้นี้')
      return
    }
    const profileRole = user.role.find((role): role is CanonicalRole => (
      canonicalRoles.includes(role as CanonicalRole)
    ))
    setEditingUser(user)
    setEditSelection({
      farmKey: request.organizationId && request.farmId
        ? `${request.organizationId}/${request.farmId}`
        : '',
      role: user.role.includes('MasterAdmin')
        ? 'MasterAdmin'
        : request.assignedRole ?? profileRole ?? 'WORKER',
    })
    setRequestError(undefined)
  }

  const saveUserAccess = async () => {
    if (!editingUser) return
    const farm = farms.find(
      (item) => `${item.organizationId}/${item.farmId}` === editSelection.farmKey,
    )
    if (!farm) {
      setRequestError('กรุณาเลือกสวนที่อยู่ในสถานะ ACTIVE')
      return
    }
    if (!window.confirm(
      `ยืนยันเปลี่ยนสิทธิ์ของ ${editingUser.firstName} ${editingUser.lastName} เป็น ${editSelection.role} ใน ${farm.label}`,
    )) return

    setRequestBusy(editingUser.uid)
    setRequestError(undefined)
    try {
      if (editSelection.role === 'MasterAdmin' || editingUser.role.includes('MasterAdmin')) {
        await updateFirebaseMasterAdminAccess({
          uid: editingUser.uid,
          masterAdmin: editSelection.role === 'MasterAdmin',
          organizationId: farm.organizationId,
          farmId: farm.farmId,
          fallbackRole: editSelection.role === 'MasterAdmin'
            ? (accessRequests.find((item) => item.uid === editingUser.uid)?.assignedRole ?? 'WORKER')
            : editSelection.role,
        })
      } else {
        await updateFirebaseUserAccess({
          uid: editingUser.uid,
          organizationId: farm.organizationId,
          farmId: farm.farmId,
          role: editSelection.role,
        })
      }
      setEditingUser(undefined)
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'แก้ไขสิทธิ์ผู้ใช้ไม่สำเร็จ')
    } finally {
      setRequestBusy(undefined)
    }
  }

  const startEditingProfile = (user: UserProfileWithDoc) => {
    const matchingRequest = accessRequests.find((r) => r.uid === user.uid)
    const phone = user.phoneNumber || matchingRequest?.maskedPhone || ''
    setEditingProfileUser(user)
    setProfileForm({
      firstName: user.firstName === 'ผู้ใช้ยืนยันผ่าน' ? '' : user.firstName || '',
      lastName: user.lastName === 'Firebase' ? '' : user.lastName || '',
      phoneNumber: phone,
    })
    setRequestError(undefined)
  }

  const saveUserProfile = async () => {
    if (!editingProfileUser) return
    if (!profileForm.firstName.trim()) {
      setRequestError('กรุณากรอกชื่อ')
      return
    }
    setRequestBusy(editingProfileUser.uid)
    setRequestError(undefined)
    try {
      await adminUpdateUserProfile({
        uid: editingProfileUser.uid,
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phoneNumber: profileForm.phoneNumber,
      })
      setEditingProfileUser(undefined)
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'บันทึกข้อมูลผู้ใช้ไม่สำเร็จ')
    } finally {
      setRequestBusy(undefined)
    }
  }

  if (!isSystemAdmin) {
    return <div className="form-error">ไม่มีสิทธิ์เข้าถึง</div>
  }

  const emailCounts = users.reduce<Record<string, number>>((acc, u) => {
    const email = (u.email || '').toLowerCase().trim()
    if (email) acc[email] = (acc[email] || 0) + 1
    return acc
  }, {})

  const hasDuplicateEmails = Object.values(emailCounts).some(count => count > 1)
  const pendingRequests = accessRequests.filter((request) => request.status === 'PENDING')

  const displayedUsers = hideDuplicates
    ? users.filter((u, _idx, self) => {
        if (pendingRequests.some((request) => request.uid === u.uid)) return true
        const email = (u.email || '').toLowerCase().trim()
        if (!email) return true
        const sameEmailList = self.filter(x => (x.email || '').toLowerCase().trim() === email)
        if (sameEmailList.length <= 1) return true
        const best = sameEmailList.find(x =>
          x.position?.includes('ผู้ดูแล') ||
          x.role?.includes('MasterAdmin') ||
          x.docId === x.uid
        ) ?? sameEmailList[0]
        return best ? u.docId === best.docId : true
      })
    : users

  const pendingRequestsWithoutProfile = pendingRequests.filter(
    (request) => !displayedUsers.some((user) => user.uid === request.uid),
  )

  return (
    <div className="admin-container" style={{ padding: '1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1b4332' }}>จัดการผู้ใช้งาน (MasterAdmin)</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#666', fontSize: '0.9rem' }}>
            ทั้งหมด {users.length + pendingRequestsWithoutProfile.length} รายการ
            {' '}· รออนุมัติ {pendingRequests.length} รายการ
          </p>
        </div>

        {hasDuplicateEmails && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer', background: '#fef3c7', padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid #fde68a' }}>
            <input
              type="checkbox"
              checked={hideDuplicates}
              onChange={(e) => setHideDuplicates(e.target.checked)}
            />
            <span>ซ่อนรายการอีเมลที่ซ้ำกัน (แสดงเฉพาะข้อมูลหลัก)</span>
          </label>
        )}
      </div>

      {requestError ? <p className="form-error" role="alert">{requestError}</p> : null}

      {editingUser ? (
        <section
          aria-labelledby="edit-user-access-title"
          style={{
            background: '#fff',
            border: '2px solid #95c7a6',
            borderRadius: '10px',
            display: 'grid',
            gap: '0.75rem',
            marginBottom: '1.25rem',
            padding: '1rem',
          }}
        >
          <div>
            <h2 id="edit-user-access-title" style={{ margin: 0 }}>แก้ไขสิทธิ์และย้ายสวน</h2>
            <p style={{ margin: '0.25rem 0 0' }}>
              {editingUser.firstName} {editingUser.lastName} · {editingUser.email || editingUser.uid}
            </p>
          </div>
          <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            <label>
              สวนปลายทาง (เฉพาะ ACTIVE)
              <select
                value={editSelection.farmKey}
                onChange={(event) => setEditSelection((current) => ({
                  ...current,
                  farmKey: event.target.value,
                }))}
              >
                {!farms.some((farm) => `${farm.organizationId}/${farm.farmId}` === editSelection.farmKey) ? (
                  <option value={editSelection.farmKey}>สวนเดิมไม่พร้อมใช้งาน — กรุณาเลือกสวนใหม่</option>
                ) : null}
                <option value="">เลือกสวน</option>
                {farms.map((farm) => (
                  <option key={`${farm.organizationId}/${farm.farmId}`} value={`${farm.organizationId}/${farm.farmId}`}>
                    {farm.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Role ใหม่
              <select
                value={editSelection.role}
                onChange={(event) => setEditSelection((current) => ({
                  ...current,
                  role: event.target.value as EditableRole,
                }))}
              >
                <option value="MasterAdmin">MasterAdmin</option>
                {canonicalRoles.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </label>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              className="primary-action"
              disabled={requestBusy === editingUser.uid || !farms.some(
                (farm) => `${farm.organizationId}/${farm.farmId}` === editSelection.farmKey,
              )}
              onClick={() => void saveUserAccess()}
              type="button"
            >
              บันทึก Role และสวน
            </button>
            <button
              className="secondary-action"
              disabled={requestBusy === editingUser.uid}
              onClick={() => setEditingUser(undefined)}
              type="button"
            >
              ยกเลิก
            </button>
          </div>
        </section>
      ) : null}

      {editingProfileUser ? (
        <section
          aria-labelledby="edit-profile-title"
          style={{
            background: '#fff',
            border: '2px solid #3b82f6',
            borderRadius: '10px',
            display: 'grid',
            gap: '0.75rem',
            marginBottom: '1.25rem',
            padding: '1rem',
          }}
        >
          <div>
            <h2 id="edit-profile-title" style={{ margin: 0, color: '#1e40af' }}>แก้ไขข้อมูลผู้ใช้งาน</h2>
            <p style={{ margin: '0.25rem 0 0', color: '#64748b' }}>
              UID: {editingProfileUser.uid} {editingProfileUser.email ? `· ${editingProfileUser.email}` : ''}
            </p>
          </div>
          <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <label>
              ชื่อ <span style={{ color: '#ef4444' }}>*</span>
              <input
                type="text"
                value={profileForm.firstName}
                onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="กรอกชื่อ"
                required
              />
            </label>
            <label>
              นามสกุล
              <input
                type="text"
                value={profileForm.lastName}
                onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="กรอกนามสกุล"
              />
            </label>
            <label>
              เบอร์โทรศัพท์
              <input
                type="tel"
                value={profileForm.phoneNumber}
                onChange={(e) => setProfileForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="เช่น 081-234-5678"
              />
            </label>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              className="primary-action"
              disabled={requestBusy === editingProfileUser.uid}
              onClick={() => void saveUserProfile()}
              type="button"
            >
              บันทึกข้อมูลผู้ใช้
            </button>
            <button
              className="secondary-action"
              disabled={requestBusy === editingProfileUser.uid}
              onClick={() => setEditingProfileUser(undefined)}
              type="button"
            >
              ยกเลิก
            </button>
          </div>
        </section>
      ) : null}

      {hasDuplicateEmails && !hideDuplicates && (
        <div style={{ background: '#fffbeb', border: '1px solid #fef08a', borderRadius: '6px', padding: '0.6rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#854d0e' }}>
          💡 <strong>ข้อสังเกต:</strong> พบรายการที่มีอีเมลเดียวกันมากกว่า 1 แถว เนื่องจากระบบมีเอกสารเดิม (เช่น ตอนสมัครสมาชิกที่ตำแหน่งระบุว่า &quot;รอผู้ดูแลอนุมัติ&quot;) และเอกสารใหม่ (เช่น ตอนเริ่มต้นระบบระบุตำแหน่งเป็น &quot;ผู้ดูแลระบบ&quot;) ในฐานข้อมูล Firestore — ท่านสามารถกดปุ่ม <strong>&quot;ลบ&quot;</strong> ที่แถวที่ไม่ต้องการ เพื่อลบเอกสารซ้ำซ้อนออกจากฐานข้อมูลได้โดยตรง
        </div>
      )}

      <div className="user-management-table-shell">
        <table className="user-management-table">
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
              <th style={{ padding: '8px 12px', textAlign: 'center' }}>รูป</th>
              <th style={{ padding: '8px 12px' }}>ชื่อ-นามสกุล / อีเมล</th>
              <th style={{ padding: '8px 12px' }}>ตำแหน่ง</th>
              <th style={{ padding: '8px 12px' }}>สถานะ</th>
              <th style={{ padding: '8px 12px' }}>สิทธิ์ (Roles)</th>
              <th style={{ padding: '8px 12px' }}>โครงการ/สวนที่รับผิดชอบ</th>
              <th style={{ padding: '8px 12px', textAlign: 'center' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {displayedUsers.map(u => {
              const emailKey = (u.email || '').toLowerCase().trim()
              const isDuplicate = emailKey && (emailCounts[emailKey] || 0) > 1
              const matchingRequest = accessRequests.find((r) => r.uid === u.uid)
              const pendingRequest = pendingRequests.find((request) => request.uid === u.uid)
              const pendingSelection = pendingRequest ? selectionFor(pendingRequest.uid) : undefined
              const phone = u.phoneNumber || matchingRequest?.maskedPhone || ''
              const isPlaceholderName =
                (u.firstName === 'ผู้ใช้ยืนยันผ่าน' && (u.lastName === 'Firebase' || !u.lastName)) ||
                u.firstName === 'ผู้ใช้ยืนยันผ่าน Firebase' ||
                (!u.firstName && !u.lastName)

              const displayTitle = isPlaceholderName && phone
                ? formatPhoneNumber(phone)
                : `${u.firstName || ''} ${u.lastName || ''}`.trim() || formatPhoneNumber(phone) || 'ผู้ใช้ไม่มีชื่อ'

              const displayContact = u.email
                ? u.email
                : (!isPlaceholderName && phone ? formatPhoneNumber(phone) : '')

              return (
                <tr
                  className={pendingRequest ? 'user-management-row--pending' : undefined}
                  key={u.docId}
                  style={{
                    backgroundColor: isDuplicate && !hideDuplicates && !pendingRequest ? '#fffdf7' : undefined,
                    borderBottom: '1px solid #f1f5f9',
                    height: '36px',
                  }}
                >
                  <td data-label="รูป" style={{ padding: '4px 8px', textAlign: 'center', verticalAlign: 'middle' }}>
                    {u.photoURL ? (
                      <img
                        src={u.photoURL}
                        alt="Profile"
                        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', verticalAlign: 'middle', display: 'inline-block' }}
                      />
                    ) : (
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#cbd5e1', display: 'inline-block', verticalAlign: 'middle' }} />
                    )}
                  </td>
                  <td data-label="ผู้ใช้งาน" style={{ padding: '4px 12px', verticalAlign: 'middle' }}>
                    <strong style={{ color: '#1e293b' }}>{displayTitle}</strong>
                    {displayContact ? (
                      <span style={{ color: '#64748b', fontSize: '0.82rem', marginLeft: '6px' }}>
                        ({displayContact})
                      </span>
                    ) : null}
                    {isDuplicate && !hideDuplicates && (
                      <span
                        style={{
                          marginLeft: '6px',
                          fontSize: '0.75rem',
                          color: '#b45309',
                          background: '#fef3c7',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          border: '1px solid #fde68a'
                        }}
                        title={`Doc ID: ${u.docId}`}
                      >
                        ซ้ำ ({u.docId === u.uid ? 'UID หลัก' : 'เอกสารเก่า'})
                      </span>
                    )}
                  </td>
                  <td data-label="ตำแหน่ง" style={{ padding: '4px 12px', verticalAlign: 'middle', color: '#334155' }}>
                    {u.position || '-'}
                  </td>
                  <td data-label="สถานะ" style={{ padding: '4px 8px', verticalAlign: 'middle' }}>
                    {pendingRequest || u.status === 'pending' ? 'รออนุมัติ' : u.status === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธ'}
                  </td>
                  <td data-label="สิทธิ์" style={{ padding: '4px 8px', verticalAlign: 'middle' }}>
                    {pendingRequest && pendingSelection ? (
                      <select
                        aria-label={`สิทธิ์ของ ${displayTitle}`}
                        value={pendingSelection.role}
                        onChange={(event) => updateRequestSelection(pendingRequest.uid, { role: event.target.value as CanonicalRole })}
                        style={{ fontSize: '0.78rem', minHeight: '28px', padding: '2px 6px' }}
                      >
                        {canonicalRoles.map((role) => <option key={role} value={role}>{role}</option>)}
                      </select>
                    ) : u.role?.join(', ') || 'ยังไม่กำหนด'}
                  </td>
                  <td data-label="สวนที่รับผิดชอบ" style={{ padding: '4px 8px', verticalAlign: 'middle' }}>
                    {pendingRequest && pendingSelection ? (
                      <select
                        aria-label={`สวนของ ${displayTitle}`}
                        value={pendingSelection.farmKey}
                        onChange={(event) => updateRequestSelection(pendingRequest.uid, { farmKey: event.target.value })}
                        style={{ fontSize: '0.78rem', maxWidth: '260px', minHeight: '28px', padding: '2px 6px' }}
                      >
                        <option value="">เลือกสวน</option>
                        {farms.map((farm) => (
                          <option key={`${farm.organizationId}/${farm.farmId}`} value={`${farm.organizationId}/${farm.farmId}`}>
                            {farm.label}
                          </option>
                        ))}
                      </select>
                    ) : assignedProjectNames(u.assignedProjects)}
                  </td>
                  <td data-label="จัดการ" style={{ padding: '3px 8px', verticalAlign: 'middle', textAlign: 'center' }}>
                    <div className="user-management-actions">
                      {pendingRequest && pendingSelection ? (
                        <>
                          <button
                            className="primary-action"
                            disabled={requestBusy === pendingRequest.uid || !pendingSelection.farmKey}
                            onClick={() => void approveRequest(pendingRequest)}
                            style={{ fontSize: '0.78rem', minHeight: '28px', padding: '2px 10px', whiteSpace: 'nowrap' }}
                            type="button"
                          >
                            Approve
                          </button>
                          <button
                            className="secondary-action"
                            disabled={requestBusy === pendingRequest.uid}
                            onClick={() => void rejectRequest(pendingRequest)}
                            style={{ color: '#e11d48', fontSize: '0.78rem', minHeight: '28px', padding: '2px 10px', whiteSpace: 'nowrap' }}
                            type="button"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="secondary-action"
                            disabled={requestBusy === u.uid}
                            onClick={() => startEditingProfile(u)}
                            style={{ fontSize: '0.78rem', minHeight: '28px', padding: '2px 8px', whiteSpace: 'nowrap' }}
                            type="button"
                            title="แก้ไขชื่อ-นามสกุลและเบอร์โทร"
                          >
                            แก้ไขชื่อ
                          </button>
                          {u.status === 'approved' ? (
                            <button
                              className="secondary-action"
                              disabled={requestBusy === u.uid}
                              onClick={() => startEditing(u)}
                              style={{ fontSize: '0.78rem', minHeight: '28px', padding: '2px 8px', whiteSpace: 'nowrap' }}
                              type="button"
                            >
                              {u.role?.includes('MasterAdmin') ? 'แก้ไข/ปลดสิทธิ์' : 'แก้ไขสิทธิ์'}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => void deleteUser(u.docId, `${u.firstName} ${u.lastName}`)}
                            style={{
                              padding: '2px 8px',
                              minHeight: '28px',
                              fontSize: '0.78rem',
                              background: '#fff1f2',
                              color: '#e11d48',
                              border: '1px solid #fecdd3',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              lineHeight: '1.4',
                              whiteSpace: 'nowrap',
                            }}
                            title="ลบรายการนี้ออกจากระบบ"
                          >
                            ลบ
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {pendingRequestsWithoutProfile.map((request) => {
              const selection = selectionFor(request.uid)
              const displayTitle = request.displayName || formatPhoneNumber(request.maskedPhone) || 'ผู้ใช้ไม่มีชื่อ'
              return (
                <tr className="user-management-row--pending" key={request.requestId} style={{ borderBottom: '1px solid #f1f5f9', height: '36px' }}>
                  <td data-label="รูป" style={{ padding: '4px 8px', textAlign: 'center', verticalAlign: 'middle' }}>
                    {request.photoURL ? (
                      <img src={request.photoURL} alt="Profile" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', verticalAlign: 'middle' }} />
                    ) : (
                      <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#cbd5e1', display: 'inline-block', verticalAlign: 'middle' }} />
                    )}
                  </td>
                  <td data-label="ผู้ใช้งาน" style={{ padding: '4px 12px', verticalAlign: 'middle' }}>
                    <strong style={{ color: '#1e293b' }}>{displayTitle}</strong>
                    <span style={{ color: '#64748b', fontSize: '0.82rem', marginLeft: '6px' }}>
                      ({request.email || request.maskedPhone || request.uid})
                    </span>
                  </td>
                  <td data-label="ตำแหน่ง" style={{ padding: '4px 12px', verticalAlign: 'middle' }}>ผู้ขอเข้าใช้งาน</td>
                  <td data-label="สถานะ" style={{ padding: '4px 8px', verticalAlign: 'middle' }}>รออนุมัติ</td>
                  <td data-label="สิทธิ์" style={{ padding: '4px 8px', verticalAlign: 'middle' }}>
                    <select
                      aria-label={`สิทธิ์ของ ${displayTitle}`}
                      value={selection.role}
                      onChange={(event) => updateRequestSelection(request.uid, { role: event.target.value as CanonicalRole })}
                      style={{ fontSize: '0.78rem', minHeight: '28px', padding: '2px 6px' }}
                    >
                      {canonicalRoles.map((role) => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </td>
                  <td data-label="สวนที่รับผิดชอบ" style={{ padding: '4px 8px', verticalAlign: 'middle' }}>
                    <select
                      aria-label={`สวนของ ${displayTitle}`}
                      value={selection.farmKey}
                      onChange={(event) => updateRequestSelection(request.uid, { farmKey: event.target.value })}
                      style={{ fontSize: '0.78rem', maxWidth: '260px', minHeight: '28px', padding: '2px 6px' }}
                    >
                      <option value="">เลือกสวน</option>
                      {farms.map((farm) => (
                        <option key={`${farm.organizationId}/${farm.farmId}`} value={`${farm.organizationId}/${farm.farmId}`}>
                          {farm.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td data-label="จัดการ" style={{ padding: '3px 8px', textAlign: 'center', verticalAlign: 'middle' }}>
                    <div className="user-management-actions">
                      <button
                        className="primary-action"
                        disabled={requestBusy === request.uid || !selection.farmKey}
                        onClick={() => void approveRequest(request)}
                        style={{ fontSize: '0.78rem', minHeight: '28px', padding: '2px 10px' }}
                        type="button"
                      >
                        Approve
                      </button>
                      <button
                        className="secondary-action"
                        disabled={requestBusy === request.uid}
                        onClick={() => void rejectRequest(request)}
                        style={{ color: '#e11d48', fontSize: '0.78rem', minHeight: '28px', padding: '2px 10px' }}
                        type="button"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
