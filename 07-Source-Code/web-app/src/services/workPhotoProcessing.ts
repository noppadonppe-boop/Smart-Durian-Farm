import {
  validatePreparedWorkPhotoUpload,
  workPhotoUploadPolicy,
  type PreparedWorkPhotoUpload,
} from '../domain/workCareDisease'

interface DecodedWorkPhoto {
  source: CanvasImageSource
  width: number
  height: number
  close: () => void
}

export interface PrepareWorkPhotoOptions {
  allowSimulatedTestFallback?: boolean
  decode?: (source: Blob) => Promise<DecodedWorkPhoto>
  encode?: (
    source: CanvasImageSource,
    width: number,
    height: number,
    quality: number,
  ) => Promise<Blob>
}

async function decodeWithBrowser(source: Blob): Promise<DecodedWorkPhoto> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(source, { imageOrientation: 'from-image' })
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      }
    } catch {
      // Safari can decode some camera formats through HTMLImageElement even when
      // createImageBitmap cannot, so continue to that path.
    }
  }
  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    throw new Error('เบราว์เซอร์นี้ไม่มีตัวถอดรหัสรูปสำหรับการย่อภาพ')
  }
  const objectUrl = URL.createObjectURL(source)
  const image = new Image()
  image.decoding = 'async'
  const loaded = new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('เปิดภาพจากกล้องไม่สำเร็จ'))
  })
  image.src = objectUrl
  await loaded
  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    close: () => URL.revokeObjectURL(objectUrl),
  }
}

function encodeWithCanvas(
  source: CanvasImageSource,
  width: number,
  height: number,
  quality: number,
): Promise<Blob> {
  if (typeof document === 'undefined') {
    return Promise.reject(new Error('เบราว์เซอร์นี้ไม่มี Canvas สำหรับการย่อภาพ'))
  }
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { alpha: false })
  if (!context) return Promise.reject(new Error('เปิด Canvas สำหรับเตรียมรูปไม่สำเร็จ'))
  context.drawImage(source, 0, 0, width, height)
  return new Promise((resolve, reject) => canvas.toBlob((blob) => {
    if (!blob || blob.type !== workPhotoUploadPolicy.outputMimeType) {
      reject(new Error('อุปกรณ์นี้ไม่รองรับการแปลงรูปเป็น WebP'))
      return
    }
    resolve(blob)
  }, workPhotoUploadPolicy.outputMimeType, quality))
}

function scaledDimensions(width: number, height: number, maxDimension: number) {
  const largest = Math.max(width, height)
  const scale = largest > maxDimension ? maxDimension / largest : 1
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

export async function prepareWorkPhotoForUpload(
  source: Blob,
  options: PrepareWorkPhotoOptions = {},
): Promise<PreparedWorkPhotoUpload> {
  const sourceMimeType = source.type.toLowerCase()
  if (!workPhotoUploadPolicy.sourceMimeTypes.includes(
    sourceMimeType as (typeof workPhotoUploadPolicy.sourceMimeTypes)[number],
  )) {
    throw new Error('รองรับภาพต้นฉบับ JPEG, PNG, WebP, HEIC หรือ HEIF เท่านั้น')
  }
  if (source.size <= 0 || source.size > workPhotoUploadPolicy.maxSourceBytes) {
    throw new Error('ภาพต้นฉบับต้องไม่เกิน 25 MB')
  }

  let decoded: DecodedWorkPhoto
  try {
    decoded = await (options.decode ?? decodeWithBrowser)(source)
  } catch (error) {
    if (!options.allowSimulatedTestFallback) {
      if (sourceMimeType === 'image/heic' || sourceMimeType === 'image/heif') {
        throw new Error(
          'อุปกรณ์นี้ถอดรหัส HEIC/HEIF ไม่ได้: ให้ตั้งกล้อง iPhone เป็น Most Compatible/JPEG หรือใช้ตัวแปลงบนอุปกรณ์ที่ผ่านอนุมัติ; ห้ามอัปโหลดไฟล์ต้นฉบับที่ยังมี EXIF/GPS',
          { cause: error },
        )
      }
      throw error
    }
    return validatePreparedWorkPhotoUpload({
      blob: source,
      processingVersion: workPhotoUploadPolicy.processingVersion,
      processingMode: 'SIMULATED_TEST_FALLBACK',
      sourceMimeType,
      outputMimeType: source.type,
      originalSizeBytes: source.size,
      preparedSizeBytes: source.size,
      originalWidth: null,
      originalHeight: null,
      preparedWidth: null,
      preparedHeight: null,
      metadataStripped: false,
    }, true)
  }

  try {
    if (decoded.width <= 0 || decoded.height <= 0) throw new Error('มิติภาพต้นฉบับไม่ถูกต้อง')
    const encode = options.encode ?? encodeWithCanvas
    const qualitySteps = [workPhotoUploadPolicy.initialQuality, 0.72, 0.62]
    let maxDimension: number = workPhotoUploadPolicy.maxDimensionPixels
    for (let resizeAttempt = 0; resizeAttempt < 4; resizeAttempt += 1) {
      const dimensions = scaledDimensions(decoded.width, decoded.height, maxDimension)
      for (const quality of qualitySteps) {
        const blob = await encode(decoded.source, dimensions.width, dimensions.height, quality)
        if (blob.size <= workPhotoUploadPolicy.maxOutputBytes) {
          return validatePreparedWorkPhotoUpload({
            blob,
            processingVersion: workPhotoUploadPolicy.processingVersion,
            processingMode: 'CANVAS_REENCODED',
            sourceMimeType,
            outputMimeType: blob.type,
            originalSizeBytes: source.size,
            preparedSizeBytes: blob.size,
            originalWidth: decoded.width,
            originalHeight: decoded.height,
            preparedWidth: dimensions.width,
            preparedHeight: dimensions.height,
            metadataStripped: true,
          }, false)
        }
      }
      maxDimension = Math.max(640, Math.round(maxDimension * 0.8))
    }
    throw new Error('ไม่สามารถบีบอัดภาพให้ต่ำกว่า 5 MB ได้')
  } finally {
    decoded.close()
  }
}

export async function withBoundedPhotoRetry<T>(
  operation: (attempt: number) => Promise<T>,
  maximumAttempts = 3,
  wait: (milliseconds: number) => Promise<void> = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds)),
): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    try {
      return await operation(attempt)
    } catch (error) {
      lastError = error
      if (attempt < maximumAttempts) await wait(attempt === 1 ? 250 : 750)
    }
  }
  throw lastError instanceof Error ? lastError : new Error('อัปโหลดรูปไม่สำเร็จหลัง Retry')
}
