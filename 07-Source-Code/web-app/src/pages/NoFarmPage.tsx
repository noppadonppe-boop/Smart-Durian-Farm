import { usePhase2 } from '../app/usePhase2'

export function NoFarmPage() {
  const { authError, identity, signOut } = usePhase2()

  return (
    <main className="auth-page" id="main-content">
      <section className="auth-card empty-state">
        <span aria-hidden="true">!</span>
        <h1>บัญชีนี้ยังไม่มีสวน</h1>
        <p>
          เข้าสู่ระบบแล้วในชื่อ {identity?.displayName ?? 'ผู้ใช้ทดสอบ'} แต่ไม่พบ
          Organization/Farm membership ที่ยังใช้งาน
        </p>
        <p>ข้อมูลปลอดภัยและยังไม่มีสิทธิ์เปิดดูสวนใด กรุณาให้เจ้าขององค์กรเพิ่มสิทธิ์</p>
        {authError ? <p className="form-error" role="alert">{authError}</p> : null}
        <button className="secondary-action" onClick={() => void signOut()} type="button">
          ออกจากระบบ
        </button>
      </section>
    </main>
  )
}
