import { usePhase2 } from '../app/usePhase2'
import { useAuth } from '../security/AuthContext'

export function NoFarmPage() {
  const { authError, identity, signOut } = usePhase2()
  const { userProfile, profileError } = useAuth()
  const pending = userProfile?.status === 'pending'

  return (
    <main className="auth-page" id="main-content">
      <section className="auth-card empty-state">
        <span aria-hidden="true">!</span>
        <h1>{pending ? 'ส่งคำขอเข้าใช้งานแล้ว' : 'บัญชีนี้ยังไม่มีสวน'}</h1>
        <p>
          เข้าสู่ระบบแล้วในชื่อ {identity?.displayName ?? 'ผู้ใช้ทดสอบ'} แต่ไม่พบ
          Organization/Farm membership ที่ยังใช้งาน
        </p>
        <p>
          {pending
            ? 'ระบบบันทึก User และคำขอสถานะ Pending ใน Firebase แล้ว กรุณารอ MasterAdmin กำหนดสิทธิ์และ Assign สวน'
            : 'ข้อมูลปลอดภัยและยังไม่มีสิทธิ์เปิดดูสวนใด กรุณาให้ MasterAdmin ตรวจ User Profile และ Farm membership'}
        </p>
        {profileError || authError ? (
          <p className="form-error" role="alert">{profileError ?? authError}</p>
        ) : null}
        <button className="secondary-action" onClick={() => void signOut()} type="button">
          ออกจากระบบ
        </button>
      </section>
    </main>
  )
}
