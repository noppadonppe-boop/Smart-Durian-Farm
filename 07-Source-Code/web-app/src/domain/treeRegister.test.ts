import {
  buildQrPayload,
  emptyTreeBaselineMeasurements,
  generateTagCode,
  parseTagCode,
  positionIdFromQrInput,
  previewTreeRegisterCsv,
  treeRegisterCsvHeaders,
  treeRegisterImportLimit,
  treeRegisterThaiCsvHeaders,
  validateTreeCycleInput,
} from './treeRegister'

function csvRow(overrides: Record<string, string> = {}): string {
  const values: Record<string, string> = {
    recordType: 'FIELD_DATA',
    organizationCode: 'DEMO',
    farmSequence: 'F01',
    zoneCode: 'Z01',
    rowCode: 'R01',
    treeSequence: '1',
    tagCode: 'DEMO-F01-Z01-R01-T001',
    plantingCycle: '1',
    variety: '',
    varietyConfidence: 'unknown',
    plantingYear: '',
    plantingYearCalendar: '',
    plantingYearConfidence: 'unknown',
    treeStatus: 'normal',
    baselineDate: '2026-08-31',
    notes: 'TEST EXAMPLE DATA ONLY',
    ...overrides,
  }
  return treeRegisterCsvHeaders.map((header) => values[header] ?? '').join(',')
}

function csv(...rows: string[]): string {
  return `${treeRegisterCsvHeaders.join(',')}\n${rows.join('\n')}`
}

function thaiCsvRow(overrides: Record<string, string> = {}): string {
  const values: Record<string, string> = {
    recordType: 'ข้อมูลภาคสนาม',
    organizationCode: 'DEMO',
    farmSequence: 'F01',
    zoneCode: 'Z01',
    rowCode: 'R01',
    treeSequence: '1',
    tagCode: 'DEMO-F01-Z01-R01-T001',
    plantingCycle: '1',
    variety: 'พันธุ์ตัวอย่าง',
    varietyConfidence: 'ประมาณ',
    plantingYear: '2564',
    plantingYearCalendar: 'พ.ศ.',
    plantingYearConfidence: 'ประมาณ',
    treeStatus: 'ปกติ',
    baselineDate: '2026-08-31',
    notes: 'SIMULATED/TEST ONLY',
    ...overrides,
  }
  return treeRegisterCsvHeaders.map((header) => values[header] ?? '').join(',')
}

function thaiCsv(...rows: string[]): string {
  return `${treeRegisterThaiCsvHeaders.join(',')}\n${rows.join('\n')}`
}

describe('Tree Tag and QR invariants', () => {
  it('generates and parses an approved human-readable tag', () => {
    const tag = generateTagCode({
      organizationCode: 'demo',
      farmSequence: 'f01',
      zoneCode: 'z02',
      rowCode: 'r03',
      treeSequence: 17,
    })
    expect(tag).toBe('DEMO-F01-Z02-R03-T017')
    expect(parseTagCode(tag)).toEqual({
      organizationCode: 'DEMO',
      farmSequence: 'F01',
      zoneCode: 'Z02',
      rowCode: 'R03',
      treeSequence: 17,
    })
  })

  it.each(['DEMO-F01-Z01-R01-T000', 'DEMO F01 Z01 R01 T001', 'D-F1-Z1-R1-T1'])(
    'rejects invalid tag %s',
    (tag) => expect(() => parseTagCode(tag)).toThrow(),
  )

  it('creates and resolves only the configured permanent QR route', () => {
    const positionId = 'pos_1234567890abcdef'
    const payload = buildQrPayload('https://qr.invalid/app/', positionId)
    expect(payload).toBe(`https://qr.invalid/app/t/${positionId}`)
    expect(positionIdFromQrInput(payload, 'https://qr.invalid/app')).toBe(positionId)
    expect(() => positionIdFromQrInput(
      `https://wrong.invalid/t/${positionId}`,
      'https://qr.invalid/app',
    )).toThrow(/base URL/u)
  })
})

