import { useEffect, useState } from 'react'

import { usePhase2 } from '../app/usePhase2'
import {
  canonicalRoles,
  permissionsFor,
  roleLabels,
  type CanonicalRole,
  type FarmMember,
  type MembershipStatus,
} from '../domain/farm'
import { PageHeader } from './PageHeader'

function MemberEditor({
  member,
  currentUserId,
  onSave,
}: {
  member: FarmMember
  currentUserId: string
  onSave: (
    userId: string,
    role: CanonicalRole,
    status: MembershipStatus,
  ) => Promise<void>
}) {
  const [role, setRole] = useState(member.role)
  const [saving, setSaving] = useState(false)
  const isCurrentUser = member.userId === currentUserId
  const selectableRoles = canonicalRoles.filter(
    (candidate) => candidate !== 'ORG_OWNER' || member.role === 'ORG_OWNER',
  )

  const save = async (status: MembershipStatus) => {
    setSaving(true)
    try {
      await onSave(member.userId, role, status)
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className="member-card">
      <header>
        <div>
          <h2>{member.displayName}</h2>
          <span>{member.maskedPhone}</span>
        </div>
        <span className={`membership-status membership-status--${member.status.toLowerCase()}`}>
          {member.status === 'ACTIVE' ? 'ใช้งาน' : 'ยกเลิกสิทธิ์'}
        </span>
      </header>
      <label htmlFor={`role-${member.userId}`}>บทบาทในสวน</label>
      <select
        disabled={saving || isCurrentUser || member.status === 'REVOKED'}
        id={`role-${member.userId}`}
        onChange={(event) => setRole(event.target.value as CanonicalRole)}
        value={role}
      >
        {selectableRoles.map((candidate) => (
          <option key={candidate} value={candidate}>
            {roleLabels[candidate]} · {candidate}
          </option>
        ))}
      </select>
      {isCurrentUser ? (
        <p>ป้องกันการแก้สิทธิ์ของบัญชีที่กำลังใช้งานในรอบนี้</p>
      ) : (
        <div className="member-card__actions">
          {member.status === 'ACTIVE' ? (
            <>
              <button
                className="secondary-action"
                disabled={saving || role === member.role}
                onClick={() => void save('ACTIVE')}
                type="button"
              >
                บันทึกบทบาท
              </button>
              <button
                className="danger-action"
                disabled={saving}
                onClick={() => void save('REVOKED')}
                type="button"
              >
                ยกเลิกสิทธิ์
              </button>
            </>
          ) : (
            <button
              className="primary-action"
              disabled={saving}
              onClick={() => void save('ACTIVE')}
              type="button"
            >
              คืนสิทธิ์สมาชิก
            </button>
          )}
        </div>
      )}
    </article>
  )
}
export function MembersPage() {
  const {
    identity,
    currentFarm,
    listFarmMembers,
    changeFarmMembership,
  } = usePhase2()
  const [members, setMembers] = useState<readonly FarmMember[]>([])
  const [loadedScope, setLoadedScope] = useState<string>()
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [updatedAt, setUpdatedAt] = useState<Date>()
  const [message, setMessage] = useState<string>()
  const [error, setError] = useState<string>()

  const canManage = currentFarm ? permissionsFor(currentFarm).canManageMemberships : false
  const scope = `${identity?.userId}/${currentFarm?.organizationId}/${currentFarm?.farmId}`

  useEffect(() => {
    if (!identity || !currentFarm || !canManage) return
    let active = true
    let inFlight = false
    const refresh = () => {
      if (inFlight) return
      inFlight = true
      void listFarmMembers()
      .then((nextMembers) => {
        if (active) {
          setMembers(nextMembers)
          setLoadedScope(scope)
          setUpdatedAt(new Date())
          setError(undefined)
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'อ่านสมาชิกไม่สำเร็จ')
      })
      .finally(() => { inFlight = false })
    }
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    refresh()
    const interval = window.setInterval(refreshWhenVisible, 30_000)
    window.addEventListener('focus', refreshWhenVisible)
    window.addEventListener('online', refreshWhenVisible)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    return () => {
      active = false
      window.clearInterval(interval)
      window.removeEventListener('focus', refreshWhenVisible)
      window.removeEventListener('online', refreshWhenVisible)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [identity, currentFarm, canManage, scope, listFarmMembers, refreshVersion])

  if (!identity || !currentFarm || !canManage) {
    return (
      <section className="page-stack">
        <PageHeader
          eyebrow="Least privilege"
          title="ไม่มีสิทธิ์จัดการสมาชิก"
          description="Phase 2 ให้เฉพาะเจ้าขององค์กรจัดการสมาชิกจนกว่านโยบาย FARM_MANAGER จะอนุมัติ" backTo="/more"
        />
        <article className="empty-state access-denied-state">
          <span aria-hidden="true">!</span>
          <h2>ปุ่มผู้ดูแลถูกซ่อนตามบทบาท</h2>
          <p>ระบบไม่ได้เชื่อถือ role ที่ส่งมาจากหน้าจอ และ Security Rules ตรวจซ้ำอีกชั้น</p>
        </article>
      </section>
    )
  }

  const saveMember = async (
    targetUserId: string,
    nextRole: CanonicalRole,
    nextStatus: MembershipStatus,
  ) => {
    setMessage(undefined)
    setError(undefined)
    try {
      const event = await changeFarmMembership({ targetUserId, nextRole, nextStatus })
      setMessage(`บันทึกแล้ว · Audit ${event.eventType} · Version ${event.membershipVersion}`)
      setRefreshVersion((version) => version + 1)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'บันทึกสิทธิ์ไม่สำเร็จ')
    }
  }

  const loading = loadedScope !== scope

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Organization owner only"
        title="สมาชิกและสิทธิ์"
        description={`จัดการบทบาทเฉพาะ ${currentFarm.farmCode} ทุกการเปลี่ยนสร้าง Audit Event`} backTo="/more"
      />
      <div className="scope-lock" role="status">
        ขอบเขตถูกล็อกที่ {currentFarm.farmName} · ไม่สามารถย้ายสมาชิกหรือข้อมูลข้ามสวน
      </div>
      {message ? <div className="success-notice" role="status">{message}</div> : null}
      {error ? <div className="form-error" role="alert">{error}</div> : null}
      <div className="member-directory-status">
        <p role="status">
          {loading ? 'กำลังอ่านรายชื่อจากเซิร์ฟเวอร์…' : `สมาชิกทั้งหมด ${members.length} คน · ใช้งาน ${members.filter((member) => member.status === 'ACTIVE').length} คน · ยกเลิกสิทธิ์ ${members.filter((member) => member.status === 'REVOKED').length} คน`}
          {error ? ' · อัปเดตไม่สำเร็จ ข้อมูลอาจไม่เป็นปัจจุบัน กรุณาลองใหม่'
            : !loading && updatedAt ? ` · อัปเดตล่าสุด ${updatedAt.toLocaleTimeString('th-TH')}` : ''}
        </p>
        <button className="secondary-action" type="button" onClick={() => {
          setLoadedScope(undefined)
          setError(undefined)
          setRefreshVersion((version) => version + 1)
        }}>อัปเดตสมาชิก</button>
      </div>
      {loading ? (
        <p>กำลังอ่านสมาชิก…</p>
      ) : (
        <div className="member-grid">
          {members.map((member) => (
            <MemberEditor
              currentUserId={identity.userId}
              key={`${scope}/${member.userId}/${member.version}`}
              member={member}
              onSave={saveMember}
            />
          ))}
        </div>
      )}
    </section>
  )
}
