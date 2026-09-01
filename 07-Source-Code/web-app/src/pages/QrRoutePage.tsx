import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
import type { TreeRouteResolution } from '../adapters/contracts'
import { treeStatusLabels } from '../domain/treeRegister'
import { PageHeader } from './PageHeader'

export function QrRoutePage() {
  const { positionId } = useParams()
  const { currentFarm, resolvePositionRoute } = usePhase2()
  const [resolution, setResolution] = useState<TreeRouteResolution>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    if (!positionId) return
    void Promise.resolve()
      .then(() => {
        if (active) {
          setResolution(undefined)
          setError(undefined)
        }
        return resolvePositionRoute(positionId)
      })
      .then((result) => {
        if (active) setResolution(result)
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'เปิด QR route ไม่สำเร็จ')
      })
    return () => {
      active = false
    }
  }, [currentFarm?.farmId, positionId, resolvePositionRoute])

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Permanent QR route" title="ตำแหน่งจาก QR" description="Opaque ID ถูก resolve หลังตรวจ Sign-in และ Farm membership" />
      {!resolution && !error ? <div className="loading-inline" role="status">กำลังตรวจสิทธิ์และค้นหาตำแหน่ง…</div> : null}
      {error ? <div className="form-error" role="alert">{error}</div> : null}
      {resolution?.status === 'ACCESS_DENIED' ? <article className="scan-result scan-result--access_denied" role="alert"><span aria-hidden="true">⛔</span><h2>ไม่มีสิทธิ์เปิด QR นี้</h2><p>QR อาจอยู่คนละสวน ระบบไม่เปิดเผย Tag ชื่อพันธุ์ หรือตำแหน่ง</p><Link to="/scan">กลับหน้าสแกน</Link></article> : null}
      {resolution?.status === 'UNKNOWN' ? <article className="scan-result scan-result--unknown" role="alert"><span aria-hidden="true">?</span><h2>ไม่พบ Opaque Position ID</h2><code>{positionId}</code><p>ตรวจ URL หรือกรอก Human Tag ด้วยมือ</p><Link to="/scan">กรอกรหัสด้วยมือ</Link></article> : null}
      {resolution?.status === 'FOUND' ? <article className="tree-profile-card"><span className="status-pill">ตรวจสิทธิ์แล้ว</span><h2>{resolution.position.tagCode}</h2><p>{resolution.position.zoneCode} · {resolution.position.rowCode} · ตำแหน่ง {resolution.position.treeSequence}</p><p>รอบปลูก {resolution.position.currentCycleNumber} · {treeStatusLabels[resolution.position.currentCycle.treeStatus]}</p><Link className="primary-action" to={`/trees/${resolution.position.positionId}`}>เปิดข้อมูลและ Timeline</Link></article> : null}
    </section>
  )
}
