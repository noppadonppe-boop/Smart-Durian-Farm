import { useEffect, useState } from 'react'
import { onSnapshot, query, getDocs, deleteDoc } from 'firebase/firestore'
import { createFirebaseLiveClients } from '../infrastructure/firebase/firebaseClient'
import type { AccessRequestRecord, UserProfile } from '../domain/auth'
import { canonicalRoles, type CanonicalRole } from '../domain/farm'
import { rootCollection, rootDoc } from '../infrastructure/firebase/firebaseDataRoot'
import { useAuth } from '../security/AuthContext'
import {
  approveFirebaseAccessRequest,
  rejectFirebaseAccessRequest,
  updateFirebaseUserAccess,
} from '../services/accessRequestService'

interface UserProfileWithDoc extends UserProfile {
  docId: string
}

interface FarmOption {
  organizationId: string
  farmId: string
  label: string
}

interface RequestSelection {
  farmKey: string
  role: CanonicalRole
}

export function UserManagementPage() {
  const { isSystemAdmin } = useAuth()
  const [users, setUsers] = useState<UserProfileWithDoc[]>([])
  const [accessRequests, setAccessRequests] = useState<AccessRequestRecord[]>([])
  const [farms, setFarms] = useState<FarmOption[]>([])
  const [requestSelections, setRequestSelections] = useState<Record<string, RequestSelection>>({})
  const [requestBusy, setRequestBusy] = useState<string>()
  const [requestError, setRequestError] = useState<string>()
  const [editingUser, setEditingUser] = useState<UserProfileWithDoc>()
  const [editSelection, setEditSelection] = useState<RequestSelection>({
    farmKey: '',
    role: 'WORKER',
  })
  const [hideDuplicates, setHideDuplicates] = useState(false)
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
      try {
        const organizationSnapshot = await getDocs(query(rootCollection(firestore, 'organizations')))
        const farmGroups = await Promise.all(organizationSnapshot.docs.map(async (d) => {
            const data = d.data() as { organizationId?: string; organizationName?: string }
            const id = data.organizationId || d.id
            const farmSnapshot = await getDocs(rootCollection(
              firestore, 'organizations', id, 'farms',
            ))
            return farmSnapshot.docs.flatMap((farmDocument) => {
              const farm = farmDocument.data() as {
                farmId?: string
                farmCode?: string
                farmName?: string
                status?: string
              }
              const farmId = farm.farmId || farmDocument.id
              if (farm.status !== 'ACTIVE') return []
              return [{
                organizationId: id,
                farmId,
                label: `${data.organizationName ?? id} · ${farm.farmCode ?? farmId} · ${farm.farmName ?? ''}`,
              }]
            })
          }))
        setFarms(
          farmGroups.flat().sort((left, right) => left.label.localeCompare(right.label, 'th')),
        )
      } catch (err) {
        setRequestError(`โหลดรายการสวนไม่สำเร็จ: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    void fetchFarms()
  }, [firestore])

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
      role: request.assignedRole ?? profileRole ?? 'WORKER',
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
      await updateFirebaseUserAccess({
        uid: editingUser.uid,
        organizationId: farm.organizationId,
        farmId: farm.farmId,
        role: editSelection.role,
      })
      setEditingUser(undefined)
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'แก้ไขสิทธิ์ผู้ใช้ไม่สำเร็จ')
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

  return (
    <div className="admin-container" style={{ padding: '1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1b4332' }}>จัดการผู้ใช้งาน (MasterAdmin)</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#666', fontSize: '0.9rem' }}>
            ทั้งหมด {users.length} รายการ (แสดงผล {displayedUsers.length} รายการ)
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

      <section style={{ marginBottom: '1.25rem' }} aria-labelledby="pending-access-title">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
          <h2 id="pending-access-title" style={{ margin: '0 0 0.75rem' }}>คำขอเข้าใช้งานที่รอดำเนินการ</h2>
          <strong>{pendingRequests.length} คำขอ</strong>
        </div>
        {requestError ? <p className="form-error" role="alert">{requestError}</p> : null}
        {pendingRequests.length === 0 ? (
          <div className="empty-state"><p>ยังไม่มีคำขอสถานะ Pending</p></div>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {pendingRequests.map((request) => {
              const selection = selectionFor(request.uid)
              return (
                <article key={request.requestId} style={{ background: '#fff', border: '1px solid #dbe4dc', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <strong>{request.displayName}</strong>
                      <div>{request.email || request.maskedPhone || request.uid}</div>
                      <small>{request.providerIds.join(', ')} · Pending</small>
                    </div>
                    <div style={{ display: 'grid', gap: '0.5rem', minWidth: 'min(100%, 320px)' }}>
                      <label>
                        สวน
                        <select
                          value={selection.farmKey}
                          onChange={(event) => updateRequestSelection(request.uid, { farmKey: event.target.value })}
                        >
                          <option value="">เลือกสวน</option>
                          {farms.map((farm) => (
                            <option key={`${farm.organizationId}/${farm.farmId}`} value={`${farm.organizationId}/${farm.farmId}`}>
                              {farm.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        สิทธิ์ในสวน
                        <select
                          value={selection.role}
                          onChange={(event) => updateRequestSelection(request.uid, { role: event.target.value as CanonicalRole })}
                        >
                          {canonicalRoles.map((role) => <option key={role} value={role}>{role}</option>)}
                        </select>
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="primary-action"
                          disabled={requestBusy === request.uid || !selection.farmKey}
                          onClick={() => void approveRequest(request)}
                          type="button"
                        >
                          อนุมัติและ Assign สวน
                        </button>
                        <button
                          className="secondary-action"
                          disabled={requestBusy === request.uid}
                          onClick={() => void rejectRequest(request)}
                          type="button"
                        >
                          ปฏิเสธ
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

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
                  role: event.target.value as CanonicalRole,
                }))}
              >
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

      {hasDuplicateEmails && !hideDuplicates && (
        <div style={{ background: '#fffbeb', border: '1px solid #fef08a', borderRadius: '6px', padding: '0.6rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#854d0e' }}>
          💡 <strong>ข้อสังเกต:</strong> พบรายการที่มีอีเมลเดียวกันมากกว่า 1 แถว เนื่องจากระบบมีเอกสารเดิม (เช่น ตอนสมัครสมาชิกที่ตำแหน่งระบุว่า &quot;รอผู้ดูแลอนุมัติ&quot;) และเอกสารใหม่ (เช่น ตอนเริ่มต้นระบบระบุตำแหน่งเป็น &quot;ผู้ดูแลระบบ&quot;) ในฐานข้อมูล Firestore — ท่านสามารถกดปุ่ม <strong>&quot;ลบ&quot;</strong> ที่แถวที่ไม่ต้องการ เพื่อลบเอกสารซ้ำซ้อนออกจากฐานข้อมูลได้โดยตรง
        </div>
      )}

      <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
              <th style={{ padding: '8px 12px', width: '44px', textAlign: 'center' }}>รูป</th>
              <th style={{ padding: '8px 12px' }}>ชื่อ-นามสกุล / อีเมล</th>
              <th style={{ padding: '8px 12px' }}>ตำแหน่ง</th>
              <th style={{ padding: '8px 12px', width: '120px' }}>สถานะ</th>
              <th style={{ padding: '8px 12px', width: '160px' }}>สิทธิ์ (Roles)</th>
              <th style={{ padding: '8px 12px', minWidth: '180px' }}>โครงการ/สวนที่รับผิดชอบ</th>
              <th style={{ padding: '8px 12px', width: '150px', textAlign: 'center' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {displayedUsers.map(u => {
              const emailKey = (u.email || '').toLowerCase().trim()
              const isDuplicate = emailKey && (emailCounts[emailKey] || 0) > 1

              return (
                <tr
                  key={u.docId}
                  style={{
                    backgroundColor: isDuplicate && !hideDuplicates ? '#fffdf7' : undefined,
                    borderBottom: '1px solid #f1f5f9',
                    height: '42px',
                  }}
                >
                  <td style={{ padding: '4px 8px', textAlign: 'center', verticalAlign: 'middle' }}>
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
                  <td style={{ padding: '4px 12px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    <strong style={{ color: '#1e293b' }}>{u.firstName} {u.lastName}</strong>
                    <span style={{ color: '#64748b', fontSize: '0.82rem', marginLeft: '6px' }}>({u.email})</span>
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
                  <td style={{ padding: '4px 12px', verticalAlign: 'middle', whiteSpace: 'nowrap', color: '#334155' }}>
                    {u.position || '-'}
                  </td>
                  <td style={{ padding: '4px 8px', verticalAlign: 'middle' }}>
                    {u.status === 'pending' ? 'รออนุมัติ' : u.status === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธ'}
                  </td>
                  <td style={{ padding: '4px 8px', verticalAlign: 'middle' }}>
                    {u.role?.join(', ') || 'ยังไม่กำหนด'}
                  </td>
                  <td style={{ padding: '4px 8px', verticalAlign: 'middle' }}>
                    {u.assignedProjects?.length ? u.assignedProjects.join(', ') : 'ยังไม่ได้ Assign สวน'}
                  </td>
                  <td style={{ padding: '4px 8px', verticalAlign: 'middle', textAlign: 'center' }}>
                    {!u.role?.includes('MasterAdmin') && u.status === 'approved' ? (
                      <button
                        className="secondary-action"
                        disabled={requestBusy === u.uid}
                        onClick={() => startEditing(u)}
                        style={{ fontSize: '0.78rem', marginRight: '0.35rem', padding: '2px 8px' }}
                        type="button"
                      >
                        แก้ไขสิทธิ์
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void deleteUser(u.docId, `${u.firstName} ${u.lastName}`)}
                      style={{
                        padding: '2px 8px',
                        fontSize: '0.78rem',
                        background: '#fff1f2',
                        color: '#e11d48',
                        border: '1px solid #fecdd3',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        lineHeight: '1.4',
                      }}
                      title="ลบรายการนี้ออกจากระบบ"
                    >
                      ลบ
                    </button>
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
