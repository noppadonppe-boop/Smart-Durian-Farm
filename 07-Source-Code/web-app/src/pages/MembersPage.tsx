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
  const [loadedFarmId, setLoadedFarmId] = useState<string>()
  const [message, setMessage] = useState<string>()
  const [error, setError] = useState<string>()

  const canManage = currentFarm ? permissionsFor(currentFarm).canManageMemberships : false

  useEffect(() => {
    let active = true
    void listFarmMembers()
      .then((nextMembers) => {
        if (active) {
          setMembers(nextMembers)
          setLoadedFarmId(currentFarm?.farmId)
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'อ่านสมาชิกไม่สำเร็จ')
      })
    return () => {
      active = false
    }
  }, [currentFarm?.farmId, listFarmMembers])

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
      setMembers(await listFarmMembers())
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'บันทึกสิทธิ์ไม่สำเร็จ')
    }
  }

  const loading = loadedFarmId !== currentFarm.farmId

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
      {loading ? (
        <p>กำลังอ่านสมาชิก…</p>
      ) : (
        <div className="member-grid">
          {members.map((member) => (
            <MemberEditor
              currentUserId={identity.userId}
              key={member.userId}
              member={member}
              onSave={saveMember}
            />
          ))}
        </div>
      )}
    </section>
  )
}
