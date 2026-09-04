import { Link } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
import { permissionsFor, roleLabels } from '../domain/farm'
import { canReadCommercial } from '../domain/commercialTraceability'
import { canViewManagementReports } from '../domain/managementReporting'
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
        ? mode === 'firebase-live'
          ? 'Phone OTP และข้อมูลสวนผ่าน Firebase Production'
          : 'Phone OTP ผ่าน Firebase จริง · ข้อมูลสวนยังเป็น Mock ในเครื่อง'
        : mode === 'firebase-emulator'
          ? 'Phone OTP สำหรับการทดสอบ · ไม่ส่ง SMS จริง'
          : 'OTP สำหรับการทดสอบ · ไม่ส่ง SMS จริง',
    ],
    ['บทบาทปัจจุบัน', `${roleLabels[currentFarm.role]} · ${currentFarm.farmCode}`],
    ['ข้อมูล', mode === 'firebase-live' ? 'ข้อมูล Production แยกตาม Organization/Farm' : 'ข้อมูลจำลองเท่านั้น · แยกตาม Organization/Farm'],
    [
      'การเชื่อมระบบจริง',
      authMode === 'firebase-live'
        ? mode === 'firebase-live'
          ? 'เชื่อม Firebase Authentication, Firestore และ Storage ตามสิทธิ์'
          : 'เชื่อมเฉพาะ Firebase Authentication · ข้อมูลยังอยู่ใน Mock adapter'
        : 'ยังไม่เชื่อมต่อ · ใช้ Mock Data จนกว่าจะพร้อมเปิดแอปจริง',
    ],
  ] as const

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Access & controls"
        title="เพิ่มเติม"
        description="เมนูปรับตามบทบาทและไม่แสดง action ที่ไม่มีสิทธิ์"
      />

      <div className="more-identity-banner">
        <div className="more-identity-banner__user">
          <div className="more-identity-banner__avatar" aria-hidden="true">
            {currentFarm.farmName ? currentFarm.farmName.charAt(0) : 'K'}
          </div>
          <div>
            <h2 className="more-identity-banner__name">{currentFarm.farmName} ({currentFarm.farmCode})</h2>
            <p className="more-identity-banner__sub">
              {identity.displayName || identity.maskedPhone} · องค์กร: {currentFarm.organizationName || currentFarm.organizationCode}
            </p>
          </div>
        </div>
        <div className="more-identity-banner__badges">
          <span className="status-pill">
            {currentFarm.isOrganizationOwner ? '👑 เจ้าขององค์กร' : roleLabels[currentFarm.role]}
          </span>
          <span className="farm-status farm-status--active">{currentFarm.farmStatus}</span>
        </div>
      </div>

      <div className="admin-menu-hub" aria-label="เมนูตามสิทธิ์">
        {/* กลุ่มที่ 1: การวางแผนและภาพรวมสวน */}
        <section className="admin-group">
          <div className="admin-group__header">
            <span className="admin-group__badge">PLANNING</span>
            <h3 className="admin-group__title">การวางแผนและภาพรวมสวน</h3>
          </div>
          <div className="admin-links">
            <Link className="admin-link-card--planning" to="/annual-cycles">
              <span aria-hidden="true">◷</span>
              <div>
                <strong>รอบบริหารสวนรายปี</strong>
                <small>มิ.ย.–พ.ค. หรือวันเริ่มเฉพาะสวน · แผนระดับสวน/โซน</small>
              </div>
              <span aria-hidden="true">›</span>
            </Link>
            {canViewManagementReports(currentFarm) ? (
              <Link className="admin-link-card--planning" to="/reports">
                <span aria-hidden="true">▤</span>
                <div>
                  <strong>รายงานผลสวนและต้นทุน</strong>
                  <small>สัปดาห์ · เดือน · 3 เดือน · ปี พร้อมค่าแรงและค่าใช้จ่าย</small>
                </div>
                <span aria-hidden="true">›</span>
              </Link>
            ) : null}
            <Link className="admin-link-card--planning" to="/orchard-layout">
              <span aria-hidden="true">▦</span>
              <div>
                <strong>แปลนสวนและเลือกตำแหน่ง</strong>
                <small>โซน · แถวซ้ายไปขวา · ต้นบนลงล่าง</small>
              </div>
              <span aria-hidden="true">›</span>
            </Link>
            {currentFarm.isOrganizationOwner ? (
              <Link className="admin-link-card--planning" to="/portfolio">
                <span aria-hidden="true">▧</span>
                <div>
                  <strong>ภาพรวมหลายสวน</strong>
                  <small>Owner only · รวมเฉพาะสวนที่มีสิทธิ์</small>
                </div>
                <span aria-hidden="true">›</span>
              </Link>
            ) : null}
            {currentFarm.isOrganizationOwner ? (
              <Link className="admin-link-card--planning" to="/farm-management">
                <span aria-hidden="true">⌂</span>
                <div>
                  <strong>จัดการสวน</strong>
                  <small>ORG_OWNER · เพิ่ม แก้ไข ระงับ เปิดใหม่ และเก็บถาวร</small>
                </div>
                <span aria-hidden="true">›</span>
              </Link>
            ) : (
              <Link className="admin-link-card--planning" to={`/farm-management/${currentFarm.farmId}`}>
                <span aria-hidden="true">⌂</span>
                <div>
                  <strong>ข้อมูลสวน</strong>
                  <small>อ่านอย่างเดียวตาม Farm membership</small>
                </div>
                <span aria-hidden="true">›</span>
              </Link>
            )}
          </div>
        </section>

        {/* กลุ่มที่ 2: ผลผลิต คลังสินค้า และการซิงก์ */}
        <section className="admin-group">
          <div className="admin-group__header">
            <span className="admin-group__badge">OPERATIONS</span>
            <h3 className="admin-group__title">ผลผลิต คลังสินค้า และการซิงก์</h3>
          </div>
          <div className="admin-links">
            {canReadCommercial(currentFarm.role) ? (
              <>
                <Link className="admin-link-card--ops" to="/production">
                  <span aria-hidden="true">◉</span>
                  <div>
                    <strong>ผลผลิตและการขาย</strong>
                    <small>Crop → Harvest → Sales · แยกตามสวน</small>
                  </div>
                  <span aria-hidden="true">›</span>
                </Link>
                <Link className="admin-link-card--ops" to="/inventory">
                  <span aria-hidden="true">▣</span>
                  <div>
                    <strong>{currentFarm.isOrganizationOwner ? 'สต็อกและต้นทุนตรง' : 'สต็อกวัสดุ'}</strong>
                    <small>
                      {currentFarm.isOrganizationOwner
                        ? 'รับ เบิก ปรับยอด พร้อมต้นทุน Owner-only'
                        : 'รับ เบิก ปรับยอดเชิงปฏิบัติการ · ไม่แสดงต้นทุน'}
                    </small>
                  </div>
                  <span aria-hidden="true">›</span>
                </Link>
              </>
            ) : null}
            <Link className="admin-link-card--ops" to="/sync">
              <span aria-hidden="true">⇄</span>
              <div>
                <strong>ศูนย์ซิงก์และ Conflict</strong>
                <small>Offline queue, Retry, Photo recovery และ Correction</small>
              </div>
              <span aria-hidden="true">›</span>
            </Link>
          </div>
        </section>

        {/* กลุ่มที่ 3: สิทธิ์ ความปลอดภัย และระบบ */}
        <section className="admin-group">
          <div className="admin-group__header">
            <span className="admin-group__badge">SYSTEM & ACCESS</span>
            <h3 className="admin-group__title">สิทธิ์ ความปลอดภัย และระบบ</h3>
          </div>
          <div className="admin-links">
            {permissions.canManageMemberships ? (
              <Link className="admin-link-card--system" to="/members">
                <span aria-hidden="true">♙</span>
                <div>
                  <strong>สมาชิกและสิทธิ์</strong>
                  <small>Owner only · มี Audit ทุกการเปลี่ยน</small>
                </div>
                <span aria-hidden="true">›</span>
              </Link>
            ) : null}
            {permissions.canReadAudit ? (
              <Link className="admin-link-card--system" to="/audit">
                <span aria-hidden="true">◇</span>
                <div>
                  <strong>ประวัติ Audit</strong>
                  <small>เฉพาะสวนปัจจุบัน</small>
                </div>
                <span aria-hidden="true">›</span>
              </Link>
            ) : null}
            <Link className="admin-link-card--system" to={`/farms/${currentFarm.farmId}`}>
              <span aria-hidden="true">⌁</span>
              <div>
                <strong>ทดสอบ Farm deep link</strong>
                <small>ตรวจ membership ก่อนเปิดสวน</small>
              </div>
              <span aria-hidden="true">›</span>
            </Link>
            {import.meta.env.DEV && mode === 'mock' ? (
              <Link className="admin-link-card--system" to="/dev/scenarios">
                <span aria-hidden="true">⚙</span>
                <div>
                  <strong>Mock Scenario Center</strong>
                  <small>Development only · deterministic scenarios</small>
                </div>
                <span aria-hidden="true">›</span>
              </Link>
            ) : null}
            <Link className="admin-link-card--system" to="/manual">
              <span aria-hidden="true">?</span>
              <div>
                <strong>คู่มือผู้ใช้</strong>
                <small>เริ่มต้นใช้งาน บทบาท Workflow การกรอกข้อมูล และการแก้ปัญหา</small>
              </div>
              <span aria-hidden="true">›</span>
            </Link>
          </div>
        </section>
      </div>

      <div className="admin-group">
        <div className="admin-group__header">
          <span className="admin-group__badge">ENVIRONMENT</span>
          <h3 className="admin-group__title">ขอบเขตระบบและการเชื่อมต่อ</h3>
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
      </div>

      <section className="phase2-test-controls" aria-labelledby="pending-test-title">
        <div>
          <span className="status-pill">Validation control</span>
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
