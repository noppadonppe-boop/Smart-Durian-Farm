import { useMemo, useState, type FormEvent } from 'react'

import { usePhase2 } from '../app/usePhase2'
import {
  annualCycleStatusLabels,
  annualPlanCategoryLabels,
  annualPlanScopeLabels,
  annualPlanStatusLabels,
  inclusivePeriodEnd,
  type AnnualCycleDraft,
  type AnnualCycleStatus,
  type AnnualPlanCategory,
  type AnnualPlanItemDraft,
  type AnnualPlanScope,
} from '../domain/annualFarmCycle'
import type { CanonicalRole } from '../domain/farm'
import { PageHeader } from './PageHeader'

function suggestedDraft(periodStart: string, previousAnnualCycleId: string | null): AnnualCycleDraft {
  return {
    cycleCode: `AFY-${periodStart.slice(0, 7)}`,
    name: `รอบบริหารสวน ${periodStart.slice(0, 4)}`,
    periodStart,
    timezone: 'Asia/Bangkok',
    notes: '',
    previousAnnualCycleId,
  }
}

function cloneDraft(cycle: NonNullable<ReturnType<typeof usePhase2>['annualCycleSnapshot']['selectedCycle']>): AnnualCycleDraft {
  return {
    cycleCode: cycle.cycleCode,
    name: cycle.name,
    periodStart: cycle.periodStart,
    timezone: cycle.timezone,
    notes: cycle.notes,
    previousAnnualCycleId: cycle.previousAnnualCycleId,
  }
}

function nextStatuses(status: AnnualCycleStatus): readonly AnnualCycleStatus[] {
  if (status === 'DRAFT') return ['PLANNED']
  if (status === 'PLANNED') return ['DRAFT', 'ACTIVE']
  if (status === 'ACTIVE') return ['CLOSING']
  if (status === 'CLOSING') return ['ACTIVE', 'CLOSED']
  return []
}

function targetDescription(scope: AnnualPlanScope, zones: readonly string[], positions: readonly string[]): string {
  if (scope === 'FARM') return 'ทั้งสวน'
  if (scope === 'ZONE') return zones.join(', ')
  return `${positions.length} ตำแหน่ง`
}

