import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
import {
  careTypeLabels,
  type CareEventRecord,
  type SpecialistApprovalStatus,
} from '../domain/workCareDisease'
import type { TreePositionSummary } from '../domain/treeRegister'
import { PageHeader } from './PageHeader'

type CareFilter = SpecialistApprovalStatus | 'ALL'

const filterLabels: Record<CareFilter, string> = {
  ALL: 'ทั้งหมด',
  PENDING_SPECIALIST: 'รอ Agronomist',
  APPROVED: 'อนุมัติแล้ว',
  NOT_REQUIRED: 'ไม่ต้องอนุมัติ',
}

export function CarePage() {
  const { currentFarm, listCareEvents, listTreePositions, approveCareEvent, mode } = usePhase2()
  const isProduction = mode === 'firebase-live' && !currentFarm?.isMock
  const [events, setEvents] = useState<readonly CareEventRecord[]>([])
  const [trees, setTrees] = useState<readonly TreePositionSummary[]>([])
  const [filter, setFilter] = useState<CareFilter>('ALL')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string>()
  const [error, setError] = useState<string>()
  const [message, setMessage] = useState<string>()

  const reload = useCallback(async () => {
    const [nextEvents, nextTrees] = await Promise.all([listCareEvents(), listTreePositions()])
    setEvents(nextEvents)
    setTrees(nextTrees)
  }, [listCareEvents, listTreePositions])

  useEffect(() => {
    let active = true
    queueMicrotask(() => {
      if (!active) return
      setLoading(true)
      setError(undefined)
      void reload()
        .catch((cause: unknown) => {
          if (active) setError(cause instanceof Error ? cause.message : 'โหลด Care Events ไม่สำเร็จ')
        })
        .finally(() => { if (active) setLoading(false) })
    })
    return () => { active = false }
  }, [currentFarm?.farmId, reload])

  const visible = filter === 'ALL'
    ? events
    : events.filter((event) => event.approvalStatus === filter)
  const treeByPosition = useMemo(
    () => new Map(trees.map((tree) => [tree.positionId, tree])),
    [trees],
  )

  const approve = async (event: CareEventRecord) => {
    setBusyId(event.careEventId)
    setError(undefined)
    setMessage(undefined)
    try {
      await approveCareEvent(event.careEventId, crypto.randomUUID())
      await reload()
      setMessage(isProduction ? 'Agronomist อนุมัติ treatment แล้ว' : 'Agronomist อนุมัติ treatment จำลองแล้ว')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'อนุมัติไม่สำเร็จ')
    } finally {
      setBusyId(undefined)
    }
  }

  return <section className="page-stack">
    <PageHeader
      eyebrow="Phase 4 · Care history"
      title="Care Events"
      description="สร้างจาก Work Order ที่ตรวจรับแล้ว; chemical คง Pending Specialist จน Agronomist อนุมัติ"
    />

    <div className="work-filter" aria-label="กรอง Care Event">
      {(Object.keys(filterLabels) as CareFilter[]).map((value) => <button
        aria-pressed={filter === value}
        className={filter === value ? 'status-filter status-filter--active' : 'status-filter'}
        key={value}
        onClick={() => setFilter(value)}
        type="button"
      >{filterLabels[value]}</button>)}
    </div>

    {loading ? <div className="loading-inline" role="status">กำลังอ่าน Care Events…</div> : null}
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    {message ? <p className="success-notice" role="status">{message}</p> : null}
    {!loading && !error ? <p className="result-count">{visible.length} เหตุการณ์ · {currentFarm?.farmCode} · {isProduction ? 'Firebase Production' : 'ข้อมูลจำลองเท่านั้น'}</p> : null}

    <div className="work-list">
      {visible.map((event) => <article className="work-card" key={event.careEventId}>
        <div className="work-card__heading">
          <span className="status-pill">{filterLabels[event.approvalStatus]}</span>
          <span>v{event.version}</span>
        </div>
        <h2>{careTypeLabels[event.careType]}</h2>
        <p>{event.notes || 'ไม่มีหมายเหตุ'}</p>
        <dl className="work-card__meta">
          <div><dt>ต้นเป้าหมาย</dt><dd>{event.positionIds.map((positionId) => {
            const tree = treeByPosition.get(positionId)
            return tree ? <Link key={positionId} to={`/trees/${positionId}`}>{tree.tagCode}</Link> : <code key={positionId}>{positionId}</code>
          }).reduce<ReactNode[]>((items, item, index) => index === 0 ? [item] : [...items, ', ', item], [])}</dd></div>
          <div><dt>วัสดุจริงตามรายงาน</dt><dd>{event.materials.map((item) => `${item.materialName} ${item.quantity} ${item.unit}`).join(', ') || 'ไม่มีวัสดุ'}</dd></div>
          <div><dt>สร้างเมื่อ</dt><dd>{event.createdAtLabel}</dd></div>
          <div><dt>ผู้อนุมัติ</dt><dd>{event.approvedBy ?? (event.approvalStatus === 'PENDING_SPECIALIST' ? 'รอ Agronomist' : 'ไม่ต้องอนุมัติ')}</dd></div>
        </dl>
        <div className="form-actions">
          <Link className="secondary-action" to={`/work/${event.workOrderId}`}>เปิด Work Order ต้นทาง</Link>
          {currentFarm?.role === 'AGRONOMIST' && event.approvalStatus === 'PENDING_SPECIALIST' ? <button
            className="primary-action"
            disabled={busyId === event.careEventId}
            onClick={() => void approve(event)}
            type="button"
          >{busyId === event.careEventId ? 'กำลังอนุมัติ…' : 'อนุมัติโดย Agronomist'}</button> : null}
        </div>
      </article>)}
      {!loading && !error && visible.length === 0 ? <article className="empty-state">
        <h2>ไม่มี Care Event ในตัวกรองนี้</h2>
        <p>Event จะเกิดหลังตรวจรับ Work Order ประเภทดูแล</p>
      </article> : null}
    </div>
  </section>
}
