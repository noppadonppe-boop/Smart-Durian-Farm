import { useNavigate, useParams } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
import { farmStatusLabels, roleLabels } from '../domain/farm'
import { PageHeader } from './PageHeader'

export function FarmAccessPage() {
  const { farmId } = useParams()
  const navigate = useNavigate()
  const { farms, currentFarm, requestFarmSwitch } = usePhase2()
  const targetFarm = farms.find((farm) => farm.farmId === farmId)

  if (!targetFarm) {
    return (
      <section className="page-stack">
        <PageHeader
          eyebrow="Access denied"
          title="ไม่มีสิทธิ์เปิดสวนนี้"
          description="ลิงก์นี้ไม่อยู่ในรายการ Farm membership ของบัญชีปัจจุบัน"
        />
        <article className="empty-state access-denied-state">
          <span aria-hidden="true">!</span>
          <h2>ระบบปฏิเสธการเข้าถึง</h2>
          <p>
            ไม่มีข้อมูลจากสวนเป้าหมายถูกโหลด หากคิดว่าได้รับลิงก์ถูกต้อง
            ให้เจ้าขององค์กรตรวจ membership ก่อน
          </p>
          <button className="primary-action" onClick={() => void navigate('/')} type="button">
            กลับสวนปัจจุบัน
          </button>
        </article>
      </section>
    )
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Authorized farm deep link"
        title="เปิดสวนจากลิงก์"
        description="ระบบตรวจ membership แล้ว แต่จะไม่เปลี่ยนสวนจนกว่าผู้ใช้ยืนยัน"
      />
      <article className="farm-deep-link-card">
        <span className={`farm-status farm-status--${targetFarm.farmStatus.toLowerCase()}`}>
          {farmStatusLabels[targetFarm.farmStatus]}
        </span>
        <h2>{targetFarm.farmName}</h2>
        <code>{targetFarm.farmCode}</code>
        <p>สิทธิ์ในสวนนี้: {roleLabels[targetFarm.role]}</p>
        <button
          className="primary-action"
          disabled={targetFarm.farmId === currentFarm?.farmId}
          onClick={() => {
            requestFarmSwitch(targetFarm.farmId)
            void navigate('/')
          }}
          type="button"
        >
          {targetFarm.farmId === currentFarm?.farmId ? 'กำลังอยู่สวนนี้' : 'ยืนยันเปิดสวนนี้'}
        </button>
      </article>
    </section>
  )
}
