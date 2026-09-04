import jsQR from 'jsqr'

/**
 * Scans an HTMLVideoElement frame for QR codes using an in-memory or provided canvas.
 * Optimized for performance: limits resolution to max 640px and skips frames when video is not ready.
 */
export function scanVideoFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): string | null {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return null
  const videoWidth = video.videoWidth
  const videoHeight = video.videoHeight
  if (!videoWidth || !videoHeight) return null

  // Downscale to max 640px to ensure smooth scanning without high CPU usage
  const maxDim = 640
  let width = videoWidth
  let height = videoHeight
  if (width > maxDim || height > maxDim) {
    if (width > height) {
      height = Math.round((height * maxDim) / width)
      width = maxDim
    } else {
      width = Math.round((width * maxDim) / height)
      height = maxDim
    }
  }

  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null

  ctx.drawImage(video, 0, 0, width, height)
  const imageData = ctx.getImageData(0, 0, width, height)
  if (!imageData || !imageData.data) return null

  try {
    const code = jsQR(imageData.data, width, height, {
      inversionAttempts: 'dontInvert',
    })
    return code?.data?.trim() || null
  } catch {
    return null
  }
}
