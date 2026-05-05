// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT FloatingARLabel
// Floating label yang muncul saat objek terdeteksi dengan hasil AI.
// Termasuk CSS-only pseudo-3D hologram/cube/icon effect.
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
}

export function FloatingARLabel({
  label,
  confidence,
  isAnalyzing,
  result,
  bbox,
  videoWidth,
  videoHeight,
}: FloatingARLabelProps) {
  const [fadeIn, setFadeIn] = useState(false)

  // Defensive: guard against invalid bbox
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

  // Animasi fade in saat mount
  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 50)
    return () => clearTimeout(timer)
  }, [])

  // Konversi dari normalized (0-1) ke pixel
  const labelX = (bbox.originX + bbox.width / 2) * videoWidth
  const labelY = bbox.originY * videoHeight - 80 // 80px di atas bbox

  // Clamp label position to stay within viewport
  const clampedX = Math.max(140, Math.min(videoWidth - 140, labelX))
  const clampedY = Math.max(60, Math.min(videoHeight - 180, labelY))

  // Display values
  const displayLabel = result?.objectName || label.toUpperCase()
  const category = result?.category
  const description = result?.description
  const funFacts = result?.funFacts

  // Console debug
  console.log('[FloatingARLabel] rendered description:', description)

  // Fallback description
  const displayDescription = description?.trim() || 'Deskripsi objek tidak tersedia.'

  return (
    <div
      className={`
        floating-ar-label
        pointer-events-none z-20
        transition-all duration-300
        ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
      `}
      style={{
        position: 'absolute',
        left: `${clampedX}px`,
        top: `${clampedY}px`,
        transform: 'translateX(-50%)',
        width: '280px',
      }}
    >
      {/* ── Pseudo-3D Hologram Cube Icon ── */}
      {result && (
        <div className="hologram-cube-wrapper">
          <div className="hologram-cube">
            {/* Top face */}
            <div className="cube-face cube-top" />
            {/* Front face */}
            <div className="cube-face cube-front">
              <div className="cube-inner-glow" />
            </div>
            {/* Right face */}
            <div className="cube-face cube-right" />
            {/* Left face */}
            <div className="cube-face cube-left" />
          </div>
          {/* Hologram base glow */}
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

        {/* Label content */}
        <div className="relative flex flex-col items-center gap-1 z-10">
          {result ? (
            <>
              {/* Object name from AI */}
              <span className="font-mono-tech text-sm text-hud-cyan tracking-wide hologram-text">
                {displayLabel}
              </span>
              {/* Category badge */}
              {category && (
                <span className="font-hud text-[10px] text-hud-purple/80 uppercase tracking-wider">
                  {category}
                </span>
              )}
              {/* AI Description Panel */}
              <div className="w-full mt-2 px-3 py-2 rounded-lg bg-hud-black/60 border border-hud-cyan/30">
                {/* "AI DESCRIPTION" heading */}
                <div className="font-hud text-[9px] text-hud-cyan/60 uppercase tracking-widest mb-1">
                  AI DESCRIPTION
                </div>
                {/* Description text */}
                <p className="font-hud text-[11px] text-hud-cyan/90 leading-relaxed max-h-16 overflow-hidden">
                  {displayDescription}
                </p>
                {/* Fun facts (up to 2) */}
                {funFacts && funFacts.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-hud-cyan/20">
                    <div className="font-hud text-[8px] text-hud-purple/60 uppercase tracking-wider mb-1">
                      Fun Facts
                    </div>
                    {funFacts.slice(0, 2).map((fact, idx) => (
                      <div key={idx} className="flex items-start gap-1">
                        <span className="text-hud-purple/40 text-[8px] mt-0.5">▸</span>
                        <span className="font-hud text-[10px] text-hud-purple/80 leading-tight">
                          {fact}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Confidence & AI badge */}
              <div className="flex items-center gap-2 mt-2">
                <span className="font-hud text-[9px] text-hud-cyan/60">
                  AI {Math.round(confidence * 100)}%
                </span>
                {result.providerUsed && (
                  <span className="hologram-badge">
                    {result.providerUsed}
                  </span>
                )}
              </div>
            </>
          ) : isAnalyzing ? (
            <>
              {/* Analyzing state */}
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
            <>
              {/* Default detected label */}
              <span className="font-mono-tech text-xs text-hud-purple/80 tracking-wide">
                {label.toUpperCase()}
              </span>
              <span className="font-hud text-[9px] text-hud-purple/50">
                DETECTED {Math.round(confidence * 100)}%
              </span>
            </>
          )}
        </div>

        {/* Arrow pointing down to object */}
        <div
          className={`
            absolute -bottom-2 left-1/2 -translate-x-1/2
            w-0 h-0
            border-l-[6px] border-r-[6px] border-t-[8px]
            border-l-transparent border-r-transparent
            ${result ? 'border-t-hud-cyan/60' : isAnalyzing ? 'border-t-hud-purple/60' : 'border-t-hud-purple/40'}
          `}
        />
      </div>
    </div>
  )
}