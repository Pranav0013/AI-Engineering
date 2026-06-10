import { FRAME_QUALITY, FRAME_SIZE, MAX_VIDEO_FRAMES } from './constants'

export async function extractVideoFrames(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const objectUrl = URL.createObjectURL(file)
    video.src = objectUrl
    video.muted = true
    video.playsInline = true

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load video file'))
    }

    video.onloadedmetadata = () => {
      const duration = video.duration
      if (!isFinite(duration) || duration === 0) {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Video has no valid duration'))
        return
      }

      const frameCount = Math.min(MAX_VIDEO_FRAMES, Math.ceil(duration))
      const interval = duration / frameCount
      const timestamps = Array.from({ length: frameCount }, (_, i) => i * interval)

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const frames: string[] = []
      let idx = 0

      function captureNextFrame() {
        if (idx >= timestamps.length) {
          URL.revokeObjectURL(objectUrl)
          resolve(frames)
          return
        }
        video.currentTime = timestamps[idx]
      }

      video.onseeked = () => {
        const aspectRatio = video.videoWidth / video.videoHeight
        if (aspectRatio >= 1) {
          canvas.width = FRAME_SIZE
          canvas.height = Math.round(FRAME_SIZE / aspectRatio)
        } else {
          canvas.height = FRAME_SIZE
          canvas.width = Math.round(FRAME_SIZE * aspectRatio)
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', FRAME_QUALITY)
        frames.push(dataUrl.split(',')[1])
        idx++
        captureNextFrame()
      }

      captureNextFrame()
    }
  })
}

export async function extractPlaywrightTrace(
  file: File
): Promise<{ traceContent: string; screenshots: string[] }> {
  const { default: JSZip } = await import('jszip')
  const zip = await JSZip.loadAsync(await file.arrayBuffer())

  const textParts: string[] = []
  const screenshots: string[] = []

  const entries = Object.entries(zip.files)

  for (const [name, zipEntry] of entries) {
    if (zipEntry.dir) continue

    if (name.endsWith('.trace') || name.endsWith('.json') || name.endsWith('.txt')) {
      const text = await zipEntry.async('text')
      if (text.length > 0) textParts.push(`--- ${name} ---\n${text.slice(0, 8000)}`)
    } else if (
      (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg')) &&
      screenshots.length < 3
    ) {
      const base64 = await zipEntry.async('base64')
      screenshots.push(base64)
    }
  }

  return {
    traceContent: textParts.slice(0, 4).join('\n\n').slice(0, 32000),
    screenshots,
  }
}
