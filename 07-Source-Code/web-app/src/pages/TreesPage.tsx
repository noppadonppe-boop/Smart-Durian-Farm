import { PageHeader } from './PageHeader'

export function TreesPage() {
  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Route placeholder"
        title="ต้นไม้"
        description="Tree Register เริ่มใน Phase 3 หลังข้อมูล topology และ Field Validation พร้อม"
      />
      <article className="empty-state">
        <span aria-hidden="true">♧</span>
        <h2>ยังไม่มีทะเบียนต้น</h2>
        <p>Field topology, รหัสสวนจริง และ Tree Survey ยังคงเป็น TBD</p>
      </article>
    </section>
  )
}
