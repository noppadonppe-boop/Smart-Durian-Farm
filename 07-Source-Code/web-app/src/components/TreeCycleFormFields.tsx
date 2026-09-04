/* eslint-disable react-refresh/only-export-components -- form state helpers are intentionally colocated with the only consumer component */
import {
  identityConfidenceLabels,
  measurementConfidenceLabels,
  treeHealthStatuses,
  treePresenceLabels,
  treeStatusLabels,
  validateTreeCycleInput,
  type IdentityConfidence,
  type MeasurementConfidence,
  type PlantingCycleRecord,
  type TreeStatus,
  type UpdatePlantingCycleInput,
} from '../domain/treeRegister'

import './TreeCycleFormFields.css'

export interface TreeCycleFormValue {
  treeStatus: TreeStatus
  variety: string
  varietyConfidence: IdentityConfidence
  plantingYear: string
  plantingYearCalendar: 'BE' | 'CE'
  plantingYearConfidence: IdentityConfidence
  plantSource: string
  baselineDate: string
  notes: string
  gpsEnabled: boolean
  latitude: string
  longitude: string
  gpsAccuracyM: string
  gpsMethod: string
  gpsMeasuredAt: string
  gpsMeasuredBy: string
  gpsConfidence: MeasurementConfidence
  gpsSource: string
  trunkEnabled: boolean
  trunkMeasureType: 'circumference' | 'diameter'
  trunkMeasureValue: string
  trunkMeasureHeightCm: string
  trunkMeasureMethod: string
  trunkMeasuredAt: string
  trunkMeasuredBy: string
  trunkMeasureConfidence: MeasurementConfidence
  trunkMeasureSource: string
  canopyEnabled: boolean
  canopyWidthNSValue: string
  canopyWidthEWValue: string
  canopyMeasureMethod: string
  canopyMeasuredAt: string
  canopyMeasuredBy: string
  canopyMeasureConfidence: MeasurementConfidence
  canopyMeasureSource: string
  heightEnabled: boolean
  heightValue: string
  heightMeasureMethod: string
  heightMeasuredAt: string
  heightMeasuredBy: string
  heightMeasureConfidence: MeasurementConfidence
  heightMeasureSource: string
}

