import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
import { FarmProfileForm } from '../components/FarmProfileForm'
import {
  farmStatusLabels,
  type FarmArchiveReadiness,
  type FarmAuditEvent,
  type FarmProfile,
  type FarmProfileDraft,
  type FarmStatus,
} from '../domain/farm'
import { PageHeader } from './PageHeader'

interface StatusRequest {
  nextStatus: FarmStatus
  idempotencyKey: string
}
const farmAuditLabels: Record<FarmAuditEvent['eventType'], string> = {
  FARM_CREATED: 'เพิ่มสวน',
  FARM_PROFILE_UPDATED: 'แก้ไขข้อมูลสวน',
  FARM_SUSPENDED: 'ระงับสวน',
  FARM_REACTIVATED: 'เปิดใช้งานสวนใหม่',
  FARM_ARCHIVED: 'เก็บถาวรสวน',
}
export function FarmProfilePage() {
  const { farmId } = useParams()
  const location = useLocation()
  const {
    currentFarm,
    farms,
    getFarmProfile,
    updateFarmProfile,
    getFarmArchiveReadiness,
    changeFarmStatus,
    listFarmAudit,
  } = usePhase2()
  const [profile, setProfile] = useState<FarmProfile>()
  const [audit, setAudit] = useState<readonly FarmAuditEvent[]>([])
  const [readiness, setReadiness] = useState<FarmArchiveReadiness>()
  const [statusRequest, setStatusRequest] = useState<StatusRequest>()
  const [updateKey, setUpdateKey] = useState(() => `farm-update-${crypto.randomUUID()}`)
  const [notice, setNotice] = useState<string | undefined>(() => {
    const state = location.state as { notice?: unknown } | null
    return typeof state?.notice === 'string' ? state.notice : undefined
  })
  const [error, setError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)

  const isOwner = currentFarm?.isOrganizationOwner === true
  const hasMembership = farms.some((farm) => farm.farmId === farmId)
  const canAttemptRead = Boolean(farmId && (isOwner || hasMembership))

  useEffect(() => {
    if (!farmId || !canAttemptRead) return
    let active = true
    void Promise.all([
      getFarmProfile(farmId),
      isOwner ? listFarmAudit(farmId) : Promise.resolve([]),
    ]).then(([nextProfile, nextAudit]) => {
      if (!active) return
      setProfile(nextProfile)
      setAudit(nextAudit)
    }).catch((loadError: unknown) => {
      if (active) {
        setError(loadError instanceof Error ? loadError.message : 'อ่าน Farm Profile ไม่สำเร็จ')
      }
    })
    return () => {
      active = false
    }
  }, [canAttemptRead, farmId, getFarmProfile, isOwner, listFarmAudit])

  if (!currentFarm || !farmId) return null
  if (!canAttemptRead) {
    return (
      <section className="page-stack">
        <PageHeader
          eyebrow="Cross-Farm denied"
          title="ไม่มีสิทธิ์เปิด Farm Profile นี้"
          description="ไม่มีข้อมูลจากสวนเป้าหมายถูกโหลด เพราะบัญชีนี้ไม่มี membership" backTo="/more"
        />
        <Link className="primary-action action-link" to="/more">กลับเมนูเพิ่มเติม</Link>
      </section>
    )
  }
  if (!profile) {
    return (
      <section className="page-stack">
        <PageHeader eyebrow="Farm Profile" title="กำลังอ่านข้อมูลสวน" description="ตรวจ membership และ Farm scope ก่อนแสดงข้อมูล" backTo="/more" />
        {error ? <p className="form-error" role="alert">{error}</p> : null}
      </section>
    )
  }

  const saveProfile = async (draft: FarmProfileDraft) => {
    setSubmitting(true)
    setError(undefined)
    try {
      const result = await updateFarmProfile(profile.farmId, updateKey, draft)
      setProfile(result.profile)
      setNotice(result.wasRetry ? 'Retry เดิมสำเร็จโดยไม่สร้าง Audit ซ้ำ' : 'บันทึก Farm Profile และ Audit before/after แล้ว')
      setUpdateKey(`farm-update-${crypto.randomUUID()}`)
      setAudit(await listFarmAudit(profile.farmId))
    } finally {
      setSubmitting(false)
    }
  }

  const prepareStatus = async (nextStatus: FarmStatus) => {
    setError(undefined)
    setNotice(undefined)
    setStatusRequest({
      nextStatus,
      idempotencyKey: `farm-status-${crypto.randomUUID()}`,
    })
    if (nextStatus === 'ARCHIVED') {
      try {
        setReadiness(await getFarmArchiveReadiness(profile.farmId))
      } catch (readinessError) {
        setError(readinessError instanceof Error ? readinessError.message : 'ตรวจ Archive blocker ไม่สำเร็จ')
      }
    } else {
      setReadiness(undefined)
    }
  }

  const confirmStatus = async () => {
    if (!statusRequest) return
    setSubmitting(true)
    setError(undefined)
    try {
      const result = await changeFarmStatus(
        profile.farmId,
        statusRequest.idempotencyKey,
        statusRequest.nextStatus,
      )
      setProfile(result.profile)
      setNotice(`เปลี่ยนสถานะเป็น “${farmStatusLabels[result.profile.status]}” และสร้าง Audit แล้ว`)
      setStatusRequest(undefined)
      setReadiness(undefined)
      setAudit(await listFarmAudit(profile.farmId))
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'เปลี่ยนสถานะสวนไม่สำเร็จ')
    } finally {
      setSubmitting(false)
    }
  }

  const profileDraft: FarmProfileDraft = {
    farmName: profile.farmName,
    farmSequence: profile.farmSequence,
    province: profile.province,
    district: profile.district,
    subdistrict: profile.subdistrict,
    locationNote: profile.locationNote,
    timezone: profile.timezone,
    seasonStartMonth: profile.seasonStartMonth,
    seasonEndMonth: profile.seasonEndMonth,
    seasonNote: profile.seasonNote,
    notes: profile.notes,
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Farm Profile"
        title={profile.farmName}
        description={`${profile.farmCode} · เวอร์ชัน ${profile.version} · ${farmStatusLabels[profile.status]}`}
        action={isOwner ? <Link className="secondary-action action-link" to="/farm-management">รายการสวน</Link> : undefined}
      />
      <div className="operational-data-banner" role="status">Firebase Production · Operational Farm Profile</div>
      {notice ? <p className="success-message" role="status">{notice}</p> : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <FarmProfileForm
        key={`${profile.farmId}:${profile.version}:${isOwner ? 'owner' : 'reader'}`}
        initialValue={profileDraft}
        mode={isOwner ? 'EDIT' : 'READ_ONLY'}
        onSubmit={isOwner ? saveProfile : undefined}
        organizationCode={currentFarm.organizationCode}
        submitting={submitting}
      />

      {isOwner ? (
        <section className="farm-lifecycle-panel" aria-labelledby="farm-lifecycle-title">
          <div>
            <span className={`farm-status farm-status--${profile.status.toLowerCase()}`}>
              {farmStatusLabels[profile.status]}
            </span>
            <h2 id="farm-lifecycle-title">สถานะและการรักษาประวัติ</h2>
            <p>การระงับไม่ปิดงานเดิมอัตโนมัติ และสวนที่เก็บถาวรแล้วเปิดกลับไม่ได้</p>
          </div>
          {!statusRequest && profile.status === 'ACTIVE' ? (
            <div className="dialog-actions">
              <button className="secondary-action" onClick={() => void prepareStatus('SUSPENDED')} type="button">ระงับสวน</button>
              <button className="secondary-action" onClick={() => void prepareStatus('ARCHIVED')} type="button">ตรวจรายการก่อนเก็บถาวร</button>
            </div>
          ) : null}
          {!statusRequest && profile.status === 'SUSPENDED' ? (
            <div className="dialog-actions">
              <button className="primary-action" onClick={() => void prepareStatus('ACTIVE')} type="button">เปิดใช้งานสวนใหม่</button>
              <button className="secondary-action" onClick={() => void prepareStatus('ARCHIVED')} type="button">ตรวจรายการก่อนเก็บถาวร</button>
            </div>
          ) : null}
          {profile.status === 'ARCHIVED' ? (
            <p className="read-only-note">เก็บถาวรแล้ว · อ่านประวัติได้ แต่ไม่อนุญาตเขียนหรือเปิดกลับมาใช้งาน</p>
          ) : null}

          {statusRequest ? (
            <div className="farm-status-confirmation" role="region" aria-label="ยืนยันเปลี่ยนสถานะสวน">
              {statusRequest.nextStatus === 'ARCHIVED' ? (
                <>
                  <h3>ตรวจผลกระทบก่อนเก็บถาวร</h3>
                  <p>
                    งานเปิด {readiness?.openWorkOrders.length ?? 'กำลังตรวจ'} รายการ · Pending {readiness?.pendingOperations.length ?? 'กำลังตรวจ'} รายการ
                  </p>
                  {readiness?.openWorkOrders.map((item) => (
                    <p key={item.recordId}><code>{item.recordId}</code> · {item.label} · {item.status}</p>
                  ))}
                  {readiness?.pendingOperations.map((item) => (
                    <p key={item.recordId}><code>{item.recordId}</code> · {item.label} · {item.status}</p>
                  ))}
                </>
              ) : (
                <>
                  <h3>{statusRequest.nextStatus === 'SUSPENDED' ? 'ยืนยันระงับสวน' : 'ยืนยันเปิดใช้งานสวนใหม่'}</h3>
                  <p>{statusRequest.nextStatus === 'SUSPENDED' ? 'ข้อมูลเดิมยังอ่านได้ แต่งานและข้อมูลปฏิบัติการจะเขียนไม่ได้' : 'การเขียนข้อมูลปฏิบัติการจะกลับมาใช้ได้ตามบทบาท'}</p>
                </>
              )}
              <div className="dialog-actions">
                <button
                  className="primary-action"
                  disabled={submitting || (statusRequest.nextStatus === 'ARCHIVED' && readiness?.canArchive !== true)}
                  onClick={() => void confirmStatus()}
                  type="button"
                >
                  {statusRequest.nextStatus === 'ARCHIVED' ? 'ยืนยันเก็บถาวร' : statusRequest.nextStatus === 'SUSPENDED' ? 'ยืนยันระงับสวน' : 'ยืนยันเปิดใช้งาน'}
                </button>
                <button className="secondary-action" disabled={submitting} onClick={() => {
                  setStatusRequest(undefined)
                  setReadiness(undefined)
                }} type="button">ยกเลิก</button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {isOwner ? (
        <section className="farm-audit-list" aria-labelledby="farm-audit-title">
          <h2 id="farm-audit-title">ประวัติ Farm Management</h2>
          {audit.map((event) => (
            <article key={event.auditEventId}>
              <strong>{farmAuditLabels[event.eventType]}</strong>
              <span>{event.createdAtLabel} · เวอร์ชัน {event.farmVersion}</span>
              <code>{event.auditEventId}</code>
            </article>
          ))}
        </section>
      ) : null}
    </section>
  )
}
