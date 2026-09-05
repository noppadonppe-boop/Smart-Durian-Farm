import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'

import {
  generateTagCode,
  resolveTreeRegisterHeader,
  treeRegisterCsvHeaders,
  treeRegisterRegistrationCsvHeaders,
  treeRegisterThaiHeaderByField,
  treeRegisterThaiRegistrationCsvHeaders,
} from '../domain/treeRegister'

const excelMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const maxCompressedFileBytes = 2 * 1024 * 1024
const maxExpandedFileBytes = 8 * 1024 * 1024
const maxArchiveEntries = 64
const relationshipNamespace = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'

export interface TreeRegisterTemplateScope {
  farmCode: string
  organizationCode: string
  farmSequence: string
}

export interface TreeRegisterTemplateFile {
  blob: Blob
  fileName: string
}

export interface TreeRegisterSpreadsheetContent {
  csvText: string
  format: 'CSV' | 'XLSX'
  sheetName: string
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function columnName(index: number): string {
  let value = index + 1
  let name = ''
  while (value > 0) {
    const remainder = (value - 1) % 26
    name = String.fromCharCode(65 + remainder) + name
    value = Math.floor((value - 1) / 26)
  }
  return name
}

function columnIndex(reference: string): number {
  const match = /^([A-Z]+)\d+$/u.exec(reference.toUpperCase())
  if (!match?.[1]) return -1
  return [...match[1]].reduce((total, character) => total * 26 + character.charCodeAt(0) - 64, 0) - 1
}

function rowXml(
  values: readonly string[],
  rowNumber: number,
  style = 2,
  height?: number,
): string {
  const cells = values.map((value, index) => {
    const reference = `${columnName(index)}${rowNumber}`
    return `<c r="${reference}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`
  }).join('')
  const heightAttributes = height ? ` ht="${height}" customHeight="1"` : ''
  return `<row r="${rowNumber}"${heightAttributes}>${cells}</row>`
}

function worksheetXml(
  rows: readonly (readonly string[])[],
  options: { dataValidations?: string; filter?: boolean; widths?: readonly number[] } = {},
): string {
  const widestRow = Math.max(1, ...rows.map((row) => row.length))
  const lastCell = `${columnName(widestRow - 1)}${Math.max(1, rows.length)}`
  const widths = options.widths?.map((width, index) => (
    `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`
  )).join('') ?? ''
  const sheetRows = rows.map((row, index) => rowXml(
    row,
    index + 1,
    index === 0 ? 1 : 2,
    index === 0 ? 42 : undefined,
  )).join('')
  const autoFilter = options.filter ? `<autoFilter ref="A1:${columnName(widestRow - 1)}1"/>` : ''
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${lastCell}"/>
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  ${widths ? `<cols>${widths}</cols>` : ''}
  <sheetData>${sheetRows}</sheetData>
  ${autoFilter}
  ${options.dataValidations ?? ''}
  <pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>
</worksheet>`
}

function stylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2"><font><sz val="11"/><name val="Aptos"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Aptos"/></font></fonts>
  <fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF17562F"/><bgColor indexed="64"/></patternFill></fill></fills>
  <borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD9E1D8"/></left><right style="thin"><color rgb="FFD9E1D8"/></right><top style="thin"><color rgb="FFD9E1D8"/></top><bottom style="thin"><color rgb="FFD9E1D8"/></bottom><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="49" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="49" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyNumberFormat="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`
}

function createWorkbookBytes(scope: TreeRegisterTemplateScope): Uint8Array {
  const exampleTag = generateTagCode({
    organizationCode: scope.organizationCode,
    farmSequence: scope.farmSequence,
    zoneCode: 'Z01',
    rowCode: 'R03',
    treeSequence: 5,
  })
  const example = Object.fromEntries(treeRegisterRegistrationCsvHeaders.map((header) => [header, '']))
  Object.assign(example, {
    zoneCode: 'Z01',
    rowCode: 'R03',
    treeSequence: '5',
    tagCode: exampleTag,
    plantingCycle: '1',
    variety: 'พันธุ์ตัวอย่าง',
    plantingYear: '2568',
  })
  const exampleRow = treeRegisterRegistrationCsvHeaders.map((header) => String(example[header] ?? ''))
  const instructions = [
    ['แม่แบบทะเบียนต้น KDOMS', 'Firebase Production'],
    ['สวนเป้าหมาย', scope.farmCode],
    ['วิธีกรอก', 'กรอก 7 คอลัมน์ในชีต “ทะเบียนตำแหน่ง” เริ่มแถว 2; หากลงทะเบียนเฉพาะตำแหน่ง กรอก 3 คอลัมน์แรกได้; ห้ามเปลี่ยนชื่อภาษาไทยหรือลำดับคอลัมน์'],
    ['สวนปลายทาง', 'ระบบจะนำเข้าข้อมูลเข้าสวนปัจจุบันโดยอัตโนมัติ ไม่ต้องกรอกรหัสองค์กรหรือลำดับสวนในไฟล์'],
    ['ขอบเขต', 'นำเข้าได้ไม่จำกัดจำนวนแถวและต้องเป็นสวนปัจจุบันเท่านั้น ระบบจะอัปโหลดครั้งละ 50 ตำแหน่ง'],
    ['Google Sheets', 'อัปโหลดไฟล์นี้ไป Google Sheets แล้วดาวน์โหลดกลับเป็น Microsoft Excel (.xlsx) หรือ CSV ของชีต “ทะเบียนตำแหน่ง”'],
    ['รหัสป้าย', 'เว้นว่างได้ ระบบสร้างจากโซน-แถว-ต้น และบันทึกเป็นรูปแบบ เช่น Z01-R03-T05; ต้องไม่ซ้ำภายในสวน'],
    ['ไฟล์เดิม', 'ระบบยังนำเข้าแม่แบบ 49 คอลัมน์และ compact ภาษาไทยรุ่นเดิมได้ แต่ห้ามผสมหัวคอลัมน์สองภาษา'],
    ['ความปลอดภัย', 'ตรวจทั้งไฟล์ก่อนเขียนจริง; แต่ละชุด 50 ตำแหน่งป้องกันข้อมูลซ้ำ และใช้ไฟล์เดิมเริ่มต่อได้หากหยุดกลางทาง'],
    ['ข้อมูลจริง', 'กรอกเฉพาะข้อมูลภาคสนามที่ตรวจสอบแล้วในสวนปัจจุบัน'],
  ]
  const allowedValues = [
    ['ชื่อคอลัมน์', 'ค่าที่อนุญาต'],
    [treeRegisterThaiHeaderByField.zoneCode, 'รับ Z01, Z1, 01 หรือ 1; ระบบบันทึกเป็น Z01'],
    [treeRegisterThaiHeaderByField.rowCode, 'รับ R01, R1, 01 หรือ 1; ระบบบันทึกเป็น R01'],
    [treeRegisterThaiHeaderByField.treeSequence, 'รับ T01, T1, 01 หรือ 1; ระบบบันทึกเป็นลำดับต้นและสร้าง Tag แบบ T01'],
    [treeRegisterThaiHeaderByField.tagCode, 'เว้นว่างได้; ระบบสร้างเป็นโซน-แถว-ต้น เช่น Z01-R03-T05'],
    [treeRegisterThaiHeaderByField.plantingCycle, 'เว้นว่างได้; ตำแหน่งใหม่เริ่มที่ 1'],
    [treeRegisterThaiHeaderByField.plantingYear, 'พ.ศ. หรือ ค.ศ.; ระบบจำแนกจากค่า'],
  ]
  const sheet1 = worksheetXml([treeRegisterThaiRegistrationCsvHeaders], {
    filter: true,
    widths: treeRegisterThaiRegistrationCsvHeaders.map((header) => Math.min(32, Math.max(14, header.length + 2))),
  })
  const sheet2 = worksheetXml(instructions, { widths: [24, 96] })
  const sheet3 = worksheetXml([treeRegisterThaiRegistrationCsvHeaders, exampleRow], {
    filter: true,
    widths: treeRegisterThaiRegistrationCsvHeaders.map((header) => Math.min(32, Math.max(14, header.length + 2))),
  })
  const sheet4 = worksheetXml(allowedValues, { widths: [28, 88] })
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet4.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`
  const rootRelationships = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`
  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="${relationshipNamespace}"><sheets><sheet name="ทะเบียนตำแหน่ง" sheetId="1" r:id="rId1"/><sheet name="วิธีใช้" sheetId="2" r:id="rId2"/><sheet name="ตัวอย่าง" sheetId="3" r:id="rId3"/><sheet name="ค่าที่อนุญาต" sheetId="4" r:id="rId4"/></sheets></workbook>`
  const workbookRelationships = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet4.xml"/><Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`
  return zipSync({
    '[Content_Types].xml': strToU8(contentTypes),
    '_rels/.rels': strToU8(rootRelationships),
    'xl/workbook.xml': strToU8(workbook),
    'xl/_rels/workbook.xml.rels': strToU8(workbookRelationships),
    'xl/styles.xml': strToU8(stylesXml()),
    'xl/worksheets/sheet1.xml': strToU8(sheet1),
    'xl/worksheets/sheet2.xml': strToU8(sheet2),
    'xl/worksheets/sheet3.xml': strToU8(sheet3),
    'xl/worksheets/sheet4.xml': strToU8(sheet4),
  }, { level: 6 })
}

function exactArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

export function createTreeRegisterTemplateFile(
  scope: TreeRegisterTemplateScope,
): TreeRegisterTemplateFile {
  const safeFarmCode = scope.farmCode.replace(/[^A-Za-z0-9-]+/gu, '-')
  const bytes = createWorkbookBytes(scope)
  return {
    blob: new Blob([exactArrayBuffer(bytes)], { type: excelMimeType }),
    fileName: `${safeFarmCode}-แบบฟอร์ม-ทะเบียนต้น.xlsx`,
  }
}

function parseXml(xml: string, label: string): XMLDocument {
  if (/<!DOCTYPE/iu.test(xml)) throw new Error(`${label} มี XML declaration ที่ไม่อนุญาต`)
  const document = new DOMParser().parseFromString(xml, 'application/xml')
  if (document.getElementsByTagName('parsererror').length > 0) {
    throw new Error(`${label} ในไฟล์ Excel ไม่ถูกต้อง`)
  }
  return document
}

function textNodes(element: Element): string {
  return [...element.getElementsByTagNameNS('*', 't')]
    .map((node) => node.textContent ?? '')
    .join('')
}

function assertArchiveBudget(bytes: Uint8Array): void {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let endOffset = -1
  const minimumOffset = Math.max(0, bytes.byteLength - 65_557)
  for (let offset = bytes.byteLength - 22; offset >= minimumOffset; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      endOffset = offset
      break
    }
  }
  if (endOffset < 0) throw new Error('ไฟล์ Excel ไม่มี ZIP directory ที่ถูกต้อง')
  const entryCount = view.getUint16(endOffset + 10, true)
  const centralOffset = view.getUint32(endOffset + 16, true)
  if (entryCount > maxArchiveEntries) throw new Error(`ไฟล์ Excel มีส่วนประกอบเกิน ${maxArchiveEntries} รายการ`)
  let expandedBytes = 0
  let offset = centralOffset
  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > bytes.byteLength || view.getUint32(offset, true) !== 0x02014b50) {
      throw new Error('ZIP directory ของไฟล์ Excel ไม่ถูกต้อง')
    }
    expandedBytes += view.getUint32(offset + 24, true)
    if (expandedBytes > maxExpandedFileBytes) {
      throw new Error(`ไฟล์ Excel ขยายแล้วต้องไม่เกิน ${maxExpandedFileBytes / 1024 / 1024} MB`)
    }
    const fileNameLength = view.getUint16(offset + 28, true)
    const extraLength = view.getUint16(offset + 30, true)
    const commentLength = view.getUint16(offset + 32, true)
    offset += 46 + fileNameLength + extraLength + commentLength
  }
}