export function todayInBangkok(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function currentBangkokDateTimeInput(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '00'
  return `${value('year')}-${value('month')}-${value('day')}T${value('hour')}:${value('minute')}`
}

export function createTreeCycleFormValue(
  treeStatus: TreeStatus = 'empty',
): TreeCycleFormValue {
  const measuredAt = currentBangkokDateTimeInput()
  return {
    treeStatus,
    variety: '',
    varietyConfidence: 'unknown',
    plantingYear: '',
    plantingYearCalendar: 'BE',
    plantingYearConfidence: 'unknown',
    plantSource: '',
    baselineDate: todayInBangkok(),
    notes: '',
    gpsEnabled: false,
    latitude: '',
    longitude: '',
    gpsAccuracyM: '',
    gpsMethod: '',
    gpsMeasuredAt: measuredAt,
    gpsMeasuredBy: '',
    gpsConfidence: 'measured',
    gpsSource: '',
    trunkEnabled: false,
    trunkMeasureType: 'circumference',
    trunkMeasureValue: '',
    trunkMeasureHeightCm: '100',
    trunkMeasureMethod: '',
    trunkMeasuredAt: measuredAt,
    trunkMeasuredBy: '',
    trunkMeasureConfidence: 'measured',
    trunkMeasureSource: '',
    canopyEnabled: false,
    canopyWidthNSValue: '',
    canopyWidthEWValue: '',
    canopyMeasureMethod: '',
    canopyMeasuredAt: measuredAt,
    canopyMeasuredBy: '',
    canopyMeasureConfidence: 'measured',
    canopyMeasureSource: '',
    heightEnabled: false,
    heightValue: '',
    heightMeasureMethod: '',
    heightMeasuredAt: measuredAt,
    heightMeasuredBy: '',
    heightMeasureConfidence: 'measured',
    heightMeasureSource: '',
  }
}

function localDateTime(isoValue: string | undefined): string {
  return isoValue ? isoValue.slice(0, 16) : currentBangkokDateTimeInput()
}

export function treeCycleFormValueFromRecord(record: PlantingCycleRecord): TreeCycleFormValue {
  const measurements = record.baselineMeasurements ?? {
    gps: null,
    trunk: null,
    canopy: null,
    height: null,
  }
  return {
    ...createTreeCycleFormValue(record.treeStatus),
    variety: record.variety ?? '',
    varietyConfidence: record.varietyConfidence,
    plantingYear: record.plantingYear === null ? '' : String(record.plantingYear),
    plantingYearCalendar: record.plantingYearCalendar ?? 'BE',
    plantingYearConfidence: record.plantingYearConfidence,
    plantSource: record.plantSource ?? '',
    baselineDate: record.baselineDate,
    notes: record.notes,
    gpsEnabled: measurements.gps !== null,
    latitude: measurements.gps ? String(measurements.gps.latitude) : '',
    longitude: measurements.gps ? String(measurements.gps.longitude) : '',
    gpsAccuracyM: measurements.gps ? String(measurements.gps.accuracyM) : '',
    gpsMethod: measurements.gps?.method ?? '',
    gpsMeasuredAt: localDateTime(measurements.gps?.measuredAt),
    gpsMeasuredBy: measurements.gps?.measuredBy ?? '',
    gpsConfidence: measurements.gps?.confidence ?? 'measured',
    gpsSource: measurements.gps?.source ?? '',
    trunkEnabled: measurements.trunk !== null,
    trunkMeasureType: measurements.trunk?.type ?? 'circumference',
    trunkMeasureValue: measurements.trunk ? String(measurements.trunk.value) : '',
    trunkMeasureHeightCm: measurements.trunk ? String(measurements.trunk.heightCm) : '100',
    trunkMeasureMethod: measurements.trunk?.method ?? '',
    trunkMeasuredAt: localDateTime(measurements.trunk?.measuredAt),
    trunkMeasuredBy: measurements.trunk?.measuredBy ?? '',
    trunkMeasureConfidence: measurements.trunk?.confidence ?? 'measured',
    trunkMeasureSource: measurements.trunk?.source ?? '',
    canopyEnabled: measurements.canopy !== null,
    canopyWidthNSValue: measurements.canopy ? String(measurements.canopy.widthNS) : '',
    canopyWidthEWValue: measurements.canopy ? String(measurements.canopy.widthEW) : '',
    canopyMeasureMethod: measurements.canopy?.method ?? '',
    canopyMeasuredAt: localDateTime(measurements.canopy?.measuredAt),
    canopyMeasuredBy: measurements.canopy?.measuredBy ?? '',
    canopyMeasureConfidence: measurements.canopy?.confidence ?? 'measured',
    canopyMeasureSource: measurements.canopy?.source ?? '',
    heightEnabled: measurements.height !== null,
    heightValue: measurements.height ? String(measurements.height.value) : '',
    heightMeasureMethod: measurements.height?.method ?? '',
    heightMeasuredAt: localDateTime(measurements.height?.measuredAt),
    heightMeasuredBy: measurements.height?.measuredBy ?? '',
    heightMeasureConfidence: measurements.height?.confidence ?? 'measured',
    heightMeasureSource: measurements.height?.source ?? '',
  }
}

function numberValue(value: string, label: string): number {
  if (!value.trim() || !Number.isFinite(Number(value))) throw new Error(`${label}ต้องเป็นตัวเลข`)
  return Number(value)
}

function bangkokIso(value: string, label: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/u.test(value)) {
    throw new Error(`${label}ต้องระบุวันที่และเวลา`)
  }
  return `${value}:00+07:00`
}

