import { PageHeader } from './PageHeader'

export function WorkPage() {
  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Route placeholder"
        title="งาน"
        description="ตำแหน่งสำหรับ Work Orders ใน Phase 4; รอบนี้แสดงเฉพาะโครงสร้างและสถานะจำลอง"
      />
      <article className="empty-state">
        <span aria-hidden="true">✓</span>
        <h2>ยังไม่มีงานจริง</h2>
        <p>ไม่สร้าง Work Order หรือบันทึกข้อมูลธุรกิจใน Phase 1</p>
      </article>
    </section>
  )
}
