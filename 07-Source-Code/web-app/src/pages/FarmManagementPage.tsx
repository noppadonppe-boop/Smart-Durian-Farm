import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
import { farmStatusLabels, type FarmProfile } from '../domain/farm'
import { useAuth } from '../security/AuthContext'
import { PageHeader } from './PageHeader'

import '../components/FarmManagement.css'

export function FarmManagementPage() {
  const { currentFarm, listFarmProfiles, mode } = usePhase2()
  const { isSystemAdmin } = useAuth()
  const isProduction = mode === 'firebase-live' && !currentFarm?.isMock
  const [profiles, setProfiles] = useState<readonly FarmProfile[]>([])
  const [error, setError] = useState<string>()
  const isOwner = currentFarm?.isOrganizationOwner === true
  const canManage = isSystemAdmin || isOwner

  useEffect(() => {
    if (!canManage) return
    let active = true
    void listFarmProfiles()
      .then((result) => {
        if (active) setProfiles(result)
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'อ่านรายการสวนไม่สำเร็จ')
      })
    return () => {
      active = false
    }
  }, [canManage, listFarmProfiles])

  if (!currentFarm) return null
  if (!canManage) {
    return (
      <section className="page-stack">
        <PageHeader
          eyebrow="ORG_OWNER only"
          title="ไม่มีสิทธิ์จัดการสวน"
          description="บทบาทนี้เปิด Farm Profile ของสวนที่มี membership ได้แบบอ่านอย่างเดียว" backTo="/more"
        />
        <Link className="primary-action action-link" to={`/farm-management/${currentFarm.farmId}`}>
          เปิดข้อมูลสวนปัจจุบัน
        </Link>
      </section>
    )
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Organization → Farm Management"
        title="จัดการสวน"
        description="เพิ่ม แก้ไข ระงับ เปิดใช้งานใหม่ และเก็บถาวร โดยรักษาประวัติทุกครั้ง"
        action={<Link className="primary-action action-link" to="/farm-management/new">เพิ่มสวน</Link>}
      />
      {isProduction
        ? <div className="operational-data-banner" role="status">Firebase Production · จัดการ Farm Profile ในองค์กรปัจจุบัน</div>
        : <div className="mock-scope-note" role="status">SIMULATED/TEST ONLY · Farm Profile Mockup 4 สวน · ข้อมูลจำลองเท่านั้น</div>}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="farm-management-list" aria-label="รายการสวนในองค์กร">
        {profiles.map((profile) => (
          <Link key={profile.farmId} to={`/farm-management/${profile.farmId}`}>
            <div>
              <strong>{profile.farmName}</strong>
              <code>{profile.farmCode}</code>
            </div>
            <span className={`farm-status farm-status--${profile.status.toLowerCase()}`}>
              {farmStatusLabels[profile.status]}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
