// ─────────────────────────────────────────────────────────────────────────────
// HOOK useObjectDetector
// Inisialisasi MediaPipe ObjectDetector dan jalankan deteksi realtime
// pada video element dengan interval yang dikontrol (bukan setiap frame).
//
// Alur:
// 1. Initialize ObjectDetector dari MediaPipe Tasks Vision
// 2. Jalankan detect() setiap 300ms pada video element
// 3. Return detection results (label, score, bbox)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react'
import { FilesetResolver, ObjectDetector } from '@mediapipe/tasks-vision'
import type { DetectionResult, BoundingBox } from '../types'

// Interval deteksi: 300ms = ~3 deteksi per detik
// Tidak terlalu sering (hemat CPU) tapi cukup realtime
const DETECTION_INTERVAL_MS = 300

interface UseObjectDetectorReturn {
  detections: DetectionResult[]
  isModelReady: boolean
  isDetecting: boolean
  modelError: string | null
  videoRef: React.RefObject<HTMLVideoElement>
  videoWidth: number
  videoHeight: number
}

export function useObjectDetector(): UseObjectDetectorReturn {
  const [detections, setDetections] = useState<DetectionResult[]>([])
  const [isModelReady, setIsModelReady] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [modelError, setModelError] = useState<string | null>(null)
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 })

  // Refs untuk menyimpan state yang tidak trigger re-render
  const videoRef = useRef<HTMLVideoElement>(null)
  const detectorRef = useRef<ObjectDetector | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastDetectionRef = useRef<DetectionResult[]>([])

  // ── Inisialisasi MediaPipe ObjectDetector ────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function initDetector() {
      try {
        console.log('[useObjectDetector] 🔄 Memuat model MediaPipe ObjectDetector...')

        // FilesetResolver diperlukan untuk inisialisasi MediaPipe WASM
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        )

        // Buat ObjectDetector dengan model EfficientDet-Lite0
        // Model ini cukup ringan untuk browser dan cukup akurat
        const detector = await ObjectDetector.createFromOptions(vision, {
          baseOptions: {
            // Model EfficientDet-Lite0 - ringan dan cepat
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-assets/EfficientDet-Lite0/v2.tflite',
            delegate: 'GPU', // Gunakan GPU kalau tersedia
          },
          // Threshold confidence minimum
          runningMode: 'VIDEO',
          // Score minimal untuk deteksi (0–1)
          // Di bawah 0.5 biasanya noise, di atas 0.7 cukup reliable
          // Diset 0.5 sebagai default, bisa disesuaikan
          // categoryAllowlist: [],  // kosong = deteksi semua kategori
        })

        if (cancelled) return

        detectorRef.current = detector
        setIsModelReady(true)
        console.log('[useObjectDetector] ✅ Model ObjectDetector siap!')
      } catch (err) {
        console.error('[useObjectDetector] ❌ Gagal memuat model:', err)
        if (!cancelled) {
          setModelError(
            'Gagal memuat model deteksi objek. Pastikan koneksi internet stabil.'
          )
        }
      }
    }

    initDetector()

    return () => {
      cancelled = true
      // Cleanup detector
      if (detectorRef.current) {
        detectorRef.current.close()
        detectorRef.current = null
      }
      // Cleanup interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // ── Deteksi loop: jalan setiap DETECTION_INTERVAL_MS ────────────────────
  useEffect(() => {
    if (!isModelReady) return

    const runDetection = async () => {
      const video = videoRef.current
      const detector = detectorRef.current

      if (!video || !detector) return

      // Video harus sudah memiliki frame (loadedmetadata)
      if (video.readyState < 2) return

      // Skip kalau video tidak playing
      if (video.paused || video.ended) return

      setIsDetecting(true)

      try {
        // Jalankan deteksi pada frame video saat ini
        // detector.detectForVideo() menggunakan timestamp internally
        // untuk tracking antar frame
        const results = detector.detectForVideo(video, performance.now())

        if (results.detections && results.detections.length > 0) {
          // Konversi hasil MediaPipe ke format yang kita pakai
          const converted: DetectionResult[] = results.detections.map((d) => ({
            label: d.categories[0]?.categoryName ?? 'unknown',
            confidence: d.categories[0]?.score ?? 0,
            boundingBox: {
              originX: d.boundingBox?.originX ?? 0,
              originY: d.boundingBox?.originY ?? 0,
              width: d.boundingBox?.width ?? 0,
              height: d.boundingBox?.height ?? 0,
            },
          }))

          // Sort: confidence tertinggi di depan
          converted.sort((a, b) => b.confidence - a.confidence)

          lastDetectionRef.current = converted
          setDetections(converted)

          // Update video dimensions untuk konversi bbox ke pixel
          if (video.videoWidth && video.videoHeight) {
            setVideoDimensions({
              width: video.videoWidth,
              height: video.videoHeight,
            })
          }
        } else {
          lastDetectionRef.current = []
          setDetections([])
        }
      } catch (err) {
        console.error('[useObjectDetector] ❌ Deteksi error:', err)
      } finally {
        setIsDetecting(false)
      }
    }

    // Jalankan detection loop setiap DETECTION_INTERVAL_MS
    intervalRef.current = setInterval(runDetection, DETECTION_INTERVAL_MS)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isModelReady])

  // ── Helper: konversi bbox normalisasi ke pixel ──────────────────────────
  const bboxToPixel = useCallback(
    (bbox: BoundingBox): BoundingBox => {
      return {
        originX: bbox.originX * videoDimensions.width,
        originY: bbox.originY * videoDimensions.height,
        width: bbox.width * videoDimensions.width,
        height: bbox.height * videoDimensions.height,
      }
    },
    [videoDimensions]
  )

  return {
    detections,
    isModelReady,
    isDetecting,
    modelError,
    videoRef,
    videoWidth: videoDimensions.width,
    videoHeight: videoDimensions.height,
  }
}