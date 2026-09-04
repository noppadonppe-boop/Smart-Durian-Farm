import { useMemo, useState, type FormEvent } from 'react'

import {
  deriveFarmCode,
  normalizeFarmProfileDraft,
  type FarmProfileDraft,
} from '../domain/farm'

import './FarmManagement.css'

const emptyFarmProfileDraft: FarmProfileDraft = {
  farmName: '',
  farmSequence: '',
  province: 'TBD',
  district: 'TBD',
  subdistrict: 'TBD',
  locationNote: 'SIMULATED/TEST ONLY',
  timezone: 'Asia/Bangkok',
  seasonStartMonth: null,
  seasonEndMonth: null,
  seasonNote: 'TBD',
  notes: 'SIMULATED/TEST ONLY',
}

const operationalFarmProfileDraft: FarmProfileDraft = {
  ...emptyFarmProfileDraft,
  locationNote: '',
  notes: '',
}

interface FarmProfileFormProps {
  organizationCode: string
  initialValue?: FarmProfileDraft
  mode: 'CREATE' | 'EDIT' | 'READ_ONLY'
  submitting?: boolean
  production?: boolean
  onSubmit?: (draft: FarmProfileDraft) => Promise<void>
}

function monthValue(value: number | null): string {
  return value === null ? '' : String(value)
}

function parsedMonth(value: string): number | null {
  return value === '' ? null : Number(value)
}

export function FarmProfileForm({
  organizationCode,
  initialValue,
  mode,
  submitting = false,
  production = false,
  onSubmit,
}: FarmProfileFormProps) {
  const [draft, setDraft] = useState<FarmProfileDraft>(initialValue ?? (production ? operationalFarmProfileDraft : emptyFarmProfileDraft))
  const [error, setError] = useState<string>()

  const farmCodePreview = useMemo(() => {
    try {
      return deriveFarmCode(organizationCode, draft.farmSequence)
    } catch {
      return `${organizationCode}-Fxx`
    }
  }, [draft.farmSequence, organizationCode])

  const readOnly = mode === 'READ_ONLY'
  const setText = (field: keyof FarmProfileDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!onSubmit || readOnly) return
    setError(undefined)
    try {
      await onSubmit(normalizeFarmProfileDraft(draft))
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'บันทึก Farm Profile ไม่สำเร็จ')
    }
  }

  return (
    <form className="farm-profile-form" onSubmit={(event) => void submit(event)}>
      <fieldset disabled={readOnly || submitting}>
        <legend>ข้อมูลหลัก</legend>
        <label>
          ชื่อสวน
          <input
            autoComplete="off"
            maxLength={100}
            onChange={(event) => setText('farmName', event.target.value)}
            required
            value={draft.farmName}
          />
        </label>
        <label>
          Farm Sequence
          <input
            autoCapitalize="characters"
            autoComplete="off"
            disabled={readOnly || submitting || mode === 'EDIT'}
            onChange={(event) => setText('farmSequence', event.target.value.toUpperCase())}
            pattern="F[0-9]{2,}"
            placeholder="F05"
            required
            value={draft.farmSequence}
          />
        </label>
        <p className="farm-code-preview">
          รหัสสวนที่ระบบสร้าง: <code>{farmCodePreview}</code>
        </p>
      </fieldset>

      <fieldset disabled={readOnly || submitting}>
        <legend>ที่ตั้ง</legend>
        <div className="farm-profile-form__grid">
          <label>
            จังหวัด
            <input maxLength={100} onChange={(event) => setText('province', event.target.value)} value={draft.province} />
          </label>
          <label>
            อำเภอ/เขต
            <input maxLength={100} onChange={(event) => setText('district', event.target.value)} value={draft.district} />
          </label>
          <label>
            ตำบล/แขวง
            <input maxLength={100} onChange={(event) => setText('subdistrict', event.target.value)} value={draft.subdistrict} />
          </label>
        </div>
        <label>
          คำอธิบายพื้นที่
          <textarea maxLength={300} onChange={(event) => setText('locationNote', event.target.value)} value={draft.locationNote} />
        </label>
      </fieldset>

      <fieldset disabled={readOnly || submitting}>
        <legend>Timezone และฤดูกาล</legend>
        <label>
          IANA Timezone
          <input onChange={(event) => setText('timezone', event.target.value)} required value={draft.timezone} />
        </label>
        <div className="farm-profile-form__grid">
          <label>
            เดือนเริ่มฤดูกาล
            <input
              inputMode="numeric"
              max={12}
              min={1}
              onChange={(event) => setDraft((current) => ({
                ...current,
                seasonStartMonth: parsedMonth(event.target.value),
              }))}
              type="number"
              value={monthValue(draft.seasonStartMonth)}
            />
          </label>
          <label>
            เดือนสิ้นสุดฤดูกาล
            <input
              inputMode="numeric"
              max={12}
              min={1}
              onChange={(event) => setDraft((current) => ({
                ...current,
                seasonEndMonth: parsedMonth(event.target.value),
              }))}
              type="number"
              value={monthValue(draft.seasonEndMonth)}
            />
          </label>
        </div>
        <label>
          หมายเหตุฤดูกาล
          <textarea maxLength={300} onChange={(event) => setText('seasonNote', event.target.value)} value={draft.seasonNote} />
        </label>
      </fieldset>

      <fieldset disabled={readOnly || submitting}>
        <legend>หมายเหตุ</legend>
        <label>
          หมายเหตุทั่วไป
          <textarea maxLength={500} onChange={(event) => setText('notes', event.target.value)} value={draft.notes} />
        </label>
      </fieldset>

      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {readOnly ? (
        <p className="read-only-note">อ่านได้ตาม Farm membership · บทบาทนี้แก้ไขไม่ได้</p>
      ) : (
        <button className="primary-action" disabled={submitting} type="submit">
          {submitting ? 'กำลังบันทึก…' : mode === 'CREATE' ? production ? 'สร้างสวน' : 'สร้างสวนจำลอง' : 'บันทึก Farm Profile'}
        </button>
      )}
    </form>
  )
}