export function treeCycleInputFromForm(value: TreeCycleFormValue): UpdatePlantingCycleInput {
  const input: UpdatePlantingCycleInput = {
    variety: value.variety.trim() || null,
    varietyConfidence: value.variety.trim() ? value.varietyConfidence : 'unknown',
    plantingYear: value.plantingYear ? numberValue(value.plantingYear, 'ปีปลูก') : null,
    plantingYearCalendar: value.plantingYear ? value.plantingYearCalendar : null,
    plantingYearConfidence: value.plantingYear ? value.plantingYearConfidence : 'unknown',
    plantSource: value.plantSource.trim() || null,
    treeStatus: value.treeStatus,
    baselineDate: value.baselineDate,
    baselineMeasurements: {
      gps: value.gpsEnabled ? {
        latitude: numberValue(value.latitude, 'ละติจูด'),
        longitude: numberValue(value.longitude, 'ลองจิจูด'),
        accuracyM: numberValue(value.gpsAccuracyM, 'ความแม่นยำ GPS'),
        method: value.gpsMethod.trim(),
        measuredAt: bangkokIso(value.gpsMeasuredAt, 'วันที่เวลาวัด GPS'),
        measuredBy: value.gpsMeasuredBy.trim(),
        confidence: value.gpsConfidence,
        source: value.gpsSource.trim(),
      } : null,
      trunk: value.trunkEnabled ? {
        type: value.trunkMeasureType,
        value: numberValue(value.trunkMeasureValue, 'ค่าที่วัดลำต้น'),
        unit: 'cm',
        heightCm: numberValue(value.trunkMeasureHeightCm, 'ความสูงจุดวัดลำต้น'),
        method: value.trunkMeasureMethod.trim(),
        measuredAt: bangkokIso(value.trunkMeasuredAt, 'วันที่เวลาวัดลำต้น'),
        measuredBy: value.trunkMeasuredBy.trim(),
        confidence: value.trunkMeasureConfidence,
        source: value.trunkMeasureSource.trim(),
      } : null,
      canopy: value.canopyEnabled ? {
        widthNS: numberValue(value.canopyWidthNSValue, 'ความกว้างทรงพุ่มเหนือ–ใต้'),
        widthEW: numberValue(value.canopyWidthEWValue, 'ความกว้างทรงพุ่มตะวันออก–ตะวันตก'),
        unit: 'm',
        method: value.canopyMeasureMethod.trim(),
        measuredAt: bangkokIso(value.canopyMeasuredAt, 'วันที่เวลาวัดทรงพุ่ม'),
        measuredBy: value.canopyMeasuredBy.trim(),
        confidence: value.canopyMeasureConfidence,
        source: value.canopyMeasureSource.trim(),
      } : null,
      height: value.heightEnabled ? {
        value: numberValue(value.heightValue, 'ความสูงต้น'),
        unit: 'm',
        method: value.heightMeasureMethod.trim(),
        measuredAt: bangkokIso(value.heightMeasuredAt, 'วันที่เวลาวัดความสูง'),
        measuredBy: value.heightMeasuredBy.trim(),
        confidence: value.heightMeasureConfidence,
        source: value.heightMeasureSource.trim(),
      } : null,
    },
    notes: value.notes.trim(),
  }
  validateTreeCycleInput(input)
  return input
}

interface TreeCycleFormFieldsProps {
  value: TreeCycleFormValue
  onChange: (patch: Partial<TreeCycleFormValue>) => void
}

const identityOptions = Object.entries(identityConfidenceLabels) as [IdentityConfidence, string][]
const measurementOptions = Object.entries(measurementConfidenceLabels) as [MeasurementConfidence, string][]
const healthOptions = treeHealthStatuses.map((status) => [status, treeStatusLabels[status]] as const)

