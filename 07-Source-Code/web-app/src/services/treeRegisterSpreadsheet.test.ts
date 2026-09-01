import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'

import {
  previewTreeRegisterCsv,
  treeRegisterCsvHeaders,
  treeRegisterThaiCsvHeaders,
} from '../domain/treeRegister'
import {
  createTreeRegisterTemplateFile,
  readTreeRegisterSpreadsheet,
} from './treeRegisterSpreadsheet'

const excelMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

async function templateAsFile(): Promise<File> {
  const template = createTreeRegisterTemplateFile({
    farmCode: 'DEMO-F01',
    organizationCode: 'DEMO',
    farmSequence: 'F01',
  })
  return new File([await template.blob.arrayBuffer()], template.fileName, { type: excelMimeType })
}

async function xlsxWithValidRow(): Promise<File> {
  const template = await templateAsFile()
  const archive = unzipSync(new Uint8Array(await template.arrayBuffer()))
  const values: Record<string, string> = {
    recordType: 'ข้อมูลภาคสนาม',
    organizationCode: 'DEMO',
    farmSequence: 'F01',
    zoneCode: 'Z02',
    rowCode: 'R03',
    treeSequence: '17',
    tagCode: 'DEMO-F01-Z02-R03-T017',
    plantingCycle: '1',
    varietyConfidence: 'ไม่ทราบ',
    plantingYearConfidence: 'ไม่ทราบ',
    treeStatus: 'ปกติ',
    baselineDate: '2026-09-01',
    notes: 'SIMULATED/TEST ONLY',
  }
  const letters = (index: number) => {
    let value = index + 1
    let result = ''
    while (value > 0) {
      result = String.fromCharCode(65 + ((value - 1) % 26)) + result
      value = Math.floor((value - 1) / 26)
    }
    return result
  }
  const excelSerial = (
    Date.UTC(2026, 8, 1) - Date.UTC(1899, 11, 30)
  ) / 86_400_000
  const cells = treeRegisterCsvHeaders.map((header, index) => header === 'baselineDate'
    ? `<c r="${letters(index)}2"><v>${excelSerial}</v></c>`
    : `<c r="${letters(index)}2" t="inlineStr"><is><t>${values[header] ?? ''}</t></is></c>`
  ).join('')
  const sheetPath = 'xl/worksheets/sheet1.xml'
  const sheet = strFromU8(archive[sheetPath]!)
    .replace('<sheetData>', '<sheetData>')
    .replace('</sheetData>', `<row r="2">${cells}</row></sheetData>`)
  archive[sheetPath] = strToU8(sheet)
  const bytes = zipSync(archive, { level: 6 })
  return new File([bytes.buffer], 'google-sheets-export.xlsx', { type: excelMimeType })
}

describe('Tree Register Excel/Google Sheets files', () => {
  it('creates a scoped Thai Excel template with the exact import header', async () => {
    const template = createTreeRegisterTemplateFile({
      farmCode: 'DEMO-F01',
      organizationCode: 'DEMO',
      farmSequence: 'F01',
    })
    expect(template.fileName).toBe('DEMO-F01-แบบฟอร์ม-ทะเบียนต้น.xlsx')

    const content = await readTreeRegisterSpreadsheet(await templateAsFile())
    const preview = previewTreeRegisterCsv(content.csvText, 'DEMO', 'F01')
    expect(content).toMatchObject({ format: 'XLSX', sheetName: 'ทะเบียนตำแหน่ง' })
    expect(content.csvText.split('\n')[0]).toBe(treeRegisterThaiCsvHeaders.join(','))
    expect(preview.headerValid).toBe(true)
    expect(preview.totalRows).toBe(0)
  })

  it('reads a valid Thai data row from an Excel/Google Sheets export', async () => {
    const content = await readTreeRegisterSpreadsheet(await xlsxWithValidRow())
    const preview = previewTreeRegisterCsv(content.csvText, 'DEMO', 'F01')
    expect(preview.rejects).toHaveLength(0)
    expect(preview.candidates).toHaveLength(1)
    expect(preview.candidates[0]?.tagCode).toBe('DEMO-F01-Z02-R03-T017')
    expect(preview.candidates[0]?.baselineDate).toBe('2026-09-01')
  })

  it('accepts Thai CSV and legacy English CSV, and explains that .xls must be converted', async () => {
    const thaiCsv = `${treeRegisterThaiCsvHeaders.join(',')}\n`
    const thaiContent = await readTreeRegisterSpreadsheet(new File([thaiCsv], 'thai-template.csv', { type: 'text/csv' }))
    expect(thaiContent).toEqual({ csvText: thaiCsv, format: 'CSV', sheetName: 'CSV' })
    expect(previewTreeRegisterCsv(thaiContent.csvText, 'DEMO', 'F01').headerValid).toBe(true)

    const englishCsv = `${treeRegisterCsvHeaders.join(',')}\n`
    const englishContent = await readTreeRegisterSpreadsheet(new File([englishCsv], 'legacy-template.csv', { type: 'text/csv' }))
    expect(previewTreeRegisterCsv(englishContent.csvText, 'DEMO', 'F01').headerValid).toBe(true)

    await expect(readTreeRegisterSpreadsheet(new File(['legacy'], 'legacy.xls')))
      .rejects.toThrow(/Save As.*\.xlsx/u)
  })
})
