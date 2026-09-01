import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
import type { InAppNotification } from '../domain/workCareDisease'
import { PageHeader } from './PageHeader'

const notificationKindLabels: Record<InAppNotification['kind'], string> = {
  URGENT_WORK: 'งานเร่งด่วน',
  REWORK: 'งานที่ต้องแก้',
  DISEASE_FOLLOW_UP: 'ติดตามอาการ',
}

export function NotificationsPage() {
  const { currentFarm, listNotifications } = usePhase2()
  const [items, setItems] = useState<readonly InAppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    queueMicrotask(() => {
      if (!active) return
      setLoading(true)
      setError(undefined)
      void listNotifications()
        .then((nextItems) => { if (active) setItems(nextItems) })
        .catch((cause: unknown) => {
          if (active) setError(cause instanceof Error ? cause.message : 'โหลดคิวติดตามไม่สำเร็จ')
        })
        .finally(() => { if (active) setLoading(false) })
    })
    return () => { active = false }
  }, [currentFarm?.farmId, listNotifications])

  return <section className="page-stack">
    <PageHeader
      eyebrow="Phase 4 · In-app only"
      title="คิวเร่งด่วนและติดตาม"
      description="ไม่มี SMS จริง ไม่มี push ภายนอก และเปิดกลับไปยัง record ในสวนปัจจุบันเท่านั้น"
    />
    {loading ? <div className="loading-inline" role="status">กำลังจัดคิวรายการที่ต้องติดตาม…</div> : null}
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    {!loading && !error ? <p className="result-count">{items.length} รายการ · {currentFarm?.farmCode} · In-app เท่านั้น</p> : null}
    <div className="work-list">
      {items.map((item) => <Link className="work-card notification-card" key={item.notificationId} to={item.targetPath}>
        <div className="work-card__heading">
          <span className="work-priority work-priority--urgent">{notificationKindLabels[item.kind]}</span>
          <span className="status-pill">เปิด record ›</span>
        </div>
        <h2>{item.title}</h2>
        <p>{item.description}</p>
      </Link>)}
      {!loading && !error && items.length === 0 ? <article className="empty-state">
        <h2>ไม่มีรายการเร่งด่วน</h2>
        <p>คิวนี้คำนวณจาก Work Order และ Disease Incident ในสวนปัจจุบัน</p>
      </article> : null}
    </div>
  </section>
}
