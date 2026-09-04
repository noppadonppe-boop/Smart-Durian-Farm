import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
import { appEnvironment } from '../config/environment'
import {
  buildQrPayload,
  canManageTreeRegister,
  treePresenceFromStatus,
  treePresenceLabels,
  treeStatusLabels,
  type TreeQrAsset,
  type TreeQrFormat,
  type PositionStatus,
  type TreePositionSummary,
  type TreeStatus,
} from '../domain/treeRegister'
import { generateQrDataUrl, generateQrSvg } from '../services/qrCode'
import { downloadTreeRegisterTemplate } from '../services/treeRegisterSpreadsheet'
import { PageHeader } from './PageHeader'
import './TreeRegisterPages.css'

type TreeListFilterStatus = 'ALL' | 'present' | TreeStatus | PositionStatus

function qrAssetKey(positionId: string, format: TreeQrFormat): string {
  return `${positionId}:${format}`
}

function qrPayload(position: TreePositionSummary, format: TreeQrFormat): string {
  if (format === 'TAG') return position.tagCode
  try {
    return buildQrPayload(appEnvironment.qrBaseUrl, position.positionId)
  } catch {
    return position.tagCode
  }
}

export function TreesPage() {
  const { currentFarm, listTreePositions, listTreeQrAssets, createTreeQrAsset } = usePhase2()
  const [positions, setPositions] = useState<readonly TreePositionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [templateError, setTemplateError] = useState<string>()
  const [qrNotification, setQrNotification] = useState<string>()
  const [query, setQuery] = useState('')
  const [zone, setZone] = useState('ALL')
  const [status, setStatus] = useState<TreeListFilterStatus>('ALL')
  const [qrGeneratedMap, setQrGeneratedMap] = useState<Record<string, boolean>>({})
  const [qrAssets, setQrAssets] = useState<readonly TreeQrAsset[]>([])
  const [qrBusy, setQrBusy] = useState(false)
  const [selectedQrPosition, setSelectedQrPosition] = useState<TreePositionSummary>()
  const [qrFormat, setQrFormat] = useState<'TAG' | 'URL'>('TAG')
  const [copySuccess, setCopySuccess] = useState(false)
  const pendingQrAssets = useRef(new Map<string, Promise<TreeQrAsset>>())

  useEffect(() => {
    let active = true
    void Promise.resolve()
      .then(() => {
        if (active) {
          setLoading(true)
          setError(undefined)
        }
        return Promise.all([listTreePositions(), listTreeQrAssets()])
      })
      .then(([result, assets]) => {
        if (active) {
          setPositions(result)
          setQrAssets(assets)
          setQrGeneratedMap(Object.fromEntries(
            assets
              .filter((asset) => asset.format === 'TAG' && asset.status === 'READY')
              .map((asset) => [asset.positionId, true]),
          ))
        }
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
  }, [currentFarm, listTreePositions, listTreeQrAssets])

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
        (status === 'present' && position.currentCycle.treeStatus !== 'empty') ||
        (status !== 'present' &&
          (position.positionStatus === status || position.currentCycle.treeStatus === status))
      return matchesQuery && matchesZone && matchesStatus
    })
  }, [positions, query, status, zone])

  const qrDataUrls = useMemo(() => {
    const cache = new Map<string, string>()
    for (const pos of positions) {
      cache.set(pos.positionId, generateQrDataUrl(pos.tagCode, { label: pos.tagCode, margin: 1 }))
    }
    return cache
  }, [positions])

  const qrAssetMap = useMemo(
    () => new Map(qrAssets.map((asset) => [qrAssetKey(asset.positionId, asset.format), asset])),
    [qrAssets],
  )

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

  const ensureQrAsset = async (position: TreePositionSummary, format: TreeQrFormat): Promise<TreeQrAsset> => {
    const key = qrAssetKey(position.positionId, format)
    const existing = qrAssetMap.get(key)
    if (existing) return existing
    const pending = pendingQrAssets.current.get(key)
    if (pending) return pending

    const payload = qrPayload(position, format)
    const promise = createTreeQrAsset({
      positionId: position.positionId,
      tagCode: position.tagCode,
      format,
      payload,
      svg: generateQrSvg(payload, { label: position.tagCode, margin: 2 }),
    })
      .then((asset) => {
        setQrAssets((current) => current.some((candidate) => qrAssetKey(candidate.positionId, candidate.format) === key)
          ? current.map((candidate) => qrAssetKey(candidate.positionId, candidate.format) === key ? asset : candidate)
          : [...current, asset])
        if (format === 'TAG') setQrGeneratedMap((current) => ({ ...current, [position.positionId]: true }))
        return asset
      })
      .finally(() => pendingQrAssets.current.delete(key))
    pendingQrAssets.current.set(key, promise)
    return promise
  }

  const handleCreateQr = async (position: TreePositionSummary) => {
    setQrBusy(true)
    setError(undefined)
    try {
      await ensureQrAsset(position, 'TAG')
      setSelectedQrPosition(position)
      setQrNotification(`สร้าง QR Code และบันทึกรูปของ ${position.tagCode} แล้ว`)
      setTimeout(() => setQrNotification(undefined), 3500)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'บันทึก QR Code ไม่สำเร็จ')
    } finally {
      setQrBusy(false)
    }
  }

  const handleCreateAllQrs = async () => {
    setQrBusy(true)
    setError(undefined)
    try {
      for (const position of positions) await ensureQrAsset(position, 'TAG')
      setQrNotification(`สร้างและบันทึก QR Code ให้ครบทุก ${positions.length} รายการแล้ว`)
      setTimeout(() => setQrNotification(undefined), 3500)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'บันทึก QR Code ทั้งหมดไม่สำเร็จ')
    } finally {
      setQrBusy(false)
    }
  }

  const handleDownloadQrSvg = async (position: TreePositionSummary, format: TreeQrFormat = qrFormat) => {
    setError(undefined)
    try {
      await ensureQrAsset(position, format)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'บันทึก QR Code ไม่สำเร็จ')
      return
    }
    const svg = generateQrSvg(qrPayload(position, format), { label: position.tagCode, margin: 4 })
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `QR_${format}_${position.tagCode}.svg`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch {
      // fallback
    }
  }

  return (
    <section className="page-stack">
      <PageHeader
        title="ทะเบียนตำแหน่งต้น"
        description="Tag อ้างถึงตำแหน่งถาวร ส่วนต้นปลูกทดแทนเพิ่ม Planting Cycle โดยไม่ลบประวัติ"
      />

      {canManage ? (
        <div className="page-actions tree-page-actions">
          <Link className="secondary-action" to="/orchard-layout">
            เปิดแปลนสวน
          </Link>
          <Link className="primary-action" to="/trees/new">
            ลงทะเบียน
          </Link>
          <button className="secondary-action tree-page-action--compact" onClick={downloadTemplate} type="button">
            ดาวน์โหลดแม่แบบ Excel ภาษาไทย
          </button>
          <Link className="secondary-action tree-page-action--compact" to="/trees/import">
            นำเข้า Excel / Google Sheets / CSV
          </Link>
        </div>
      ) : (
        <div className="page-actions">
          <Link className="secondary-action" to="/orchard-layout">
            เปิดแปลนสวน
          </Link>
        </div>
      )}

      {templateError ? (
        <div className="form-error" role="alert">
          {templateError}
        </div>
      ) : null}
      {qrNotification ? (
        <div className="tree-table__notification" role="status">
          ✓ {qrNotification}
        </div>
      ) : null}

      <div className="tree-filters tree-filters--compact" aria-label="ค้นหาและกรองทะเบียนต้น">
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
            {zones.map((zoneCode) => (
              <option key={zoneCode}>{zoneCode}</option>
            ))}
          </select>
        </label>
        <label>
          สถานะ
          <select onChange={(event) => setStatus(event.target.value as typeof status)} value={status}>
            <option value="ALL">ทุกสถานะ</option>
            <option value="ACTIVE">ตำแหน่งใช้งาน</option>
            <option value="ARCHIVED">ตำแหน่งเก็บถาวร</option>
            <option value="present">มีต้น</option>
            <option value="normal">ต้นปกติ</option>
            <option value="watch">เฝ้าระวัง</option>
            <option value="sick">ป่วย</option>
            <option value="dead">ตาย</option>
            <option value="empty">ไม่มีต้น</option>
          </select>
        </label>
      </div>

      {loading ? (
        <div className="loading-inline" role="status">
          กำลังอ่านทะเบียนต้น…
        </div>
      ) : null}
      {error ? (
        <div className="form-error" role="alert">
          {error}
        </div>
      ) : null}

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
            <section className="tree-table-card" aria-labelledby="tree-table-title">
              <div className="tree-table-card__heading">
                <div>
                  <h2 id="tree-table-title">รายการต้นไม้</h2>
                  <p>เลือกรหัสป้ายหรือปุ่มดูรายละเอียดเพื่อเปิดประวัติของตำแหน่ง</p>
                </div>
                <div className="tree-table-card__heading-actions">
                  <button
                    className="secondary-action tree-table__create-all-btn"
                    disabled={qrBusy}
                    onClick={() => void handleCreateAllQrs()}
                    title="สร้าง QR Code ให้ครบทุกตำแหน่ง"
                    type="button"
                  >
                    สร้าง QR ทั้งหมด
                  </button>
                  <span>{filtered.length} ตำแหน่ง</span>
                </div>
              </div>
              <p className="tree-table-card__scroll-hint">เลื่อนตารางไปด้านข้างเพื่อดูข้อมูลทั้งหมด</p>
              <div className="tree-table-scroll" role="region" aria-label="ตารางรายการต้นไม้" tabIndex={0}>
                <table className="tree-table">
                  <thead>
                    <tr>
                      <th scope="col">รหัสป้าย</th>
                      <th scope="col">TAG ID</th>
                      <th scope="col">โซน / แถว</th>
                      <th scope="col">พันธุ์</th>
                      <th scope="col">ปีปลูก</th>
                      <th scope="col">สถานะ</th>
                      <th scope="col">รอบปลูก</th>
                      <th scope="col">
                        <span className="visually-hidden">การทำงาน</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((position) => {
                      const treePresence = treePresenceFromStatus(position.currentCycle.treeStatus)
                      const plantingYear = position.currentCycle.plantingYear
                        ? `${position.currentCycle.plantingYear} ${position.currentCycle.plantingYearCalendar === 'BE' ? 'พ.ศ.' : 'ค.ศ.'}`
                        : 'ไม่ทราบ'
                      const hasQr = Boolean(qrGeneratedMap[position.positionId])
                      const qrThumb = qrAssetMap.get(qrAssetKey(position.positionId, 'TAG'))?.storageUrl
                        || qrDataUrls.get(position.positionId)
                      return (
                        <tr key={position.positionId}>
                          <th scope="row">
                            <Link
                              className="tree-table__tag-link"
                              title={`ตำแหน่ง ${position.treeSequence}`}
                              to={`/trees/${position.positionId}`}
                            >
                              <code>{position.tagCode}</code>
                            </Link>
                          </th>
                          <td className="tree-table__qr-cell">
                            {hasQr && qrThumb ? (
                              <button
                                aria-label={`ดู QR Code ของ ${position.tagCode}`}
                                className="tree-table__qr-btn"
                                onClick={() => setSelectedQrPosition(position)}
                                title={`คลิกเพื่อเปิดดูหรือทดสอบ QR Code ของ ${position.tagCode}`}
                                type="button"
                              >
                                <img
                                  alt={`QR ${position.tagCode}`}
                                  className="tree-table__qr-thumb"
                                  height={22}
                                  src={qrThumb}
                                  width={22}
                                />
                                <code>{position.tagCode}</code>
                              </button>
                            ) : (
                              <button
                                className="tree-table__create-qr-btn"
                                disabled={qrBusy}
                                onClick={() => void handleCreateQr(position)}
                                title={`คลิกเพื่อสร้าง QR Code ให้ตำแหน่ง ${position.tagCode}`}
                                type="button"
                              >
                                + สร้าง QR
                              </button>
                            )}
                          </td>
                          <td>
                            <strong>{position.zoneCode}</strong>
                            <small>{position.rowCode}</small>
                          </td>
                          <td>{position.currentCycle.variety ?? 'ไม่ทราบพันธุ์'}</td>
                          <td>{plantingYear}</td>
                          <td>
                            <span className={`tree-status tree-status--${position.currentCycle.treeStatus}`}>
                              {treePresenceLabels[treePresence]}
                            </span>
                            {treePresence === 'present' && position.currentCycle.treeStatus !== 'normal' ? (
                              <small>{treeStatusLabels[position.currentCycle.treeStatus]}</small>
                            ) : null}
                            {position.positionStatus === 'ARCHIVED' ? <small>ตำแหน่งเก็บถาวร</small> : null}
                          </td>
                          <td>
                            <strong>{position.currentCycleNumber}</strong>
                          </td>
                          <td>
                            <Link className="tree-table__detail-link" to={`/trees/${position.positionId}`}>
                              ดูรายละเอียด <span aria-hidden="true">→</span>
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      ) : null}

      {selectedQrPosition ? (
        <div
          aria-labelledby="qr-modal-title"
          aria-modal="true"
          className="tree-qr-modal-backdrop"
          onClick={() => setSelectedQrPosition(undefined)}
          role="dialog"
        >
          <div className="tree-qr-modal" onClick={(e) => e.stopPropagation()} role="document">
            <div className="tree-qr-modal__heading">
              <div>
                <span className="tree-qr-modal__eyebrow">TAG ID &amp; QR CODE</span>
                <h3 id="qr-modal-title">{selectedQrPosition.tagCode}</h3>
              </div>
              <button
                aria-label="ปิด"
                className="tree-qr-modal__close-btn"
                onClick={() => setSelectedQrPosition(undefined)}
                type="button"
              >
                ✕
              </button>
            </div>

            {(() => {
              const activePayload = qrPayload(selectedQrPosition, qrFormat)
              const activeQrAsset = qrAssetMap.get(qrAssetKey(selectedQrPosition.positionId, qrFormat))
              return (
                <>
                  <div className="tree-qr-modal__format-toggle" role="group" aria-label="รูปแบบ QR Code">
                    <button
                      className={`tree-qr-modal__format-btn ${qrFormat === 'TAG' ? 'is-active' : ''}`}
                      onClick={() => {
                        setQrFormat('TAG')
                        void ensureQrAsset(selectedQrPosition, 'TAG').catch((cause: unknown) => {
                          setError(cause instanceof Error ? cause.message : 'บันทึก QR Code ไม่สำเร็จ')
                        })
                      }}
                      type="button"
                    >
                      🏷️ รหัสป้าย TAG (สแกนง่าย แนะนำ)
                    </button>
                    <button
                      className={`tree-qr-modal__format-btn ${qrFormat === 'URL' ? 'is-active' : ''}`}
                      onClick={() => {
                        setQrFormat('URL')
                        void ensureQrAsset(selectedQrPosition, 'URL').catch((cause: unknown) => {
                          setError(cause instanceof Error ? cause.message : 'บันทึก QR Code ไม่สำเร็จ')
                        })
                      }}
                      type="button"
                    >
                      🔗 URL ถาวร (/t/pos_...)
                    </button>
                  </div>

                  <div className="tree-qr-modal__body">
                    <div className="tree-qr-modal__image-wrap">
                      <img
                        alt={`QR Code ${selectedQrPosition.tagCode}`}
                        className="tree-qr-modal__image"
                        src={activeQrAsset?.storageUrl || generateQrDataUrl(activePayload, { label: selectedQrPosition.tagCode, margin: 2 })}
                        width={180}
                      />
                    </div>

                    <div className="tree-qr-modal__meta">
                      <div>
                        <span>รหัสป้าย (Tag):</span>
                        <code>{selectedQrPosition.tagCode}</code>
                      </div>
                      <div>
                        <span>Position ID:</span>
                        <code>{selectedQrPosition.positionId}</code>
                      </div>
                      <div>
                        <span>โซน / แถว / ลำดับ:</span>
                        <strong>
                          {selectedQrPosition.zoneCode} / {selectedQrPosition.rowCode} / #{selectedQrPosition.treeSequence}
                        </strong>
                      </div>
                      <div>
                        <span>ข้อมูลใน QR ({qrFormat}):</span>
                        <code>{activePayload}</code>
                      </div>
                    </div>
                  </div>

                  <div className="tree-qr-modal__actions">
                    <Link
                      className="primary-action tree-qr-modal__scan-link"
                      to={`/scan?expected=${selectedQrPosition.positionId}&tag=${encodeURIComponent(selectedQrPosition.tagCode)}`}
                    >
                      🔍 ทดสอบในเมนูสแกน
                    </Link>
                    <div className="tree-qr-modal__btn-row">
                      <button
                        className="secondary-action"
                        onClick={() => void handleDownloadQrSvg(selectedQrPosition, qrFormat)}
                        type="button"
                      >
                        📥 ดาวน์โหลด SVG ({qrFormat})
                      </button>
                      <button
                        className="secondary-action"
                        onClick={() => void handleCopyText(activePayload)}
                        type="button"
                      >
                        {copySuccess ? '✓ คัดลอกแล้ว' : qrFormat === 'TAG' ? '📋 คัดลอกรหัส TAG' : '📋 คัดลอกลิงก์'}
                      </button>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      ) : null}
    </section>
  )
}
