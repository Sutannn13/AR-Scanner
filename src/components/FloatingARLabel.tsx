// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT FloatingARLabel
// Floating label yang muncul saat objek terdeteksi.
// Berbeda dengan DetectionBox yang show bounding box,
// FloatingARLabel hanya show label dengan animasi floating.
//
// Props:
// - label: nama objek
// - confidence: score deteksi
// - isAnalyzing: apakah sedang di-scan oleh AI
// - result: hasil scan dari AI (null kalau belum selesai)
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

  // Animasi fade in saat mount
  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 50)
    return () => clearTimeout(timer)
  }, [])

  // Posisi label: di atas bounding box, centered horizontal
  const labelX = bbox.originX + bbox.width / 2
  const labelY = bbox.originY - 60 // 60px di atas bbox

  const style: React.CSSProperties = {
    position: 'absolute' as const,
    left: `${labelX}px`,
    top: `${labelY}px`,
    transform: 'translateX(-50%)',
  }

  // Kalau hasil sudah ada, tampilkan nama objek dari AI
  const displayLabel = result?.objectName || label.toUpperCase()
  const category = result?.category

  return (
    <div
      className={`
        absolute pointer-events-none z-20
        transition-all duration-300
        ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
      `}
      style={style}
    >
      {/* Main label container */}
      <div
        className={`
          relative px-4 py-2 rounded-xl
          bg-gradient-to-r from-hud-bg/95 to-hud-bg/85
          backdrop-blur-md border
          ${isAnalyzing
            ? 'border-hud-purple/50 animate-label-analyzing'
            : result
              ? 'border-hud-cyan/50 shadow-lg shadow-hud-cyan/20'
              : 'border-hud-purple/40'}
        `}
      >
        {/* Glow effect untuk hasil */}
        {result && (
          <div className="absolute inset-0 rounded-xl bg-hud-cyan/10 animate-glow-pulse" />
        )}

        {/* Label text */}
        <div className="relative flex flex-col items-center gap-0.5">
          {result ? (
            <>
              {/* Nama objek dari AI */}
              <span className="font-mono-tech text-sm text-hud-cyan tracking-wide">
                {displayLabel}
              </span>
              {/* Category badge */}
              {category && (
                <span className="font-hud text-[10px] text-hud-purple/70 uppercase tracking-wider">
                  {category}
                </span>
              )}
              {/* Confidence */}
              <span className="font-hud text-[9px] text-hud-cyan/50">
                AI CONF: {Math.round(confidence * 100)}%
              </span>
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
              {/* Default label */}
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
            ${result ? 'border-t-hud-cyan/50' : isAnalyzing ? 'border-t-hud-purple/50' : 'border-t-hud-purple/40'}
          `}
        />
      </div>
    </div>
  )
}