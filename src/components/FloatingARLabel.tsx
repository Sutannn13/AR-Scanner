// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT FloatingARLabel
// Floating label yang muncul saat objek terdeteksi dengan hasil AI.
// Termasuk CSS-only pseudo-3D hologram/cube/icon effect.
// Mendukung mode: 'anchor' (berikut bbox) atau 'center' (panel tengah viewport).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useRef, useCallback } from 'react'
import type { ScanResult, BoundingBox } from '../types'

/** Tracking health states */
export type TrackingState = 'locked' | 'unstable' | 'lost'

interface FloatingARLabelProps {
  label: string
  confidence: number
  isAnalyzing: boolean
  result: ScanResult | null
  bbox: BoundingBox
  videoWidth: number
  videoHeight: number
  /**
   * Display mode:
   * - 'anchor': floating label above detected bbox (for analyzing phase)
   * - 'center': large centered panel covering the object (DEPRECATED — use 'message')
   * - 'message': compact message box / chat bubble, does NOT cover the object
   */
  mode?: 'anchor' | 'center' | 'message'
  /**
   * Where to place the message box when mode='message':
   * - 'inside-camera': compact floating bubble inside camera viewport (default for final result)
   * - 'bottom': always at bottom (default)
   * - 'top': always at top
   * When 'inside-camera', collision-aware placement is used based on bbox center.
   */
  overlayPlacement?: 'inside-camera' | 'bottom' | 'top'
  /**
   * Tracking health state — affects visual style (blur, opacity, border color).
   * Parent (CameraView/App) computes this via IoU comparison.
   */
  trackingState?: TrackingState
  /**
   * Current detections for smooth follow. Bubble will lerp to matching bbox.
   */
  currentDetections?: Array<{ label: string; boundingBox: BoundingBox; confidence: number }>
  /**
   * Tracked label for matching detections.
   */
  trackedLabel?: string
}

// Lerp factor for smooth bubble follow
const LERP_FACTOR = 0.15

/**
 * Compute pseudo-3D rotation from normalized bbox position.
 * Max 3deg X, 4deg Y — subtle, not excessive.
 */
