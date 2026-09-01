import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
import { OrchardTargetSelector } from '../components/OrchardTargetSelector'
import { canManageCommercial, canRecordFruitObservation } from '../domain/commercialTraceability'
import {
  type OrchardNavigationIntent,
  type OrchardNavigationSelection,
} from '../domain/orchardLayout'
import type { TreePositionSummary } from '../domain/treeRegister'
import { canCreateWork, canObserveDisease } from '../domain/workCareDisease'
import { PageHeader } from './PageHeader'

interface OrchardWorkflowActionProps {
  description: string
  disabledReason?: string
  enabled: boolean
  intent: OrchardNavigationIntent
  navigationSelection: OrchardNavigationSelection
  title: string
  to: string
}

function OrchardWorkflowAction({
  description,
  disabledReason,
  enabled,
  intent,
  navigationSelection,
  title,
  to,
}: OrchardWorkflowActionProps) {
  const content = <>
    <strong>{title}</strong>
    <span>{description}</span>
    {!enabled && disabledReason ? <small>{disabledReason}</small> : null}
  </>
  if (!enabled) return <article aria-disabled="true" className="orchard-action-card orchard-action-card--disabled">{content}</article>
  return <Link
    className="orchard-action-card"
    state={{ targetSelection: { ...navigationSelection, intent } }}
    to={to}
  >{content}</Link>
}

