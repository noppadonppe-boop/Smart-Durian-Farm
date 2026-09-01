import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
import { OrchardTargetSelector } from '../components/OrchardTargetSelector'
import {
  canAccessCommercialFinancialData,
  canManageCommercial,
  canReadCommercial,
  canRecordFruitObservation,
  cropStageLabels,
  cropStages,
  fruitCountingModeLabels,
  valueQualityLabels,
  type CommercialSnapshot,
  type CountMethod,
  type CropStage,
  type FruitCountingMode,
  type ValueQuality,
} from '../domain/commercialTraceability'
import {
  aiCaptureMethodLabels,
  aiCaptureMethods,
  runDeterministicFruitCount,
  type AiCaptureMethod,
  type DeterministicFruitCountResult,
} from '../domain/fruitCountingFeasibility'
import {
  navigationIntentFromState,
  positionIdsForAnchor,
  selectionFromNavigationState,
  selectionZoneCodes,
} from '../domain/orchardLayout'
import type { TreePositionSummary } from '../domain/treeRegister'
import { PageHeader } from './PageHeader'

function formText(form: FormData, name: string): string {
  const value = form.get(name)
  return typeof value === 'string' ? value : ''
}

function numberOrNull(form: FormData, name: string): number | null {
  const normalized = formText(form, name).trim()
  return normalized ? Number(normalized) : null
}

function values(form: FormData, name: string): string[] {
  return formText(form, name).split(',').map((item) => item.trim()).filter(Boolean)
}

function formSignature(form: FormData): string {
  return JSON.stringify([...form.entries()].map(([name, value]) => [
    name,
    typeof value === 'string' ? value : `${value.name}:${value.size}:${value.type}`,
  ]))
}