function computePseudo3DRotation(bbox: BoundingBox): { rotateX: number; rotateY: number } {
  const centerX = bbox.originX + bbox.width / 2
  const centerY = bbox.originY + bbox.height / 2
  // Map to -1..1 range
  const normX = (centerX - 0.5) * 2
  const normY = (centerY - 0.5) * 2
  return {
    rotateY: normX * 4, // ±4deg max
    rotateX: -normY * 3, // ±3deg max, negate so top objects tilt away
  }
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
  overlayPlacement = 'bottom',
  trackingState = 'locked',
  currentDetections,
  trackedLabel,
}: FloatingARLabelProps) {
  const [fadeIn, setFadeIn] = useState(false)

  // Smooth follow state (for message mode)
  const smoothedPosRef = useRef({ x: 0, y: 0 })
  const [smoothedPos, setSmoothedPos] = useState({ x: 0, y: 0 })

  // Animation frame ref for smooth follow
  const animFrameRef = useRef<number | null>(null)

  // Tentukan mode: jika ada result, default ke message (non-intrusive); sonst anchor
  const activeMode = mode ?? (result ? 'message' : 'anchor')

  // Determine placement for message mode
  const messagePlacement = (() => {
    if (overlayPlacement === 'top') return 'top'
    if (overlayPlacement === 'bottom') return 'bottom'
    const bboxCenterY = bbox.originY + bbox.height / 2
    return bboxCenterY > 0.55 ? 'top' : 'bottom'
  })()

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
      console.warn('[FloatingARLabel] Invalid bbox skipped:', { bbox, videoWidth, videoHeight })
      return null
    }
  }

  // Animasi fade in saat mount
  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 50)
    return () => clearTimeout(timer)
  }, [])

  // ── Smooth follow via lerp interpolation ─────────────────────────────────
  const runSmoothFollow = useCallback(() => {
    // Find current detection matching tracked label
    let targetBbox: BoundingBox | null = null

    if (currentDetections && trackedLabel && activeMode === 'message' && result) {
      for (const det of currentDetections) {
        if (det.label.toLowerCase() === trackedLabel.toLowerCase()) {
          targetBbox = det.boundingBox
          break
        }
      }
    }

    // Use provided bbox if no matching detection found
    if (!targetBbox) {
      targetBbox = bbox
    }

    // Compute target center in pixel coords
    const targetX = (targetBbox.originX + targetBbox.width / 2) * videoWidth
    const targetY = (targetBbox.originY + targetBbox.height / 2) * videoHeight

    // Lerp: smoothed = previous + (target - previous) * factor
    const newX = smoothedPosRef.current.x + (targetX - smoothedPosRef.current.x) * LERP_FACTOR
    const newY = smoothedPosRef.current.y + (targetY - smoothedPosRef.current.y) * LERP_FACTOR

    smoothedPosRef.current = { x: newX, y: newY }
    setSmoothedPos({ x: newX, y: newY })

    animFrameRef.current = requestAnimationFrame(runSmoothFollow)
  }, [currentDetections, trackedLabel, activeMode, result, bbox, videoWidth, videoHeight])

  // Start/stop smooth follow loop when result appears
  useEffect(() => {
    if (activeMode === 'message' && result) {
      // Initialize smoothed pos to current bbox center
      const initX = (bbox.originX + bbox.width / 2) * videoWidth
      const initY = (bbox.originY + bbox.height / 2) * videoHeight
      smoothedPosRef.current = { x: initX, y: initY }
      setSmoothedPos({ x: initX, y: initY })

      // Start animation loop
      animFrameRef.current = requestAnimationFrame(runSmoothFollow)
    } else {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
    }
  }, [activeMode, result, runSmoothFollow, bbox, videoWidth, videoHeight])

  // ── Compute pseudo-3D rotation ──────────────────────────────────────────
  const { rotateX, rotateY } = computePseudo3DRotation(bbox)

  // ── Posisi label ────────────────────────────────────────────────────────────
  let labelX = 0
  let labelY = 0

  if (activeMode === 'anchor') {
    labelX = (bbox.originX + bbox.width / 2) * videoWidth
    labelY = bbox.originY * videoHeight - 80
    labelX = Math.max(160, Math.min(videoWidth - 160, labelX))
    labelY = Math.max(60, labelY)
  }

  // ── Display values ───────────────────────────────────────────────────────────
  const displayLabel = result?.objectName || label.toUpperCase()
  const category = result?.category
  const description = result?.description
  const funFacts = result?.funFacts
  const confidencePercent = Math.round(confidence * 100)

  // ── Lost/unstable visual classes ────────────────────────────────────────────
  const isLost = trackingState === 'lost'
  const isUnstable = trackingState === 'unstable'
  const hasTrackingIssue = isLost || isUnstable

  // ── LOST indicator text ─────────────────────────────────────────────────────
  const lostIndicatorText = isLost ? 'TARGET LOST' : isUnstable ? 'TRACKING UNSTABLE' : null

  // ── Render result panel (mode center) ───────────────────────────────────────
  if (result && activeMode === 'message') {
    return (
      <div
        className={`
          ar-message-box
          ar-message-inside-camera
          ar-message-placement-${messagePlacement}
          ${fadeIn ? 'ar-message-visible' : 'ar-message-hidden'}
          ${trackingState}
          ${hasTrackingIssue ? 'ar-message-lost' : ''}
        `}
        style={{
          transform: `
            translate3d(0, 0, 0)
            perspective(700px)
            rotateX(${rotateX}deg)
            rotateY(${rotateY}deg)
          `,
          // Use smoothed position for message bubble
          ['--smooth-x' as string]: `${smoothedPos.x}px`,
          ['--smooth-y' as string]: `${smoothedPos.y}px`,
        }}
      >
        <div className="ar-message-content">
          {/* ── Lost/unstable indicator ── */}
          {hasTrackingIssue && lostIndicatorText && (
            <div className="ar-message-lost-indicator">
              <span className="ar-message-lost-dot" />
              <span className="ar-message-lost-text">{lostIndicatorText}</span>
              {isLost && (
                <span className="ar-message-lost-sub">Objek keluar dari kamera</span>
              )}
            </div>
          )}

          {/* ── Header row: badge + object name ── */}
          <div className="ar-message-header">
            <span className="ar-message-badge">AI OBJECT INFO</span>
            <span className="ar-message-title">{result.objectName}</span>
            {category && (
              <span className="ar-message-category">{category}</span>
            )}
          </div>

          {/* ── Description ── */}
          {description && (
            <p className="ar-message-description">
              {description.trim() || 'Deskripsi tidak tersedia.'}
            </p>
          )}

          {/* ── Fun fact (max 1) ── */}
          {funFacts && funFacts.length > 0 && (
            <div className="ar-message-fact">
              <span className="ar-message-fact-bullet">▸</span>
              <span className="ar-message-fact-text">{funFacts[0]}</span>
            </div>
          )}

          {/* ── Footer row: confidence + provider + hint ── */}
          <div className="ar-message-footer">
            <div className="ar-message-confidence">
              <span className="ar-message-conf-label">CONF</span>
              <div className="ar-message-conf-track">
                <div
                  className="ar-message-conf-fill"
                  style={{ width: `${confidencePercent}%` }}
                />
              </div>
              <span className="ar-message-conf-value">{confidencePercent}%</span>
            </div>
            {result.providerUsed && (
              <span className="ar-message-provider">{result.providerUsed}</span>
            )}
          </div>

          {/* ── Hint ── */}
          <div className="ar-message-hint">
            Tekan SCAN AGAIN untuk objek lain
          </div>
        </div>
      </div>
    )
  }

  // ── Render result panel (mode center — DEPRECATED, kept for compat) ──────────
  if (result && activeMode === 'center') {
    return (
      <div
        className={`
          ar-result-panel
          ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
        `}
      >
        {/* ── Dark backdrop overlay for better readability ── */}
        <div className="ar-result-backdrop" />

        {/* ── Main panel container ── */}
        <div className="ar-result-card">
          {/* ── Pseudo-3D Hologram Cube Icon ── */}
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

          {/* ── Header badge ── */}
          <div className="ar-header-badge">
            <span className="ar-header-badge-text">AI OBJECT INFO</span>
          </div>

          {/* ── Object name ── */}
          <span className="ar-object-name">{displayLabel}</span>

          {/* ── Category badge ── */}
          {category && (
            <span className="ar-category-badge">{category}</span>
          )}

          {/* ── Scrollable content area ── */}
          <div className="ar-panel-scroll">
            {/* ── RINGKASAN section ── */}
            {description && (
              <div className="ar-section">
                <div className="ar-section-title">RINGKASAN</div>
                <p className="ar-description-text">
                  {description.trim() || 'Deskripsi objek tidak tersedia.'}
                </p>
              </div>
            )}

            {/* ── FUN FACTS section ── */}
            {funFacts && funFacts.length > 0 && (
              <div className="ar-section">
                <div className="ar-section-title">FUN FACTS</div>
                {funFacts.slice(0, 2).map((fact, idx) => (
                  <div key={idx} className="ar-funfact-item">
                    <span className="ar-funfact-bullet">▸</span>
                    <span className="ar-funfact-text">{fact}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Confidence bar ── */}
          <div className="ar-confidence-section">
            <span className="ar-confidence-label">Confidence</span>
            <div className="ar-confidence-track">
              <div
                className="ar-confidence-fill"
                style={{ width: `${confidencePercent}%` }}
              />
            </div>
            <span className="ar-confidence-value">{confidencePercent}%</span>
          </div>

          {/* ── Provider badge ── */}
          {result.providerUsed && (
            <div className="ar-provider-badge">
              {result.providerUsed}
            </div>
          )}

          {/* ── Scan again hint ── */}
          <div className="ar-hint-badge">
            Tekan SCAN AGAIN untuk objek lain
          </div>
        </div>
      </div>
    )
  }

  // ── Anchor mode: floating label above detection bbox ────────────────────────
  return (
    <div
      className={`
        floating-ar-label
        pointer-events-none
        transition-all duration-300
        ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
      `}
      style={{
        position: 'absolute',
        left: `${labelX}px`,
        top: `${labelY}px`,
        transform: 'translateX(-50%)',
        width: '280px',
        zIndex: 50,
      }}
    >
      {/* ── Main label container with hologram effect ── */}
      <div
        className={`
          relative px-4 py-3 rounded-2xl
          ${isAnalyzing ? 'analyzing-card' : 'detected-card'}
        `}
      >
        {/* ── Label content ── */}
        <div className="relative flex flex-col items-center z-10">
          {isAnalyzing ? (
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

        {/* Arrow pointing down to object */}
        <div
          className={`
            absolute -bottom-2 left-1/2 -translate-x-1/2
            w-0 h-0
            border-l-[6px] border-r-[6px] border-t-[8px]
            border-l-transparent border-r-transparent
            ${isAnalyzing ? 'border-t-hud-purple/60' : 'border-t-hud-purple/40'}
          `}
        />
      </div>
    </div>
  )
}