import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="empty-state page-stack">
      <span aria-hidden="true">?</span>
      <h1>ไม่พบหน้าที่ต้องการ</h1>
      <p>เส้นทางนี้ยังไม่อยู่ใน Foundation</p>
      <Link className="primary-action" to="/">
        กลับหน้าหลัก
      </Link>
    </section>
  )
}
