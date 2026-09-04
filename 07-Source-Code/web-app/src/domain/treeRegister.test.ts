import {
  buildQrPayload,
  emptyTreeBaselineMeasurements,
  generateTagCode,
  normalizeRowCode,
  normalizeTreeSequence,
  normalizeZoneCode,
  parseTagCode,
  positionIdFromQrInput,
  previewTreeRegisterCsv,
  treeRegisterCsvHeaders,
  treeRegisterImportLimit,
  treeRegisterRegistrationCsvHeaders,
  treeRegisterThaiCsvHeaders,
  treeRegisterThaiRegistrationCsvHeaders,
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

function registrationCsvRow(overrides: Record<string, string> = {}): string {
  const values: Record<string, string> = {
    zoneCode: '1',
    rowCode: '1',
    treeSequence: '1',
    tagCode: 'Z1-R1-T1',
    plantingCycle: '1',
    variety: 'หมอนทอง',
    plantingYear: '2568',
    ...overrides,
  }
  return treeRegisterRegistrationCsvHeaders.map((field) => values[field] ?? '').join(',')
}

describe('Tree Tag and QR invariants', () => {
  it.each([
    ['Z01', 'Z01'],
    ['Z1', 'Z01'],
    ['01', 'Z01'],
    ['1', 'Z01'],
  ])('normalizes zone input %s to %s', (input, expected) => {
    expect(normalizeZoneCode(input)).toBe(expected)
  })

  it.each([
    ['R01', 'R01'],
    ['R1', 'R01'],
    ['01', 'R01'],
    ['1', 'R01'],
  ])('normalizes row input %s to %s', (input, expected) => {
    expect(normalizeRowCode(input)).toBe(expected)
  })

  it.each([
    ['T01', 1],
    ['T1', 1],
    ['01', 1],
    ['1', 1],
  ])('normalizes tree input %s to sequence %s', (input, expected) => {
    expect(normalizeTreeSequence(input)).toBe(expected)
  })

  it('generates a farm-local tag and still parses it with trusted Farm context', () => {
    const tag = generateTagCode({
      organizationCode: 'demo',
      farmSequence: 'f01',
      zoneCode: 'z02',
      rowCode: 'r03',
      treeSequence: 17,
    })
    expect(tag).toBe('Z02-R03-T17')
    expect(parseTagCode(tag, { organizationCode: 'DEMO', farmSequence: 'F01' })).toEqual({
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
    expect(preview.candidates.at(0)?.tagCode).toBe('Z01-R01-T01')
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

  it('accepts the compact Thai registration template without farm context columns', () => {
    const preview = previewTreeRegisterCsv(
      `${treeRegisterThaiRegistrationCsvHeaders.join(',')}\n${registrationCsvRow()}`,
      'DEMO',
      'F01',
    )
    expect(preview.headerValid).toBe(true)
    expect(preview.rejects).toHaveLength(0)
    expect(preview.candidates[0]).toMatchObject({
      zoneCode: 'Z01',
      rowCode: 'R01',
      treeSequence: 1,
      tagCode: 'Z01-R01-T01',
      plantingCycle: 1,
      plantingYear: 2568,
      plantingYearCalendar: 'BE',
    })
  })

  it('keeps the previous compact Thai template importable', () => {
    const legacyHeaders = [
      'ประเภทข้อมูล',
      'รหัสองค์กร',
      'ลำดับสวน',
      ...treeRegisterThaiRegistrationCsvHeaders,
    ]
    const legacyRow = [
      'ข้อมูลภาคสนาม',
      'DEMO',
      'F01',
      registrationCsvRow(),
    ].join(',')
    const preview = previewTreeRegisterCsv(
      `${legacyHeaders.join(',')}\n${legacyRow}`,
      'DEMO',
      'F01',
    )
    expect(preview.headerValid).toBe(true)
    expect(preview.rejects).toHaveLength(0)
    expect(preview.candidates[0]?.tagCode).toBe('Z01-R01-T01')
  })

  it('accepts position-only compact rows and fills the canonical tag and first cycle', () => {
    const preview = previewTreeRegisterCsv(
      `${treeRegisterThaiRegistrationCsvHeaders.join(',')}\n1,1,1\nZ1,R1,T2\n01,01,3`,
      'DEMO',
      'F01',
    )
    expect(preview.rejects).toHaveLength(0)
    expect(preview.candidates.map((candidate) => ({
      zoneCode: candidate.zoneCode,
      rowCode: candidate.rowCode,
      treeSequence: candidate.treeSequence,
      tagCode: candidate.tagCode,
      plantingCycle: candidate.plantingCycle,
      treeStatus: candidate.treeStatus,
    }))).toEqual([
      { zoneCode: 'Z01', rowCode: 'R01', treeSequence: 1, tagCode: 'Z01-R01-T01', plantingCycle: 1, treeStatus: 'empty' },
      { zoneCode: 'Z01', rowCode: 'R01', treeSequence: 2, tagCode: 'Z01-R01-T02', plantingCycle: 1, treeStatus: 'empty' },
      { zoneCode: 'Z01', rowCode: 'R01', treeSequence: 3, tagCode: 'Z01-R01-T03', plantingCycle: 1, treeStatus: 'empty' },
    ])
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
