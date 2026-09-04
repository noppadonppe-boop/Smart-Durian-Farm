import { useCallback, useEffect, useState } from 'react'

import { usePhase2 } from '../app/usePhase2'
import { permissionsFor, roleLabels, type MembershipAuditEvent } from '../domain/farm'
import type { FarmExportRecord, OperationalAuditEvent } from '../domain/operationalHardening'
import { PageHeader } from './PageHeader'

const membershipLabels: Record<MembershipAuditEvent['eventType'], string> = {
  ROLE_CHANGED: 'เปลี่ยนบทบาท',
  MEMBERSHIP_REVOKED: 'ยกเลิกสิทธิ์',
  MEMBERSHIP_RESTORED: 'คืนสิทธิ์',
}
const operationalLabels: Record<OperationalAuditEvent['eventType'], string> = {
  OFFLINE_SYNCED: 'ซิงก์รายการ Offline',
  OFFLINE_CONFLICT: 'หยุดรายการเพราะ Conflict',
  CONFLICT_RESOLVED: 'ตัดสิน Master Conflict',
  CONFLICT_ESCALATED: 'ส่ง Conflict ต่อ Owner',
  PHOTO_RECOVERY_REGISTERED: 'ลงทะเบียนกู้คืนรูป',
  PHOTO_RETRIED: 'กู้คืนรูป',
  ORPHAN_CLEANED: 'จัดการ Orphan',
  EXPORT_CREATED: 'สร้าง Export',
}
export function AuditPage() {
  const { currentFarm, listMembershipAudit, listOperationalAudit, requestFarmExport, mode } = usePhase2()
  const isProduction = mode === 'firebase-live' && !currentFarm?.isMock
  const [membershipEvents, setMembershipEvents] = useState<readonly MembershipAuditEvent[]>([])
  const [operationalEvents, setOperationalEvents] = useState<readonly OperationalAuditEvent[]>([])
  const [exportRecord, setExportRecord] = useState<FarmExportRecord>()
  const [error, setError] = useState<string>()
  const [message, setMessage] = useState<string>()
  const canRead = currentFarm ? permissionsFor(currentFarm).canReadAudit : false

  const load = useCallback(async () => {
    const [memberships, operations] = await Promise.all([listMembershipAudit(), listOperationalAudit()])
    setMembershipEvents(memberships)
    setOperationalEvents(operations)
  }, [listMembershipAudit, listOperationalAudit])

  useEffect(() => {
    let active = true
    if (!canRead) return () => undefined
    void Promise.all([listMembershipAudit(), listOperationalAudit()])
      .then(([memberships, operations]) => {
        if (active) {
          setMembershipEvents(memberships)
          setOperationalEvents(operations)
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'อ่าน Audit ไม่สำเร็จ')
      })
    return () => { active = false }
  }, [canRead, currentFarm?.farmId, listMembershipAudit, listOperationalAudit])

  if (!currentFarm || !canRead) return <section className="page-stack">
    <PageHeader eyebrow="Access denied" title="ไม่มีสิทธิ์ดู Audit" description="VIEWER และ WORKER ไม่มีสิทธิ์ Audit หรือ Export โดยอัตโนมัติ" backTo="/more" />
  </section>

  const createExport = () => {
    setError(undefined); setMessage(undefined)
    void requestFarmExport(`export-ui-${crypto.randomUUID()}`)
      .then(async (record) => {
        setExportRecord(record)
        setMessage(`${isProduction ? 'สร้าง Export' : 'สร้าง Export จำลอง'} ${record.rowCount} แถว และบันทึก Audit แล้ว`)
        await load()
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Export ไม่สำเร็จ'))
  }

  return <section className="page-stack audit-page">
    <PageHeader eyebrow="Append-only evidence & export" title="Audit และ Export ตามสิทธิ์" description={`ใครทำอะไร เมื่อใด ใน ${currentFarm.farmCode} · ไม่รวมสวนอื่น`} backTo="/more" />
    {isProduction
      ? <div className="operational-data-banner" role="note"><strong>Firebase Production · Append-only</strong><span>Export มีเฉพาะรหัสและเหตุการณ์ขั้นต่ำ ไม่มีเบอร์โทรหรือข้อมูลลูกค้า</span></div>
      : <div className="field-validation-banner" role="note"><strong>SIMULATED/TEST ONLY</strong><span>Export มีเฉพาะรหัสและเหตุการณ์ขั้นต่ำ ไม่มีเบอร์โทรหรือข้อมูลลูกค้า</span></div>}
    {error ? <div className="form-error" role="alert">{error}</div> : null}
    {message ? <div className="success-notice" role="status">{message}</div> : null}

    <section className="operational-panel"><div className="section-heading"><div><span className="status-pill">Farm-scoped CSV</span><h2>ส่งออก Audit ขั้นต่ำ</h2></div><button className="primary-action" type="button" onClick={createExport}>สร้าง Export พร้อม Audit</button></div>
      <p>CSV ป้องกัน Spreadsheet formula injection และไม่มี public link</p>
      {exportRecord ? <a className="secondary-action" download={`${currentFarm.farmCode}-audit.csv`} href={`data:text/csv;charset=utf-8,${encodeURIComponent(exportRecord.csvText)}`}>{isProduction ? 'ดาวน์โหลด CSV' : 'ดาวน์โหลด CSV จำลอง'} {exportRecord.rowCount} แถว</a> : null}
    </section>

    <section className="operational-panel"><div className="section-heading"><div><span className="status-pill">Operational</span><h2>Offline, Conflict, Photo และ Export</h2></div></div>
      {operationalEvents.length === 0 ? <p>ยังไม่มี Operational Audit</p> : <ol className="audit-list operational-audit-list">{operationalEvents.map((event) => <li key={event.eventId}>
        <span>{operationalLabels[event.eventType]}</span><h3>{event.targetType} · {event.targetId}</h3>
        <p>{event.beforeSummary} → {event.afterSummary}</p><small>actor {event.actorUserId} · {event.createdAtLabel}</small><code>{event.eventId}</code>
      </li>)}</ol>}
    </section>

    <section className="operational-panel"><div className="section-heading"><div><span className="status-pill">Membership</span><h2>การเปลี่ยนสิทธิ์</h2></div></div>
      {membershipEvents.length === 0 ? <p>ยังไม่มีการเปลี่ยน Membership ในรอบนี้</p> : <ol className="audit-list">{membershipEvents.map((event) => <li key={event.auditEventId}>
        <span>{membershipLabels[event.eventType]}</span><h3>{event.targetDisplayName}</h3>
        <p>{roleLabels[event.beforeRole]} → {roleLabels[event.afterRole]} · {event.beforeStatus} → {event.afterStatus}</p>
        <small>โดย {event.actorDisplayName} · {event.createdAtLabel}</small><code>{event.auditEventId}</code>
      </li>)}</ol>}
    </section>
  </section>
}
