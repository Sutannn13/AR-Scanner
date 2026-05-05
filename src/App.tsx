import { useCallback, useEffect, useRef } from 'react'
import { AlertCircle, Cpu, Wifi, Timer, RefreshCw } from 'lucide-react'
import { useCamera } from './hooks/useCamera'
import { useObjectDetector } from './hooks/useObjectDetector'
import { useStableObject } from './hooks/useStableObject'
import { useScanStore, useARStore } from './store/scanStore'
import { analyzeImage, onCooldownTick } from './services/geminiService'
import { CameraView } from './components/CameraView'
import { ScanButton } from './components/ScanButton'
import { InfoCard } from './components/InfoCard'
import { ScanHistory } from './components/ScanHistory'
import type { DetectionResult, ScanResult } from './types'

export default function App() {
  const { videoRef, ready: cameraReady, camError, captureFrame, retryCamera } = useCamera()

  // ── Object Detection (MediaPipe) - pass camera ready state ──────────────
  const {
    detections,
    isModelReady: isDetectorReady,
    isDetecting,
    modelError,
    videoWidth,
    videoHeight,
  } = useObjectDetector({ cameraReady, videoRef })

  // ── AR Store untuk overlay state ───────────────────────────────────────────
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

  // Refs
  const analysisInProgressRef = useRef(false)

  // ── Stability tracking untuk objek yang terdeteksi ─────────────────────────
  const { stableObject, updateDetections, resetStability } = useStableObject({
    // Objek harus stabil selama 3 detik sebelum di-analisis AI
    stabilityThresholdMs: 3000,
    // Callback saat objek stabil
    onStable: (obj) => {
      console.log(`[AR] 🟢 Objek stabil terdeteksi: ${obj.label} (${Math.round(obj.progress * 100)}%)`)

      // Set tracked label dan mulai AR overlay
      setTrackedLabel(obj.label)
      setAROverlay({
        targetLabel: obj.label,
        bbox: obj.bbox,
        result: null, // belum ada hasil AI
        isAnalyzing: false,
        showProgress: true,
      })

      // Trigger analisis AI (hanya kalau belum sedang analisis)
      if (!analysisInProgressRef.current) {
        triggerAIRecognition(obj.label)
      }
    },
    // Callback saat objek hilang dari frame
    onLost: (label) => {
      console.log(`[AR] 🔴 Objek hilang dari frame: ${label}`)
      if (trackedLabel === label) {
        clearAROverlay()
        analysisInProgressRef.current = false
      }
    },
  })

  // ── Update detections ke stability tracker ─────────────────────────────────
  useEffect(() => {
    if (detections.length > 0) {
      updateDetections(detections)
    }
  }, [detections, updateDetections])

  // ── Trigger AI recognition untuk objek stabil ──────────────────────────────
  const triggerAIRecognition = useCallback(async (label: string) => {
    // Cegah multiple analysis gleichzeitig
    if (analysisInProgressRef.current) return
    analysisInProgressRef.current = true

    setIsAIAnalyzing(true)
    setAROverlay({
      targetLabel: label,
      bbox: stableObject?.bbox ?? { originX: 0, originY: 0, width: 0, height: 0 },
      result: null,
      isAnalyzing: true,
      showProgress: true,
    })

    try {
      // Capture frame dari video
      const base64 = captureFrame()
      if (!base64) {
        throw new Error('Gagal mengambil gambar dari kamera')
      }

      // Panggil AI service
      console.log(`[AR] 🤖 Memulai analisis AI untuk: ${label}`)
      const result = await analyzeImage(base64)

      // Update overlay dengan hasil
      setAROverlay({
        targetLabel: label,
        bbox: stableObject?.bbox ?? { originX: 0, originY: 0, width: 0, height: 0 },
        result,
        isAnalyzing: false,
        showProgress: false,
      })

      // Simpan ke history juga
      addResult(result)
      console.log(`[AR] ✅ Analisis selesai: ${result.objectName}`)
    } catch (err) {
      console.error(`[AR] ❌ Analisis gagal:`, err)
      // Reset overlay on error
      clearAROverlay()
    } finally {
      analysisInProgressRef.current = false
      setIsAIAnalyzing(false)
    }
  }, [captureFrame, addResult, clearAROverlay, setAROverlay, setIsAIAnalyzing, stableObject])

  // ── Listen to cooldown ticks (informational only, never blocks scan) ──
  useEffect(() => {
    const unsub = onCooldownTick((remaining) => {
      setCooldown(remaining)
    })
    return unsub
  }, [setCooldown])

  // ── Main scan handler ────────────────────────────────────────────
  const handleScan = useCallback(async () => {
    if (status === 'scanning' || status === 'processing') return

    // Block scan if camera is not ready
    if (!cameraReady) {
      setError('Kamera belum siap. Izinkan akses kamera dan tunggu preview muncul.')
      setStatus('error')
      return
    }

    // No global cooldown block — analyzeImage() handles per-provider skipping

    setStatus('scanning')
    setError(null)

    // Let scan animation play for a moment
    await new Promise((r) => setTimeout(r, 1800))

    const base64 = captureFrame()
    if (!base64) {
      setError('Gagal mengambil gambar dari kamera.')
      setStatus('error')
      return
    }

    setStatus('processing')

    try {
      const result = await analyzeImage(base64)
      addResult(result) // also sets status → 'done'
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      setStatus('error')
    }
  }, [status, cameraReady, captureFrame, setStatus, setError, addResult])

  const hasAnyKey = !!(
    import.meta.env.VITE_GEMINI_API_KEY?.trim() ||
    import.meta.env.VITE_OPENROUTER_API_KEY?.trim() ||
    import.meta.env.VITE_TOGETHER_API_KEY?.trim() ||
    import.meta.env.VITE_HF_API_KEY?.trim()
  )

  // Determine what to show in the status indicator
  const getCameraStatus = () => {
    if (camError) return { label: 'NO_SIGNAL', active: false }
    if (!cameraReady) return { label: 'INIT_CAMERA', active: false }
    if (!isDetectorReady) return { label: 'CAM_LIVE', active: true }
    return { label: 'AR_ACTIVE', active: true }
  }

  const cameraStatus = getCameraStatus()

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
            POWERED BY GEMINI AI · TUGAS VAR · UBSI
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
        />

        {/* Camera initializing message */}
        {!cameraReady && !camError && (
          <div className="alert-box alert-info">
            <RefreshCw size={14} className="text-hud-cyan flex-shrink-0 mt-0.5 animate-spin" />
            <span className="font-hud text-sm text-hud-cyan">Meminta akses kamera...</span>
          </div>
        )}

        {/* Model Error dari MediaPipe - only warning, doesn't block functionality */}
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
        {/* Gemini cooldown info (non-blocking — scanning still works via fallbacks) */}
        {cooldownSeconds > 0 && (
          <div className="cooldown-banner">
            <Timer size={16} className="text-yellow-400 flex-shrink-0" />
            <div className="cooldown-content">
              <span className="cooldown-title">
                Gemini cooldown: {cooldownSeconds}s
              </span>
              <span className="cooldown-sub">
                Menggunakan provider cadangan (Groq / OpenRouter). Kamu tetap bisa scan!
              </span>
              <div className="cooldown-bar-track">
                <div className="cooldown-bar-fill" style={{ animationDuration: `${cooldownSeconds}s` }} />
              </div>
            </div>
          </div>
        )}

        {/* Error from scan */}
        {error && status === 'error' && (
          <div className="alert-box alert-error">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
            <span className="font-hud text-sm text-red-400 whitespace-pre-line">{error}</span>
          </div>
        )}

        {/* Scan Button — NEVER blocked by cooldown, but blocked if camera not ready */}
        <div className="scan-button-wrapper">
          <ScanButton status={status} onClick={handleScan} disabled={!cameraReady} />
        </div>

        {/* Result Card */}
        {current && (
          <InfoCard result={current} onClose={() => setCurrent(null)} />
        )}

        {/* History */}
        <ScanHistory history={history} />

        {/* Footer */}
        <footer className="app-footer">
          <p className="font-mono-tech footer-text">
            VAR · UBSI · {new Date().getFullYear()} · AR OBJECT SCANNER
          </p>
        </footer>
      </main>
    </div>
  )
}
