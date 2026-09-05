import { useState, type FormEvent } from 'react'

import { appEnvironment } from '../config/environment'
import { useAuth } from '../security/AuthContext'
import {
  bootstrapOperationalWorkspace,
  type OperationalWorkspaceResult,
} from '../services/productionBootstrap'
import { PageHeader } from './PageHeader'

function formString(data: FormData, name: string): string {
  const value = data.get(name)
  return typeof value === 'string' ? value : ''
}

export function FirebaseAdminPage() {
  const { firebaseUser, isSystemAdmin, refreshProfile } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [notice, setNotice] = useState<string>()
  const [workspace, setWorkspace] = useState<OperationalWorkspaceResult>()

  const submitOperational = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError(undefined)
    setNotice(undefined)
    try {
      const data = new FormData(event.currentTarget)
      const result = await bootstrapOperationalWorkspace({
        organizationName: formString(data, 'organizationName'),
        organizationCode: formString(data, 'organizationCode'),
        farmName: formString(data, 'farmName'),
        farmSequence: formString(data, 'farmSequence'),
        province: formString(data, 'province'),
        district: formString(data, 'district'),
        subdistrict: formString(data, 'subdistrict'),
        locationNote: formString(data, 'locationNote'),
      })
      sessionStorage.setItem('kdoms.currentFarmId', result.farmId)
      setWorkspace(result)
      setNotice(`สร้าง ${result.farmCode} ใน Firebase Live สำเร็จแล้ว`)
      await refreshProfile()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'สร้างพื้นที่ใช้งานจริงไม่สำเร็จ')
    } finally {
      setBusy(false)
    }
  }

  if (!firebaseUser) {
    return <div className="form-error">กรุณาเข้าสู่ระบบ Firebase Live ก่อน</div>
  }

  if (!isSystemAdmin) {
    return (
      <section className="page-stack firebase-admin-page">
        <PageHeader
          eyebrow="Firebase Live authorization"
          title="บัญชีนี้ยังไม่ใช่ผู้ดูแลระบบ"
          description="ระบบไม่ยอมให้ Seed หรือสร้าง Organization จากข้อความ Role ในหน้าจอเพียงอย่างเดียว"
        />
        <div className="form-error" role="alert">
          ต้องใช้บัญชีที่เป็น seed owner เดิม หรือมี Firebase custom claim <code>masterAdmin=true</code>
        </div>
        <p>UID สำหรับให้ผู้ดูแล Firebase อนุมัติ: <code>{firebaseUser.uid}</code></p>
      </section>
    )
  }

  return (
    <section className="page-stack firebase-admin-page">
      <PageHeader
        eyebrow="MasterAdmin · Firebase Live"
        title="ตั้งค่าข้อมูลและ Seed"
        description="สร้างพื้นที่ใช้งานจริงก่อน แล้วบันทึกข้อมูลแต่ละโมดูลผ่านฟอร์มของระบบโดยตรง"
      />

      <div className="operational-data-banner" role="status">
        Project <code>{appEnvironment.firebase.projectId}</code> · Firestore Live · UID <code>{firebaseUser.uid}</code>
      </div>

      {error ? <div className="form-error" role="alert">{error}</div> : null}
      {notice ? <div className="form-success" role="status">{notice}</div> : null}

      {workspace ? (
        <article className="hero-card">
          <div>
            <span className="status-pill">OPERATIONAL</span>
            <h2>{workspace.farmCode}</h2>
            <p>Organization/Farm/Owner membership และ Audit ถูกสร้างใน Firebase Live แล้ว</p>
          </div>
          <button className="primary-action" onClick={() => window.location.assign('/')} type="button">
            เข้าใช้งานสวนจริง
          </button>
        </article>
      ) : (
        <form className="workflow-panel firebase-admin-form" onSubmit={(event) => void submitOperational(event)}>
          <div className="section-heading">
            <div>
              <span className="status-pill">ข้อมูลจริง</span>
              <h2>สร้างพื้นที่ใช้งานจริง</h2>
            </div>
          </div>
          <p>
            ปุ่มนี้สร้างเฉพาะโครงสร้างเริ่มต้นที่จำเป็น ไม่สร้างจำนวนต้น งาน โรค ผลผลิต ยอดขาย
            หรือต้นทุนปลอม ค่าที่ไม่ทราบสามารถเว้นว่างแล้วเพิ่มภายหลังได้
          </p>
          <div className="form-grid">
            <label>
              ชื่อองค์กร
              <input name="organizationName" required minLength={2} maxLength={100} />
            </label>
            <label>
              Organization Code
              <input name="organizationCode" required minLength={2} maxLength={10} pattern="[A-Za-z0-9]+" placeholder="KDOMS" />
            </label>
            <label>
              ชื่อสวน
              <input name="farmName" required minLength={2} maxLength={100} />
            </label>
            <label>
              Farm Sequence
              <input name="farmSequence" required defaultValue="F01" pattern="F[0-9]{2,}" />
            </label>
            <label>
              จังหวัด
              <input name="province" maxLength={100} />
            </label>
            <label>
              อำเภอ/เขต
              <input name="district" maxLength={100} />
            </label>
            <label>
              ตำบล/แขวง
              <input name="subdistrict" maxLength={100} />
            </label>
            <label className="span-full">
              รายละเอียดตำแหน่งโดยย่อ
              <input name="locationNote" maxLength={300} />
            </label>
          </div>
          <button className="primary-action" disabled={busy} type="submit">
            {busy ? 'กำลังสร้างใน Firebase Live…' : 'สร้างพื้นที่ใช้งานใน Firebase Live'}
          </button>
        </form>
      )}
    </section>
  )
}