describe('Tree Register CSV validation', () => {
  it('accepts a valid 49-column FIELD_DATA row', () => {
    const preview = previewTreeRegisterCsv(csv(csvRow()), 'DEMO', 'F01')
    expect(preview.headerValid).toBe(true)
    expect(preview.candidates).toHaveLength(1)
    expect(preview.rejects).toHaveLength(0)
    expect(preview.candidates.at(0)?.tagCode).toBe('DEMO-F01-Z01-R01-T001')
  })

  it('keeps typed GPS evidence from a valid import candidate', () => {
    const preview = previewTreeRegisterCsv(csv(csvRow({
      latitude: '13.7563',
      longitude: '100.5018',
      gpsAccuracyM: '4.5',
      gpsMethod: 'device_gps_average_3',
      gpsMeasuredAt: '2026-08-31T09:00:00+07:00',
      gpsMeasuredBy: 'survey-user-01',
      gpsConfidence: 'measured',
      gpsSource: 'phone-gps',
    })), 'DEMO', 'F01')
    expect(preview.rejects).toHaveLength(0)
    expect(preview.candidates[0]?.baselineMeasurements.gps).toMatchObject({
      latitude: 13.7563,
      longitude: 100.5018,
      accuracyM: 4.5,
      confidence: 'measured',
    })
  })

  it('rejects tree facts when the position status is empty', () => {
    expect(() => validateTreeCycleInput({
      variety: 'หมอนทอง',
      varietyConfidence: 'confirmed',
      plantingYear: null,
      plantingYearCalendar: null,
      plantingYearConfidence: 'unknown',
      plantSource: null,
      treeStatus: 'empty',
      baselineDate: '2026-08-31',
      baselineMeasurements: emptyTreeBaselineMeasurements(),
    })).toThrow(/ไม่มีต้น/u)
  })

  it('accepts Thai headers and Thai option values, then normalizes them internally', () => {
    const preview = previewTreeRegisterCsv(thaiCsv(thaiCsvRow()), 'DEMO', 'F01')
    expect(preview.headerValid).toBe(true)
    expect(preview.rejects).toHaveLength(0)
    expect(preview.candidates).toHaveLength(1)
    expect(preview.candidates[0]).toMatchObject({
      varietyConfidence: 'estimated',
      plantingYear: 2564,
      plantingYearCalendar: 'BE',
      plantingYearConfidence: 'estimated',
      treeStatus: 'normal',
    })
  })

  it('rejects a file that mixes Thai and legacy English headers', () => {
    const mixedHeaders: string[] = [...treeRegisterThaiCsvHeaders]
    mixedHeaders[0] = 'recordType'
    const preview = previewTreeRegisterCsv(
      `${mixedHeaders.join(',')}\n${thaiCsvRow()}`,
      'DEMO',
      'F01',
    )
    expect(preview.headerValid).toBe(false)
    expect(preview.rejects[0]?.errors.join(' ')).toMatch(/แม่แบบภาษาไทย/u)
  })

  it('rejects the EXAMPLE template row and never treats it as field data', () => {
    const preview = previewTreeRegisterCsv(
      csv(csvRow({ recordType: 'EXAMPLE' })),
      'DEMO',
      'F01',
    )
    expect(preview.candidates).toHaveLength(0)
    expect(preview.rejects.at(0)?.errors.join(' ')).toMatch(/ข้อมูลภาคสนาม/u)
  })

  it('detects duplicate rows, mismatched tags and wrong-farm imports', () => {
    const preview = previewTreeRegisterCsv(
      csv(
        csvRow(),
        csvRow(),
        csvRow({ treeSequence: '2', tagCode: 'DEMO-F01-Z01-R01-T999' }),
        csvRow({
          organizationCode: 'OTHER',
          treeSequence: '3',
          tagCode: 'OTHER-F01-Z01-R01-T003',
        }),
      ),
      'DEMO',
      'F01',
    )
    expect(preview.candidates).toHaveLength(1)
    expect(preview.rejects).toHaveLength(3)
    expect(preview.rejects.flatMap((reject) => reject.errors).join(' ')).toMatch(
      /ซ้ำ|ไม่ตรง|organizationCode/u,
    )
  })

  it('uses a stable idempotency key for retries of identical content', () => {
    const content = csv(csvRow())
    expect(previewTreeRegisterCsv(content, 'DEMO', 'F01').idempotencyKey).toBe(
      previewTreeRegisterCsv(content, 'DEMO', 'F01').idempotencyKey,
    )
  })

  it('rejects rows over the 50-position atomic import limit during Preview', () => {
    const rows = Array.from({ length: treeRegisterImportLimit + 1 }, (_, index) => csvRow({
      treeSequence: String(index + 1),
      tagCode: `DEMO-F01-Z01-R01-T${String(index + 1).padStart(3, '0')}`,
    }))
    const preview = previewTreeRegisterCsv(csv(...rows), 'DEMO', 'F01')
    expect(preview.candidates).toHaveLength(treeRegisterImportLimit)
    expect(preview.rejects).toHaveLength(1)
    expect(preview.rejects[0]?.errors.join(' ')).toMatch(/ไม่เกิน 50/u)
  })
})
