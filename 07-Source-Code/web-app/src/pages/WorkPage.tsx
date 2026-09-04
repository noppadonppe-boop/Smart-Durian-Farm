import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
import {
  careTypeLabels,
  workStatusLabels,
  type WorkOrderRecord,
  type WorkOrderStatus,
} from '../domain/workCareDisease'
import { PageHeader } from './PageHeader'

const filters: readonly (WorkOrderStatus | 'ALL')[] = [
  'ALL', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'SUBMITTED', 'REWORK', 'CLOSED',
]

export function WorkPage() {
  const { currentFarm, identity, listWorkOrders, mode } = usePhase2()
  const isProduction = mode === 'firebase-live' && !currentFarm?.isMock
  const [orders, setOrders] = useState<readonly WorkOrderRecord[]>([])
  const [filter, setFilter] = useState<WorkOrderStatus | 'ALL'>('ALL')
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    void Promise.resolve()
      .then(listWorkOrders)
      .then((items) => { if (active) setOrders(items) })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'โหลดรายการงานไม่สำเร็จ')
      })
    return () => { active = false }
  }, [currentFarm?.farmId, listWorkOrders])

  const visible = filter === 'ALL' ? orders : orders.filter((order) => order.status === filter)
  const canCreate = currentFarm?.role === 'ORG_OWNER' || currentFarm?.role === 'FARM_MANAGER' || currentFarm?.role === 'AGRONOMIST'
  const canViewDiseaseAnalysis = canCreate

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Phase 4 · Work Orders"
        title={currentFarm?.role === 'WORKER' ? 'งานของฉัน' : 'งานในสวนปัจจุบัน'}
        description="รับงาน ยืนยันต้น รายงานหลักฐาน และส่งตรวจโดยคง Farm scope ตลอด flow"
      />

      <div className="page-actions">
        {canCreate ? <Link className="primary-action" to="/work/new">{isProduction ? 'สร้างงาน' : 'สร้างงานจำลอง'}</Link> : null}
        <Link className="secondary-action" to="/notifications">คิวเร่งด่วน/ติดตาม</Link>
        <Link className="secondary-action" to="/care">Care Events</Link>
        <Link className="secondary-action" to="/disease">ติดตามโรค</Link>
        {canViewDiseaseAnalysis ? <Link className="secondary-action" to="/disease-analysis-readiness">{isProduction ? 'ศูนย์วิเคราะห์โรค' : 'ศูนย์วิเคราะห์โรคจำลอง'}</Link> : null}
      </div>

      <div className="work-filter" aria-label="กรองสถานะงาน">
        {filters.map((status) => (
          <button
            aria-pressed={filter === status}
            className={filter === status ? 'status-filter status-filter--active' : 'status-filter'}
            key={status}
            onClick={() => setFilter(status)}
            type="button"
          >
            {status === 'ALL' ? 'ทั้งหมด' : workStatusLabels[status]}
          </button>
        ))}
      </div>

      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <p className="result-count">
        {visible.length} งาน · ผู้ใช้ {identity?.displayName ?? 'TBD'} · {isProduction ? 'Firebase Production' : 'ข้อมูลจำลองเท่านั้น'}
      </p>

      <div className="work-list">
        {visible.map((order) => (
          <Link className="work-card" key={order.workOrderId} to={`/work/${order.workOrderId}`}>
            <div className="work-card__heading">
              <span className={`work-priority work-priority--${order.priority.toLowerCase()}`}>
                {order.priority === 'URGENT' ? 'เร่งด่วน' : 'ปกติ'}
              </span>
              <span className={`work-status work-status--${order.status.toLowerCase()}`}>
                {workStatusLabels[order.status]}
              </span>
            </div>
            <h2>{order.title}</h2>
            <p>{order.description}</p>
            <dl className="work-card__meta">
              <div><dt>Target</dt><dd>{order.target.kind} · {order.target.positionIds.length} ต้น</dd></div>
              <div><dt>ประเภท</dt><dd>{order.careType ? careTypeLabels[order.careType] : order.category}</dd></div>
              <div><dt>ครบกำหนด</dt><dd>{order.dueDate}{isProduction ? '' : ' · วันที่จำลอง'}</dd></div>
            </dl>
          </Link>
        ))}
        {visible.length === 0 ? (
          <article className="empty-state">
            <span aria-hidden="true">✓</span>
            <h2>ไม่มีงานในตัวกรองนี้</h2>
            <p>ระบบไม่โหลดงานจากสวนอื่นหรือบทบาทที่ไม่มีสิทธิ์</p>
          </article>
        ) : null}
      </div>
    </section>
  )
}
