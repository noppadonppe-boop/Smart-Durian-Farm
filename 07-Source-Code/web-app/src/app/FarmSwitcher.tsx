import { useState } from 'react'

import {
  farmStatusLabels,
  roleLabels,
} from '../domain/farm'
import { usePhase2 } from './usePhase2'

export function FarmSwitcher() {
  const {
    farms,
    currentFarm,
    pendingOperations,
    requestFarmSwitch,
  } = usePhase2()
  const [open, setOpen] = useState(false)

  if (!currentFarm) return null
  const currentPendingCount = pendingOperations.filter(
    (operation) => operation.farmId === currentFarm.farmId,
  ).length

  return (
    <div className="farm-switcher">
      <button
        aria-expanded={open}
        aria-label={`สวนปัจจุบัน: ${currentFarm.farmName} (${currentFarm.farmCode}) · ${roleLabels[currentFarm.role]} · กดเพื่อเปลี่ยน`}
        className="farm-context farm-context--button"
        onClick={() => setOpen((current) => !current)}
        title="สวนปัจจุบัน · กดเพื่อเปลี่ยน"
        type="button"
      >
        <span className="farm-context__label">สวนปัจจุบัน:</span>
        <strong className="farm-context__name">{currentFarm.farmName}</strong>
        <code>{currentFarm.farmCode}</code>
        <span className="farm-context__role">{roleLabels[currentFarm.role]}</span>
        <span className="farm-context__chevron" aria-hidden="true">▾</span>
      </button>

      {open ? (
        <section aria-label="เลือกสวน" className="farm-switcher__panel">
          <header>
            <div>
              <strong>เลือกสวนที่มีสิทธิ์</strong>
              <span>แสดงเฉพาะ membership ของบัญชีนี้</span>
            </div>
            <button aria-label="ปิดรายการสวน" onClick={() => setOpen(false)} type="button">
              ×
            </button>
          </header>
          <div className="farm-switcher__list">
            {farms.map((farm) => (
              <button
                aria-current={farm.farmId === currentFarm.farmId ? 'true' : undefined}
                key={farm.farmId}
                onClick={() => {
                  requestFarmSwitch(farm.farmId)
                  setOpen(false)
                }}
                type="button"
              >
                <span>
                  <strong>{farm.farmName}</strong>
                  <code>{farm.farmCode}</code>
                </span>
                <span>
                  <small>{roleLabels[farm.role]}</small>
                  <small className={`farm-status farm-status--${farm.farmStatus.toLowerCase()}`}>
                    {farmStatusLabels[farm.farmStatus]}
                  </small>
                </span>
              </button>
            ))}
          </div>
          {currentPendingCount > 0 ? (
            <p className="farm-switcher__pending">
              สวนปัจจุบันมี {currentPendingCount} รายการค้างส่ง การเปลี่ยนสวนต้องยืนยัน
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}

export function PendingFarmSwitchDialog() {
  const {
    currentFarm,
    pendingSwitchTarget,
    pendingOperations,
    confirmFarmSwitch,
    cancelFarmSwitch,
  } = usePhase2()

  if (!currentFarm || !pendingSwitchTarget) return null
  const pendingCount = pendingOperations.filter(
    (operation) => operation.farmId === currentFarm.farmId,
  ).length

  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-labelledby="switch-confirm-title" aria-modal="true" className="confirm-dialog" role="dialog">
        <span aria-hidden="true">!</span>
        <h2 id="switch-confirm-title">ยืนยันการเปลี่ยนสวน</h2>
        <p>
          มี {pendingCount} รายการค้างส่งใน <strong>{currentFarm.farmCode}</strong>{' '}
          รายการเหล่านี้จะยังผูกกับสวนเดิมและจะไม่ย้ายไป{' '}
          <strong>{pendingSwitchTarget.farmCode}</strong>
        </p>
        <div className="dialog-actions">
          <button className="secondary-action" onClick={cancelFarmSwitch} type="button">
            อยู่สวนเดิม
          </button>
          <button className="primary-action" onClick={confirmFarmSwitch} type="button">
            ยืนยันเปลี่ยนสวน
          </button>
        </div>
      </section>
    </div>
  )
}
