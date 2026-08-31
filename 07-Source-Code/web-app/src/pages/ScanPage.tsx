import { PageHeader } from './PageHeader'

export function ScanPage() {
  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Route placeholder"
        title="สแกน"
        description="QR camera และ resolver จริงอยู่ใน Phase 3 หลัง Field Validation Gate"
      />
      <article className="scan-shell">
        <div className="scan-frame" aria-hidden="true">
          <span>⌗</span>
        </div>
        <h2>Scan shell พร้อม</h2>
        <p>
          Permanent route ที่อนุมัติคือ <code>/t/{'{opaquePositionId}'}</code>
        </p>
        <button type="button" disabled>
          กล้อง QR — ยังไม่เปิดใช้ใน Phase 1
        </button>
      </article>
    </section>
  )
}
