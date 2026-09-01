import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
import {
  canManageTreeRegister,
  treeStatusLabels,
  type PositionStatus,
  type TreePositionSummary,
  type TreeStatus,
} from '../domain/treeRegister'
import { downloadTreeRegisterTemplate } from '../services/treeRegisterSpreadsheet'
import { PageHeader } from './PageHeader'

export function TreesPage() {
  const { currentFarm, listTreePositions, mode } = usePhase2()
  const [positions, setPositions] = useState<readonly TreePositionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [templateError, setTemplateError] = useState<string>()
  const [query, setQuery] = useState('')
  const [zone, setZone] = useState('ALL')
  const [status, setStatus] = useState<'ALL' | TreeStatus | PositionStatus>('ALL')

  useEffect(() => {
    let active = true
    void Promise.resolve()
      .then(() => {
        if (active) {
          setLoading(true)
          setError(undefined)
        }
        return listTreePositions()
      })
      .then((result) => {
        if (active) setPositions(result)
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'อ่านทะเบียนต้นไม่สำเร็จ')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [currentFarm?.farmId, listTreePositions])

  const zones = useMemo(
    () => [...new Set(positions.map((position) => position.zoneCode))].sort(),
    [positions],
  )
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toUpperCase()
    return positions.filter((position) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        position.tagCode.includes(normalizedQuery) ||
        (position.currentCycle.variety ?? '').toUpperCase().includes(normalizedQuery)
      const matchesZone = zone === 'ALL' || position.zoneCode === zone
      const matchesStatus =
        status === 'ALL' ||
        position.positionStatus === status ||
        position.currentCycle.treeStatus === status
      return matchesQuery && matchesZone && matchesStatus
    })
  }, [positions, query, status, zone])

  if (!currentFarm) return null
  const canManage = canManageTreeRegister(currentFarm)

  const downloadTemplate = () => {
    setTemplateError(undefined)
    try {
      downloadTreeRegisterTemplate(currentFarm)
    } catch (cause) {
      setTemplateError(cause instanceof Error ? cause.message : 'สร้างแม่แบบ Excel ไม่สำเร็จ')
    }
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="ทะเบียนต้น"
        title="ทะเบียนตำแหน่งต้น"
        description="Tag อ้างถึงตำแหน่งถาวร ส่วนต้นปลูกทดแทนเพิ่ม Planting Cycle โดยไม่ลบประวัติ"
      />

      {mode === 'firebase-live' && !currentFarm.isMock
        ? <div className="operational-data-banner" role="note"><strong>ทะเบียนข้อมูลภาคสนาม</strong><span>ตำแหน่งใหม่จะบันทึกเป็นข้อมูลใช้งานของสวนปัจจุบัน โปรดตรวจโซน แถว และรหัสป้ายก่อนยืนยัน</span></div>
        : <div className="field-validation-banner" role="note"><strong>โหมดทดสอบระบบ</strong><span>ข้อมูลในสภาพแวดล้อมนี้ยังเป็น SIMULATED/TEST ONLY</span></div>}

      {canManage ? (
        <div className="page-actions">
          <Link className="secondary-action" to="/orchard-layout">เปิดแปลนสวน</Link>
          <Link className="primary-action" to="/trees/new">เพิ่มตำแหน่งปลูก</Link>
          <button className="secondary-action" onClick={downloadTemplate} type="button">
            ดาวน์โหลดแม่แบบ Excel ภาษาไทย
          </button>
          <Link className="secondary-action" to="/trees/import">นำเข้า Excel / Google Sheets / CSV</Link>
        </div>
      ) : <div className="page-actions"><Link className="secondary-action" to="/orchard-layout">เปิดแปลนสวน</Link></div>}

      {templateError ? <div className="form-error" role="alert">{templateError}</div> : null}

      <div className="tree-filters" aria-label="ค้นหาและกรองทะเบียนต้น">
        <label>
          ค้นหา Tag หรือพันธุ์
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`เช่น ${currentFarm.farmCode} หรือชื่อพันธุ์`}
            type="search"
            value={query}
          />
        </label>
        <label>
          โซน
          <select onChange={(event) => setZone(event.target.value)} value={zone}>
            <option value="ALL">ทุกโซน</option>
            {zones.map((zoneCode) => <option key={zoneCode}>{zoneCode}</option>)}
          </select>
        </label>
        <label>
          สถานะ
          <select
            onChange={(event) => setStatus(event.target.value as typeof status)}
            value={status}
          >
            <option value="ALL">ทุกสถานะ</option>
            <option value="ACTIVE">ตำแหน่งใช้งาน</option>
            <option value="ARCHIVED">ตำแหน่งเก็บถาวร</option>
            <option value="normal">ต้นปกติ</option>
            <option value="watch">เฝ้าระวัง</option>
            <option value="sick">ป่วย</option>
            <option value="dead">ตาย</option>
            <option value="empty">ไม่มีต้น</option>
          </select>
        </label>
      </div>

      {loading ? <div className="loading-inline" role="status">กำลังอ่านทะเบียนต้น…</div> : null}
      {error ? <div className="form-error" role="alert">{error}</div> : null}

      {!loading && !error ? (
        <>
          <div className="result-count" role="status">
            พบ {filtered.length} จาก {positions.length} ตำแหน่งใน {currentFarm.farmCode}
          </div>
          {filtered.length === 0 ? (
            <article className="empty-state">
              <span aria-hidden="true">♧</span>
              <h2>ไม่พบตำแหน่งตามตัวกรอง</h2>
              <p>เปลี่ยนคำค้นหรือเลือกสถานะอื่น ข้อมูลยังไม่ถูกลบ</p>
            </article>
          ) : (
            <div className="tree-list">
              {filtered.map((position) => (
                <Link className="tree-card" key={position.positionId} to={`/trees/${position.positionId}`}>
                  <div className="tree-card__identity">
                    <code>{position.tagCode}</code>
                    <strong>{position.currentCycle.variety ?? 'ไม่ทราบพันธุ์'}</strong>
                    <span>{position.zoneCode} · {position.rowCode} · ตำแหน่ง {position.treeSequence}</span>
                  </div>
                  <div className="tree-card__status">
                    <span className={`tree-status tree-status--${position.currentCycle.treeStatus}`}>
                      {treeStatusLabels[position.currentCycle.treeStatus]}
                    </span>
                    <small>รอบปลูก {position.currentCycleNumber}</small>
                    {position.positionStatus === 'ARCHIVED' ? <small>เก็บถาวร</small> : null}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      ) : null}
    </section>
  )
}