function archiveText(archive: Record<string, Uint8Array>, path: string, label: string): string {
  const content = archive[path]
  if (!content) throw new Error(`ไม่พบ ${label} ในไฟล์ Excel`)
  return strFromU8(content)
}

function normalizeWorksheetPath(target: string): string {
  const normalized = target.replaceAll('\\', '/').replace(/^\//u, '')
  const path = normalized.startsWith('xl/') ? normalized : `xl/${normalized}`
  if (path.includes('../') || !path.startsWith('xl/worksheets/')) {
    throw new Error('Worksheet path ในไฟล์ Excel ไม่ปลอดภัย')
  }
  return path
}

function firstWorksheet(
  archive: Record<string, Uint8Array>,
): { sheetName: string; xml: string } {
  const workbook = parseXml(archiveText(archive, 'xl/workbook.xml', 'workbook'), 'Workbook')
  const relationships = parseXml(
    archiveText(archive, 'xl/_rels/workbook.xml.rels', 'workbook relationships'),
    'Workbook relationships',
  )
  const sheets = [...workbook.getElementsByTagNameNS('*', 'sheet')]
  const selected = sheets.find((sheet) => sheet.getAttribute('name') === 'ทะเบียนตำแหน่ง') ?? sheets[0]
  if (!selected) throw new Error('ไฟล์ Excel ไม่มี Worksheet')
  const relationshipId = selected.getAttributeNS(relationshipNamespace, 'id') ?? selected.getAttribute('r:id')
  const relationship = [...relationships.getElementsByTagNameNS('*', 'Relationship')]
    .find((item) => item.getAttribute('Id') === relationshipId)
  const target = relationship?.getAttribute('Target')
  if (!target) throw new Error('ไม่พบ Worksheet relationship ในไฟล์ Excel')
  const path = normalizeWorksheetPath(target)
  return {
    sheetName: selected.getAttribute('name') || 'Worksheet 1',
    xml: archiveText(archive, path, 'worksheet'),
  }
}

function sharedStrings(archive: Record<string, Uint8Array>): string[] {
  const content = archive['xl/sharedStrings.xml']
  if (!content) return []
  const document = parseXml(strFromU8(content), 'Shared strings')
  return [...document.getElementsByTagNameNS('*', 'si')].map(textNodes)
}

function worksheetRows(xml: string, strings: readonly string[]): string[][] {
  const document = parseXml(xml, 'Worksheet')
  const rows: string[][] = []
  for (const row of document.getElementsByTagNameNS('*', 'row')) {
    const values: string[] = []
    for (const cell of row.getElementsByTagNameNS('*', 'c')) {
      const index = columnIndex(cell.getAttribute('r') ?? '')
      if (index < 0 || index >= treeRegisterCsvHeaders.length + 20) continue
      const type = cell.getAttribute('t')
      const raw = cell.getElementsByTagNameNS('*', 'v').item(0)?.textContent ?? ''
      let value = raw
      if (type === 'inlineStr') value = textNodes(cell)
      if (type === 's') value = strings[Number(raw)] ?? ''
      values[index] = value
    }
    while (values.at(-1) === '') values.pop()
    if (values.some((value) => value !== '')) rows.push(values.map((value) => value ?? ''))
  }
  return rows
}

function excelSerialToIso(value: string, dateOnly: boolean): string {
  if (!/^\d+(?:\.\d+)?$/u.test(value)) return value
  const serial = Number(value)
  if (!Number.isFinite(serial) || serial < 1 || serial > 2_958_465) return value
  const milliseconds = Date.UTC(1899, 11, 30) + serial * 86_400_000
  const date = new Date(milliseconds)
  if (Number.isNaN(date.valueOf())) return value
  return dateOnly ? date.toISOString().slice(0, 10) : date.toISOString()
}

function normalizeSpreadsheetDates(rows: string[][]): string[][] {
  const header = rows[0]
  if (!header) return rows
  const dateOnlyHeaders = new Set(['baselineDate'])
  const dateTimeHeaders = new Set([
    'gpsMeasuredAt',
    'trunkMeasuredAt',
    'canopyMeasuredAt',
    'heightMeasuredAt',
  ])
  return rows.map((row, rowIndex) => {
    if (rowIndex === 0) return row
    return row.map((value, columnIndexValue) => {
      const field = resolveTreeRegisterHeader(header[columnIndexValue] ?? '')
      if (field && dateOnlyHeaders.has(field)) return excelSerialToIso(value, true)
      if (field && dateTimeHeaders.has(field)) return excelSerialToIso(value, false)
      return value
    })
  })
}

function csvCell(value: string): string {
  if (!/[",\r\n]/u.test(value)) return value
  return `"${value.replaceAll('"', '""')}"`
}

function rowsToCsv(rows: readonly (readonly string[])[]): string {
  return rows.map((row) => row.map(csvCell).join(',')).join('\n')
}

async function readXlsx(file: File): Promise<TreeRegisterSpreadsheetContent> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  assertArchiveBudget(bytes)
  let archive: Record<string, Uint8Array>
  try {
    archive = unzipSync(bytes)
  } catch {
    throw new Error('เปิดไฟล์ Excel ไม่สำเร็จ กรุณาดาวน์โหลดใหม่เป็น .xlsx')
  }
  const worksheet = firstWorksheet(archive)
  const rows = normalizeSpreadsheetDates(worksheetRows(worksheet.xml, sharedStrings(archive)))
  return { csvText: rowsToCsv(rows), format: 'XLSX', sheetName: worksheet.sheetName }
}

export async function readTreeRegisterSpreadsheet(
  file: File,
): Promise<TreeRegisterSpreadsheetContent> {
  if (file.size > maxCompressedFileBytes) {
    throw new Error(`ไฟล์ต้องไม่เกิน ${maxCompressedFileBytes / 1024 / 1024} MB`)
  }
  const name = file.name.toLowerCase()
  if (name.endsWith('.csv') || file.type === 'text/csv') {
    return { csvText: await file.text(), format: 'CSV', sheetName: 'CSV' }
  }
  if (name.endsWith('.xls')) {
    throw new Error('ไฟล์ .xls รุ่นเก่าไม่รองรับ กรุณา Save As เป็น .xlsx')
  }
  if (!name.endsWith('.xlsx') && file.type !== excelMimeType) {
    throw new Error('รองรับเฉพาะ Excel (.xlsx) และ CSV (.csv)')
  }
  return readXlsx(file)
}

export function downloadTreeRegisterTemplate(scope: TreeRegisterTemplateScope): void {
  const template = createTreeRegisterTemplateFile(scope)
  const url = URL.createObjectURL(template.blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = template.fileName
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
