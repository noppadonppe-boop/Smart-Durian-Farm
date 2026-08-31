import { useParams } from 'react-router-dom'

import { PageHeader } from './PageHeader'

export function QrRoutePage() {
  const { positionId } = useParams()

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Permanent route shell"
        title="ตำแหน่งจาก QR"
        description="Foundation route เท่านั้น ระบบยังไม่ resolve ข้อมูลต้นหรือ authorization"
      />
      <article className="empty-state">
        <span aria-hidden="true">⌗</span>
        <h2>Opaque position identifier</h2>
        <code>{positionId ?? 'TBD'}</code>
        <p>ข้อมูลนี้ไม่ใช่หลักฐานสิทธิ์และไม่มีการร้องขอ backend ใน Phase 1</p>
      </article>
    </section>
  )
}
