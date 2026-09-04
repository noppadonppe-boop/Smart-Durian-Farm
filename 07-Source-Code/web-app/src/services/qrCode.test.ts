import { describe, expect, it } from 'vitest'
import { generateQrDataUrl, generateQrMatrix, generateQrSvg } from './qrCode'

describe('qrCode service', () => {
  it('generates a valid QR code matrix for Tag Code', () => {
    const result = generateQrMatrix('DEMO-F01-Z01-R01-T001')
    expect(result.version).toBe(2)
    expect(result.size).toBe(25)
    expect(result.matrix.length).toBe(25)
    expect(result.matrix[0]?.length).toBe(25)
    // Top-left finder center is black (r=3, c=3)
    expect(result.matrix[3]?.[3]).toBe(true)
    // Top-left finder inner ring is white (r=1, c=1)
    expect(result.matrix[1]?.[1]).toBe(false)
  })

  it('generates a valid QR code matrix for long URL', () => {
    const url = 'https://durian-smartfarm.web.app/t/pos_3d5b08c903274df08611b8539e6a9fc9'
    const result = generateQrMatrix(url)
    expect(result.version).toBe(5)
    expect(result.size).toBe(37)
    expect(result.matrix.length).toBe(37)
  })

  it('generates valid SVG string and data URL', () => {
    const svg = generateQrSvg('TEST-TAG')
    expect(svg).toContain('<svg')
    expect(svg).toContain('viewBox=')
    expect(svg).toContain('<rect')
    expect(svg).toContain('<path')

    const dataUrl = generateQrDataUrl('TEST-TAG')
    expect(dataUrl.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true)
  })

  it('renders a human-readable label below the QR code when requested', () => {
    const svg = generateQrSvg('TEST-TAG', { label: 'Z01-R01-T02' })

    expect(svg).toContain('<text')
    expect(svg).toContain('>Z01-R01-T02</text>')
    expect(svg).toMatch(/viewBox="0 0 \d+ \d+\.\d+"/)
  })

  it('escapes a label before embedding it in SVG markup', () => {
    const svg = generateQrSvg('TEST-TAG', { label: 'A&B <TAG>' })

    expect(svg).toContain('A&amp;B &lt;TAG&gt;')
  })

  it('throws for text exceeding version 10 capacity', () => {
    const longText = 'A'.repeat(300)
    expect(() => generateQrMatrix(longText)).toThrow(/ข้อความยาวเกินความจุ/)
  })
})
