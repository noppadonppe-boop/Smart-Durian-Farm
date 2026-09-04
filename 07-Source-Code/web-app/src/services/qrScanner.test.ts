import { describe, expect, it, vi } from 'vitest'
import { scanVideoFrame } from './qrScanner'
import { generateQrMatrix } from './qrCode'
import jsQR from 'jsqr'

describe('qrScanner service', () => {
  it('returns null when video has no dimensions or is not ready', () => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')

    expect(scanVideoFrame(video, canvas)).toBeNull()
  })

  it('returns null when canvas context is unavailable', () => {
    const video = document.createElement('video')
    Object.defineProperty(video, 'readyState', { value: 4, configurable: true })
    Object.defineProperty(video, 'videoWidth', { value: 640, configurable: true })
    Object.defineProperty(video, 'videoHeight', { value: 480, configurable: true })

    const canvas = document.createElement('canvas')
    canvas.getContext = vi.fn().mockReturnValue(null)

    expect(scanVideoFrame(video, canvas)).toBeNull()
  })

  it('extracts frame and decodes QR code via jsQR', () => {
    const text = 'DEMO-F01-Z01-R01-T001'
    const qr = generateQrMatrix(text)
    const scale = 8
    const margin = 4
    const size = (qr.size + margin * 2) * scale
    const rawRgba = new Uint8ClampedArray(size * size * 4)

    // Fill white background
    rawRgba.fill(255)
    for (let r = 0; r < qr.size; r++) {
      for (let c = 0; c < qr.size; c++) {
        if (qr.matrix[r]?.[c]) {
          const startX = (c + margin) * scale
          const startY = (r + margin) * scale
          for (let dy = 0; dy < scale; dy++) {
            for (let dx = 0; dx < scale; dx++) {
              const idx = ((startY + dy) * size + (startX + dx)) * 4
              rawRgba[idx] = 0
              rawRgba[idx + 1] = 0
              rawRgba[idx + 2] = 0
              rawRgba[idx + 3] = 255
            }
          }
        }
      }
    }

    // Direct test with jsQR
    const directResult = jsQR(rawRgba, size, size)
    expect(directResult?.data).toBe(text)

    // Test scanVideoFrame with mocked canvas context
    const video = document.createElement('video')
    Object.defineProperty(video, 'readyState', { value: 4, configurable: true })
    Object.defineProperty(video, 'videoWidth', { value: size, configurable: true })
    Object.defineProperty(video, 'videoHeight', { value: size, configurable: true })

    const canvas = document.createElement('canvas')
    const drawImageMock = vi.fn()
    const getImageDataMock = vi.fn().mockReturnValue({
      data: rawRgba,
      width: size,
      height: size,
    })

    canvas.getContext = vi.fn().mockReturnValue({
      drawImage: drawImageMock,
      getImageData: getImageDataMock,
    })

    const decoded = scanVideoFrame(video, canvas)
    expect(decoded).toBe(text)
    expect(drawImageMock).toHaveBeenCalled()
    expect(getImageDataMock).toHaveBeenCalled()
  })
})
