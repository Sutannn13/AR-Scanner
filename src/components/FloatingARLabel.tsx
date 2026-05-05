// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT FloatingARLabel
// Floating label yang muncul saat objek terdeteksi dengan hasil AI.
// Termasuk CSS-only pseudo-3D hologram/cube/icon effect.
// Mendukung mode: 'anchor' (berikut bbox) atau 'center' (panel tengah viewport).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import type { ScanResult } from '../types'

interface FloatingARLabelProps {
  label: string
  confidence: number
  isAnalyzing: boolean
  result: ScanResult | null
  bbox: { originX: number; originY: number; width: number; height: number }
  videoWidth: number
  videoHeight: number
  /** 'anchor' = mengikuti bbox, 'center' = panel tengah viewport (untuk hasil akhir) */
  mode?: 'anchor' | 'center'
}

export function FloatingARLabel({
  label,
  confidence,
  isAnalyzing,
  result,
  bbox,
  videoWidth,
  videoHeight,
  mode,
}: FloatingARLabelProps) {
  const [fadeIn, setFadeIn] = useState(false)

  // Tentukan mode: jika ada result, default ke center; sonst anchor
  const activeMode = mode ?? (result ? 'center' : 'anchor')

  // Guard: hanya anchor mode yang butuh valid bbox
  if (activeMode === 'anchor') {
    if (
      !Number.isFinite(bbox.originX) ||
      !Number.isFinite(bbox.originY) ||
      !Number.isFinite(bbox.width) ||
      !Number.isFinite(bbox.height) ||
      bbox.width <= 0 ||
      bbox.height <= 0 ||
      videoWidth <= 0 ||
      videoHeight <= 0
    ) {
      console.warn('[FloatingARLabel] ⚠️ Invalid bbox skipped:', { bbox, videoWidth, videoHeight })
      return null
    }
  }

  // Animasi fade in saat mount
  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 50)
    return () => clearTimeout(timer)
  }, [])

  // ── Posisi label ────────────────────────────────────────────────────────────
  let labelX = 0
  let labelY = 0

  if (activeMode === 'anchor') {
    // Mode anchor: posisi berdasarkan bbox
    labelX = (bbox.originX + bbox.width / 2) * videoWidth
    labelY = bbox.originY * videoHeight - 80 // 80px di atas bbox
    // Clamp agar tidak overflow viewport
    labelX = Math.max(160, Math.min(videoWidth - 160, labelX))
    labelY = Math.max(60, labelY)
  }
  // mode 'center' tidak pakai labelX/labelY, langsung di-style

  // ── Display values ───────────────────────────────────────────────────────────
  const displayLabel = result?.objectName || label.toUpperCase()
  const category = result?.category
  const description = result?.description
  const funFacts = result?.funFacts

  // Console debug
  console.log('[FloatingARLabel] rendered description:', description)

  // Fallback description
  const displayDescription = description?.trim() || 'Deskripsi objek tidak tersedia.'

  // Confidence percentage
  const confidencePercent = Math.round(confidence * 100)

  return (
    <div
      className={`
        floating-ar-label
        pointer-events-none
        transition-all duration-300
        ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
      `}
      style={
        activeMode === 'center'
          ? {
              position: 'absolute',
              left: '50%',
              top: '52%',
              transform: 'translate(-50%, -50%)',
              width: 'min(320px, calc(100% - 32px))',
              zIndex: 50,
            }
          : {
              position: 'absolute',
              left: `${labelX}px`,
              top: `${labelY}px`,
              transform: 'translateX(-50%)',
              width: '280px',
              zIndex: 50,
            }
      }
    >
      {/* ── Pseudo-3D Hologram Cube Icon ── */}
      {result && (
        <div className="hologram-cube-wrapper">
          <div className="hologram-cube">
            <div className="cube-face cube-top" />
            <div className="cube-face cube-front">
              <div className="cube-inner-glow" />
            </div>
            <div className="cube-face cube-right" />
            <div className="cube-face cube-left" />
          </div>
          <div className="hologram-base" />
        </div>
      )}

      {/* ── Main label container with hologram effect ── */}
      <div
        className={`
          relative px-4 py-3 rounded-2xl
          ${result ? 'hologram-card' : isAnalyzing ? 'analyzing-card' : 'detected-card'}
        `}
      >
        {/* Hologram scan lines effect */}
        {result && <div className="hologram-scanlines" />}

        {/* Glow effect for results */}
        {result && <div className="result-glow" />}

        {/* ── Label content ── */}
        <div className="relative flex flex-col items-center z-10">

          {/* ===== RESULT (AI Object Info) ===== */}
          {result ? (
            <>
              {/* Header badge */}
              <div className="mb-2 px-3 py-1 rounded-full bg-hud-cyan/20 border border-hud-cyan/40">
                <span className="font-hud text-[9px] text-hud-cyan uppercase tracking-widest">
                  AI OBJECT INFO
                </span>
              </div>

              {/* Object name */}
              <span className="font-mono-tech text-base text-hud-cyan tracking-wide hologram-text">
                {displayLabel}
              </span>

              {/* Category */}
              {category && (
                <span className="font-hud text-[10px] text-hud-purple/80 uppercase tracking-wider">
                  {category}
                </span>
              )}

              {/* ── Description Panel ── */}
              <div className="w-full mt-3 px-3 py-2.5 rounded-xl bg-hud-black/70 border border-hud-cyan/30">
                <p className="font-hud text-[11px] text-hud-cyan/90 leading-relaxed max-h-20 overflow-hidden">
                  {displayDescription}
                </p>

                {/* Fun facts */}
                {funFacts && funFacts.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-hud-cyan/20">
                    <div className="font-hud text-[8px] text-hud-purple/60 uppercase tracking-wider mb-1">
                      Fun Facts
                    </div>
                    {funFacts.slice(0, 2).map((fact, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 mb-0.5">
                        <span className="text-hud-purple/50 text-[8px] mt-0.5 flex-shrink-0">▸</span>
                        <span className="font-hud text-[10px] text-hud-purple/80 leading-tight">
                          {fact}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Confidence bar ── */}
              <div className="w-full mt-2 flex items-center gap-2">
                <span className="font-hud text-[8px] text-hud-cyan/50 uppercase tracking-wider">
                  Confidence
                </span>
                <div className="flex-1 h-1.5 bg-hud-black/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-hud-cyan/60 to-hud-cyan transition-all duration-500"
                    style={{ width: `${confidencePercent}%` }}
                  />
                </div>
                <span className="font-hud text-[9px] text-hud-cyan/70">
                  {confidencePercent}%
                </span>
              </div>

              {/* Provider badge */}
              {result.providerUsed && (
                <div className="mt-1.5">
                  <span className="hologram-badge">
                    {result.providerUsed}
                  </span>
                </div>
              )}

              {/* Scan again hint */}
              <div className="mt-2 px-2 py-1 rounded bg-hud-purple/10 border border-hud-purple/20">
                <span className="font-hud text-[9px] text-hud-purple/60">
                  Tekan SCAN AGAIN untuk objek lain
                </span>
              </div>
            </>
          ) : isAnalyzing ? (
            /* ===== ANALYZING STATE ===== */
            <>
              <span className="font-mono-tech text-sm text-hud-purple tracking-wide animate-pulse">
                ANALYZING...
              </span>
              <span className="font-hud text-[9px] text-hud-purple/50">
                {label.toUpperCase()}
              </span>
              {/* Loading dots */}
              <div className="flex gap-1 mt-1">
                <span className="w-1 h-1 bg-hud-purple rounded-full animate-bounce-dot-1" />
                <span className="w-1 h-1 bg-hud-purple rounded-full animate-bounce-dot-2" />
                <span className="w-1 h-1 bg-hud-purple rounded-full animate-bounce-dot-3" />
              </div>
            </>
          ) : (
            /* ===== DETECTED (default) ===== */
            <>
              <span className="font-mono-tech text-xs text-hud-purple/80 tracking-wide">
                {label.toUpperCase()}
              </span>
              <span className="font-hud text-[9px] text-hud-purple/50">
                DETECTED {Math.round(confidence * 100)}%
              </span>
            </>
          )}
        </div>

        {/* Arrow pointing down to object (only in anchor mode) */}
        {activeMode === 'anchor' && (
          <div
            className={`
              absolute -bottom-2 left-1/2 -translate-x-1/2
              w-0 h-0
              border-l-[6px] border-r-[6px] border-t-[8px]
              border-l-transparent border-r-transparent
              ${result ? 'border-t-hud-cyan/60' : isAnalyzing ? 'border-t-hud-purple/60' : 'border-t-hud-purple/40'}
            `}
          />
        )}
      </div>
    </div>
  )
}