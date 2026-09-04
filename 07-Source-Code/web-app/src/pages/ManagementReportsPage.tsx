import { useCallback, useEffect, useState, type FormEvent } from 'react'

import { usePhase2 } from '../app/usePhase2'
import {
  canExportManagementReport,
  canRecordLaborCost,
  canRecordOperatingExpense,
  canViewManagementReports,
  createManagementReportCsv,
  expenseAllocationScopeLabels,
  expenseCategories,
  expenseCategoryLabels,
  laborCostBases,
  laborCostBasisLabels,
  laborReferenceTypeLabels,
  laborReferenceTypes,
  reportPeriodKindLabels,
  reportPeriodKinds,
  type ExpenseAllocationScope,
  type ExpenseCategory,
  type FarmManagementReport,
  type LaborCostBasis,
  type LaborReferenceType,
  type ReportPeriodKind,
} from '../domain/managementReporting'
import { PageHeader } from './PageHeader'

function formText(form: FormData, name: string): string {
  const value = form.get(name)
  return typeof value === 'string' ? value : ''
}

function formatMoney(value: number): string {
  return `${value.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท`
}

function formatOptional(value: number | null, suffix = ''): string {
  return value === null ? 'N/A' : `${value.toLocaleString('th-TH', { maximumFractionDigits: 3 })}${suffix}`
}

function defaultAnchor(periodStart: string, periodEndExclusive: string): string {
  const preferred = '2026-08-31'
  if (preferred >= periodStart && preferred < periodEndExclusive) return preferred
  return periodStart
}

