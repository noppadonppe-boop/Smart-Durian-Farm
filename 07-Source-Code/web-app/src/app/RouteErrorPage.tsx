import { useState } from 'react'
import { useRouteError } from 'react-router-dom'
import { isModuleLoadError, refreshAppVersion } from './routeRecovery'

export function RouteErrorPage() {
  const error = useRouteError()
  const [busy, setBusy] = useState(false)
  const [offline, setOffline] = useState(false)
  const moduleError = isModuleLoadError(error)
  const reload = async () => {
    if (!navigator.onLine) {
      setOffline(true)
      return
    }
    setBusy(true)
    await refreshAppVersion()
    window.location.reload()
  }

  return (
    <main className="page-stack" style={{ maxWidth: '640px', margin: '2rem auto', padding: '1rem' }}>
      <h1>{moduleError ? 'โหลดหน้านี้ไม่สำเร็จ' : 'เกิดข้อผิดพลาดในการเปิดหน้า'}</h1>
      <p>{moduleError
        ? 'แอปอาจเพิ่งอัปเดต หรือการเชื่อมต่อขัดข้อง กรุณาเชื่อมต่ออินเทอร์เน็ตแล้วโหลดหน้าใหม่'
        : 'กรุณาลองโหลดหน้าใหม่ หากยังพบปัญหา ให้แจ้งผู้ดูแลพร้อมชื่อหน้าที่เปิด'}</p>
      <p>การโหลดหน้าใหม่อาจทำให้ข้อความที่ยังไม่ได้บันทึกหายไป</p>
      {offline ? <p role="alert">ยังไม่มีการเชื่อมต่ออินเทอร์เน็ต กรุณาเชื่อมต่อแล้วลองอีกครั้ง</p> : null}
      <button className="primary-action" type="button" disabled={busy} onClick={() => void reload()}>
        {busy ? 'กำลังโหลดเวอร์ชันล่าสุด…' : 'โหลดหน้าใหม่'}
      </button>
    </main>
  )
}

