import { PageHeader } from './PageHeader'

const boundaries = [
  ['Authentication', 'Mock shell เท่านั้น · DEC-010 ยัง Open'],
  ['Firebase', 'Local Emulator เท่านั้น · deny by default'],
  ['ข้อมูล', 'Mock data เท่านั้น · ห้ามข้อมูลสวนจริง'],
  ['Deployment', 'ยังไม่อนุมัติ public deployment หรือ production domain'],
] as const

export function MorePage() {
  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Foundation controls"
        title="เพิ่มเติม"
        description="สรุปขอบเขตทางสถาปัตยกรรมที่ Phase ถัดไปต้องเติม"
      />
      <div className="boundary-list">
        {boundaries.map(([title, description]) => (
          <article key={title}>
            <div>
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
            <span aria-hidden="true">›</span>
          </article>
        ))}
      </div>
    </section>
  )
}
