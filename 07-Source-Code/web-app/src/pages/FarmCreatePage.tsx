import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { usePhase2 } from '../app/usePhase2'
import { FarmProfileForm } from '../components/FarmProfileForm'
import type { FarmProfileDraft } from '../domain/farm'
import { PageHeader } from './PageHeader'

export function FarmCreatePage() {
  const navigate = useNavigate()
  const { currentFarm, createFarm } = usePhase2()
  const [submitting, setSubmitting] = useState(false)
  const [idempotencyKey] = useState(() => `farm-create-${crypto.randomUUID()}`)

  if (!currentFarm) return null
  if (!currentFarm.isOrganizationOwner) {
    return (
      <section className="page-stack">
        <PageHeader
          eyebrow="Access denied"
          title="เฉพาะ ORG_OWNER ที่เพิ่มสวนได้"
          description="ระบบไม่ได้โหลดหรือสร้าง Farm ใดจากคำขอนี้"
        />
        <Link className="primary-action action-link" to="/more">กลับเมนูเพิ่มเติม</Link>
      </section>
    )
  }

  const submit = async (draft: FarmProfileDraft) => {
    setSubmitting(true)
    try {
      const result = await createFarm(idempotencyKey, draft)
      await navigate(`/farm-management/${result.profile.farmId}`, {
        replace: true,
        state: { notice: result.wasRetry ? 'Retry เดิมสำเร็จโดยไม่สร้างสวนซ้ำ' : 'สร้าง Farm + Owner membership + Audit แบบ atomic แล้ว' },
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Atomic Farm creation"
        title="เพิ่มสวน"
        description="ระบบสร้าง Farm ID, Farm Code, เวลา, Owner membership และ Audit ให้เอง"
      />
      <div className="mock-scope-note" role="status">SIMULATED/TEST ONLY · ไม่มีข้อมูลสวนจริง</div>
      <FarmProfileForm
        mode="CREATE"
        onSubmit={submit}
        organizationCode={currentFarm.organizationCode}
        submitting={submitting}
      />
    </section>
  )
}
