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

import { useState, useEffect, useRef } from 'react'
import { FilesetResolver, ObjectDetector } from '@mediapipe/tasks-vision'
import type { DetectionResult } from '../types'

// Interval deteksi: 300ms = ~3 deteksi per detik
// Tidak terlalu sering (hemat CPU) tapi cukup realtime
const DETECTION_INTERVAL_MS = 300

// Threshold dibuat lebih rendah agar objek nyata yang confidence-nya
// tidak terlalu tinggi tetap bisa dipakai. EfficientDet-Lite0 tidak
// mengenali semua objek, jadi 0.35 memberi ruang lebih untuk deteksi.
const DETECTION_SCORE_THRESHOLD = 0.35

// Model configuration - can be overridden via env var
const MODEL_CONFIG = {
  wasmPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',

  modelPath: import.meta.env.VITE_MEDIAPIPE_MODEL_PATH ||
     'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float32/1/efficientdet_lite0.tflite',

  delegate: 'GPU' as const,
}

interface UseObjectDetectorProps {
  cameraReady: boolean
  videoRef: React.RefObject<HTMLVideoElement>
}

interface UseObjectDetectorReturn {
  detections: DetectionResult[]
  isModelReady: boolean
  isDetecting: boolean
  modelError: string | null
  videoWidth: number
  videoHeight: number
}

export function useObjectDetector({ cameraReady, videoRef }: UseObjectDetectorProps): UseObjectDetectorReturn {
  const [detections, setDetections] = useState<DetectionResult[]>([])
  const [isModelReady, setIsModelReady] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [modelError, setModelError] = useState<string | null>(null)
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 })

  // Refs untuk menyimpan state yang tidak trigger re-render
  const detectorRef = useRef<ObjectDetector | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastDetectionRef = useRef<DetectionResult[]>([])
  const initAttemptRef = useRef(0)
  const isInitializedRef = useRef(false)

  // ── Inisialisasi MediaPipe ObjectDetector ────────────────────────────────
  useEffect(() => {
    // Only initialize after camera is ready
    if (!cameraReady) {
      console.log('[useObjectDetector] ⏳ Menunggu kamera siap sebelum init detector...')
      return
    }

    // Skip if already initialized successfully
    if (isInitializedRef.current) {
      return
    }

    let cancelled = false
    const currentAttempt = ++initAttemptRef.current

    async function initDetector() {
      try {
        console.log('[useObjectDetector] 🔄 Memuat model MediaPipe ObjectDetector...')
        console.log('[useObjectDetector] 📦 WASM Path:', MODEL_CONFIG.wasmPath)
        console.log('[useObjectDetector] 🤖 Model Path:', MODEL_CONFIG.modelPath)

        // FilesetResolver diperlukan untuk inisialisasi MediaPipe WASM
        const vision = await FilesetResolver.forVisionTasks(MODEL_CONFIG.wasmPath)

        // Check if this attempt is still current (not cancelled)
        if (cancelled || currentAttempt !== initAttemptRef.current) {
          console.log('[useObjectDetector] ⏹️ Init cancelled or stale, aborting')
          return
        }

        // Buat ObjectDetector dengan model EfficientDet-Lite0
        // Model ini cukup ringan untuk browser dan cukup akurat
        const detector = await ObjectDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_CONFIG.modelPath,
            delegate: MODEL_CONFIG.delegate,
          },
          runningMode: 'VIDEO',
        })

        // Double-check after async operation
        if (cancelled || currentAttempt !== initAttemptRef.current) {
          console.log('[useObjectDetector] ⏹️ Init cancelled or stale after model creation, aborting')
          detector.close()
          return
        }

        detectorRef.current = detector
        isInitializedRef.current = true
        setIsModelReady(true)
        console.log('[useObjectDetector] ✅ Model ObjectDetector siap!')
      } catch (err) {
        console.error('[useObjectDetector] ❌ Gagal memuat model:', err)
        if (!cancelled && currentAttempt === initAttemptRef.current) {
          setModelError(
            'Mode realtime gagal, tetapi manual scan tetap bisa digunakan.'
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
        intervalRef.current = null
      }
      isInitializedRef.current = false
    }
  }, [cameraReady])

  // ── Deteksi loop: jalan setiap DETECTION_INTERVAL_MS ────────────────────
  useEffect(() => {
    // Only run detection loop when model is ready AND camera is ready
    if (!isModelReady || !cameraReady) return

    const runDetection = async () => {
      const video = videoRef.current
      const detector = detectorRef.current

      if (!video || !detector) return

      // Video harus sudah memiliki frame (readyState >= 2 means have current data)
      if (video.readyState < 2) {
        return
      }

      // Skip kalau video tidak playing
      if (video.paused || video.ended) return

      setIsDetecting(true)

      try {
        // Jalankan deteksi pada frame video saat ini
        // detector.detectForVideo() menggunakan timestamp internally
        // untuk tracking antar frame
        const results = detector.detectForVideo(video, performance.now())

        if (results.detections && results.detections.length > 0) {
          const vw = video.videoWidth || 1
          const vh = video.videoHeight || 1

          // Convert MediaPipe results to our format
          // Apply confidence threshold and keep top 3 only
          const converted: DetectionResult[] = results.detections
            .filter((d) => {
              // Filter out invalid detections
              const rawBbox = d.boundingBox
              if (!rawBbox) return false
              const w = rawBbox.width ?? 0
              const h = rawBbox.height ?? 0
              if (w <= 0 || h <= 0) return false
              // Only include detections that meet the score threshold
              const score = d.categories[0]?.score ?? 0
              if (score < DETECTION_SCORE_THRESHOLD) return false
              return true
            })
            .map((d) => {
              const raw = d.boundingBox!
              // Normalize to 0-1 range
              const originX = Math.max(0, Math.min(1, raw.originX / vw))
              const originY = Math.max(0, Math.min(1, raw.originY / vh))
              const width = Math.max(0, Math.min(1, raw.width / vw))
              const height = Math.max(0, Math.min(1, raw.height / vh))

              return {
                label: d.categories[0]?.categoryName ?? 'unknown',
                confidence: d.categories[0]?.score ?? 0,
                boundingBox: { originX, originY, width, height },
              }
            })

          // Sort by confidence descending
          converted.sort((a, b) => b.confidence - a.confidence)

          // Keep only top 3 detections
          const topDetections = converted.slice(0, 3)

          // Only log summary, not full array
          if (topDetections.length > 0) {
            console.log(
              `[useObjectDetector] Detections: ${topDetections.length} (max 3 shown)`,
              topDetections.map((d) => `${d.label} (${Math.round(d.confidence * 100)}%)`)
            )
          }

          lastDetectionRef.current = topDetections
          setDetections(topDetections)

          // Update video dimensions
          setVideoDimensions({ width: vw, height: vh })
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
  }, [isModelReady, cameraReady])

  
  return {
    detections,
    isModelReady,
    isDetecting,
    modelError,
    videoWidth: videoDimensions.width,
    videoHeight: videoDimensions.height,
  }
}