export function OrchardLayoutPage() {
  const { currentFarm, listTreePositions } = usePhase2()
  const [positions, setPositions] = useState<readonly TreePositionSummary[]>([])
  const [selectedPositionIds, setSelectedPositionIds] = useState<readonly string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    void listTreePositions()
      .then((items) => { if (active) setPositions(items) })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'อ่านแปลนสวนไม่สำเร็จ') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [currentFarm?.farmId, listTreePositions])

  const selectedPositions = useMemo(() => {
    const selected = new Set(selectedPositionIds)
    return positions.filter((position) => selected.has(position.positionId))
  }, [positions, selectedPositionIds])

  if (!currentFarm) return null
  const navigationSelection: OrchardNavigationSelection = {
    source: 'ORCHARD_LAYOUT',
    farmId: currentFarm.farmId,
    positionIds: selectedPositionIds,
  }
  const farmWritable = currentFarm.farmStatus === 'ACTIVE' && currentFarm.membershipStatus === 'ACTIVE'
  const hasSelection = selectedPositions.length > 0
  const diseaseTargetReady = selectedPositions.length === 1 && selectedPositions[0]?.currentCycle.treeStatus !== 'empty'
  const productionTargetReady = selectedPositions.length > 0 && selectedPositions.every((position) => position.currentCycle.treeStatus !== 'empty')

  return <section className="page-stack">
    <PageHeader eyebrow="DEC-045 · Orchard Layout" title="แปลนสวนและเลือกตำแหน่ง" description="แถวเรียงซ้ายไปขวา ต้นเรียงบนลงล่าง และใช้ Position ID ถาวรเป็นเป้าหมาย" />
    <aside className="field-validation-banner"><strong>SIMULATED/TEST ONLY · แปลนเชิงโครงสร้าง</strong><span>ทิศทาง จุดอ้างอิง และ topology จริงยังเป็น TBD จนกว่าจะยืนยันระหว่าง Controlled Pilot</span></aside>
    {loading ? <div className="loading-inline" role="status">กำลังอ่านตำแหน่งในสวน…</div> : null}
    {error ? <div className="form-error" role="alert">{error}</div> : null}
    {!loading && !error ? <OrchardTargetSelector
      farm={currentFarm}
      onChange={setSelectedPositionIds}
      positions={positions}
      selectedPositionIds={selectedPositionIds}
      selectionMode="MULTIPLE"
      title="แปลนตำแหน่งต้นในสวนปัจจุบัน"
    /> : null}

    <section className="orchard-action-panel" aria-label="นำตำแหน่งที่เลือกไปบันทึกข้อมูล">
      <div><span className="status-pill">5 Workflow เป้าหมาย</span><h2>ทำรายการจากตำแหน่งที่เลือก</h2><p>เลือกครั้งเดียวแล้วเปิดฟอร์มที่ต้องการ ระบบจะส่งเฉพาะ Position ID ภายในสวนปัจจุบันไปยัง Workflow นั้น</p></div>
      <div className="orchard-action-grid">
        {canCreateWork(currentFarm.role, 'GENERAL') ? <OrchardWorkflowAction
          description="สร้าง Work Order ประเภทงานทั่วไปสำหรับต้น ชุดต้น แถว หรือโซน"
          disabledReason={farmWritable ? 'เลือกอย่างน้อย 1 ตำแหน่ง' : 'สวนนี้เป็นแบบอ่านอย่างเดียว'}
          enabled={farmWritable && hasSelection}
          intent="WORK_GENERAL"
          navigationSelection={navigationSelection}
          title="สร้างงานทั่วไป"
          to="/work/new"
        /> : null}
        {canCreateWork(currentFarm.role, 'CARE') ? <OrchardWorkflowAction
          description="สร้าง Work Order ดูแล โดยเริ่มจากงานตรวจสภาพ (Inspection)"
          disabledReason={farmWritable ? 'เลือกอย่างน้อย 1 ตำแหน่ง' : 'สวนนี้เป็นแบบอ่านอย่างเดียว'}
          enabled={farmWritable && hasSelection}
          intent="WORK_CARE"
          navigationSelection={navigationSelection}
          title="สร้างงานดูแล"
          to="/work/new"
        /> : null}
        {canObserveDisease(currentFarm.role) ? <OrchardWorkflowAction
          description="บันทึกอาการที่สังเกตพบ โดยยังไม่ถือเป็นการวินิจฉัย"
          disabledReason={farmWritable ? 'ต้องเลือกต้นที่มีอยู่เพียง 1 ต้น' : 'สวนนี้เป็นแบบอ่านอย่างเดียว'}
          enabled={farmWritable && diseaseTargetReady}
          intent="DISEASE_INCIDENT"
          navigationSelection={navigationSelection}
          title="รายงานอาการ/โรค"
          to="/disease"
        /> : null}
        {canRecordFruitObservation(currentFarm.role) ? <OrchardWorkflowAction
          description="เปิด Fruit Observation พร้อมต้นหรือพื้นที่ที่เลือก"
          disabledReason={farmWritable ? 'เลือกอย่างน้อย 1 ตำแหน่งที่มีต้น' : 'สวนนี้เป็นแบบอ่านอย่างเดียว'}
          enabled={farmWritable && productionTargetReady}
          intent="FRUIT_OBSERVATION"
          navigationSelection={navigationSelection}
          title="บันทึกจำนวนผล"
          to="/production#fruit-observation-form"
        /> : null}
        {canManageCommercial(currentFarm.role) ? <OrchardWorkflowAction
          description="สร้าง Harvest Lot และผูกแหล่งที่มากับตำแหน่งที่เลือก"
          disabledReason={farmWritable ? 'เลือกอย่างน้อย 1 ตำแหน่งที่มีต้น' : 'สวนนี้เป็นแบบอ่านอย่างเดียว'}
          enabled={farmWritable && productionTargetReady}
          intent="HARVEST_LOT"
          navigationSelection={navigationSelection}
          title="สร้าง Harvest Lot"
          to="/production#harvest-lot-form"
        /> : null}
      </div>
      <p className="orchard-action-note">งานรายต้นยังต้องยืนยัน Farm + Zone + Row + Position และ QR/รหัสตามขั้นตอนของงานก่อนบันทึกผล</p>
      {!farmWritable ? <p className="form-warning">สวนหรือ Membership นี้เป็นแบบอ่านอย่างเดียว จึงเปิดดูแปลนได้แต่สร้างข้อมูลไม่ได้</p> : null}
    </section>
  </section>
}
