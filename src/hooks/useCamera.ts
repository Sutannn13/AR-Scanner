import { useCallback, useEffect, useRef, useState } from 'react'

export interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>
  ready: boolean
  camError: string | null
  captureFrame: () => string | null
  retryCamera: () => void
}

const CAMERA_CONSTRAINTS_PRIMARY = {
  video: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
  audio: false,
}

const CAMERA_CONSTRAINTS_FALLBACK = {
  video: true,
  audio: false,
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [ready, setReady] = useState(false)
  const [camError, setCamError] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const initAttemptRef = useRef(0)

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const startCamera = useCallback(async () => {
    const attempt = ++initAttemptRef.current
    cleanupStream()
    setReady(false)
    setCamError(null)

    console.log(`[useCamera] 📷 Meminta akses kamera (attempt #${attempt})...`)

    let stream: MediaStream | null = null

    // Try primary constraints (back camera with ideal resolution)
    try {
      console.log('[useCamera] Attempting back camera with ideal resolution...')
      console.log('[useCamera] Constraints:', JSON.stringify(CAMERA_CONSTRAINTS_PRIMARY))
      stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS_PRIMARY)
    } catch (err) {
      console.warn('[useCamera] Back camera failed, trying fallback (any camera)...', err)
      try {
        console.log('[useCamera] Attempting any available camera...')
        console.log('[useCamera] Fallback Constraints:', JSON.stringify(CAMERA_CONSTRAINTS_FALLBACK))
        stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS_FALLBACK)
      } catch (fallbackErr) {
        console.error('[useCamera] ❌ Semua upaya akses kamera gagal:', fallbackErr)
        if (attempt === initAttemptRef.current) {
          setCamError(
            'Kamera tidak bisa diakses. Pastikan izin kamera sudah diberikan, gunakan HTTPS, dan coba刷新 halaman.'
          )
        }
        return
      }
    }

    // Abort if this attempt is stale
    if (attempt !== initAttemptRef.current) {
      cleanupStream()
      return
    }

    streamRef.current = stream
    console.log('[useCamera] ✅ Stream diterima!', stream.getTracks().map(t => `${t.kind}:${t.label}`).join(', '))

    const video = videoRef.current
    if (!video) {
      cleanupStream()
      return
    }

    video.srcObject = stream
    video.setAttribute('playsinline', '')
    video.setAttribute('muted', '')

    // Use multiple events to ensure video is truly ready
    const handleCanPlay = async () => {
      if (attempt !== initAttemptRef.current) return

      console.log('[useCamera] loadedmetadata event fired')
      console.log(`[useCamera] video.readyState: ${video.readyState}`)
      console.log(`[useCamera] videoWidth: ${video.videoWidth}, videoHeight: ${video.videoHeight}`)

      try {
        console.log('[useCamera] Calling video.play()...')
        await video.play()
        console.log('[useCamera] ✅ video.play() berhasil!')

        // Only set ready when video has real dimensions
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          console.log(`[useCamera] ✅ Kamera siap! Resolution: ${video.videoWidth}x${video.videoHeight}`)
          setReady(true)
        } else {
          console.warn('[useCamera] ⚠️ video.play() berhasil tapi dimensi masih 0, menunggu...')
          // Wait for actual dimensions
          video.onloadeddata = null
          video.oncanplay = null
          video.onplaying = () => {
            if (attempt === initAttemptRef.current && video.videoWidth > 0 && video.videoHeight > 0) {
              console.log(`[useCamera] ✅ Kamera siap (from playing event)! Resolution: ${video.videoWidth}x${video.videoHeight}`)
              setReady(true)
            }
          }
        }
      } catch (playErr) {
        console.error('[useCamera] ❌ video.play() gagal:', playErr)
        if (attempt === initAttemptRef.current) {
          setCamError('Gagal memulai video. Pastikan tidak ada aplikasi lain yang menggunakan kamera.')
        }
      }
    }

    video.onloadedmetadata = handleCanPlay
    video.onloadeddata = () => {
      if (attempt === initAttemptRef.current) {
        console.log('[useCamera] loadeddata event fired')
      }
    }
    video.oncanplay = () => {
      if (attempt === initAttemptRef.current) {
        console.log('[useCamera] canplay event fired')
      }
    }
    video.onplaying = () => {
      if (attempt === initAttemptRef.current) {
        console.log('[useCamera] playing event fired')
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          console.log(`[useCamera] ✅ Kamera siap (playing event)! Resolution: ${video.videoWidth}x${video.videoHeight}`)
          setReady(true)
        }
      }
    }
    video.onerror = () => {
      console.error('[useCamera] ❌ Video element error:', video.error)
      if (attempt === initAttemptRef.current) {
        setCamError(`Video error: ${video.error?.message ?? 'Unknown error'}`)
      }
    }
  }, [cleanupStream])

  useEffect(() => {
    startCamera()

    return () => {
      cleanupStream()
    }
  }, [startCamera, cleanupStream])

  /**
   * Retry camera without page refresh
   */
  const retryCamera = useCallback(() => {
    console.log('[useCamera] 🔄 Retrying camera...')
    startCamera()
  }, [startCamera])

  /**
   * Capture current video frame → base64 JPEG string (without the data: prefix)
   */
  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current
    if (!video || !ready) {
      console.warn('[useCamera] captureFrame: video not ready', { ready: !!ready })
      return null
    }

    // Check if video has actual content
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn('[useCamera] captureFrame: video has no dimensions yet')
      return null
    }

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Quality 0.85 = good balance of size vs detail for AI analysis
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    return dataUrl.split(',')[1] // strip "data:image/jpeg;base64,"
  }, [ready])

  return { videoRef, ready, camError, captureFrame, retryCamera }
}
