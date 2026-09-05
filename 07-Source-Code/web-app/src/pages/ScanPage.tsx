import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
import { appEnvironment } from '../config/environment'
import type { SyncState } from '../domain/farm'
import {
  parseTagCode,
  positionIdFromQrInput,
  treeStatusLabels,
  type TreePositionDetail,
  type TreePositionSummary,
} from '../domain/treeRegister'
import { scanVideoFrame } from '../services/qrScanner'
import { PageHeader } from './PageHeader'

interface LayoutContext {
  syncState: SyncState
}

type ScanResult =
  | { status: 'MATCH' | 'MISMATCH' | 'OFFLINE_CACHED'; position: TreePositionDetail }
  | { status: 'UNKNOWN' | 'ACCESS_DENIED'; message: string }

interface BarcodeResultLike { rawValue: string }
interface BarcodeDetectorLike { detect(source: HTMLVideoElement): Promise<readonly BarcodeResultLike[]> }
type BarcodeDetectorConstructor = new (options: { formats: string[] }) => BarcodeDetectorLike

export function ScanPage() {
  const { syncState } = useOutletContext<LayoutContext>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const workOrderId = searchParams.get('workOrder') ?? ''
  const {
    currentFarm,
    listTreePositions,
    resolvePositionRoute,
    resolveTag,
    reportDamagedTag,
    confirmWorkTarget,
  } = usePhase2()
  const [positions, setPositions] = useState<readonly TreePositionSummary[]>([])
  const [expectedPositionId, setExpectedPositionId] = useState(searchParams.get('expected') ?? '')
  const [manualInput, setManualInput] = useState(
    searchParams.get('tag') ?? searchParams.get('input') ?? searchParams.get('q') ?? '',
  )
  const [result, setResult] = useState<ScanResult>()
  const [message, setMessage] = useState<string>()
  const [cameraState, setCameraState] = useState<'IDLE' | 'STARTING' | 'ACTIVE' | 'FALLBACK'>('IDLE')
  const [damagedNote, setDamagedNote] = useState('')
  const [confirmingWork, setConfirmingWork] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | undefined>(undefined)
  const frameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    let active = true
    void listTreePositions().then((items) => {
      if (active) setPositions(items.filter((item) => item.positionStatus === 'ACTIVE'))
    }).catch(() => {
      if (active) setMessage('อ่านรายการต้นสำหรับบริบทงานไม่สำเร็จ แต่ยังกรอกรหัสด้วยมือได้')
    })
    return () => {
      active = false
    }
  }, [currentFarm?.farmId, listTreePositions])

  const stopCamera = () => {
    if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = undefined
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraState('IDLE')
  }

  useEffect(() => stopCamera, [])

  const resolveInput = useCallback(
    async (value: string, expectedOverride?: string) => {
      if (!currentFarm) return
      const input = value.trim()
      setMessage(undefined)
      setResult(undefined)
      if (!input) {
        setMessage('กรุณาสแกนหรือกรอก Tag/QR ก่อน')
        return
      }
      try {
        let position: TreePositionDetail | undefined
        if (input.startsWith('http://') || input.startsWith('https://') || input.startsWith('pos_')) {
          let positionId = ''
          try {
            positionId = positionIdFromQrInput(input, appEnvironment.qrBaseUrl)
          } catch {
            if (typeof window !== 'undefined') {
              try {
                positionId = positionIdFromQrInput(input, window.location.origin)
              } catch {
                // ignore
              }
            }
          }
          if (!positionId && input.startsWith('pos_')) {
            positionId = input.trim()
          }
          if (!positionId) {
            throw new Error('QR URL ไม่ถูกต้อง หรือไม่ได้มาจากโดเมนของระบบ')
          }
          const resolution = await resolvePositionRoute(positionId)
          if (resolution.status === 'ACCESS_DENIED') {
            setResult({ status: 'ACCESS_DENIED', message: 'QR นี้อยู่คนละสวนหรือบัญชีไม่มีสิทธิ์ ระบบไม่เปิดเผยข้อมูลต้น' })
            return
          }
          if (resolution.status === 'UNKNOWN') {
            setResult({ status: 'UNKNOWN', message: 'ไม่พบ Opaque Position ID นี้ในทะเบียนที่เข้าถึงได้' })
            return
          }
          position = resolution.position
        } else {
          const tag = parseTagCode(input, {
            organizationCode: currentFarm.organizationCode,
            farmSequence: currentFarm.farmSequence,
          })
          if (
            tag.organizationCode !== currentFarm.organizationCode ||
            tag.farmSequence !== currentFarm.farmSequence
          ) {
            setResult({ status: 'ACCESS_DENIED', message: `Tag ที่กรอกระบุคนละสวนกับ ${currentFarm.farmCode} จึงไม่ค้นข้อมูลข้ามสวน` })
            return
          }
          position = await resolveTag(input)
          if (!position) {
            setResult({ status: 'UNKNOWN', message: 'ไม่พบ Tag นี้ในสวนปัจจุบัน ตรวจรหัสหรือแจ้งป้ายชำรุด' })
            return
          }
        }

        const expectedId = expectedOverride ?? expectedPositionId
        if (expectedId && position.positionId !== expectedId) {
          setResult({ status: 'MISMATCH', position })
        } else if (expectedId || workOrderId) {
          if (syncState === 'offline') {
            setResult({ status: 'OFFLINE_CACHED', position })
          } else {
            setResult({ status: 'MATCH', position })
          }
        } else {
          // สแกน QR หรือตรวจ TAG ทั่วไป: ไปหน้ารายละเอียดต้นไม้เพื่อดำเนินการทันที
          void navigate(`/trees/${position.positionId}`)
        }
      } catch (cause) {
        setResult({
          status: 'UNKNOWN',
          message: cause instanceof Error ? cause.message : 'อ่าน QR/Tag ไม่สำเร็จ',
        })
      }
    },
    [currentFarm, expectedPositionId, navigate, resolvePositionRoute, resolveTag, syncState, workOrderId],
  )

  useEffect(() => {
    const initial = searchParams.get('tag') ?? searchParams.get('input') ?? searchParams.get('q')
    if (initial && currentFarm) {
      const timer = window.setTimeout(() => {
        void resolveInput(initial)
      }, 0)
      return () => window.clearTimeout(timer)
    }
  }, [currentFarm, resolveInput, searchParams])

  const startCamera = async () => {
    setMessage(undefined)
    setCameraState('STARTING')
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('เบราว์เซอร์นี้ไม่เปิดกล้องผ่าน Web API')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      streamRef.current = stream
      const video = videoRef.current
      if (!video) throw new Error('ไม่พบพื้นที่แสดงภาพกล้อง')
      video.srcObject = stream
      await video.play()

      const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector
      let detector: BarcodeDetectorLike | undefined
      if (Detector) {
        try {
          detector = new Detector({ formats: ['qr_code'] })
        } catch {
          // native detector not ready, will use canvas scanner
        }
      }

      setCameraState('ACTIVE')
      const canvas = document.createElement('canvas')
      let isScanning = true

      const detectFrame = async () => {
        if (!isScanning || !videoRef.current || !streamRef.current) return
        const currentVideo = videoRef.current
        if (currentVideo.readyState >= 2 && currentVideo.videoWidth > 0) {
          let rawValue: string | null = null
          if (detector) {
            try {
              const codes = await detector.detect(currentVideo)
              rawValue = codes.at(0)?.rawValue ?? null
            } catch {
              // native detect failed on frame, fallback to canvas
            }
          }
          if (!rawValue) {
            rawValue = scanVideoFrame(currentVideo, canvas)
          }
          if (rawValue && isScanning) {
            isScanning = false
            try {
              if (navigator.vibrate) navigator.vibrate(100)
            } catch {
              // ignore
            }
            setManualInput(rawValue)
            stopCamera()
            await resolveInput(rawValue)
            return
          }
        }
        frameRef.current = requestAnimationFrame(() => void detectFrame())
      }
      frameRef.current = requestAnimationFrame(() => void detectFrame())
    } catch (cause) {
      stopCamera()
      setCameraState('FALLBACK')
      setMessage(`${cause instanceof Error ? cause.message : 'เปิดกล้องไม่สำเร็จ'} — ใช้การกรอกรหัสด้วยมือแทนได้`)
    }
  }

  const reportDamage = async () => {
    if (!result || !('position' in result)) return
    try {
      await reportDamagedTag(result.position.positionId, damagedNote)
      setMessage('บันทึกรายงานป้ายชำรุดแล้ว โดยไม่เปลี่ยน Tag หรือตำแหน่ง')
      setDamagedNote('')
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'รายงานป้ายชำรุดไม่สำเร็จ')
    }
  }

  const confirmForWork = async () => {
    if (!workOrderId || !result || !('position' in result) || result.status === 'MISMATCH') return
    setConfirmingWork(true)
    try {
      await confirmWorkTarget(
        workOrderId,
        crypto.randomUUID(),
        result.position.positionId,
      )
      void navigate(`/work/${workOrderId}`)
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'ยืนยันต้นกับ Work Order ไม่สำเร็จ')
    } finally {
      setConfirmingWork(false)
    }
  }

  const expected = positions.find((position) => position.positionId === expectedPositionId)

  return (
    <section className="page-stack">
      <PageHeader eyebrow={workOrderId ? 'Phase 4 · Work target confirmation' : 'Phase 3 · QR confirmation'} title="สแกนยืนยันตำแหน่ง" description="ตรวจ Farm + Position + สิทธิ์ก่อนเปิดข้อมูล และมี Manual fallback เสมอ" />

      <label className="scan-context">บริบทงานที่คาดหวัง<select disabled={Boolean(workOrderId)} onChange={(event) => { setExpectedPositionId(event.target.value); setResult(undefined) }} value={expectedPositionId}><option value="">ค้นหาต้นทั่วไป — ไม่เทียบใบงาน</option>{positions.map((position) => <option key={position.positionId} value={position.positionId}>{position.tagCode}</option>)}</select></label>

      <article className="camera-panel">
        <div className={`camera-view camera-view--${cameraState.toLowerCase()}`}>
          <video aria-label="ภาพจากกล้องสำหรับสแกน QR" muted playsInline ref={videoRef} />
          {cameraState === 'IDLE' ? <span aria-hidden="true">⌗</span> : null}
          {cameraState === 'ACTIVE' ? (
            <div className="camera-view__reticle" aria-hidden="true">
              <div className="camera-view__corner camera-view__corner--tl" />
              <div className="camera-view__corner camera-view__corner--tr" />
              <div className="camera-view__corner camera-view__corner--bl" />
              <div className="camera-view__corner camera-view__corner--br" />
              <div className="camera-view__laser" />
            </div>
          ) : null}
        </div>
        <h2>{cameraState === 'ACTIVE' ? 'กำลังค้นหา QR แบบเรียลไทม์' : 'สแกน QR Code หรือป้าย TAG'}</h2>
        <p>{cameraState === 'ACTIVE' ? 'เล็งกล้องไปที่ QR Code ของต้นไม้ ระบบจะตรวจจับและอ่านค่าอัตโนมัติ' : 'ระบบจะขอสิทธิ์กล้องเมื่อกดเปิด และไม่อัปโหลดวิดีโอ'}</p>
        <div className="form-actions">{cameraState === 'IDLE' || cameraState === 'FALLBACK' ? <button className="primary-action" onClick={() => void startCamera()} type="button">เปิดกล้อง QR</button> : <button className="secondary-action" onClick={stopCamera} type="button">ปิดกล้อง</button>}</div>
      </article>


      <section className="manual-scan" aria-labelledby="manual-scan-title">
        <h2 id="manual-scan-title">กรอกรหัสด้วยมือ</h2>
        <p>รับ Human Tag, QR URL หรือ Opaque Position ID</p>
        <label className="scan-context" htmlFor="manual-scan-input">รหัส Tag, QR URL หรือ Position ID</label>
        <div><input autoCapitalize="characters" id="manual-scan-input" onChange={(event) => setManualInput(event.target.value)} placeholder="Z01-R01-T01" value={manualInput} /><button onClick={() => void resolveInput(manualInput)} type="button">ตรวจรหัส</button></div>
      </section>

      {message ? <div className="scan-message" role="status">{message}</div> : null}
      {result?.status === 'ACCESS_DENIED' || result?.status === 'UNKNOWN' ? (
        <article className={`scan-result scan-result--${result.status.toLowerCase()}`} role="alert"><span aria-hidden="true">{result.status === 'ACCESS_DENIED' ? '⛔' : '?'}</span><h2>{result.status === 'ACCESS_DENIED' ? 'ปฏิเสธการเปิดข้อมูล' : 'ไม่พบตำแหน่ง'}</h2><p>{result.message}</p></article>
      ) : null}
      {result && 'position' in result ? (
        <article className={`scan-result scan-result--${result.status.toLowerCase()}`} role="status">
          <span aria-hidden="true">{result.status === 'MISMATCH' ? '!' : result.status === 'OFFLINE_CACHED' ? '↻' : '✓'}</span>
          <h2>{result.status === 'MISMATCH' ? 'ป้ายนี้ไม่ตรงกับงาน' : result.status === 'OFFLINE_CACHED' ? 'พบจากข้อมูลที่แคชไว้' : 'ยืนยันตำแหน่งตรงกัน'}</h2>
          {result.status === 'MISMATCH' ? <div className="mismatch-codes"><div><small>งานต้องการ</small><code>{expected?.tagCode ?? expectedPositionId}</code></div><div><small>สแกนจริง</small><code>{result.position.tagCode}</code></div></div> : <code>{result.position.tagCode}</code>}
          <p>{result.position.zoneCode} · {result.position.rowCode} · รอบปลูก {result.position.currentCycleNumber} · {treeStatusLabels[result.position.currentCycle.treeStatus]}</p>
          {result.status === 'MISMATCH' ? <p><strong>ระบบหยุด action ของต้นเดิม</strong> และไม่เปลี่ยน target อัตโนมัติ</p> : workOrderId ? <button className="primary-action" disabled={confirmingWork} onClick={() => void confirmForWork()} type="button">{confirmingWork ? 'กำลังยืนยัน…' : syncState === 'offline' ? 'ยืนยันจากแคชในเครื่อง' : 'ยืนยันกับ Work Order'}</button> : <Link className="primary-action" to={`/trees/${result.position.positionId}`}>เปิดข้อมูลตำแหน่ง</Link>}
          <div className="damaged-inline"><input aria-label="รายละเอียดป้ายชำรุด" onChange={(event) => setDamagedNote(event.target.value)} placeholder="รายละเอียดป้ายชำรุด (ถ้ามี)" value={damagedNote} /><button onClick={() => void reportDamage()} type="button">แจ้งป้ายชำรุด</button></div>
        </article>
      ) : null}
    </section>
  )
}