export function ManagementReportsPage() {
  const {
    mode,
    currentFarm,
    identity,
    annualCycleSnapshot,
    annualCyclesLoading,
    generateManagementReport,
    createLaborCost,
    createOperatingExpense,
    resetManagementReportingMockData,
  } = usePhase2()
  const selectedCycle = annualCycleSnapshot.selectedCycle
  const [kind, setKind] = useState<ReportPeriodKind>('MONTHLY')
  const [anchorDate, setAnchorDate] = useState('2026-08-31')
  const [report, setReport] = useState<FarmManagementReport>()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()
  const [message, setMessage] = useState<string>()

  useEffect(() => {
    if (!selectedCycle) return
    if (anchorDate < selectedCycle.periodStart || anchorDate >= selectedCycle.periodEndExclusive) {
      const timeoutId = window.setTimeout(() => {
        setAnchorDate(defaultAnchor(selectedCycle.periodStart, selectedCycle.periodEndExclusive))
      }, 0)
      return () => window.clearTimeout(timeoutId)
    }
    return undefined
  }, [anchorDate, selectedCycle])

  const load = useCallback(async () => {
    if (!currentFarm || !identity || !selectedCycle || !canViewManagementReports(currentFarm)) return
    setLoading(true)
    setError(undefined)
    try {
      setReport(await generateManagementReport(kind, anchorDate))
    } catch (caught) {
      setReport(undefined)
      setError(caught instanceof Error ? caught.message : 'สร้างรายงานไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [anchorDate, currentFarm, generateManagementReport, identity, kind, selectedCycle])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [load])

  if (!currentFarm || !identity) return null
  if (!canViewManagementReports(currentFarm)) {
    return <section className="page-stack"><PageHeader eyebrow="Access denied" title="รายงานการจัดการสวน" description="บทบาทปัจจุบันไม่มีสิทธิ์ดูข้อมูลต้นทุนและรายงานระดับสวน" /></section>
  }

  const submitLabor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedCycle) return
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    setSaving(true); setError(undefined); setMessage(undefined)
    try {
      await createLaborCost(`labor-${crypto.randomUUID()}`, {
        annualCycleId: selectedCycle.annualCycleId,
        incurredOn: formText(form, 'incurredOn'),
        workerReference: formText(form, 'workerReference'),
        basis: formText(form, 'basis') as LaborCostBasis,
        quantity: Number(formText(form, 'quantity')),
        rateBaht: Number(formText(form, 'rateBaht')),
        referenceType: formText(form, 'referenceType') as LaborReferenceType,
        referenceId: formText(form, 'referenceId'),
        notes: formText(form, 'notes'),
      })
      setMessage('บันทึกต้นทุนแรงงานแบบจำลองและ Audit แล้ว')
      await load()
      formElement.reset()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'บันทึกต้นทุนแรงงานไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const submitExpense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedCycle) return
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    setSaving(true); setError(undefined); setMessage(undefined)
    try {
      await createOperatingExpense(`expense-${crypto.randomUUID()}`, {
        annualCycleId: selectedCycle.annualCycleId,
        incurredOn: formText(form, 'incurredOn'),
        category: formText(form, 'category') as ExpenseCategory,
        description: formText(form, 'description'),
        amountBaht: Number(formText(form, 'amountBaht')),
        allocationScope: formText(form, 'allocationScope') as ExpenseAllocationScope,
        allocationReferenceId: formText(form, 'allocationReferenceId'),
        notes: formText(form, 'notes'),
      })
      setMessage('บันทึกค่าใช้จ่ายแบบจำลองและ Audit แล้ว')
      await load()
      formElement.reset()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'บันทึกค่าใช้จ่ายไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const downloadCsv = () => {
    if (!report || !canExportManagementReport(currentFarm)) return
    const blob = new Blob([createManagementReportCsv(report)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${currentFarm.farmCode}-${report.reportCode}-${report.period.periodStart}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
    setMessage('สร้าง CSV ในเครื่องแล้ว · ไม่มี public link')
  }

  const reset = async () => {
    setSaving(true); setError(undefined); setMessage(undefined)
    try {
      await resetManagementReportingMockData()
      setMessage('Reset Management Reporting Mock Data Pack v1.0.0 แล้ว')
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Reset ไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  return <section className="page-stack management-report-page">
    <PageHeader
      eyebrow="DEC-049 · Farm-scoped management reporting"
      title="รายงานการจัดการสวนและต้นทุน"
      description="รายสัปดาห์ รายเดือน ราย 3 เดือน และรายปี · แยกผลผลิต ยอดขาย ต้นทุนแรงงาน วัสดุ ค่าใช้จ่ายดำเนินงาน และสินทรัพย์ลงทุน"
      backTo="/more"
    />
    <div className="field-validation-banner" role="note">
      <strong>SIMULATED/TEST ONLY · {currentFarm.farmCode}</strong>
      <span>ต้นทุนเพื่อการบริหารสวน ไม่ใช่ Payroll/บัญชี/ภาษี · ไม่มีข้อมูลจริงหรือการส่งออกภายนอก</span>
    </div>
    {error ? <div className="form-error" role="alert">{error}</div> : null}
    {message ? <div className="success-notice" role="status">{message}</div> : null}
    {annualCyclesLoading || loading ? <div className="loading-inline" role="status">กำลังสร้างรายงานจากข้อมูลจำลอง…</div> : null}

    <section className="report-control-panel" aria-labelledby="report-filter-title">
      <div><span className="status-pill">Report period</span><h2 id="report-filter-title">เลือกงวดรายงาน</h2></div>
      <div className="report-filter-grid">
        <label>รอบรายงาน<select aria-label="รอบรายงาน" value={kind} onChange={(event) => setKind(event.target.value as ReportPeriodKind)}>{reportPeriodKinds.map((value) => <option key={value} value={value}>{reportPeriodKindLabels[value]}</option>)}</select></label>
        <label>วันที่อ้างอิง<input aria-label="วันที่อ้างอิงรายงาน" type="date" value={anchorDate} min={selectedCycle?.periodStart} max={selectedCycle ? new Date(new Date(`${selectedCycle.periodEndExclusive}T00:00:00Z`).valueOf() - 86400000).toISOString().slice(0, 10) : undefined} onChange={(event) => setAnchorDate(event.target.value)} /></label>
        <div><small>Annual Cycle</small><strong>{selectedCycle?.cycleCode ?? 'ยังไม่ได้เลือกรอบ'}</strong><span>{selectedCycle ? `${selectedCycle.periodStart} – ${selectedCycle.periodEndExclusive}` : ''}</span></div>
      </div>
    </section>

    {report ? <>
      <section className="report-summary" aria-labelledby="report-summary-title">
        <div className="section-heading"><div><span className="status-pill">{report.reportCode} · v{report.reportVersion}</span><h2 id="report-summary-title">{reportPeriodKindLabels[report.period.kind]} · {report.period.label}</h2></div>{canExportManagementReport(currentFarm) ? <button className="secondary-action" type="button" onClick={downloadCsv}>ดาวน์โหลด CSV</button> : null}</div>
        <div className="commercial-metrics report-metrics">
          <article><small>จำนวนผลล่าสุด</small><strong>{formatOptional(report.metrics.currentFruitCount, ' ผล')}</strong><span>ประมาณการ {report.metrics.currentFruitEstimatedCount} รายการ</span></article>
          <article><small>เก็บเกี่ยว</small><strong>{report.metrics.harvestFruitCount.toLocaleString('th-TH')} ผล</strong><span>{report.metrics.harvestWeightKg.toLocaleString('th-TH')} kg</span></article>
          <article><small>ยอดขายที่บันทึก</small><strong>{formatMoney(report.metrics.grossSalesRecordedBaht)}</strong><span>{report.metrics.salesWeightKg.toLocaleString('th-TH')} kg · ค้าง {formatMoney(report.metrics.outstandingSalesBaht)}</span></article>
          <article><small>ต้นทุนบริหารรวม</small><strong>{formatMoney(report.metrics.totalManagementCostBaht)}</strong><span>ไม่รวมลงทุน {formatMoney(report.metrics.capitalExpenseBaht)}</span></article>
          <article><small>ส่วนต่างเพื่อการบริหาร</small><strong>{formatMoney(report.metrics.managementMarginBaht)}</strong><span>{formatOptional(report.metrics.managementMarginRate, '%')} ของยอดขาย</span></article>
          <article><small>ต้นทุนต่อ kg</small><strong>{formatOptional(report.metrics.costPerHarvestKgBaht, ' บาท')}</strong><span>ต่อผล {formatOptional(report.metrics.costPerHarvestFruitBaht, ' บาท')}</span></article>
        </div>
      </section>

      <section className="report-breakdown" aria-labelledby="cost-breakdown-title">
        <div className="section-heading"><div><span className="status-pill">Cost breakdown</span><h2 id="cost-breakdown-title">ต้นทุนและแผน</h2></div></div>
        <div className="report-cost-grid">
          <article><small>วัสดุเบิกใช้</small><strong>{formatMoney(report.metrics.materialDirectCostBaht)}</strong><span>นับเมื่อ ISSUE ไม่ใช่เมื่อรับเข้า</span></article>
          <article><small>แรงงาน</small><strong>{formatMoney(report.metrics.laborCostBaht)}</strong><span>ต้นทุนบริหาร ไม่ใช่ Payroll</span></article>
          <article><small>ค่าใช้จ่ายดำเนินงาน</small><strong>{formatMoney(report.metrics.operatingExpenseBaht)}</strong><span>ไม่รวมสินทรัพย์ลงทุน</span></article>
          <article><small>แผนต้นทุนที่แตะงวด</small><strong>{formatMoney(report.metrics.plannedDirectCostBaht)}</strong><span>งวดย่อยยังไม่เฉลี่ยตามวัน</span></article>
        </div>
      </section>

      <section className="report-breakdown" aria-labelledby="operations-title">
        <div className="section-heading"><div><span className="status-pill">Farm management</span><h2 id="operations-title">งาน สุขภาพต้น และคุณภาพข้อมูล</h2></div></div>
        <div className="report-cost-grid">
          <article><small>งานครบกำหนด</small><strong>{report.metrics.workDueCount}</strong><span>ปิดแล้ว ณ ตอนสร้าง {report.metrics.workClosedSnapshotCount}</span></article>
          <article><small>งานเกินกำหนด</small><strong>{report.metrics.workOverdueSnapshotCount}</strong><span>สถานะ Snapshot</span></article>
          <article><small>เคสโรคเปิด</small><strong>{report.metrics.openDiseaseCount}</strong><span>ติดตามในงวด {report.metrics.followUpDueCount}</span></article>
          <article><small>ข้อมูลต้นทุนไม่ทราบ</small><strong>{report.metrics.unknownCostMovementCount}</strong><span>Inventory movement</span></article>
        </div>
        <div className="report-quality-flags" aria-label="ข้อจำกัดคุณภาพข้อมูล">{report.qualityFlags.map((flag) => <span key={flag}>{flag}</span>)}</div>
      </section>

      <section className="report-breakdown" aria-labelledby="detail-title">
        <div className="section-heading"><div><span className="status-pill">Drill-down</span><h2 id="detail-title">รายการต้นทางในงวด</h2></div></div>
        <div className="report-table-wrap"><table><thead><tr><th>วันที่</th><th>ประเภท</th><th>รายละเอียด</th><th>หมวด</th><th>จำนวน/มูลค่า</th></tr></thead><tbody>{report.details.map((row) => <tr key={`${row.sourceType}-${row.sourceId}`}><td>{row.effectiveOn}</td><td>{row.sourceType}</td><td>{row.description}<small>{row.sourceId}</small></td><td>{row.category}</td><td>{row.amountBaht === null ? `${row.quantity ?? 'UNKNOWN'} ${row.unit}` : formatMoney(row.amountBaht)}</td></tr>)}{report.details.length === 0 ? <tr><td colSpan={5}>ไม่มีรายการในงวดนี้</td></tr> : null}</tbody></table></div>
      </section>
    </> : null}

    {selectedCycle && (canRecordLaborCost(currentFarm) || canRecordOperatingExpense(currentFarm)) ? <section className="report-entry-section" aria-labelledby="cost-entry-title">
      <div className="section-heading"><div><span className="status-pill">Append-only mock entry</span><h2 id="cost-entry-title">บันทึกต้นทุนและค่าใช้จ่าย</h2></div></div>
      <p>บันทึกใหม่อย่างตรวจสอบย้อนหลังได้ ไม่มีปุ่มแก้หรือลบ และไม่ใช้ข้อมูลบุคคลจริง</p>
      <div className="report-entry-grid">
        {canRecordLaborCost(currentFarm) ? <details open><summary>+ ค่าแรงงาน</summary><form className="commercial-form" onSubmit={(event) => { void submitLabor(event) }}>
          <label>วันที่<input name="incurredOn" type="date" required defaultValue={anchorDate} /></label>
          <label>ทีม/ผู้ปฏิบัติงานแบบย่อ<input name="workerReference" required defaultValue="ทีมงานจำลอง C" /></label>
          <label>ฐานค่าจ้าง<select name="basis" defaultValue="DAY">{laborCostBases.map((value) => <option value={value} key={value}>{laborCostBasisLabels[value]}</option>)}</select></label>
          <label>จำนวนหน่วย<input name="quantity" type="number" min="0.001" step="0.001" required defaultValue="1" /></label>
          <label>อัตราต่อหน่วย (บาท)<input name="rateBaht" type="number" min="0" step="0.01" required defaultValue="550" /></label>
          <label>อ้างอิง<select name="referenceType" defaultValue="FARM_OPERATION">{laborReferenceTypes.map((value) => <option value={value} key={value}>{laborReferenceTypeLabels[value]}</option>)}</select></label>
          <label>รหัสอ้างอิง<input name="referenceId" required defaultValue={currentFarm.farmId} /></label>
          <label className="span-full">หมายเหตุ<input name="notes" defaultValue="SIMULATED/TEST ONLY — ไม่ใช่ Payroll" /></label>
          <button className="primary-action span-full" disabled={saving} type="submit">บันทึกค่าแรง</button>
        </form></details> : null}
        {canRecordOperatingExpense(currentFarm) ? <details open><summary>+ ค่าใช้จ่ายอื่น</summary><form className="commercial-form" onSubmit={(event) => { void submitExpense(event) }}>
          <label>วันที่<input name="incurredOn" type="date" required defaultValue={anchorDate} /></label>
          <label>หมวด<select name="category" defaultValue="WATER_ELECTRICITY">{expenseCategories.map((value) => <option value={value} key={value}>{expenseCategoryLabels[value]}</option>)}</select></label>
          <label className="span-full">รายละเอียด<input name="description" required defaultValue="ค่าใช้จ่ายดำเนินงานจำลอง" /></label>
          <label>จำนวนเงิน (บาท)<input name="amountBaht" type="number" min="0.01" step="0.01" required defaultValue="1000" /></label>
          <label>จัดสรรให้<select name="allocationScope" defaultValue="FARM">{Object.entries(expenseAllocationScopeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label>รหัสขอบเขต<input name="allocationReferenceId" defaultValue={currentFarm.farmId} /></label>
          <label className="span-full">หมายเหตุ<input name="notes" defaultValue="SIMULATED/TEST ONLY" /></label>
          <button className="primary-action span-full" disabled={saving} type="submit">บันทึกค่าใช้จ่าย</button>
        </form></details> : null}
      </div>
    </section> : null}

    {mode === 'mock' ? <section className="phase2-test-controls"><span className="status-pill">Resettable fixture</span><h2>รีเซ็ตข้อมูลรายงานและต้นทุน</h2><p>คืนค่าเฉพาะ Management Reporting Mock Data Pack v1.0.0 ไม่แตะ Annual Cycle หรือข้อมูลจริง</p><button className="secondary-action" disabled={saving} type="button" onClick={() => { void reset() }}>Reset Mock Pack</button></section> : null}
  </section>
}
