import { Link } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
import { permissionsFor, roleLabels } from '../domain/farm'
import { canReadCommercial } from '../domain/commercialTraceability'
import { PageHeader } from './PageHeader'

export function MorePage() {
  const {
    mode,
    authMode,
    currentFarm,
    identity,
    pendingOperations,
    addDemoPendingOperation,
    clearDemoPendingOperations,
  } = usePhase2()
  if (!currentFarm || !identity) return null
  const permissions = permissionsFor(currentFarm)
  const currentPending = pendingOperations.filter(
    (operation) => operation.farmId === currentFarm.farmId,
  )

  const boundaries = [
    [
      'Authentication',
      authMode === 'firebase-live'
        ? 'Phone OTP ผ่าน Firebase จริง · ส่ง SMS จริง · ข้อมูลสวนยังเป็น Mock'
        : mode === 'firebase-emulator'
          ? 'Phone OTP ผ่าน Firebase Local Emulator · ไม่ส่ง SMS จริง'
          : 'Mock OTP ในเครื่อง · ไม่ส่ง SMS จริง',
    ],
    ['บทบาทปัจจุบัน', `${roleLabels[currentFarm.role]} · ${currentFarm.farmCode}`],
    ['ข้อมูล', 'ข้อมูลจำลองเท่านั้น · แยกตาม Organization/Farm'],
    [
      'การเชื่อมระบบจริง',
      authMode === 'firebase-live'
        ? 'เชื่อมเฉพาะ Firebase Authentication · Firestore/Storage/Hosting ยังไม่เปิดใช้งานจริง'
        : 'ยังไม่เชื่อมต่อ · ใช้ Mock Data จนกว่าจะพร้อมเปิดแอปจริง',
    ],
  ] as const

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Access & local controls"
        title="เพิ่มเติม"
        description="เมนูปรับตามบทบาทและไม่แสดง action ที่ไม่มีสิทธิ์"
      />
      <div className="admin-links" aria-label="เมนูตามสิทธิ์">
        <Link to="/orchard-layout">
          <span aria-hidden="true">▦</span>
          <div><strong>แปลนสวนและเลือกตำแหน่ง</strong><small>โซน · แถวซ้ายไปขวา · ต้นบนลงล่าง</small></div>
          <span aria-hidden="true">›</span>
        </Link>
        <Link to="/sync">
          <span aria-hidden="true">⇄</span>
          <div><strong>ศูนย์ซิงก์และ Conflict</strong><small>Offline queue, Retry, Photo recovery และ Correction</small></div>
          <span aria-hidden="true">›</span>
        </Link>
        {currentFarm.isOrganizationOwner ? <Link to="/portfolio">
          <span aria-hidden="true">▦</span>
          <div><strong>ภาพรวมหลายสวน</strong><small>Owner only · รวมเฉพาะสวนที่มีสิทธิ์</small></div>
          <span aria-hidden="true">›</span>
        </Link> : null}
        {currentFarm.isOrganizationOwner ? (
          <Link to="/farm-management">
            <span aria-hidden="true">⌂</span>
            <div><strong>จัดการสวน</strong><small>ORG_OWNER · เพิ่ม แก้ไข ระงับ เปิดใหม่ และเก็บถาวร</small></div>
            <span aria-hidden="true">›</span>
          </Link>
        ) : (
          <Link to={`/farm-management/${currentFarm.farmId}`}>
            <span aria-hidden="true">⌂</span>
            <div><strong>ข้อมูลสวน</strong><small>อ่านอย่างเดียวตาม Farm membership</small></div>
            <span aria-hidden="true">›</span>
          </Link>
        )}
        {canReadCommercial(currentFarm.role) ? <>
          <Link to="/production">
            <span aria-hidden="true">◉</span>
            <div><strong>ผลผลิตและการขาย</strong><small>Crop → Harvest → Sales · แยกตามสวน</small></div>
            <span aria-hidden="true">›</span>
          </Link>
          <Link to="/inventory">
            <span aria-hidden="true">▣</span>
            <div><strong>สต็อกและต้นทุนตรง</strong><small>รับ เบิก ปรับยอด พร้อม Reference/Audit</small></div>
            <span aria-hidden="true">›</span>
          </Link>
        </> : null}
        {permissions.canManageMemberships ? (
          <Link to="/members">
            <span aria-hidden="true">♙</span>
            <div><strong>สมาชิกและสิทธิ์</strong><small>Owner only · มี Audit ทุกการเปลี่ยน</small></div>
            <span aria-hidden="true">›</span>
          </Link>
        ) : null}
        {permissions.canReadAudit ? (
          <Link to="/audit">
            <span aria-hidden="true">◇</span>
            <div><strong>ประวัติ Audit</strong><small>เฉพาะสวนปัจจุบัน</small></div>
            <span aria-hidden="true">›</span>
          </Link>
        ) : null}
        <Link to={`/farms/${currentFarm.farmId}`}>
          <span aria-hidden="true">⌁</span>
          <div><strong>ทดสอบ Farm deep link</strong><small>ตรวจ membership ก่อนเปิดสวน</small></div>
          <span aria-hidden="true">›</span>
        </Link>
        {import.meta.env.DEV && mode === 'mock' ? <Link to="/dev/scenarios">
          <span aria-hidden="true">⚙</span>
          <div><strong>Mock Scenario Center</strong><small>Development only · deterministic scenarios</small></div>
          <span aria-hidden="true">›</span>
        </Link> : null}
        <Link to="/manual">
          <span aria-hidden="true">?</span>
          <div><strong>คู่มือผู้ใช้</strong><small>เริ่มต้นใช้งาน บทบาท Workflow การกรอกข้อมูล และการแก้ปัญหา</small></div>
          <span aria-hidden="true">›</span>
        </Link>
      </div>

      <div className="boundary-list">
        {boundaries.map(([title, description]) => (
          <article key={title}>
            <div>
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
            <span aria-hidden="true">›</span>
          </article>
        ))}
      </div>

      <section className="phase2-test-controls" aria-labelledby="pending-test-title">
        <div>
          <span className="status-pill">Local validation control</span>
          <h2 id="pending-test-title">ทดสอบรายการค้างส่งกับ Farm Switcher</h2>
          <p>
            สร้างรายการจำลองที่ล็อกกับ {currentFarm.farmCode} แล้วลองเปลี่ยนสวน
            ระบบต้องเตือนและห้ามเปลี่ยน farm scope ของรายการเดิม
          </p>
        </div>
        <div className="dialog-actions">
          <button className="secondary-action" onClick={addDemoPendingOperation} type="button">
            เพิ่มรายการค้างส่งจำลอง
          </button>
          <button
            className="secondary-action"
            disabled={pendingOperations.length === 0}
            onClick={clearDemoPendingOperations}
            type="button"
          >
            ล้างรายการจำลองทั้งหมด
          </button>
        </div>
        <p>{currentPending.length} รายการค้างในสวนนี้ · {pendingOperations.length} รายการรวมทุกสวน</p>
      </section>
    </section>
  )
}
