import { useCallback, useEffect, useRef } from 'react'
import { AlertCircle, Cpu, Wifi, Timer, RefreshCw } from 'lucide-react'
import { useCamera } from './hooks/useCamera'
import { useObjectDetector } from './hooks/useObjectDetector'
import { useStableObject } from './hooks/useStableObject'
import { useScanStore, useARStore, useARSessionStore } from './store/scanStore'
import { analyzeImage, onCooldownTick } from './services/geminiService'
import { CameraView } from './components/CameraView'
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

  // ── Stability tracking - AR session aware ──────────────────────────────────
  const handleOnLost = useCallback((label: string) => {
    console.log(`[AR Session] 🔴 Target lost: ${label}`)

    if (trackedLabel === label) {
      clearAROverlay()
      clearARResult()
      analysisInProgressRef.current = false

      // If session was armed, mark session as done (user must scan again)
      if (isScanArmed) {
        finishARScanSession()
      }
    }
  }, [trackedLabel, clearAROverlay, clearARResult, isScanArmed, finishARScanSession])

  const handleOnStable = useCallback((obj: DetectedObject) => {
    // ONLY trigger if AR session is armed and hasn't analyzed yet
    if (!isScanArmed) {
      console.log(`[AR Session] ⏸️ Object stable but session not armed, ignoring`)
      return
    }

    if (hasAnalyzedCurrentTarget) {
      console.log(`[AR Session] ⏸️ Current target already analyzed, ignoring`)
      return
    }

    if (analysisInProgressRef.current) {
      console.log(`[AR Session] ⏸️ Analysis already in progress, ignoring`)
      return
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

  // ── Start AR Scan Session ───────────────────────────────────────────────────
  const handleStartARScan = useCallback(() => {
    console.log('[AR Session] 🔵 User pressed START AR SCAN')

    // Clear previous results
    clearAROverlay()
    clearARResult()
    resetStability()
    analysisInProgressRef.current = false
    stableProgressRef.current = 0

    // Start the AR session
    startARScanSession()
  }, [clearAROverlay, clearARResult, resetStability, startARScanSession])

  // ── Reset to idle / start new session ──────────────────────────────────────
  const handleResetARScan = useCallback(() => {
    console.log('[AR Session] 🔄 User pressed SCAN AGAIN')

    clearAROverlay()
    clearARResult()
    resetStability()
    analysisInProgressRef.current = false
    stableProgressRef.current = 0

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
    if (arButtonStatus === 'waiting') return 'Arahkan kamera ke objek dan tahan 3 detik'
    if (arButtonStatus === 'analyzing') return 'Menganalisis objek...'
    if (arButtonStatus === 'done') return 'Objek terdeteksi! Arahkan ke objek lain atau tekan SCAN AGAIN'
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