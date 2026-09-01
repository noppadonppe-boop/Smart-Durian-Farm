import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
import {
  canApproveCommercialCorrection,
  canManageCommercial,
  canReadCommercial,
  type CommercialSnapshot,
  type InventoryMovementType,
} from '../domain/commercialTraceability'
import { PageHeader } from './PageHeader'

function formText(form: FormData, name: string): string {
  const value = form.get(name)
  return typeof value === 'string' ? value : ''
}

export function InventoryPage() {
  const { currentFarm, mode, listCommercialSnapshot, recordInventoryMovement, resetPhase5MockData } = usePhase2()
  const [snapshot, setSnapshot] = useState<CommercialSnapshot>()
  const [selectedItemId, setSelectedItemId] = useState('')
  const [selectedLotId, setSelectedLotId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()
  const [message, setMessage] = useState<string>()
  const submissionLock = useRef(false)
  const idempotencyKeys = useRef(new Map<string, string>())

  const load = useCallback(async () => {
    if (!currentFarm || !canReadCommercial(currentFarm.role)) return
    try { setSnapshot(await listCommercialSnapshot()) } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'อ่านสต็อกไม่สำเร็จ')
    }
  }, [currentFarm, listCommercialSnapshot])

  useEffect(() => {
    queueMicrotask(() => { void load() })
  }, [load])
  if (!currentFarm) return null
  if (!canReadCommercial(currentFarm.role)) return <section className="page-stack"><PageHeader eyebrow="Phase 5 · Least privilege" title="ไม่มีสิทธิ์เปิดสต็อก" description="ข้อมูลสต็อกแยกตามสวนและบทบาท" /><Link to="/work">กลับงาน</Link></section>

  const onMovement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submissionLock.current) return
    submissionLock.current = true
    setSaving(true)
    const form = new FormData(event.currentTarget)
    const signature = JSON.stringify([...form.entries()].map(([name, value]) => [
      name,
      typeof value === 'string' ? value : `${value.name}:${value.size}:${value.type}`,
    ]))
    let idempotencyKey = idempotencyKeys.current.get(signature)
    if (!idempotencyKey) {
      idempotencyKey = `inventory-${crypto.randomUUID()}`
      idempotencyKeys.current.set(signature, idempotencyKey)
    }
    setError(undefined); setMessage(undefined)
    try {
      await recordInventoryMovement(idempotencyKey, {
        itemId: formText(form, 'itemId'),
        lotId: formText(form, 'lotId'),
        effectiveOn: formText(form, 'effectiveOn'),
        movementType: formText(form, 'movementType') as InventoryMovementType,
        quantity: Number(formText(form, 'quantity')),
        unit: formText(form, 'unit'),
        reason: formText(form, 'reason'),
        referenceType: formText(form, 'referenceType') as 'PURCHASE_REFERENCE' | 'WORK_ORDER' | 'CARE_EVENT' | 'COUNT_CORRECTION',
        referenceId: formText(form, 'referenceId'),
        directUnitCostBaht: formText(form, 'directUnitCostBaht').trim() ? Number(formText(form, 'directUnitCostBaht')) : null,
      })
      setMessage('บันทึก Inventory Movement และ Audit แล้ว')
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'บันทึกไม่สำเร็จ')
    } finally {
      submissionLock.current = false
      setSaving(false)
    }
  }

  const reset = () => {
    setError(undefined)
    void resetPhase5MockData().then(async () => { setMessage('Reset กลับ Mock Data Pack v1.0.0 แล้ว'); await load() })
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Reset ไม่สำเร็จ'))
  }

  const firstItem = snapshot?.inventoryItems.find((item) => item.status === 'ACTIVE')
  const activeItems = snapshot?.inventoryItems.filter((item) => item.status === 'ACTIVE') ?? []
  const selectedItem = activeItems.find((item) => item.itemId === selectedItemId) ?? firstItem
  const selectedLot = selectedItem?.lots.find((lot) => lot.lotId === selectedLotId) ?? selectedItem?.lots[0]

  const selectItem = (itemId: string) => {
    const item = activeItems.find((candidate) => candidate.itemId === itemId)
    setSelectedItemId(itemId)
    setSelectedLotId(item?.lots[0]?.lotId ?? '')
  }

  return <section className="page-stack commercial-page">
    <PageHeader eyebrow="Phase 5 · Farm-scoped Inventory" title="สต็อก วัสดุ และต้นทุนตรง" description="รับเข้า เบิกใช้ ปรับยอดพร้อมเหตุผลและ Reference; ปฏิเสธสต็อกติดลบและการแปลงหน่วยที่ไม่ได้กำหนด" />
    <div className="field-validation-banner" role="note"><strong>SIMULATED/TEST ONLY · {currentFarm.farmCode}</strong><span>ไม่มีการโอนข้ามสวน และไม่ใช่ระบบบัญชี</span></div>
    {error ? <div className="form-error" role="alert">{error}</div> : null}
    {message ? <div className="success-notice" role="status">{message}</div> : null}
    {snapshot ? <>
      <div className="commercial-metrics">
        <article><small>รายการวัสดุ</small><strong>{snapshot.inventoryItems.length}</strong><span>Item</span></article>
        <article><small>แจ้งเตือน</small><strong>{snapshot.alerts.length}</strong><span>Low stock/Expiry</span></article>
        <article><small>ต้นทุนเบิกใช้</small><strong>{snapshot.directCostSummary.totalIssuedCostBaht.toLocaleString('th-TH')}</strong><span>บาท · เท่าที่มีข้อมูล</span></article>
        <article><small>ไม่ทราบต้นทุน</small><strong>{snapshot.directCostSummary.unknownCostMovementCount}</strong><span>Movement</span></article>
      </div>
      <section className="commercial-section"><div className="section-heading"><div><span className="status-pill">Alerts</span><h2>เตือนสต็อกต่ำและใกล้หมดอายุ</h2></div><Link to="/production">กลับ Traceability</Link></div>
        <div className="alert-grid">{snapshot.alerts.map((alert) => <article className={`inventory-alert inventory-alert--${alert.kind.toLowerCase()}`} key={alert.alertId}><strong>{alert.title}</strong><p>{alert.description}</p></article>)}{snapshot.alerts.length === 0 ? <p>ไม่มีรายการเตือน</p> : null}</div>
      </section>
      <section className="commercial-section"><div className="section-heading"><div><span className="status-pill">Balance by lot</span><h2>ยอดคงเหลือรายล็อต</h2></div></div>
        <div className="commercial-card-grid">{snapshot.inventoryItems.map((item) => <article className="commercial-card" key={item.itemId}><small>{item.itemCode}</small><h3>{item.name}</h3>{item.lots.map((lot) => {
          const balance = snapshot.inventoryBalances.find((entry) => entry.itemId === item.itemId && entry.lotId === lot.lotId)
          return <p key={lot.lotId}><strong>{balance?.balance ?? 0} {item.baseUnit}</strong> · {lot.lotCode}<br /><small>หมดอายุ {lot.expiresOn ?? 'ไม่มี'}</small></p>
        })}</article>)}</div>
      </section>
      <section className="commercial-section"><div className="section-heading"><div><span className="status-pill">Movement history</span><h2>ประวัติรับ–เบิก–ปรับยอด</h2></div></div>
        <div className="movement-list">{snapshot.inventoryMovements.map((movement) => <article key={movement.movementId}><span className={`movement-sign movement-sign--${movement.quantityDelta < 0 ? 'out' : 'in'}`}>{movement.quantityDelta > 0 ? '+' : ''}{movement.quantityDelta}</span><div><strong>{movement.movementType} · {movement.unit}</strong><p>{movement.reason}</p><small>{movement.referenceType}: {movement.referenceId} · ต้นทุน {movement.directCostBaht?.toLocaleString('th-TH') ?? 'UNKNOWN'} บาท</small></div></article>)}</div>
      </section>
      {canManageCommercial(currentFarm.role) && selectedItem && selectedLot ? <details className="inventory-form-panel" open><summary>+ บันทึก Inventory Movement</summary><form className="commercial-form" onSubmit={(event) => { void onMovement(event) }}>
        <label>Item<select name="itemId" value={selectedItem.itemId} onChange={(event) => selectItem(event.target.value)}>{activeItems.map((item) => <option value={item.itemId} key={item.itemId}>{item.itemCode} · {item.name}</option>)}</select></label>
        <label>Lot<select name="lotId" value={selectedLot.lotId} onChange={(event) => setSelectedLotId(event.target.value)}>{selectedItem.lots.map((lot) => <option value={lot.lotId} key={lot.lotId}>{lot.lotCode} ({selectedItem.baseUnit})</option>)}</select><small>แสดงเฉพาะล็อตของ Item ที่เลือก</small></label>
        <label>วันที่เคลื่อนไหว<input name="effectiveOn" type="date" required defaultValue="2026-08-31" /></label>
        <label>ประเภท<select name="movementType" defaultValue="ISSUE"><option value="RECEIPT">รับเข้า</option><option value="ISSUE">เบิกใช้</option>{canApproveCommercialCorrection(currentFarm.role) ? <option value="ADJUSTMENT">ปรับยอดโดย Owner/Manager</option> : null}</select></label>
        <label>จำนวน<input name="quantity" type="number" step="0.001" required defaultValue="1" /><small>Adjustment ใช้ค่าลบได้; Receipt/Issue ใช้ค่าบวก</small></label>
        <label>หน่วย<input name="unit" readOnly value={selectedItem.baseUnit} /><small>กำหนดจากหน่วยฐานของ Item เพื่อไม่คาดเดาการแปลง</small></label>
        <label>Reference type<select name="referenceType" defaultValue="WORK_ORDER"><option value="PURCHASE_REFERENCE">เอกสารรับเข้า</option><option value="WORK_ORDER">Work Order</option><option value="CARE_EVENT">Care Event</option>{canApproveCommercialCorrection(currentFarm.role) ? <option value="COUNT_CORRECTION">ตรวจนับ/Correction</option> : null}</select></label>
        <label>Reference ID<input name="referenceId" required defaultValue="work_demo_tree_000001" /></label>
        <label>ต้นทุนต่อหน่วย (บาท)<input name="directUnitCostBaht" type="number" min="0" step="0.01" defaultValue="42.5" /></label>
        <label className="span-full">เหตุผล<input name="reason" required defaultValue="SIMULATED/TEST ONLY — เบิกใช้กับงานจำลอง" /></label>
        <button className="primary-action span-full" disabled={saving} type="submit">{saving ? 'กำลังบันทึก…' : 'บันทึก Movement'}</button>
      </form></details> : null}
      {mode === 'mock' ? <section className="phase2-test-controls"><span className="status-pill">Resettable fixture</span><h2>รีเซ็ตข้อมูล Phase 5</h2><p>ลบเฉพาะ mutation ในหน่วยความจำและโหลด Pack v1.0.0 เดิมกลับมา ไม่แตะข้อมูลจริง</p><button className="secondary-action" disabled={saving} type="button" onClick={reset}>Reset Mock Data Pack</button></section> : null}
    </> : <div className="loading-inline" role="status">กำลังอ่านสต็อก…</div>}
  </section>
}