export function ProductionPage() {
  const location = useLocation()
  const {
    currentFarm,
    annualCycleSnapshot,
    listTreePositions,
    listCommercialSnapshot,
    createCropCycle,
    advanceCropCycleStage,
    createFruitObservation,
    createHarvestLot,
    createSalesLot,
    correctSalesLot,
  } = usePhase2()
  const [snapshot, setSnapshot] = useState<CommercialSnapshot>()
  const [trees, setTrees] = useState<readonly TreePositionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>()
  const [message, setMessage] = useState<string>()
  const [countingMode, setCountingMode] = useState<FruitCountingMode>('MANUAL')
  const [observationStage, setObservationStage] = useState<CropStage>('MID_SEASON')
  const [countMethod, setCountMethod] = useState<CountMethod>('SAMPLE')
  const [valueQuality, setValueQuality] = useState<ValueQuality>('ESTIMATED')
  const [aiCaptureMethod, setAiCaptureMethod] = useState<AiCaptureMethod>('MULTI_VIEW')
  const [aiCountResult, setAiCountResult] = useState<DeterministicFruitCountResult>()
  const [observedCount, setObservedCount] = useState('120')
  const [confidenceNote, setConfidenceNote] = useState('SIMULATED/TEST ONLY — ข้อมูลจำลองสำหรับทดสอบ workflow')
  const [observationScopeKind, setObservationScopeKind] = useState<'TREE' | 'ZONE'>('ZONE')
  const [observationPositionIds, setObservationPositionIds] = useState<readonly string[]>([])
  const [harvestPositionIds, setHarvestPositionIds] = useState<readonly string[]>([])
  const [formOpenOverride, setFormOpenOverride] = useState<{
    observation: boolean
    harvest: boolean
  }>()
  const submissionLock = useRef(false)
  const idempotencyKeys = useRef(new Map<string, string>())

  const idempotency = (prefix: string, signature: string): string => {
    const cacheKey = `${prefix}:${signature}`
    const existing = idempotencyKeys.current.get(cacheKey)
    if (existing) return existing
    const created = `${prefix}-${crypto.randomUUID()}`
    idempotencyKeys.current.set(cacheKey, created)
    return created
  }

  const load = useCallback(async () => {
    setSnapshot(undefined)
    setTrees([])
    if (!currentFarm || !canReadCommercial(currentFarm.role)) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(undefined)
    try {
      const [nextSnapshot, nextPositions] = await Promise.all([
        listCommercialSnapshot(),
        listTreePositions(),
      ])
      const activePositions = nextPositions.filter((position) => position.positionStatus === 'ACTIVE')
      const usablePositions = activePositions.filter((position) => position.currentCycle.treeStatus !== 'empty')
      const requested = selectionFromNavigationState(location.state, currentFarm.farmId)
        .filter((positionId) => usablePositions.some((position) => position.positionId === positionId))
      const requestedIntent = navigationIntentFromState(location.state, currentFarm.farmId)
      setSnapshot(nextSnapshot)
      setTrees(activePositions)
      if (requested.length > 0 && requestedIntent !== 'HARVEST_LOT') setObservationScopeKind('TREE')
      setObservationPositionIds((current) => {
        if (requested.length > 0 && requestedIntent !== 'HARVEST_LOT') return requested
        const retained = current.filter((positionId) => usablePositions.some((position) => position.positionId === positionId))
        if (retained.length > 0) return retained
        const anchor = usablePositions[0]
        return anchor ? positionIdsForAnchor(usablePositions, anchor.positionId, 'ZONE') : []
      })
      setHarvestPositionIds((current) => {
        if (requested.length > 0 && requestedIntent !== 'FRUIT_OBSERVATION') return requested
        const retained = current.filter((positionId) => usablePositions.some((position) => position.positionId === positionId))
        return retained.length > 0 ? retained : usablePositions[0] ? [usablePositions[0].positionId] : []
      })
      setObservationStage(nextSnapshot.cropCycles.find((cycle) => cycle.status === 'ACTIVE')?.stage ?? 'MID_SEASON')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'อ่านข้อมูลผลผลิตไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [currentFarm, listCommercialSnapshot, listTreePositions, location.state])

  useEffect(() => {
    queueMicrotask(() => { void load() })
  }, [load])

  const activeCycle = snapshot?.cropCycles.find((cycle) => cycle.status === 'ACTIVE')
  const navigationIntent = navigationIntentFromState(location.state, currentFarm?.farmId ?? '')
  const observationFormOpen = formOpenOverride?.observation ?? navigationIntent !== 'HARVEST_LOT'
  const harvestFormOpen = formOpenOverride?.harvest ?? navigationIntent === 'HARVEST_LOT'
  const availableHarvests = useMemo(() => snapshot?.harvestLots.filter((lot) =>
    lot.status !== 'ARCHIVED' && lot.totalWeightKg !== null && lot.totalWeightKg > lot.soldWeightKg,
  ) ?? [], [snapshot])

  if (!currentFarm) return null
  if (!canReadCommercial(currentFarm.role)) {
    return <section className="page-stack"><PageHeader eyebrow="Phase 5 · Least privilege" title="ไม่เปิดข้อมูลเชิงพาณิชย์สำหรับบทบาทนี้" description="Worker ทำงานผ่าน Work Order; ข้อมูลผลผลิต การขาย และสต็อกเปิดตามสิทธิ์เท่านั้น" /><Link className="secondary-action" to="/work">กลับงานของฉัน</Link></section>
  }

  const submit = async (action: () => Promise<unknown>, success: string) => {
    if (submissionLock.current) return
    submissionLock.current = true
    setSubmitting(true)
    setError(undefined)
    setMessage(undefined)
    try {
      await action()
      setMessage(success)
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'บันทึกไม่สำเร็จ')
    } finally {
      submissionLock.current = false
      setSubmitting(false)
    }
  }

  const onCreateCycle = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    void submit(() => createCropCycle(idempotency('crop', formSignature(form)), {
      annualCycleId: formText(form, 'annualCycleId'),
      cycleCode: formText(form, 'cycleCode'),
      name: formText(form, 'name'),
      stage: formText(form, 'stage') as CropStage,
      zoneCodes: values(form, 'zoneCodes'),
      varietyReference: formText(form, 'varietyReference'),
      expectedHarvestDate: formText(form, 'expectedHarvestDate').trim() || null,
    }), 'สร้าง Crop Cycle จำลองแล้ว')
  }

  const onObservation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const submittedCountingMode = formText(form, 'countingMode') as FruitCountingMode
    const submittedValueQuality = submittedCountingMode === 'AI_ASSISTED'
      ? 'ESTIMATED'
      : formText(form, 'valueQuality') as ValueQuality
    const zoneCodes = selectionZoneCodes(trees, observationPositionIds)
    const signature = `${formSignature(form)}:${observationScopeKind}:${observationPositionIds.join(',')}`
    void submit(() => createFruitObservation(idempotency('fruit', signature), {
      cropCycleId: formText(form, 'cropCycleId'),
      stage: formText(form, 'stage') as CropStage,
      scopeKind: observationScopeKind,
      positionIds: observationPositionIds,
      zoneCodes,
      countingMode: submittedCountingMode,
      sourceCountSessionId: submittedCountingMode === 'AI_ASSISTED'
        ? aiCountResult?.countSessionId ?? null
        : null,
      countMethod: formText(form, 'countMethod') as CountMethod,
      observedCount: submittedValueQuality === 'UNKNOWN' ? null : numberOrNull(form, 'observedCount'),
      droppedCount: submittedValueQuality === 'UNKNOWN' ? null : numberOrNull(form, 'droppedCount'),
      valueQuality: submittedValueQuality,
      confidenceNote: formText(form, 'confidenceNote'),
      observedAt: formText(form, 'observedAt'),
    }), 'บันทึก Fruit Observation จำลองแล้ว')
  }

  const onCountingModeChange = (nextMode: FruitCountingMode) => {
    setCountingMode(nextMode)
    setAiCountResult(undefined)
    if (nextMode === 'AI_ASSISTED') {
      setValueQuality('ESTIMATED')
      if (countMethod === 'FULL_COUNT' || countMethod === 'UNKNOWN') setCountMethod('SAMPLE')
      setConfidenceNote('SIMULATED/TEST ONLY — รอผล AI จำลองและการตรวจทานโดยคน')
    } else {
      setConfidenceNote('SIMULATED/TEST ONLY — ข้อมูลจำลองสำหรับทดสอบ workflow')
    }
  }

  const onObservationStageChange = (nextStage: CropStage) => {
    setObservationStage(nextStage)
    setAiCountResult(undefined)
    if (nextStage === 'FLOWERING' && countingMode === 'AI_ASSISTED') onCountingModeChange('MANUAL')
  }

  const onRunAiMock = () => {
    setError(undefined)
    setMessage(undefined)
    try {
      const result = runDeterministicFruitCount(
        observationStage,
        aiCaptureMethod,
        `aifc-mock-${crypto.randomUUID()}`,
      )
      setAiCountResult(result)
      setObservedCount(String(result.proposedReviewedCount))
      setConfidenceNote(`${result.limitationNote} · ผู้บันทึกต้องตรวจและแก้จำนวนก่อนยืนยัน`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'AI จำลองช่วยนับไม่สำเร็จ')
    }
  }

  const onHarvest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const zoneCodes = selectionZoneCodes(trees, harvestPositionIds)
    const signature = `${formSignature(form)}:${harvestPositionIds.join(',')}`
    void submit(() => createHarvestLot(idempotency('harvest', signature), {
      cropCycleId: formText(form, 'cropCycleId'),
      lotCode: formText(form, 'lotCode'),
      harvestedOn: formText(form, 'harvestedOn'),
      positionIds: harvestPositionIds,
      zoneCodes,
      quantityFruit: numberOrNull(form, 'quantityFruit'),
      totalWeightKg: numberOrNull(form, 'totalWeightKg'),
      valueQuality: formText(form, 'valueQuality') as ValueQuality,
      grades: [],
      note: formText(form, 'note'),
    }), 'สร้าง Harvest Lot จำลองแล้ว')
  }

  const onSale = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const weightKg = Number(formText(form, 'weightKg'))
    void submit(() => createSalesLot(idempotency('sale', formSignature(form)), {
      lotCode: formText(form, 'lotCode'),
      soldOn: formText(form, 'soldOn'),
      allocations: [{ harvestLotId: formText(form, 'harvestLotId'), weightKg }],
      quantityFruit: numberOrNull(form, 'quantityFruit'),
      weightKg,
      note: formText(form, 'note'),
      ...(canAccessCommercialFinancialData(currentFarm) ? { financial: {
        customerReference: formText(form, 'customerReference'),
        unitPriceBahtPerKg: Number(formText(form, 'unitPriceBahtPerKg')),
        depositBaht: Number(formText(form, 'depositBaht')),
        receivedBaht: Number(formText(form, 'receivedBaht')),
      } } : {}),
    }), 'สร้าง Sales Lot จำลองแล้วและเชื่อม Traceability แล้ว')
  }

  const onCorrection = (event: FormEvent<HTMLFormElement>, salesLotId: string, weightKg: number) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    void submit(() => correctSalesLot(salesLotId, idempotency('sale-correction', `${salesLotId}:${formSignature(form)}`), {
      weightKg,
      unitPriceBahtPerKg: Number(formText(form, 'unitPriceBahtPerKg')),
      depositBaht: Number(formText(form, 'depositBaht')),
      receivedBaht: Number(formText(form, 'receivedBaht')),
      reason: formText(form, 'reason'),
    }), 'แก้ยอดขายด้วย Correction Event แล้ว')
  }

  return (
    <section className="page-stack commercial-page">
      <PageHeader eyebrow="Phase 5 · Production & Commercial Traceability" title="ผลผลิตถึงการขาย ตรวจย้อนกลับได้" description="Tree/Zone → Crop Cycle → Harvest Lot → Sales Lot พร้อมแยกวัดจริง ประมาณการ และยังไม่ทราบ" />
      <div className="field-validation-banner" role="note"><strong>SIMULATED/TEST ONLY · Mock Data Pack v1.0.0</strong><span>ไม่มีข้อมูลลูกค้าจริง ไม่มีบัญชี ภาษี ธนาคาร หรือการโอนข้ามสวน</span></div>
      {loading ? <div className="loading-inline" role="status">กำลังอ่านข้อมูลจำลอง…</div> : null}
      {submitting ? <div className="loading-inline" role="status">กำลังบันทึกข้อมูลจำลอง…</div> : null}
      {error ? <div className="form-error" role="alert">{error}</div> : null}
      {message ? <div className="success-notice" role="status">{message}</div> : null}

      {snapshot ? <>
        <div className="commercial-metrics" aria-label="สรุปผลผลิตและการขาย">
          <article><small>Crop Cycle</small><strong>{snapshot.cropCycles.filter((item) => item.status === 'ACTIVE').length}</strong><span>รอบที่ใช้งาน</span></article>
          <article><small>Harvest</small><strong>{snapshot.harvestLots.length}</strong><span>ล็อต</span></article>
          <article><small>Sales</small><strong>{snapshot.salesLots.filter((item) => item.status !== 'ARCHIVED').length}</strong><span>ล็อต</span></article>
          {canAccessCommercialFinancialData(currentFarm) && snapshot.financial ? <article><small>ค้างรับ</small><strong>{snapshot.financial.salesLots.reduce((sum, item) => sum + item.outstandingBaht, 0).toLocaleString('th-TH')}</strong><span>บาท · Owner only · ไม่ใช่บัญชี</span></article> : null}
        </div>

        <section className="commercial-section" aria-labelledby="trace-title">
          <div className="section-heading"><div><span className="status-pill">End-to-end trace</span><h2 id="trace-title">เส้นทางจากต้นถึงล็อตขาย</h2></div><Link to="/inventory">{canAccessCommercialFinancialData(currentFarm) ? 'เปิดสต็อกและต้นทุนตรง' : 'เปิดสต็อกวัสดุ'}</Link></div>
          <div className="trace-list">
            {snapshot.traceability.map((row) => <article key={`${row.salesLotId}:${row.harvestLotId}`} className="trace-card">
              <div><small>Sales Lot</small><strong>{row.salesLotCode}</strong></div><span aria-hidden="true">→</span>
              <div><small>Harvest Lot</small><strong>{row.harvestLotCode}</strong><em>{row.allocatedWeightKg} kg</em></div><span aria-hidden="true">→</span>
              <div><small>Crop Cycle</small><strong>{row.cropCycleCode}</strong></div><span aria-hidden="true">→</span>
              <div><small>Source</small><strong>{row.positionIds.length} ต้น · {row.zoneCodes.join(', ')}</strong></div>
            </article>)}
            {snapshot.traceability.length === 0 ? <article className="empty-state"><h2>ยังไม่มี Traceability</h2><p>สร้าง Harvest Lot และ Sales Lot เพื่อเชื่อมเส้นทาง</p></article> : null}
          </div>
        </section>

        <section className="commercial-section" aria-labelledby="cycle-title">
          <div className="section-heading"><div><span className="status-pill">Crop Cycle</span><h2 id="cycle-title">รอบผลผลิตและ Stage</h2></div></div>
          <div className="commercial-card-grid">{snapshot.cropCycles.map((cycle) => {
            const stageIndex = cropStages.indexOf(cycle.stage)
            const nextStage = cropStages[stageIndex + 1]
            return <article className="commercial-card" key={cycle.cropCycleId}>
              <small>{cycle.cycleCode}</small><h3>{cycle.name}</h3><span className="quality-pill quality-pill--measured">{cropStageLabels[cycle.stage]}</span>
              <p>{cycle.zoneCodes.join(', ')} · เก็บเกี่ยวคาดการณ์ {cycle.expectedHarvestDate ?? 'ยังไม่ทราบ'}</p>
              <small>รอบบริหารสวน: {annualCycleSnapshot.cycles.find((item) => item.annualCycleId === cycle.annualCycleId)?.cycleCode ?? cycle.annualCycleId}</small>
              {nextStage && canRecordFruitObservation(currentFarm.role) ? <button className="secondary-action" disabled={submitting} type="button" onClick={() => void submit(
                () => advanceCropCycleStage(cycle.cropCycleId, idempotency('crop-stage', `${cycle.cropCycleId}:${nextStage}`), nextStage),
                `เปลี่ยน Stage เป็น ${cropStageLabels[nextStage]} แล้ว`,
              )}>ไปขั้น {cropStageLabels[nextStage]}</button> : null}
            </article>
          })}</div>
        </section>

        <section className="commercial-section" aria-labelledby="fruit-title">
          <div className="section-heading"><div><span className="status-pill">Fruit Observation</span><h2 id="fruit-title">บันทึกจำนวนผลพร้อมฐานข้อมูล</h2></div></div>
          <div className="observation-list">{snapshot.fruitObservations.map((item) => <article className="observation-card" key={item.observationId}>
            <span className={`quality-pill quality-pill--${item.valueQuality.toLowerCase()}`}>{valueQualityLabels[item.valueQuality]}</span>
            <strong>{cropStageLabels[item.stage]} · {item.observedCount ?? 'ยังไม่ทราบ'} {item.unit}</strong>
            <p>{fruitCountingModeLabels[item.countingMode]} · ผลร่วง {item.droppedCount ?? 'ยังไม่ทราบ'} · {item.countMethod} · {item.observedAt}</p>
            {item.sourceCountSessionId ? <small>AI Count Session: {item.sourceCountSessionId}</small> : null}
            <small>{item.confidenceNote}</small>
          </article>)}</div>
        </section>

        <section className="commercial-section" aria-labelledby="lot-title">
          <div className="section-heading"><div><span className="status-pill">Lots</span><h2 id="lot-title">Harvest และ Sales Lots</h2></div></div>
          <div className="commercial-card-grid">{snapshot.harvestLots.map((lot) => <article className="commercial-card" key={lot.harvestLotId}>
            <small>Harvest · {lot.status}</small><h3>{lot.lotCode}</h3><strong>{lot.totalWeightKg ?? 'UNKNOWN'} kg</strong><p>ขายแล้ว {lot.soldWeightKg} kg · {valueQualityLabels[lot.valueQuality]}</p>
          </article>)}{snapshot.salesLots.map((lot) => {
            const financial = canAccessCommercialFinancialData(currentFarm)
              ? snapshot.financial?.salesLots.find((record) => record.salesLotId === lot.salesLotId)
              : undefined
            return <article className="commercial-card" key={lot.salesLotId}>
            <small>Sales · {lot.status}</small><h3>{lot.lotCode}</h3><strong>{lot.weightKg} kg</strong>
            {financial ? <p>{financial.customerReference} · ยอด {financial.grossAmountBaht.toLocaleString('th-TH')} · ค้าง {financial.outstandingBaht.toLocaleString('th-TH')} บาท · {financial.paymentStatus}</p> : <p>ข้อมูลล็อตเชิงปฏิบัติการ · ไม่แสดงข้อมูลการเงิน</p>}
            {financial && canAccessCommercialFinancialData(currentFarm) && lot.status !== 'ARCHIVED' ? <details><summary>แก้ยอดด้วย Correction Event</summary><form className="compact-form" onSubmit={(event) => onCorrection(event, lot.salesLotId, lot.weightKg)}>
              <label>ราคาต่อ kg<input name="unitPriceBahtPerKg" type="number" min="0" step="0.01" defaultValue={financial.unitPriceBahtPerKg} /></label>
              <label>มัดจำ<input name="depositBaht" type="number" min="0" step="0.01" defaultValue={financial.depositBaht} /></label>
              <label>รับแล้ว<input name="receivedBaht" type="number" min="0" step="0.01" defaultValue={financial.receivedBaht} /></label>
              <label>เหตุผล<textarea name="reason" required defaultValue="SIMULATED/TEST ONLY — correction review" /></label>
              <button className="primary-action" disabled={submitting} type="submit">บันทึก Correction</button>
            </form></details> : null}
          </article>})}</div>
        </section>

        {canRecordFruitObservation(currentFarm.role) ? <section className="commercial-form-stack" aria-label="ฟอร์ม Crop Cycle และ Fruit Observation">
          <details><summary>+ สร้าง Crop Cycle</summary><form className="commercial-form" onSubmit={onCreateCycle}>
            <label>รอบบริหารสวน<select name="annualCycleId" required defaultValue={annualCycleSnapshot.selectedCycle?.annualCycleId}>{annualCycleSnapshot.cycles.filter((cycle) => cycle.status !== 'CLOSED').map((cycle) => <option key={cycle.annualCycleId} value={cycle.annualCycleId}>{cycle.cycleCode} · {cycle.name}</option>)}</select></label>
            <label>รหัสรอบ<input name="cycleCode" required defaultValue={`CROP-${currentFarm.farmCode}-DEMO-02`} /></label>
            <label>ชื่อรอบ<input name="name" required defaultValue="รอบผลผลิตจำลองใหม่" /></label>
            <label>Stage<select name="stage" defaultValue="FLOWERING">{cropStages.map((stage) => <option key={stage} value={stage}>{cropStageLabels[stage]}</option>)}</select></label>
            <label>Zone (คั่นด้วย comma)<input name="zoneCodes" required defaultValue="Z01" /></label>
            <label>Variety reference<input name="varietyReference" required defaultValue="VARIETY-DEMO-ONLY" /></label>
            <label>วันที่คาดเก็บเกี่ยว<input name="expectedHarvestDate" type="date" /></label>
            <button className="primary-action" disabled={submitting} type="submit">สร้างรอบจำลอง</button>
          </form></details>
          <details id="fruit-observation-form" onToggle={(event) => {
            const open = event.currentTarget.open
            setFormOpenOverride((current) => ({ observation: open, harvest: current?.harvest ?? harvestFormOpen }))
          }} open={observationFormOpen}><summary>+ บันทึกจำนวนผล</summary><form className="commercial-form" onSubmit={onObservation}>
            <label>Crop Cycle<select name="cropCycleId" defaultValue={activeCycle?.cropCycleId}>{snapshot.cropCycles.filter((item) => item.status === 'ACTIVE').map((cycle) => <option key={cycle.cropCycleId} value={cycle.cropCycleId}>{cycle.cycleCode}</option>)}</select></label>
            <label>Stage<select name="stage" value={observationStage} onChange={(event) => onObservationStageChange(event.target.value as CropStage)}>{cropStages.map((stage) => <option key={stage} value={stage}>{cropStageLabels[stage]}</option>)}</select></label>
            <label>ขอบเขต<select value={observationScopeKind} onChange={(event) => {
              const next = event.target.value as 'TREE' | 'ZONE'
              setObservationScopeKind(next)
              const anchorId = observationPositionIds[0] ?? trees.find((tree) => tree.currentCycle.treeStatus !== 'empty')?.positionId
              if (!anchorId) return
              setObservationPositionIds(positionIdsForAnchor(
                trees,
                anchorId,
                next === 'ZONE' ? 'ZONE' : 'SINGLE',
                (tree) => tree.currentCycle.treeStatus !== 'empty',
              ))
            }}><option value="ZONE">ระดับโซน</option><option value="TREE">รายต้น/ชุดต้น</option></select></label>
            <div className="span-full">{currentFarm ? <OrchardTargetSelector
              defaultView="CHECKLIST"
              disabledReason={(tree) => tree.currentCycle.treeStatus === 'empty' ? 'ตำแหน่งไม่มีต้น จึงบันทึกจำนวนผลไม่ได้' : undefined}
              farm={currentFarm}
              onChange={setObservationPositionIds}
              positions={trees}
              selectedPositionIds={observationPositionIds}
              selectionMode={observationScopeKind === 'ZONE' ? 'ZONE' : 'MULTIPLE'}
              title="เลือกขอบเขตการสังเกตผล"
            /> : null}</div>
            <label>วิธีได้มาของจำนวน<select name="countingMode" value={countingMode} onChange={(event) => onCountingModeChange(event.target.value as FruitCountingMode)}><option value="MANUAL">คนนับ</option><option value="AI_ASSISTED" disabled={observationStage === 'FLOWERING'}>AI ช่วยนับ + คนตรวจ</option></select></label>
            <label>คุณภาพค่า<select name="valueQuality" value={countingMode === 'AI_ASSISTED' ? 'ESTIMATED' : valueQuality} disabled={countingMode === 'AI_ASSISTED'} onChange={(event) => setValueQuality(event.target.value as ValueQuality)}><option value="MEASURED">วัดจริง</option><option value="ESTIMATED">ประมาณการ</option><option value="UNKNOWN">ยังไม่ทราบ</option></select></label>
            <label>ขอบเขตการนับ<select name="countMethod" value={countMethod} onChange={(event) => setCountMethod(event.target.value as CountMethod)}><option value="FULL_COUNT" disabled={countingMode === 'AI_ASSISTED'}>นับครบ</option><option value="SAMPLE">สุ่มตัวอย่าง</option><option value="ESTIMATE">ประมาณ</option><option value="UNKNOWN" disabled={countingMode === 'AI_ASSISTED'}>ยังไม่ทราบ</option></select></label>
            {countingMode === 'AI_ASSISTED' ? <section className="ai-count-panel span-full" aria-label="AI Fruit Counting จำลอง">
              <strong>AI Fruit Counting · SIMULATED/TEST ONLY</strong>
              <p>ระบบจำลองผลอย่างคงที่เพื่อทดสอบขั้นตอนเท่านั้น ไม่ได้อ่านภาพจริง และต้องให้คนตรวจทานก่อนบันทึก</p>
              <label>ชุดภาพจำลอง<select value={aiCaptureMethod} onChange={(event) => { setAiCaptureMethod(event.target.value as AiCaptureMethod); setAiCountResult(undefined) }}>{aiCaptureMethods.map((method) => <option key={method} value={method}>{aiCaptureMethodLabels[method]}</option>)}</select></label>
              <button className="secondary-action" type="button" onClick={onRunAiMock}>ให้ AI จำลองช่วยนับ</button>
              {aiCountResult ? <div className="ai-count-summary" role="status">
                <span>พบในภาพ {aiCountResult.aiVisibleCount}</span>
                <span>หลังตัดซ้ำ {aiCountResult.trackedCount}</span>
                <span>ไม่แน่ใจ {aiCountResult.uncertainCount}</span>
                <strong>เสนอให้คนตรวจ {aiCountResult.proposedReviewedCount} ผล</strong>
              </div> : <small>กรุณารัน AI จำลองก่อน แล้วตรวจหรือแก้จำนวนผลด้านล่าง</small>}
            </section> : null}
            <label>จำนวนผล<input aria-label="จำนวนผล" name="observedCount" type="number" min="0" inputMode="numeric" value={observedCount} onChange={(event) => setObservedCount(event.target.value)} /></label>
            <label>ผลร่วง<input name="droppedCount" type="number" min="0" inputMode="numeric" defaultValue="3" /></label>
            <label>วันที่สังเกต<input name="observedAt" type="date" required defaultValue="2026-08-31" /></label>
            <label className="span-full">ฐานข้อมูล/ข้อจำกัด<textarea name="confidenceNote" required value={confidenceNote} onChange={(event) => setConfidenceNote(event.target.value)} /></label>
            <button className="primary-action span-full" disabled={submitting} type="submit">บันทึก Fruit Observation</button>
          </form></details>
        </section> : null}

        {canManageCommercial(currentFarm.role) ? <section className="commercial-form-stack" aria-label="ฟอร์ม Harvest และ Sales">
          <details id="harvest-lot-form" onToggle={(event) => {
            const open = event.currentTarget.open
            setFormOpenOverride((current) => ({ observation: current?.observation ?? observationFormOpen, harvest: open }))
          }} open={harvestFormOpen}><summary>+ สร้าง Harvest Lot</summary><form className="commercial-form" onSubmit={onHarvest}>
            <label>Crop Cycle<select name="cropCycleId" defaultValue={activeCycle?.cropCycleId}>{snapshot.cropCycles.filter((item) => item.status === 'ACTIVE').map((cycle) => <option key={cycle.cropCycleId} value={cycle.cropCycleId}>{cycle.cycleCode}</option>)}</select></label>
            <label>รหัส Harvest Lot<input name="lotCode" required defaultValue={`H-${currentFarm.farmCode}-DEMO-02`} /></label>
            <label>วันที่เก็บเกี่ยว<input name="harvestedOn" type="date" required defaultValue="2026-08-31" /></label>
            <div className="span-full">{currentFarm ? <OrchardTargetSelector
              defaultView="CHECKLIST"
              disabledReason={(tree) => tree.currentCycle.treeStatus === 'empty' ? 'ตำแหน่งไม่มีต้น จึงใช้เป็นแหล่งเก็บเกี่ยวไม่ได้' : undefined}
              farm={currentFarm}
              onChange={setHarvestPositionIds}
              positions={trees}
              selectedPositionIds={harvestPositionIds}
              selectionMode="MULTIPLE"
              title="เลือกต้นหรือพื้นที่ต้นทางของ Harvest Lot"
            /> : null}</div>
            <label>จำนวนผล<input name="quantityFruit" type="number" min="0" defaultValue="40" /></label>
            <label>น้ำหนัก kg<input name="totalWeightKg" type="number" min="0" step="0.001" defaultValue="100" /></label>
            <label>คุณภาพค่า<select name="valueQuality" defaultValue="MEASURED"><option value="MEASURED">วัดจริง</option><option value="ESTIMATED">ประมาณการ</option><option value="UNKNOWN">ยังไม่ทราบ</option></select></label>
            <label>หมายเหตุ<input name="note" defaultValue="SIMULATED/TEST ONLY" /></label>
            <button className="primary-action span-full" disabled={submitting} type="submit">สร้าง Harvest Lot</button>
          </form></details>
          <details><summary>+ สร้าง Sales Lot</summary><form className="commercial-form" onSubmit={onSale}>
            <label>Harvest Lot<select name="harvestLotId" defaultValue={availableHarvests[0]?.harvestLotId}>{availableHarvests.map((lot) => <option key={lot.harvestLotId} value={lot.harvestLotId}>{lot.lotCode} · เหลือ {(lot.totalWeightKg ?? 0) - lot.soldWeightKg} kg</option>)}</select></label>
            <label>รหัส Sales Lot<input name="lotCode" required defaultValue={`S-${currentFarm.farmCode}-DEMO-02`} /></label>
            <label>วันที่ขาย<input name="soldOn" type="date" required defaultValue="2026-08-31" /></label>
            <label>จำนวนผล<input name="quantityFruit" type="number" min="0" defaultValue="20" /></label>
            <label>น้ำหนัก kg<input name="weightKg" type="number" min="0.001" step="0.001" required defaultValue="50" /></label>
            {canAccessCommercialFinancialData(currentFarm) ? <>
              <label>Customer reference<input name="customerReference" required defaultValue="BUYER-DEMO-002" /></label>
              <label>บาท/kg<input name="unitPriceBahtPerKg" type="number" min="0" step="0.01" required defaultValue="150" /></label>
              <label>มัดจำ<input name="depositBaht" type="number" min="0" step="0.01" required defaultValue="1000" /></label>
              <label>รับแล้ว<input name="receivedBaht" type="number" min="0" step="0.01" required defaultValue="0" /></label>
            </> : <p className="span-full">บันทึกเฉพาะข้อมูลล็อตเชิงปฏิบัติการ; ราคาและการรับเงินให้เจ้าขององค์กรบันทึก</p>}
            <label className="span-full">หมายเหตุ<input name="note" defaultValue="SIMULATED/TEST ONLY — customer reference only" /></label>
            <button className="primary-action span-full" type="submit" disabled={submitting || availableHarvests.length === 0}>สร้าง Sales Lot</button>
          </form></details>
        </section> : null}
      </> : null}
    </section>
  )
}