export function TreeCycleFormFields({ value, onChange }: TreeCycleFormFieldsProps) {
  const updatePresence = (presence: 'present' | 'empty') => {
    if (presence === 'empty') {
      onChange({
        treeStatus: 'empty',
        variety: '',
        varietyConfidence: 'unknown',
        plantingYear: '',
        plantingYearConfidence: 'unknown',
        plantSource: '',
        gpsEnabled: false,
        trunkEnabled: false,
        canopyEnabled: false,
        heightEnabled: false,
      })
      return
    }
    onChange({ treeStatus: value.treeStatus === 'empty' ? 'normal' : value.treeStatus })
  }

  return <>
    <section className="tree-form-section" aria-labelledby="tree-cycle-section-title">
      <div className="tree-form-section__heading">
        <div><span>ส่วนที่ 2</span><h2 id="tree-cycle-section-title">ข้อมูลต้นและรอบปลูกปัจจุบัน</h2></div>
        <small>กรอกเท่าที่ทราบ และกลับมาแก้ไขภายหลังได้</small>
      </div>
      <div className="form-grid">
        <label>สถานะการมีต้น <strong aria-hidden="true">*</strong><select onChange={(event) => updatePresence(event.target.value as 'present' | 'empty')} value={value.treeStatus === 'empty' ? 'empty' : 'present'}>{Object.entries(treePresenceLabels).map(([presence, label]) => <option key={presence} value={presence}>{label}</option>)}</select></label>
        {value.treeStatus !== 'empty' ? <label>สถานะสุขภาพต้น <strong aria-hidden="true">*</strong><select onChange={(event) => onChange({ treeStatus: event.target.value as TreeStatus })} value={value.treeStatus}>{healthOptions.map(([status, label]) => <option key={status} value={status}>{label}</option>)}</select></label> : null}
        <label>วันที่ข้อมูลตั้งต้น <strong aria-hidden="true">*</strong><input onChange={(event) => onChange({ baselineDate: event.target.value })} required type="date" value={value.baselineDate} /></label>
        <label>พันธุ์<input disabled={value.treeStatus === 'empty'} onChange={(event) => onChange({ variety: event.target.value })} placeholder="ไม่ทราบให้เว้นว่าง" value={value.variety} /></label>
        <label>ความมั่นใจของพันธุ์<select disabled={value.treeStatus === 'empty' || !value.variety.trim()} onChange={(event) => onChange({ varietyConfidence: event.target.value as IdentityConfidence })} value={value.varietyConfidence}>{identityOptions.map(([option, label]) => <option key={option} value={option}>{label}</option>)}</select></label>
        <label>ปีปลูกโดยประมาณ<input disabled={value.treeStatus === 'empty'} inputMode="numeric" min="1" onChange={(event) => onChange({ plantingYear: event.target.value })} placeholder="เช่น 2564" type="number" value={value.plantingYear} /></label>
        <label>ระบบปี<select disabled={value.treeStatus === 'empty' || !value.plantingYear} onChange={(event) => onChange({ plantingYearCalendar: event.target.value as 'BE' | 'CE' })} value={value.plantingYearCalendar}><option value="BE">พ.ศ.</option><option value="CE">ค.ศ.</option></select></label>
        <label>ความมั่นใจของปีปลูก<select disabled={value.treeStatus === 'empty' || !value.plantingYear} onChange={(event) => onChange({ plantingYearConfidence: event.target.value as IdentityConfidence })} value={value.plantingYearConfidence}>{identityOptions.map(([option, label]) => <option key={option} value={option}>{label}</option>)}</select></label>
        <label>แหล่งพันธุ์/สถานรับต้นพันธุ์<input disabled={value.treeStatus === 'empty'} onChange={(event) => onChange({ plantSource: event.target.value })} placeholder="เว้นว่างได้เมื่อไม่ทราบ" value={value.plantSource} /></label>
      </div>
      {value.treeStatus === 'empty' ? <p className="form-guidance">ตำแหน่งนี้ไม่มีต้น ระบบจึงปิดข้อมูลพันธุ์ ปีปลูก และค่าการวัดต้นเพื่อป้องกันข้อมูลขัดแย้ง</p> : null}
      <label>หมายเหตุ<textarea onChange={(event) => onChange({ notes: event.target.value })} placeholder="ระบุแหล่งข้อมูล ข้อจำกัด หรือสิ่งที่ต้องตรวจซ้ำ" rows={3} value={value.notes} /></label>
    </section>

    <section className="tree-form-section" aria-labelledby="tree-baseline-section-title">
      <div className="tree-form-section__heading">
        <div><span>ส่วนที่ 3 · ไม่บังคับ</span><h2 id="tree-baseline-section-title">ข้อมูลสำรวจภาคสนาม</h2></div>
        <small>เปิดเฉพาะกลุ่มที่มีข้อมูลครบ ค่าแต่ละกลุ่มจะเก็บพร้อมวิธีวัด เวลา ผู้วัด และแหล่งข้อมูล</small>
      </div>

      <details className="measurement-group">
        <summary>พิกัด GPS {value.gpsEnabled ? '· พร้อมกรอก' : '· ยังไม่กรอก'}</summary>
        <label className="checkbox-control"><input checked={value.gpsEnabled} disabled={value.treeStatus === 'empty'} onChange={(event) => onChange({ gpsEnabled: event.target.checked })} type="checkbox" />เพิ่มข้อมูล GPS</label>
        {value.gpsEnabled ? <div className="form-grid measurement-fields">
          <label>ละติจูด <strong aria-hidden="true">*</strong><input inputMode="decimal" onChange={(event) => onChange({ latitude: event.target.value })} required step="any" type="number" value={value.latitude} /></label>
          <label>ลองจิจูด <strong aria-hidden="true">*</strong><input inputMode="decimal" onChange={(event) => onChange({ longitude: event.target.value })} required step="any" type="number" value={value.longitude} /></label>
          <label>ความแม่นยำ GPS (เมตร) <strong aria-hidden="true">*</strong><input inputMode="decimal" min="0" onChange={(event) => onChange({ gpsAccuracyM: event.target.value })} required step="any" type="number" value={value.gpsAccuracyM} /></label>
          <label>วิธีวัด <strong aria-hidden="true">*</strong><input onChange={(event) => onChange({ gpsMethod: event.target.value })} placeholder="เช่น GPS จากอุปกรณ์ เฉลี่ย 3 จุด" required value={value.gpsMethod} /></label>
          <label>วันที่เวลาวัด <strong aria-hidden="true">*</strong><input onChange={(event) => onChange({ gpsMeasuredAt: event.target.value })} required type="datetime-local" value={value.gpsMeasuredAt} /></label>
          <label>รหัสผู้วัด <strong aria-hidden="true">*</strong><input onChange={(event) => onChange({ gpsMeasuredBy: event.target.value })} required value={value.gpsMeasuredBy} /></label>
          <label>ความมั่นใจ <strong aria-hidden="true">*</strong><select onChange={(event) => onChange({ gpsConfidence: event.target.value as MeasurementConfidence })} value={value.gpsConfidence}>{measurementOptions.map(([option, label]) => <option key={option} value={option}>{label}</option>)}</select></label>
          <label>แหล่งข้อมูล/อุปกรณ์ <strong aria-hidden="true">*</strong><input onChange={(event) => onChange({ gpsSource: event.target.value })} required value={value.gpsSource} /></label>
        </div> : null}
      </details>

      <details className="measurement-group">
        <summary>การวัดลำต้น {value.trunkEnabled ? '· พร้อมกรอก' : '· ยังไม่กรอก'}</summary>
        <label className="checkbox-control"><input checked={value.trunkEnabled} disabled={value.treeStatus === 'empty'} onChange={(event) => onChange({ trunkEnabled: event.target.checked })} type="checkbox" />เพิ่มข้อมูลลำต้น</label>
        {value.trunkEnabled ? <div className="form-grid measurement-fields">
          <label>ประเภทการวัด <strong aria-hidden="true">*</strong><select onChange={(event) => onChange({ trunkMeasureType: event.target.value as TreeCycleFormValue['trunkMeasureType'] })} value={value.trunkMeasureType}><option value="circumference">เส้นรอบวง</option><option value="diameter">เส้นผ่านศูนย์กลาง</option></select></label>
          <label>ค่าที่วัด (ซม.) <strong aria-hidden="true">*</strong><input inputMode="decimal" min="0.01" onChange={(event) => onChange({ trunkMeasureValue: event.target.value })} required step="any" type="number" value={value.trunkMeasureValue} /></label>
          <label>ความสูงจุดวัดจากพื้น (ซม.) <strong aria-hidden="true">*</strong><input inputMode="decimal" min="0" onChange={(event) => onChange({ trunkMeasureHeightCm: event.target.value })} required step="any" type="number" value={value.trunkMeasureHeightCm} /></label>
          <label>วิธีวัด <strong aria-hidden="true">*</strong><input onChange={(event) => onChange({ trunkMeasureMethod: event.target.value })} placeholder="เช่น สายวัด ณ จุดคงที่" required value={value.trunkMeasureMethod} /></label>
          <label>วันที่เวลาวัด <strong aria-hidden="true">*</strong><input onChange={(event) => onChange({ trunkMeasuredAt: event.target.value })} required type="datetime-local" value={value.trunkMeasuredAt} /></label>
          <label>รหัสผู้วัด <strong aria-hidden="true">*</strong><input onChange={(event) => onChange({ trunkMeasuredBy: event.target.value })} required value={value.trunkMeasuredBy} /></label>
          <label>ความมั่นใจ <strong aria-hidden="true">*</strong><select onChange={(event) => onChange({ trunkMeasureConfidence: event.target.value as MeasurementConfidence })} value={value.trunkMeasureConfidence}>{measurementOptions.map(([option, label]) => <option key={option} value={option}>{label}</option>)}</select></label>
          <label>แหล่งข้อมูล <strong aria-hidden="true">*</strong><input onChange={(event) => onChange({ trunkMeasureSource: event.target.value })} required value={value.trunkMeasureSource} /></label>
        </div> : null}
      </details>

      <details className="measurement-group">
        <summary>ทรงพุ่มสองทิศ {value.canopyEnabled ? '· พร้อมกรอก' : '· ยังไม่กรอก'}</summary>
        <label className="checkbox-control"><input checked={value.canopyEnabled} disabled={value.treeStatus === 'empty'} onChange={(event) => onChange({ canopyEnabled: event.target.checked })} type="checkbox" />เพิ่มข้อมูลทรงพุ่ม</label>
        {value.canopyEnabled ? <div className="form-grid measurement-fields">
          <label>กว้างเหนือ–ใต้ (ม.) <strong aria-hidden="true">*</strong><input inputMode="decimal" min="0.01" onChange={(event) => onChange({ canopyWidthNSValue: event.target.value })} required step="any" type="number" value={value.canopyWidthNSValue} /></label>
          <label>กว้างตะวันออก–ตะวันตก (ม.) <strong aria-hidden="true">*</strong><input inputMode="decimal" min="0.01" onChange={(event) => onChange({ canopyWidthEWValue: event.target.value })} required step="any" type="number" value={value.canopyWidthEWValue} /></label>
          <label>วิธีวัด <strong aria-hidden="true">*</strong><input onChange={(event) => onChange({ canopyMeasureMethod: event.target.value })} placeholder="เช่น วัดแนวแกนไขว้" required value={value.canopyMeasureMethod} /></label>
          <label>วันที่เวลาวัด <strong aria-hidden="true">*</strong><input onChange={(event) => onChange({ canopyMeasuredAt: event.target.value })} required type="datetime-local" value={value.canopyMeasuredAt} /></label>
          <label>รหัสผู้วัด <strong aria-hidden="true">*</strong><input onChange={(event) => onChange({ canopyMeasuredBy: event.target.value })} required value={value.canopyMeasuredBy} /></label>
          <label>ความมั่นใจ <strong aria-hidden="true">*</strong><select onChange={(event) => onChange({ canopyMeasureConfidence: event.target.value as MeasurementConfidence })} value={value.canopyMeasureConfidence}>{measurementOptions.map(([option, label]) => <option key={option} value={option}>{label}</option>)}</select></label>
          <label>แหล่งข้อมูล <strong aria-hidden="true">*</strong><input onChange={(event) => onChange({ canopyMeasureSource: event.target.value })} required value={value.canopyMeasureSource} /></label>
        </div> : null}
      </details>

      <details className="measurement-group">
        <summary>ความสูงต้น {value.heightEnabled ? '· พร้อมกรอก' : '· ยังไม่กรอก'}</summary>
        <label className="checkbox-control"><input checked={value.heightEnabled} disabled={value.treeStatus === 'empty'} onChange={(event) => onChange({ heightEnabled: event.target.checked })} type="checkbox" />เพิ่มข้อมูลความสูง</label>
        {value.heightEnabled ? <div className="form-grid measurement-fields">
          <label>ความสูง (ม.) <strong aria-hidden="true">*</strong><input inputMode="decimal" min="0.01" onChange={(event) => onChange({ heightValue: event.target.value })} required step="any" type="number" value={value.heightValue} /></label>
          <label>วิธีวัด <strong aria-hidden="true">*</strong><input onChange={(event) => onChange({ heightMeasureMethod: event.target.value })} placeholder="เช่น เครื่องวัดระยะ" required value={value.heightMeasureMethod} /></label>
          <label>วันที่เวลาวัด <strong aria-hidden="true">*</strong><input onChange={(event) => onChange({ heightMeasuredAt: event.target.value })} required type="datetime-local" value={value.heightMeasuredAt} /></label>
          <label>รหัสผู้วัด <strong aria-hidden="true">*</strong><input onChange={(event) => onChange({ heightMeasuredBy: event.target.value })} required value={value.heightMeasuredBy} /></label>
          <label>ความมั่นใจ <strong aria-hidden="true">*</strong><select onChange={(event) => onChange({ heightMeasureConfidence: event.target.value as MeasurementConfidence })} value={value.heightMeasureConfidence}>{measurementOptions.map(([option, label]) => <option key={option} value={option}>{label}</option>)}</select></label>
          <label>แหล่งข้อมูล <strong aria-hidden="true">*</strong><input onChange={(event) => onChange({ heightMeasureSource: event.target.value })} required value={value.heightMeasureSource} /></label>
        </div> : null}
      </details>

      <div className="photo-deferred-note"><strong>รูปประจำต้น</strong><span>ยังไม่เปิดรับรูปจริง เนื่องจาก Firebase Storage และนโยบายรูปจริงยังไม่พร้อม ช่องนี้จะเปิดภายหลังโดยไม่กระทบข้อมูลตำแหน่งที่บันทึกวันนี้</span></div>
    </section>
  </>
}
