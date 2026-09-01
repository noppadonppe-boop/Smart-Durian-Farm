import { describe, expect, it, vi } from 'vitest'

import { prepareWorkPhotoForUpload, withBoundedPhotoRetry } from './workPhotoProcessing'

describe('work photo processing', () => {
  it('scales, re-encodes to WebP, and marks metadata stripped', async () => {
    const close = vi.fn()
    const encode = vi.fn((_source, width: number, height: number) => {
      expect(width).toBe(1600)
      expect(height).toBe(1200)
      return Promise.resolve(new Blob(['prepared'], { type: 'image/webp' }))
    })
    const result = await prepareWorkPhotoForUpload(
      new Blob(['source'], { type: 'image/jpeg' }),
      {
        decode: () => Promise.resolve({
          source: {} as CanvasImageSource,
          width: 3200,
          height: 2400,
          close,
        }),
        encode,
      },
    )

    expect(result.processingMode).toBe('CANVAS_REENCODED')
    expect(result.outputMimeType).toBe('image/webp')
    expect(result.metadataStripped).toBe(true)
    expect(result.preparedWidth).toBe(1600)
    expect(result.preparedHeight).toBe(1200)
    expect(close).toHaveBeenCalledOnce()
  })

  it('rejects unsupported source formats before decoding', async () => {
    await expect(prepareWorkPhotoForUpload(
      new Blob(['svg'], { type: 'image/svg+xml' }),
    )).rejects.toThrow('JPEG, PNG, WebP, HEIC')
  })

  it('allows an explicitly labelled fallback only for simulated tests', async () => {
    const source = new Blob(['mock'], { type: 'image/png' })
    const result = await prepareWorkPhotoForUpload(source, {
      allowSimulatedTestFallback: true,
      decode: () => Promise.reject(new Error('no decoder in jsdom')),
    })
    expect(result.processingMode).toBe('SIMULATED_TEST_FALLBACK')
    expect(result.metadataStripped).toBe(false)

    await expect(prepareWorkPhotoForUpload(source, {
      decode: () => Promise.reject(new Error('no decoder')),
    })).rejects.toThrow('no decoder')
  })

  it('fails closed with the approved HEIC capture/conversion fallback guidance', async () => {
    await expect(prepareWorkPhotoForUpload(
      new Blob(['heic'], { type: 'image/heic' }),
      { decode: () => Promise.reject(new Error('HEIC decoder unavailable')) },
    )).rejects.toThrow(/Most Compatible\/JPEG.*ห้ามอัปโหลดไฟล์ต้นฉบับ/u)
  })

  it('retries a photo operation at most three times', async () => {
    const operation = vi.fn((attempt: number) => attempt < 3
      ? Promise.reject(new Error('transient'))
      : Promise.resolve('uploaded'))
    await expect(withBoundedPhotoRetry(operation, 3, () => Promise.resolve()))
      .resolves.toBe('uploaded')
    expect(operation).toHaveBeenCalledTimes(3)

    const failed = vi.fn(() => Promise.reject(new Error('still offline')))
    await expect(withBoundedPhotoRetry(failed, 3, () => Promise.resolve()))
      .rejects.toThrow('still offline')
    expect(failed).toHaveBeenCalledTimes(3)
  })
})
