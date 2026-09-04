import { Link } from 'react-router-dom'

import {
  annualCycleStatusLabels,
  inclusivePeriodEnd,
} from '../domain/annualFarmCycle'
import { usePhase2 } from './usePhase2'

export function AnnualCycleSwitcher() {
  const {
    annualCycleSnapshot,
    annualCyclesLoading,
    selectAnnualCycle,
  } = usePhase2()
  const selected = annualCycleSnapshot.selectedCycle

  return (
    <div
      className="annual-cycle-switcher"
      title={selected
        ? `รอบปี: ${selected.cycleCode} (${selected.periodStart} – ${inclusivePeriodEnd(selected.periodEndExclusive)})`
        : 'รอบปีของสวน'}
    >
      <label className="annual-cycle-switcher__label" htmlFor="annual-cycle-context">รอบปี:</label>
      <div className="annual-cycle-switcher__control">
        <select
          aria-label="เลือกรอบบริหารสวนรายปี"
          disabled={annualCyclesLoading || annualCycleSnapshot.cycles.length === 0}
          id="annual-cycle-context"
          onChange={(event) => selectAnnualCycle(event.target.value)}
          value={selected?.annualCycleId ?? ''}
        >
          {annualCycleSnapshot.cycles.length === 0 ? (
            <option value="">ยังไม่มีรอบปี</option>
          ) : annualCycleSnapshot.cycles.map((cycle) => (
            <option key={cycle.annualCycleId} value={cycle.annualCycleId}>
              {cycle.cycleCode} · {annualCycleStatusLabels[cycle.status]}
            </option>
          ))}
        </select>
        <Link aria-label="เปิดหน้าจัดการรอบปี" to="/annual-cycles">จัดการ</Link>
      </div>
    </div>
  )
}
