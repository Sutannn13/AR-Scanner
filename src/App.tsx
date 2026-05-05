import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, Cpu, Wifi, Timer, RefreshCw } from 'lucide-react'
import { useCamera } from './hooks/useCamera'
import { useObjectDetector } from './hooks/useObjectDetector'
import { useStableObject } from './hooks/useStableObject'
import { useScanStore, useARStore, useARSessionStore } from './store/scanStore'
import { analyzeImage, onCooldownTick } from './services/geminiService'
import { CameraView } from './components/CameraView'
import { FloatingARLabel } from './components/FloatingARLabel'
import { ScanButton } from './components/ScanButton'
import { InfoCard } from './components/InfoCard'
import { ScanHistory } from './components/ScanHistory'
import type { DetectedObject } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// AR Button Status - derived from AR session state
// ─────────────────────────────────────────────────────────────────────────────
export type ARButtonStatus = 'idle' | 'armed' | 'waiting' | 'analyzing' | 'done' | 'error'

export default function App() {
  const { videoRef, ready: cameraReady, camError, captureFrame, retryCamera } = useCamera()

  // ── Object Detection (MediaPipe) ───────────────────────────────────────────
  const {
    detections,
    isModelReady: isDetectorReady,
    modelError,
    videoWidth,
    videoHeight,
  } = useObjectDetector({ cameraReady, videoRef })

  // ── Stores ───────────────────────────────────────────────────────────────────
  const {
    arOverlay,
    isAIAnalyzing,
    trackedLabel,
    setAROverlay,
    setIsAIAnalyzing,
    setTrackedLabel,
    clearAROverlay,
  } = useARStore()

  const {
    status, current, history, error, cooldownSeconds,
    setStatus, setError, addResult, setCurrent, setCooldown,
  } = useScanStore()

  const {
    isScanArmed,
    hasAnalyzedCurrentTarget,
    isARActive,
    arResult,
    startARScanSession,
    finishARScanSession,
    resetARScanSession,
    markTargetAnalyzed,
    setARResult,
    clearARResult,
  } = useARSessionStore()

  // ── Refs ───────────────────────────────────────────────────────────────────────
  const analysisInProgressRef = useRef(false)
  const stableProgressRef = useRef<number>(0)
  // Grace period timer: jangan hapus result segera saat objek hilang
  const targetLostTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Ref untuk AR result agar timer callback dapat nilai terbaru
  const arResultRef = useRef(arResult)
  useEffect(() => { arResultRef.current = arResult }, [arResult])
  const GRACE_PERIOD_MS = 2000

  // Fallback hold scan refs: ketika MediaPipe tidak mendeteksi objek apapun,
  // kita still trigger AI setelah 3 detik hold berdasarkan frame capture.
  const fallbackHoldStartRef = useRef<number | null>(null)
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fallbackTriggeredRef = useRef(false)
  // Fallback progress untuk UI feedback
  const [fallbackProgress, setFallbackProgress] = useState<number>(0)
  const FALLBACK_HOLD_MS = 3000

  // ── AR Button Status ────────────────────────────────────────────────────────
  const getARButtonStatus = (): ARButtonStatus => {
    if (isAIAnalyzing) return 'analyzing'
    if (isScanArmed && !hasAnalyzedCurrentTarget) return 'waiting'
    if (isARActive && !isScanArmed && arResult) return 'done'
    if (status === 'error') return 'error'
    return 'idle'
  }

  const arButtonStatus = getARButtonStatus()

  // ── Trigger AI Recognition (AR session) ───────────────────────────────────
  // Defined before useStableObject so its ref can be passed to callbacks
  const triggerAIRecognition = useCallback(async (obj: DetectedObject) => {
    if (analysisInProgressRef.current) return
    analysisInProgressRef.current = true

    const label = obj.label
    console.log(`[AR Session] 🤖 AI called once for: ${label}`)

    setIsAIAnalyzing(true)
    setTrackedLabel(label)
    setAROverlay({
      targetLabel: label,
      bbox: obj.bbox,
      result: null,
      isAnalyzing: true,
      showProgress: false,
    })

    try {
      const base64 = captureFrame()
      if (!base64) {
        throw new Error('Gagal mengambil gambar dari kamera')
      }

      const result = await analyzeImage(base64)

      // Store result in AR session store (NOT in history automatically)
      setARResult(result)

      // Update overlay with result
      setAROverlay({
        targetLabel: label,
        bbox: obj.bbox,
        result,
        isAnalyzing: false,
        showProgress: false,
      })

      console.log(`[AR Session] ✅ Result displayed: ${result.objectName}`)
      finishARScanSession()
    } catch (err) {
      console.error(`[AR Session] ❌ Analysis failed:`, err)
      clearAROverlay()
      clearARResult()
      resetARScanSession()
    } finally {
      analysisInProgressRef.current = false
      setIsAIAnalyzing(false)
    }
  }, [
    captureFrame,
    setARResult,
    setAROverlay,
    setTrackedLabel,
    setIsAIAnalyzing,
    clearAROverlay,
    clearARResult,
    finishARScanSession,
    resetARScanSession,
  ])

  // Ref to triggerAIRecognition for use in callbacks
  const triggerAIRecognitionRef = useRef(triggerAIRecognition)
  useEffect(() => {
    triggerAIRecognitionRef.current = triggerAIRecognition
  }, [triggerAIRecognition])

  // ── Fallback AI Recognition (frame scan when MediaPipe fails) ───────────────
  // Tidak memerlukan DetectedObject dari MediaPipe.
  // Trigger AI berdasarkan captureFrame() + bbox tengah fallback.
  const triggerAIRecognitionFromFrame = useCallback(async () => {
    if (analysisInProgressRef.current) return
    analysisInProgressRef.current = true

    const label = 'Frame Scan'
    console.log(`[AR Session] 🤖 AI fallback called for: ${label}`)

    setIsAIAnalyzing(true)
    setTrackedLabel(label)

    // Fallback bbox: area tengah 60% frame
    const fallbackBbox = { originX: 0.2, originY: 0.2, width: 0.6, height: 0.6 }

    setAROverlay({
      targetLabel: label,
      bbox: fallbackBbox,
      result: null,
      isAnalyzing: true,
      showProgress: false,
    })

    try {
      const base64 = captureFrame()
      if (!base64) {
        throw new Error('Gagal mengambil gambar dari kamera')
      }

      const result = await analyzeImage(base64)

      setARResult(result)

      // Overlay tetap di center mode
      setAROverlay({
        targetLabel: label,
        bbox: fallbackBbox,
        result,
        isAnalyzing: false,
        showProgress: false,
      })

      console.log(`[AR Session] ✅ Fallback result displayed: ${result.objectName}`)
      finishARScanSession()
    } catch (err) {
      console.error(`[AR Session] ❌ Fallback analysis failed:`, err)
      clearAROverlay()
      clearARResult()
      resetARScanSession()
    } finally {
      analysisInProgressRef.current = false
      setIsAIAnalyzing(false)
    }
  }, [
    captureFrame,
    setARResult,
    setAROverlay,
    setTrackedLabel,
    setIsAIAnalyzing,
    clearAROverlay,
    clearARResult,
    finishARScanSession,
    resetARScanSession,
  ])

  // Ref for fallback function
  const triggerAIRecognitionFromFrameRef = useRef(triggerAIRecognitionFromFrame)
  useEffect(() => {
    triggerAIRecognitionFromFrameRef.current = triggerAIRecognitionFromFrame
  }, [triggerAIRecognitionFromFrame])

  // ── Stability tracking - AR session aware ──────────────────────────────────
  const handleOnLost = useCallback((label: string) => {
    // HANYA log kalau tracking label yang sedang dianalisis
    if (trackedLabel === label) {
      console.log(`[AR Session] 🔴 Target lost: ${label} — starting grace period ${GRACE_PERIOD_MS}ms`)

      // Jangan hapus result imediatamente — beri grace period
      if (targetLostTimerRef.current) {
        clearTimeout(targetLostTimerRef.current)
      }

      targetLostTimerRef.current = setTimeout(() => {
        // Setelah grace period: baru hapus jika result masih ada
        if (arResultRef.current) {
          console.log(`[AR Session] 🗑️ Grace period expired — clearing result`)
          clearAROverlay()
          clearARResult()
          analysisInProgressRef.current = false

          if (isScanArmed) {
            finishARScanSession()
          }
        }
      }, GRACE_PERIOD_MS)
    }
    // Ignore lost labels yang bukan trackedLabel
  }, [trackedLabel, clearAROverlay, clearARResult, isScanArmed, finishARScanSession])

  const handleOnStable = useCallback((obj: DetectedObject) => {
    // ONLY trigger if AR session is armed and hasn't analyzed yet
    if (!isScanArmed) return
    if (hasAnalyzedCurrentTarget) return
    if (analysisInProgressRef.current) return

    // Cancel any pending target-lost timer
    if (targetLostTimerRef.current) {
      clearTimeout(targetLostTimerRef.current)
      targetLostTimerRef.current = null
    }

    console.log(`[AR Session] 🟢 Stable target found: ${obj.label}`)

    // Mark as analyzed BEFORE calling AI to prevent duplicate calls
    const targetKey = `${obj.label}_${Math.round(obj.bbox.originX * 100)}_${Math.round(obj.bbox.originY * 100)}`
    markTargetAnalyzed(targetKey)

    // Call via ref to avoid circular dependency
    triggerAIRecognitionRef.current(obj)
  }, [isScanArmed, hasAnalyzedCurrentTarget, markTargetAnalyzed])

  const { stableObject, updateDetections, resetStability } = useStableObject({
    stabilityThresholdMs: 3000,
    onStable: handleOnStable,
    onLost: handleOnLost,
  })

  // Track progress for UI feedback
  useEffect(() => {
    if (isScanArmed && stableObject) {
      stableProgressRef.current = stableObject.progress
    }
  }, [isScanArmed, stableObject])

  // ── Update detections (always, for onLost to work) ────────────────────────
  useEffect(() => {
    updateDetections(detections)
  }, [detections, updateDetections])

  // ── Fallback hold timer: ketika MediaPipe tidak mendeteksi objek ──────────
  // Jika Armed + belum analyzed + detections kosong → mulai fallback hold 3 detik.
  // Jika detections muncul kembali → reset fallback timer.
  useEffect(() => {
    const isArmed = isScanArmed && !hasAnalyzedCurrentTarget

    if (!isArmed) {
      // Clear fallback state when not armed
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current)
        fallbackTimerRef.current = null
      }
      fallbackHoldStartRef.current = null
      fallbackTriggeredRef.current = false
      setFallbackProgress(0)
      return
    }

    if (detections.length > 0) {
      // MediaPipe mendeteksi objek → reset fallback, biarkan stability flow yang jalan
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current)
        fallbackTimerRef.current = null
      }
      fallbackHoldStartRef.current = null
      setFallbackProgress(0)
      return
    }

    // detections.length === 0 AND isArmed → mulai/manjutkan fallback hold
    if (!fallbackHoldStartRef.current) {
      fallbackHoldStartRef.current = performance.now()
      fallbackTriggeredRef.current = false
      console.log('[AR Session] fallback hold started (no MediaPipe detections)')
    }

    // Progress update setiap 100ms
    const progressInterval = setInterval(() => {
      if (fallbackHoldStartRef.current) {
        const elapsed = performance.now() - fallbackHoldStartRef.current
        const progress = Math.min(100, Math.round((elapsed / FALLBACK_HOLD_MS) * 100))
        setFallbackProgress(progress)
      }
    }, 100)

    // Timer 3 detik untuk trigger AI
    fallbackTimerRef.current = setTimeout(() => {
      if (
        isScanArmed &&
        !hasAnalyzedCurrentTarget &&
        !analysisInProgressRef.current &&
        !fallbackTriggeredRef.current
      ) {
        fallbackTriggeredRef.current = true
        console.log('[AR Session] fallback AI called once (frame scan)')
        markTargetAnalyzed('fallback_frame_scan')
        // Panggil via ref untuk avoid circular dependency
        triggerAIRecognitionFromFrameRef.current()
      }
    }, FALLBACK_HOLD_MS)

    return () => {
      clearInterval(progressInterval)
    }
  }, [isScanArmed, hasAnalyzedCurrentTarget, detections, markTargetAnalyzed])

  // Cleanup fallback timer on unmount
  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current)
        fallbackTimerRef.current = null
      }
    }
  }, [])

  // ── Cleanup grace period timer on unmount ─────────────────────────────────
  useEffect(() => {
    return () => {
      if (targetLostTimerRef.current) {
        clearTimeout(targetLostTimerRef.current)
      }
    }
  }, [])

  // ── Start AR Scan Session ───────────────────────────────────────────────────
  const handleStartARScan = useCallback(() => {
    console.log('[AR Session] 🔵 User pressed START AR SCAN')

    // Clear previous results
    clearAROverlay()
    clearARResult()
    resetStability()
    analysisInProgressRef.current = false
    stableProgressRef.current = 0
    // Clear fallback refs
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }
    fallbackHoldStartRef.current = null
    fallbackTriggeredRef.current = false
    setFallbackProgress(0)

    // Start the AR session
    startARScanSession()
  }, [clearAROverlay, clearARResult, resetStability, startARScanSession])

  // ── Reset to idle / start new session ──────────────────────────────────────
  const handleResetARScan = useCallback(() => {
    console.log('[AR Session] 🔄 User pressed SCAN AGAIN')

    // Cancel pending grace period timer
    if (targetLostTimerRef.current) {
      clearTimeout(targetLostTimerRef.current)
      targetLostTimerRef.current = null
    }
    // Cancel fallback timer
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }

    clearAROverlay()
    clearARResult()
    resetStability()
    analysisInProgressRef.current = false
    stableProgressRef.current = 0
    fallbackHoldStartRef.current = null
    fallbackTriggeredRef.current = false
    setFallbackProgress(0)

    resetARScanSession()
  }, [clearAROverlay, clearARResult, resetStability, resetARScanSession])

  // ── Main button handler ────────────────────────────────────────────────────
  const handleScanButtonClick = useCallback(() => {
    switch (arButtonStatus) {
      case 'idle':
      case 'error':
        handleStartARScan()
        break
      case 'done':
        handleResetARScan()
        break
      case 'armed':
      case 'waiting':
      case 'analyzing':
        // Do nothing while session is active
        break
    }
  }, [arButtonStatus, handleStartARScan, handleResetARScan])

  // ── Listen to cooldown ticks ──────────────────────────────────────────────
  useEffect(() => {
    const unsub = onCooldownTick((remaining) => {
      setCooldown(remaining)
    })
    return unsub
  }, [setCooldown])

  // ── Camera status ───────────────────────────────────────────────────────────
  const getCameraStatus = () => {
    if (camError) return { label: 'NO_SIGNAL', active: false }
    if (!cameraReady) return { label: 'INIT_CAMERA', active: false }
    if (!isDetectorReady) return { label: 'CAM_LIVE', active: true }
    return { label: 'AR_READY', active: true }
  }

  const cameraStatus = getCameraStatus()

  // ── API Key check ───────────────────────────────────────────────────────────
  const hasAnyKey = !!(
    import.meta.env.VITE_GEMINI_API_KEY?.trim() ||
    import.meta.env.VITE_OPENROUTER_API_KEY?.trim() ||
    import.meta.env.VITE_TOGETHER_API_KEY?.trim() ||
    import.meta.env.VITE_HF_API_KEY?.trim()
  )

  // ── Instruction text based on session state ────────────────────────────────
  const getInstructionText = (): string | null => {
    if (arButtonStatus === 'analyzing') return 'Menganalisis objek...'
    if (arButtonStatus === 'done') return 'Objek terdeteksi! Arahkan ke objek lain atau tekan SCAN AGAIN'
    // Fallback mode: no detections but armed
    if (isScanArmed && !hasAnalyzedCurrentTarget && detections.length === 0) {
      if (fallbackProgress > 0) {
        return `Menganalisis area kamera dalam ${Math.ceil((FALLBACK_HOLD_MS - (fallbackHoldStartRef.current ? performance.now() - fallbackHoldStartRef.current : 0)) / 1000)}...`
      }
      return 'Objek belum dikenali. Tahan kamera tetap 3 detik untuk analisis AI.'
    }
    if (arButtonStatus === 'waiting') return 'Arahkan kamera ke objek dan tahan 3 detik'
    return null
  }

  const instructionText = getInstructionText()

  return (
    <div className="app-shell">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="app-header">
        <div
          className="header-icon"
          style={{ background: 'rgba(0,255,213,0.08)' }}
        >
          <Cpu size={20} className="text-hud-cyan" />
        </div>
        <div className="header-text">
          <h1 className="font-mono-tech text-hud-cyan glow-cyan header-title">
            AR_SCANNER
          </h1>
          <p className="header-subtitle">
            REALTIME CV · TUGAS VAR · UBSI
          </p>
        </div>

        {/* Live indicator */}
        <div className="header-status">
          <span className={`status-dot ${cameraStatus.active ? 'bg-hud-cyan animate-pulse-glow' : 'bg-hud-border'}`} />
          <Wifi size={12} className={cameraStatus.active ? 'text-hud-cyan' : 'text-hud-border'} />
          <span className="status-label">
            {cameraStatus.label}
          </span>
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────────── */}
      <main className="app-main">

        {/* Camera View with AR overlays */}
        <CameraView
          videoRef={videoRef}
          status={status}
          ready={cameraReady}
          detections={detections}
          stableObject={stableObject}
          videoWidth={videoWidth}
          videoHeight={videoHeight}
          arOverlay={arOverlay}
          isScanArmed={isScanArmed}
          arResult={arResult}
        />

        {/* Camera initializing message */}
        {!cameraReady && !camError && (
          <div className="alert-box alert-info">
            <RefreshCw size={14} className="text-hud-cyan flex-shrink-0 mt-0.5 animate-spin" />
            <span className="font-hud text-sm text-hud-cyan">Meminta akses kamera...</span>
          </div>
        )}

        {/* Model Error from MediaPipe */}
        {modelError && (
          <div className="alert-box alert-warning">
            <AlertCircle size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" />
            <span className="font-hud text-sm text-yellow-400">{modelError}</span>
          </div>
        )}

        {/* Camera Error */}
        {camError && (
          <div className="alert-box alert-error">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-hud text-sm text-red-400">{camError}</span>
              <button
                onClick={retryCamera}
                className="ml-2 text-xs text-red-300 underline hover:text-red-200"
              >
                Coba lagi
              </button>
            </div>
          </div>
        )}

        {/* API Key Warning */}
        {!hasAnyKey && (
          <div className="alert-box alert-warning">
            <AlertCircle size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="font-hud text-sm text-yellow-400">
              <strong>API Key belum diset!</strong>
              <p className="text-xs text-yellow-400/70 mt-0.5">
                Buat file <code className="font-mono-tech">.env</code> di root project,
                tambahkan: <code className="font-mono-tech">VITE_GEMINI_API_KEY=...</code>
              </p>
            </div>
          </div>
        )}

        {/* Cooldown Timer */}
        {cooldownSeconds > 0 && (
          <div className="cooldown-banner">
            <Timer size={16} className="text-yellow-400 flex-shrink-0" />
            <div className="cooldown-content">
              <span className="cooldown-title">
                Gemini cooldown: {cooldownSeconds}s
              </span>
              <span className="cooldown-sub">
                Menggunakan provider cadangan. Tetap bisa scan!
              </span>
              <div className="cooldown-bar-track">
                <div className="cooldown-bar-fill" style={{ animationDuration: `${cooldownSeconds}s` }} />
              </div>
            </div>
          </div>
        )}

        {/* AR Instruction Banner */}
        {instructionText && (
          <div className="ar-instruction-banner">
            <span className="ar-instruction-text">{instructionText}</span>
          </div>
        )}

        {/* AR Result Message Box - BELOW camera, does NOT cover the object */}
        {arResult && !isAIAnalyzing && (
          <FloatingARLabel
            label={arResult.objectName}
            confidence={arResult.confidence}
            isAnalyzing={false}
            result={arResult}
            bbox={{ originX: 0.5, originY: 0.5, width: 0.1, height: 0.1 }}
            videoWidth={videoWidth || 1}
            videoHeight={videoHeight || 1}
            mode="message"
          />
        )}

        {/* Scan Button - AR session aware */}
        <div className="scan-button-wrapper">
          <ScanButton
            arButtonStatus={arButtonStatus}
            onClick={handleScanButtonClick}
            disabled={!cameraReady}
          />
        </div>

        {/* Result Card - only for manual scans */}
        {current && (
          <InfoCard result={current} onClose={() => setCurrent(null)} />
        )}

        {/* Scan History - hidden during active AR session */}
        <ScanHistory
          history={history}
          hidden={isARActive && !arResult}
        />

        {/* Footer */}
        <footer className="app-footer">
          <p className="font-mono-tech footer-text">
            VAR · UBSI · {new Date().getFullYear()} · REALTIME CV AR
          </p>
        </footer>
      </main>
    </div>
  )
}