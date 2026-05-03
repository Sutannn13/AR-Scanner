import { useEffect, useRef, useState, useCallback } from 'react'

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [ready, setReady] = useState(false)
  const [camError, setCamError] = useState<string | null>(null)

  useEffect(() => {
    let stream: MediaStream | null = null

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',   // kamera belakang di HP
            width:  { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })

        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        video.onloadedmetadata = () => {
          video.play()
          setReady(true)
        }
      } catch (err) {
        console.error('Camera error:', err)
        setCamError('Kamera tidak bisa diakses. Pastikan izin kamera sudah diberikan dan gunakan HTTPS.')
      }
    }

    start()

    return () => {
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  /**
   * Capture current video frame → base64 JPEG string (without the data: prefix)
   */
  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current
    if (!video || !ready) return null

    const canvas = document.createElement('canvas')
    canvas.width  = video.videoWidth  || 1280
    canvas.height = video.videoHeight || 720

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Quality 0.85 = good balance of size vs detail for Claude vision
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    return dataUrl.split(',')[1]   // strip "data:image/jpeg;base64,"
  }, [ready])

  return { videoRef, ready, camError, captureFrame }
}
