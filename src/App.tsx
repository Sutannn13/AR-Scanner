import { useCallback, useEffect } from 'react'
import { AlertCircle, Cpu, Wifi, Timer } from 'lucide-react'
import { useCamera }    from './hooks/useCamera'
import { useScanStore } from './store/scanStore'
import { analyzeImage, onCooldownTick } from './services/geminiService'
import { CameraView }   from './components/CameraView'
import { ScanButton }   from './components/ScanButton'
import { InfoCard }     from './components/InfoCard'
import { ScanHistory }  from './components/ScanHistory'

export default function App() {
  const { videoRef, ready, camError, captureFrame } = useCamera()
  const {
    status, current, history, error, cooldownSeconds,
    setStatus, setError, addResult, setCurrent, setCooldown,
  } = useScanStore()

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
      addResult(result)           // also sets status → 'done'
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      setStatus('error')
    }
  }, [status, captureFrame, setStatus, setError, addResult])

  const hasApiKey = Boolean(
    import.meta.env.VITE_GEMINI_API_KEY &&
    import.meta.env.VITE_GEMINI_API_KEY !== 'your-gemini-api-key'
  )

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
          <span className={`status-dot ${ready ? 'bg-hud-cyan animate-pulse-glow' : 'bg-hud-border'}`} />
          <Wifi size={12} className={ready ? 'text-hud-cyan' : 'text-hud-border'} />
          <span className="status-label">
            {ready ? 'CAM_LIVE' : 'NO_SIGNAL'}
          </span>
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────────── */}
      <main className="app-main">

        {/* Camera View */}
        <CameraView videoRef={videoRef} status={status} ready={ready} />

        {/* Camera Error */}
        {camError && (
          <div className="alert-box alert-error">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
            <span className="font-hud text-sm text-red-400">{camError}</span>
          </div>
        )}

        {/* API Key Warning */}
        {!hasApiKey && (
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

        {/* Scan Button — NEVER blocked by cooldown */}
        <div className="scan-button-wrapper">
          <ScanButton status={status} onClick={handleScan} />
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