export function AnnualCyclePage() {
  const {
    currentFarm,
    annualCycleSnapshot,
    annualCyclesLoading,
    selectAnnualCycle,
    createAnnualCycle,
    updateAnnualCycle,
    transitionAnnualCycle,
    correctAnnualCycle,
    createAnnualPlanItem,
  } = usePhase2()
  const selected = annualCycleSnapshot.selectedCycle
  const [cycleDraft, setCycleDraft] = useState<AnnualCycleDraft>(() => suggestedDraft('2027-06-01', null))
  const [editDraft, setEditDraft] = useState<AnnualCycleDraft | null>(null)
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState<string>()
  const [error, setError] = useState<string>()
  const [planScope, setPlanScope] = useState<AnnualPlanScope>('FARM')
  const [planCategory, setPlanCategory] = useState<AnnualPlanCategory>('CARE')
  const [planTitle, setPlanTitle] = useState('')
  const [planTargets, setPlanTargets] = useState('')
  const [planStart, setPlanStart] = useState(selected?.periodStart ?? '2026-06-01')
  const [planEndExclusive, setPlanEndExclusive] = useState(selected?.periodEndExclusive ?? '2027-06-01')
  const [responsibleRole, setResponsibleRole] = useState<CanonicalRole>('FARM_MANAGER')

  const canManageCycle = Boolean(currentFarm?.isOrganizationOwner && currentFarm.farmStatus === 'ACTIVE')
  const canManagePlan = Boolean(currentFarm?.farmStatus === 'ACTIVE' && (
    currentFarm.isOrganizationOwner || currentFarm.role === 'FARM_MANAGER'
  ))
  const counts = useMemo(() => ({
    total: annualCycleSnapshot.planItems.length,
    completed: annualCycleSnapshot.planItems.filter((item) => item.status === 'COMPLETED').length,
    zone: annualCycleSnapshot.planItems.filter((item) => item.target.scope === 'ZONE').length,
    treeSet: annualCycleSnapshot.planItems.filter((item) => item.target.scope === 'TREE_SET').length,
  }), [annualCycleSnapshot.planItems])

  const run = async (task: () => Promise<unknown>, success: string) => {
    setError(undefined)
    setMessage(undefined)
    try {
      await task()
      setMessage(success)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'ดำเนินการไม่สำเร็จ')
    }
  }

  const submitNewCycle = (event: FormEvent) => {
    event.preventDefault()
    void run(
      () => createAnnualCycle(crypto.randomUUID(), cycleDraft),
      'สร้างรอบปีแบบร่างแล้ว',
    )
  }

  const submitCycleChange = (event: FormEvent) => {
    event.preventDefault()
    if (!selected || !editDraft) return
    const correctionOnly = !['DRAFT', 'PLANNED'].includes(selected.status)
    void run(
      () => correctionOnly
        ? correctAnnualCycle(selected.annualCycleId, crypto.randomUUID(), editDraft, reason)
        : updateAnnualCycle(selected.annualCycleId, crypto.randomUUID(), editDraft, reason),
      correctionOnly ? 'บันทึก Correction และเก็บ revision เดิมแล้ว' : 'แก้ไขรอบปีแล้ว',
    )
  }

  const submitPlan = (event: FormEvent) => {
    event.preventDefault()
    if (!selected) return
    const values = planTargets.split(',').map((value) => value.trim()).filter(Boolean)
    const draft: AnnualPlanItemDraft = {
      title: planTitle,
      category: planCategory,
      target: {
        scope: planScope,
        zoneCodes: planScope === 'ZONE' ? values : [],
        positionIds: planScope === 'TREE_SET' ? values : [],
      },
      triggerType: 'DATE_WINDOW',
      plannedStart: planStart,
      plannedEndExclusive: planEndExclusive,
      cropStage: null,
      conditionNote: '',
      responsibleRole,
      plannedQuantity: null,
      plannedUnit: '',
      notes: '',
    }
    void run(
      () => createAnnualPlanItem(selected.annualCycleId, crypto.randomUUID(), draft),
      'เพิ่มแผนประจำปีแล้ว',
    )
  }

  if (!currentFarm) return null

  return (
    <section className="page-stack annual-cycle-page">
      <PageHeader
        eyebrow="Annual Farm Management Cycle · Firebase Production"
        title="รอบบริหารสวนรายปี"
        description="หนึ่งรอบต่อหนึ่งสวน ค่าเริ่มต้นมิถุนายน–พฤษภาคม และ Owner กำหนดวันเริ่มเฉพาะสวนได้"
        backTo="/more"
      />

      {message ? <p className="annual-feedback" role="status">{message}</p> : null}
      {error ? <p className="annual-feedback annual-feedback--error" role="alert">{error}</p> : null}

      <section aria-labelledby="annual-history-title" className="annual-section">
        <header className="annual-section__header">
          <div>
            <span className="status-pill">Farm scoped</span>
            <h2 id="annual-history-title">รายการรอบปีของ {currentFarm.farmName}</h2>
          </div>
          <small>{annualCyclesLoading ? 'กำลังโหลด…' : `${annualCycleSnapshot.cycles.length} รอบ`}</small>
        </header>
        <div className="annual-cycle-list">
          {annualCycleSnapshot.cycles.map((cycle) => (
            <button
              aria-current={cycle.annualCycleId === selected?.annualCycleId ? 'true' : undefined}
              key={cycle.annualCycleId}
              onClick={() => {
                selectAnnualCycle(cycle.annualCycleId)
                setEditDraft(null)
                setMessage(undefined)
              }}
              type="button"
            >
              <span><strong>{cycle.cycleCode}</strong><small>{cycle.name}</small></span>
              <span><b>{annualCycleStatusLabels[cycle.status]}</b><small>{cycle.periodStart} – {inclusivePeriodEnd(cycle.periodEndExclusive)}</small></span>
            </button>
          ))}
          {annualCycleSnapshot.cycles.length === 0 ? <p className="empty-state">ยังไม่มีรอบปีในสวนนี้</p> : null}
        </div>
      </section>

      {selected ? (
        <>
          <section aria-labelledby="annual-current-title" className="annual-section annual-current-card">
            <header className="annual-section__header">
              <div>
                <span className={`annual-status annual-status--${selected.status.toLowerCase()}`}>
                  {annualCycleStatusLabels[selected.status]}
                </span>
                <h2 id="annual-current-title">{selected.name}</h2>
              </div>
              <code>{selected.cycleCode}</code>
            </header>
            <dl className="annual-definition-grid">
              <div><dt>ช่วงรอบ</dt><dd>{selected.periodStart} – {inclusivePeriodEnd(selected.periodEndExclusive)}</dd></div>
              <div><dt>Revision</dt><dd>{selected.revision}</dd></div>
              <div><dt>Timezone</dt><dd>{selected.timezone}</dd></div>
              <div><dt>รอบก่อนหน้า</dt><dd>{selected.previousAnnualCycleId ?? 'ไม่มี'}</dd></div>
            </dl>
            <p>{selected.notes || 'ไม่มีหมายเหตุ'}</p>
            {canManageCycle && nextStatuses(selected.status).length > 0 ? (
              <div className="annual-transition-panel">
                <label>เหตุผลสำหรับแก้ไข / เปลี่ยนสถานะ
                  <input onChange={(event) => setReason(event.target.value)} placeholder="ต้องระบุเพื่อ Audit" value={reason} />
                </label>
                <div className="form-actions">
                  {nextStatuses(selected.status).map((status) => (
                    <button
                      className={status === 'CLOSED' ? 'danger-action' : 'secondary-action'}
                      key={status}
                      onClick={() => void run(
                        () => transitionAnnualCycle(selected.annualCycleId, crypto.randomUUID(), status, reason),
                        `เปลี่ยนสถานะเป็น ${annualCycleStatusLabels[status]} แล้ว`,
                      )}
                      type="button"
                    >
                      เปลี่ยนเป็น {annualCycleStatusLabels[status]}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section aria-labelledby="annual-plan-title" className="annual-section">
            <header className="annual-section__header">
              <div><span className="status-pill">Farm / Zone first</span><h2 id="annual-plan-title">แผนงานในรอบนี้</h2></div>
            </header>
            <div className="annual-metrics">
              <article><strong>{counts.total}</strong><span>แผนทั้งหมด</span></article>
              <article><strong>{counts.completed}</strong><span>เสร็จแล้ว</span></article>
              <article><strong>{counts.zone}</strong><span>ระดับโซน</span></article>
              <article><strong>{counts.treeSet}</strong><span>ข้อยกเว้นรายต้น</span></article>
            </div>
            <div className="annual-plan-list">
              {annualCycleSnapshot.planItems.map((item) => (
                <article key={item.planItemId}>
                  <header><strong>{item.title}</strong><span>{annualPlanStatusLabels[item.status]}</span></header>
                  <p>{annualPlanCategoryLabels[item.category]} · {annualPlanScopeLabels[item.target.scope]} · {targetDescription(item.target.scope, item.target.zoneCodes, item.target.positionIds)}</p>
                  <small>{item.plannedStart} – {inclusivePeriodEnd(item.plannedEndExclusive)} · ผู้รับผิดชอบ {item.responsibleRole}</small>
                </article>
              ))}
              {annualCycleSnapshot.planItems.length === 0 ? <p>ยังไม่มีแผนในรอบนี้</p> : null}
            </div>
          </section>

          {canManagePlan && selected.status !== 'CLOSED' ? (
            <details className="annual-section">
              <summary>เพิ่มแผนระดับสวน / โซน / รายต้นเฉพาะกรณี</summary>
              <form className="annual-form" onSubmit={submitPlan}>
                <label>ชื่อแผน<input onChange={(event) => setPlanTitle(event.target.value)} required value={planTitle} /></label>
                <label>ประเภท
                  <select onChange={(event) => setPlanCategory(event.target.value as AnnualPlanCategory)} value={planCategory}>
                    {Object.entries(annualPlanCategoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label>ระดับการวางแผน
                  <select onChange={(event) => setPlanScope(event.target.value as AnnualPlanScope)} value={planScope}>
                    {Object.entries(annualPlanScopeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                {planScope !== 'FARM' ? <label>{planScope === 'ZONE' ? 'รหัสโซน คั่นด้วยจุลภาค' : 'Position ID คั่นด้วยจุลภาค'}
                  <input onChange={(event) => setPlanTargets(event.target.value)} placeholder={planScope === 'ZONE' ? 'Z01, Z02' : 'pos_…'} required value={planTargets} />
                </label> : null}
                <label>วันเริ่ม<input min={selected.periodStart} onChange={(event) => setPlanStart(event.target.value)} required type="date" value={planStart} /></label>
                <label>วันถัดจากวันสิ้นสุด<input max={selected.periodEndExclusive} onChange={(event) => setPlanEndExclusive(event.target.value)} required type="date" value={planEndExclusive} /></label>
                <label>บทบาทรับผิดชอบ
                  <select onChange={(event) => setResponsibleRole(event.target.value as CanonicalRole)} value={responsibleRole}>
                    <option value="FARM_MANAGER">ผู้จัดการสวน</option><option value="AGRONOMIST">นักวิชาการเกษตร</option><option value="WORKER">คนงาน</option><option value="ORG_OWNER">เจ้าขององค์กร</option>
                  </select>
                </label>
                <button className="primary-action" type="submit">เพิ่มแผน</button>
              </form>
            </details>
          ) : null}

          {canManageCycle ? (
            <details className="annual-section" onToggle={(event) => {
              if (event.currentTarget.open) setEditDraft(cloneDraft(selected))
            }}>
              <summary>{['DRAFT', 'PLANNED'].includes(selected.status) ? 'แก้ไขรอบปี' : 'Correction รอบที่เริ่มแล้ว / ปิดแล้ว'}</summary>
              {editDraft ? (
                <form className="annual-form" onSubmit={submitCycleChange}>
                  <label>รหัสรอบ<input onChange={(event) => setEditDraft({ ...editDraft, cycleCode: event.target.value })} required value={editDraft.cycleCode} /></label>
                  <label>ชื่อรอบ<input onChange={(event) => setEditDraft({ ...editDraft, name: event.target.value })} required value={editDraft.name} /></label>
                  <label>วันเริ่มเฉพาะสวน<input onChange={(event) => setEditDraft({ ...editDraft, periodStart: event.target.value })} required type="date" value={editDraft.periodStart} /></label>
                  <label>Timezone<input onChange={(event) => setEditDraft({ ...editDraft, timezone: event.target.value })} required value={editDraft.timezone} /></label>
                  <label className="span-full">หมายเหตุ<textarea onChange={(event) => setEditDraft({ ...editDraft, notes: event.target.value })} value={editDraft.notes} /></label>
                  <label className="span-full">เหตุผล<input onChange={(event) => setReason(event.target.value)} required value={reason} /></label>
                  <button className="primary-action" type="submit">{['DRAFT', 'PLANNED'].includes(selected.status) ? 'บันทึกการแก้ไข' : 'บันทึก Correction + revision ใหม่'}</button>
                </form>
              ) : null}
            </details>
          ) : null}

          {annualCycleSnapshot.corrections.length > 0 ? (
            <section aria-labelledby="annual-corrections-title" className="annual-section">
              <h2 id="annual-corrections-title">ประวัติ Correction</h2>
              {annualCycleSnapshot.corrections.map((correction) => (
                <article className="annual-correction" key={correction.correctionId}>
                  <strong>Revision {correction.beforeRevision} → {correction.afterRevision}</strong>
                  <p>{correction.reason}</p><small>{correction.actorDisplayName} · {correction.createdAtLabel}</small>
                </article>
              ))}
            </section>
          ) : null}
        </>
      ) : null}

      {canManageCycle ? (
        <details className="annual-section" onToggle={(event) => {
          if (!event.currentTarget.open) return
          const latest = annualCycleSnapshot.cycles[0]
          if (latest) setCycleDraft(suggestedDraft(latest.periodEndExclusive, latest.annualCycleId))
        }}>
          <summary>สร้างรอบปีใหม่</summary>
          <form className="annual-form" onSubmit={submitNewCycle}>
            <label>รหัสรอบ<input onChange={(event) => setCycleDraft({ ...cycleDraft, cycleCode: event.target.value })} required value={cycleDraft.cycleCode} /></label>
            <label>ชื่อรอบ<input onChange={(event) => setCycleDraft({ ...cycleDraft, name: event.target.value })} required value={cycleDraft.name} /></label>
            <label>วันเริ่มรอบ<input onChange={(event) => setCycleDraft({ ...cycleDraft, periodStart: event.target.value })} required type="date" value={cycleDraft.periodStart} /></label>
            <label>Timezone<input onChange={(event) => setCycleDraft({ ...cycleDraft, timezone: event.target.value })} required value={cycleDraft.timezone} /></label>
            <label className="span-full">หมายเหตุ<textarea onChange={(event) => setCycleDraft({ ...cycleDraft, notes: event.target.value })} value={cycleDraft.notes} /></label>
            <button className="primary-action" type="submit">สร้างเป็นร่าง</button>
          </form>
        </details>
      ) : null}
    </section>
  )
}
