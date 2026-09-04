import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'

import {
  previewTreeRegisterCsv,
  treeRegisterCsvHeaders,
  treeRegisterRegistrationCsvHeaders,
  treeRegisterThaiCsvHeaders,
  treeRegisterThaiRegistrationCsvHeaders,
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
    zoneCode: '1',
    rowCode: '1',
    treeSequence: '1',
    tagCode: 'Z1-R1-T1',
    plantingCycle: '1',
    variety: 'หมอนทอง',
    plantingYear: '2568',
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
  const cells = treeRegisterRegistrationCsvHeaders.map((header, index) =>
    `<c r="${letters(index)}2" t="inlineStr"><is><t>${values[header] ?? ''}</t></is></c>`
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
  it('creates a Thai Excel template that starts with farm-local position fields', async () => {
    const template = createTreeRegisterTemplateFile({
      farmCode: 'DEMO-F01',
      organizationCode: 'DEMO',
      farmSequence: 'F01',
    })
    expect(template.fileName).toBe('DEMO-F01-แบบฟอร์ม-ทะเบียนต้น.xlsx')

    const content = await readTreeRegisterSpreadsheet(await templateAsFile())
    const preview = previewTreeRegisterCsv(content.csvText, 'DEMO', 'F01')
    expect(content).toMatchObject({ format: 'XLSX', sheetName: 'ทะเบียนตำแหน่ง' })
    expect(content.csvText.split('\n')[0]).toBe(treeRegisterThaiRegistrationCsvHeaders.join(','))
    expect(content.csvText).not.toContain('ประเภทข้อมูล')
    expect(content.csvText).not.toContain('รหัสองค์กร')
    expect(content.csvText).not.toContain('ลำดับสวน')
    expect(preview.headerValid).toBe(true)
    expect(preview.totalRows).toBe(0)
  })

  it('reads a valid Thai data row from an Excel/Google Sheets export', async () => {
    const content = await readTreeRegisterSpreadsheet(await xlsxWithValidRow())
    const preview = previewTreeRegisterCsv(content.csvText, 'DEMO', 'F01')
    expect(preview.rejects).toHaveLength(0)
    expect(preview.candidates).toHaveLength(1)
    expect(preview.candidates[0]).toMatchObject({
      zoneCode: 'Z01',
      rowCode: 'R01',
      treeSequence: 1,
      tagCode: 'Z01-R01-T01',
      plantingYear: 2568,
    })
  })

  it('accepts Thai CSV and legacy English CSV, and explains that .xls must be converted', async () => {
    const thaiCsv = `${treeRegisterThaiCsvHeaders.join(',')}\n`
    const thaiContent = await readTreeRegisterSpreadsheet(new File([thaiCsv], 'thai-template.csv', { type: 'text/csv' }))
    expect(thaiContent).toEqual({ csvText: thaiCsv, format: 'CSV', sheetName: 'CSV' })
    expect(previewTreeRegisterCsv(thaiContent.csvText, 'DEMO', 'F01').headerValid).toBe(true)

    const compactThaiCsv = `${treeRegisterThaiRegistrationCsvHeaders.join(',')}\n`
    expect(previewTreeRegisterCsv(compactThaiCsv, 'DEMO', 'F01').headerValid).toBe(true)

    const englishCsv = `${treeRegisterCsvHeaders.join(',')}\n`
    const englishContent = await readTreeRegisterSpreadsheet(new File([englishCsv], 'legacy-template.csv', { type: 'text/csv' }))
    expect(previewTreeRegisterCsv(englishContent.csvText, 'DEMO', 'F01').headerValid).toBe(true)

    await expect(readTreeRegisterSpreadsheet(new File(['legacy'], 'legacy.xls')))
      .rejects.toThrow(/Save As.*\.xlsx/u)
  })
})
