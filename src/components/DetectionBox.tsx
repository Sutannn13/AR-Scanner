// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT DetectionBox
// Render bounding box dan progress bar untuk objek yang terdeteksi.
//
// Props:
// - bbox: bounding box normalized (0-1)
// - label: nama objek yang terdeteksi
// - confidence: score deteksi (0-1)
// - progress: progress stabilitas (0-1), null kalau belum ada
// - isStable: apakah objek sudah stabil
// - videoWidth/videoHeight: dimensi video untuk scale
// ─────────────────────────────────────────────────────────────────────────────

import type { BoundingBox } from '../types'

interface DetectionBoxProps {
  bbox: BoundingBox
  label: string
  confidence: number
  progress: number | null
  isStable: boolean
  videoWidth: number
  videoHeight: number
}

// Konversi confidence (0-1) ke display color
function confidenceToColor(confidence: number): string {
  if (confidence >= 0.8) return 'border-hud-cyan'
  if (confidence >= 0.6) return 'border-hud-purple'
  return 'border-yellow-400'
}

export function DetectionBox({
  bbox,
  label,
  confidence,
  progress,
  isStable,
  videoWidth,
  videoHeight,
}: DetectionBoxProps) {
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
    console.warn('[DetectionBox] ⚠️ Invalid bbox skipped:', { bbox, videoWidth, videoHeight })
    return null;
  }

  // Konversi dari normalized (0-1) ke pixel
  const style: React.CSSProperties = {
    left: `${bbox.originX * videoWidth}px`,
    top: `${bbox.originY * videoHeight}px`,
    width: `${bbox.width * videoWidth}px`,
    height: `${bbox.height * videoHeight}px`,
  }

  const borderColor = confidenceToColor(confidence)

  return (
    <div
      className={`
        absolute pointer-events-none
        border-2 ${borderColor}
        rounded-md
        ${isStable ? 'shadow-lg shadow-hud-cyan/30 animate-box-stable' : 'animate-box-detect'}
        transition-all duration-200
      `}
      style={style}
    >
      {/* Corner markers */}
      <span className={`absolute -top-0.5 -left-0.5 w-2 h-2 ${borderColor} ${isStable ? 'bg-hud-cyan' : 'bg-hud-purple/50'}`} />
      <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 ${borderColor} ${isStable ? 'bg-hud-cyan' : 'bg-hud-purple/50'}`} />
      <span className={`absolute -bottom-0.5 -left-0.5 w-2 h-2 ${borderColor} ${isStable ? 'bg-hud-cyan' : 'bg-hud-purple/50'}`} />
      <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 ${borderColor} ${isStable ? 'bg-hud-cyan' : 'bg-hud-purple/50'}`} />

      {/* Label badge */}
      <div
        className={`
          absolute -top-6 left-1/2 -translate-x-1/2
          px-2 py-0.5 rounded
          bg-hud-bg/90 backdrop-blur-sm
          border border-current/30
          ${isStable ? 'border-hud-cyan/50' : 'border-hud-purple/50'}
        `}
      >
        <span className={`
          font-mono-tech text-[9px] tracking-wider
          ${isStable ? 'text-hud-cyan' : 'text-hud-purple'}
        `}>
          {label.toUpperCase()} {Math.round(confidence * 100)}%
        </span>
      </div>

      {/* Progress bar */}
      {progress !== null && (
        <div
          className="absolute -bottom-3 left-0 right-0 px-1"
          style={{ height: '3px' }}
        >
          <div className="h-full bg-hud-border/50 rounded-full overflow-hidden">
            <div
              className={`
                h-full rounded-full transition-all duration-100
                ${isStable ? 'bg-hud-cyan' : 'bg-hud-purple'}
              `}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Stable indicator */}
      {isStable && (
        <div className="absolute -bottom-6 right-1">
          <span className="font-mono-tech text-[8px] text-hud-cyan/60 animate-pulse">
            ● STABLE
          </span>
        </div>
      )}
    </div>
  )
}