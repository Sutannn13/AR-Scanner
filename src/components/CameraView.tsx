// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT CameraView
// Viewport utama untuk camera feed dengan AR overlay.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import type {
  ScanStatus,
  DetectionResult,
  DetectedObject,
  BoundingBox,
  ScanResult,
} from '../types'
import type { TrackingState } from './FloatingARLabel'
import { DetectionBox } from './DetectionBox'
import { FloatingARLabel } from './FloatingARLabel'

// Tracking health constants
const IOU_THRESHOLD = 0.25
const GRACE_BEFORE_UNSTABLE_MS = 500 // Start "unstable" after 500ms of no detection
const GRACE_PERIOD_MS = 2000 // Clear result after 2000ms of no detection

/**
 * Calculate IoU between two normalized bounding boxes (0-1 coords).
 */
function calculateIoU(a: BoundingBox, b: BoundingBox): number {
  const x1 = Math.max(a.originX, b.originX)
  const y1 = Math.max(a.originY, b.originY)
  const x2 = Math.min(a.originX + a.width, b.originX + b.width)
  const y2 = Math.min(a.originY + a.height, b.originY + b.height)
  if (x2 <= x1 || y2 <= y1) return 0
  const intersectArea = (x2 - x1) * (y2 - y1)
  const aArea = a.width * a.height
  const bArea = b.width * b.height
  const unionArea = aArea + bArea - intersectArea
  return unionArea > 0 ? intersectArea / unionArea : 0
}

/**
 * Find a detection matching the tracked label with acceptable IoU.
 */
function findMatchingDetection(
  detections: DetectionResult[],
  trackedLabel: string,
  trackedBbox: BoundingBox
): DetectionResult | null {
  for (const det of detections) {
    if (det.label.toLowerCase() !== trackedLabel.toLowerCase()) continue
    const iou = calculateIoU(trackedBbox, det.boundingBox)
    if (iou > IOU_THRESHOLD) return det
  }
  return null
}

interface Props {
  videoRef: React.RefObject<HTMLVideoElement>
  status: ScanStatus
  ready: boolean
  detections?: DetectionResult[]
  stableObject?: DetectedObject | null
  onDetectionsChange?: (detections: DetectionResult[]) => void
  videoWidth?: number
  videoHeight?: number
  arOverlay?: {
    targetLabel: string
    bbox: BoundingBox
    result: any
    isAnalyzing: boolean
  } | null
  // AR session props
  isScanArmed?: boolean
  arResult?: ScanResult | null
}

const STATUS_LABEL: Record<ScanStatus, string> = {
  idle: 'STANDBY',
  scanning: 'SCANNING',
  processing: 'ANALYZING',
  done: 'COMPLETE',
  error: 'ERROR',
  cooldown: 'COOLDOWN',
}

// Konversi bbox normalisasi ke pixel coordinates.
// Dipakai hanya untuk DetectionBox, karena DetectionBox butuh ukuran pixel.
function normalizeBboxToPixel(
  bbox: BoundingBox,
  videoWidth: number,
  videoHeight: number
): BoundingBox {
  return {
    originX: bbox.originX * videoWidth,
    originY: bbox.originY * videoHeight,
    width: bbox.width * videoWidth,
    height: bbox.height * videoHeight,
  }
}

export function CameraView({
  videoRef,
  status,
  ready,
  detections = [],
  stableObject = null,
  onDetectionsChange,
  videoWidth = 0,
  videoHeight = 0,
  arOverlay = null,
  isScanArmed = false,
  arResult = null,
}: Props) {
  const isActive = status === 'scanning'
  const isProcessing = status === 'processing'

  // ── AR Result Tracking State ──────────────────────────────────────────────
  // Track whether the result target is still visible or lost
  const trackedBboxRef = useRef<BoundingBox | null>(null)
  const trackedLabelRef = useRef<string | null>(null)
  const lastMatchTimeRef = useRef<number>(0)
  const trackingStateRef = useRef<TrackingState>('locked')
  const [trackingState, setTrackingState] = useState<TrackingState>('locked')

  // Update tracked bbox/label when arResult is set
  useEffect(() => {
    if (arResult && arOverlay?.bbox) {
      trackedBboxRef.current = arOverlay.bbox
      trackedLabelRef.current = arResult.objectName
      lastMatchTimeRef.current = Date.now()
      trackingStateRef.current = 'locked'
      setTrackingState('locked')
    }
  }, [arResult, arOverlay?.bbox])

  // Run tracking health check on every detection update
  useEffect(() => {
    if (!arResult || !trackedBboxRef.current || !trackedLabelRef.current) return

    const trackedBbox = trackedBboxRef.current
    const trackedLabel = trackedLabelRef.current

    const match = findMatchingDetection(detections, trackedLabel, trackedBbox)
    const now = Date.now()

    if (match) {
      // Update tracked bbox to latest detection for smooth follow
      trackedBboxRef.current = match.boundingBox
      lastMatchTimeRef.current = now
      trackingStateRef.current = 'locked'
      setTrackingState('locked')
    } else {
      const elapsed = now - lastMatchTimeRef.current
      if (elapsed >= GRACE_PERIOD_MS) {
        trackingStateRef.current = 'lost'
        setTrackingState('lost')
      } else if (elapsed >= GRACE_BEFORE_UNSTABLE_MS) {
        trackingStateRef.current = 'unstable'
        setTrackingState('unstable')
      }
      // Else: still locked (grace period not reached)
    }
  }, [detections, arResult])

  // Notify parent about detections
  useEffect(() => {
    if (onDetectionsChange) {
      onDetectionsChange(detections)
    }
  }, [detections, onDetectionsChange])

  return (
    <div
      className={`
        camera-container
        ${isActive ? 'scanning camera-active' : 'camera-idle'}
        ${isScanArmed ? 'ar-armed' : ''}
        ${arResult ? 'result-mode' : ''}
      `}
    >
      {/* ── Video Feed ── */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="camera-video"
      />

      {/* ── Camera Grid Overlay ── */}
      <div className="absolute inset-0 camera-grid opacity-40 pointer-events-none" />

      {/* ── AR Detection Overlays: DetectionBox tetap pakai bbox pixel ── */}
      {(isScanArmed || arResult) && detections.map((detection, idx) => {
          const isThisStable = stableObject?.label === detection.label

          // DetectionBox butuh bbox pixel, jadi di sini memang dikonversi.
          const pixelBbox = normalizeBboxToPixel(
            detection.boundingBox,
            videoWidth || 1,
            videoHeight || 1
          )

          return (
            <DetectionBox
              key={`detection-${idx}-${detection.label}`}
              bbox={pixelBbox}
              label={detection.label}
              confidence={detection.confidence}
              progress={isThisStable ? stableObject.progress : null}
              isStable={isThisStable}
              videoWidth={videoWidth || 1}
              videoHeight={videoHeight || 1}
            />
          )
        })}

      {/*
        ── Small info badge inside camera when AR result is ready ──
        Does NOT cover the object — just a subtle indicator.
        Adapts label and color based on tracking health state.
      */}
      {arResult && !arOverlay?.isAnalyzing && (
        <div
          className={`camera-info-ready-badge ${
            trackingState === 'lost'
              ? 'camera-info-badge-lost'
              : trackingState === 'unstable'
                ? 'camera-info-badge-unstable'
                : ''
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full animate-pulse ${
              trackingState === 'lost'
                ? 'bg-yellow-400'
                : trackingState === 'unstable'
                  ? 'bg-yellow-400/70'
                  : 'bg-hud-cyan'
            }`}
          />
          <span
            className={`font-mono-tech text-[9px] tracking-widest ${
              trackingState === 'lost'
                ? 'text-yellow-400'
                : trackingState === 'unstable'
                  ? 'text-yellow-400/70'
                  : 'text-hud-cyan'
            }`}
          >
            {trackingState === 'lost' ? 'TARGET LOST' : trackingState === 'unstable' ? 'TRACKING UNSTABLE' : 'OBJECT LOCKED'}
          </span>
        </div>
      )}

      {/*
        ── Floating AR Label saat analyzing (mode anchor, mengikuti bbox) ──
      */}
      {arOverlay?.isAnalyzing && stableObject && (
        <FloatingARLabel
          label={stableObject.label}
          confidence={stableObject.confidence}
          isAnalyzing={true}
          result={null}
          bbox={stableObject.bbox}
          videoWidth={videoWidth || 1}
          videoHeight={videoHeight || 1}
          mode="anchor"
        />
      )}

      {/* ── AR Corner Brackets with animation ── */}
      <div
        className={`pointer-events-none ${
          isActive ? 'animate-bracket-pulse' : ''
        }`}
      >
        <span className="ar-bracket ar-tl" />
        <span className="ar-bracket ar-tr" />
        <span className="ar-bracket ar-bl" />
        <span className="ar-bracket ar-br" />
      </div>

      {/* ── FINAL AR RESULT: compact floating message box INSIDE camera viewport ── */}
      {arResult && !arOverlay?.isAnalyzing && (
        <FloatingARLabel
          label={arResult.objectName}
          confidence={arResult.confidence}
          isAnalyzing={false}
          result={arResult}
          bbox={trackedBboxRef.current ?? stableObject?.bbox ?? { originX: 0.5, originY: 0.5, width: 0.1, height: 0.1 }}
          videoWidth={videoWidth || 1}
          videoHeight={videoHeight || 1}
          mode="message"
          overlayPlacement="inside-camera"
          trackingState={trackingState}
          currentDetections={detections}
          trackedLabel={arResult.objectName}
        />
      )}

      {/* ── Scanning Frame Effect ── */}
      {isActive && (
        <>
          <div className="absolute left-0 right-0 h-0.5 animate-scanline-vertical scan-line-gradient" />

          <div className="absolute top-0 bottom-0 w-0.5 animate-scanline-horizontal scan-line-gradient-purple" />

          <div className="absolute inset-0 animate-corner-glow pointer-events-none scan-corners">
            <div className="absolute top-0 left-0 w-16 h-16 border-t-[3px] border-l-[3px] border-hud-cyan rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-16 h-16 border-t-[3px] border-r-[3px] border-hud-cyan rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-[3px] border-l-[3px] border-hud-cyan rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-[3px] border-r-[3px] border-hud-cyan rounded-br-xl" />
          </div>
        </>
      )}

      {/* ── Processing State with Skeleton Loading ── */}
      {isProcessing && (
        <div className="absolute inset-0 bg-processing-overlay flex items-center justify-center pointer-events-none">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 border-4 border-hud-cyan/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-hud-cyan rounded-full animate-spin-slow" />
            <div className="absolute inset-2 border-2 border-transparent border-b-hud-purple/50 rounded-full animate-spin-reverse" />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-hud-cyan/20 rounded-lg flex items-center justify-center animate-pulse">
                <div className="w-3 h-3 bg-hud-cyan rounded animate-pulse" />
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 left-4 right-4 space-y-2">
            <div className="flex justify-center gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-1.5 w-8 rounded-full animate-pulse-bar bg-hud-cyan/30"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Done State Celebration ── */}
      {status === 'done' && (
        <div className="absolute inset-0 pointer-events-none animate-success-flash bg-hud-cyan/10">
          <div className="absolute inset-0 animate-scan-complete">
            <span className="ar-bracket ar-tl !border-hud-cyan" />
            <span className="ar-bracket ar-tr !border-hud-cyan" />
            <span className="ar-bracket ar-bl !border-hud-cyan" />
            <span className="ar-bracket ar-br !border-hud-cyan" />
          </div>
        </div>
      )}

      {/* ── No Camera Placeholder ── */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-hud-bg">
          <div className="text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 border-2 border-hud-cyan/30 rounded-full animate-radar" />
              <div className="absolute inset-2 border border-hud-cyan/20 rounded-full animate-radar animation-delay-200" />
              <div className="absolute inset-4 border border-hud-cyan/10 rounded-full animate-radar animation-delay-400" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 bg-hud-cyan rounded-full animate-ping" />
              </div>
            </div>

            <p className="font-mono-tech text-xs text-hud-cyan/40 tracking-widest animate-pulse">
              INIT_CAMERA...
            </p>

            <p className="font-hud text-[10px] text-hud-cyan/20">
              Meminta akses kamera
            </p>
          </div>
        </div>
      )}

      {/* ── HUD: top-left label ── */}
      <div className="absolute top-3 left-3 pointer-events-none">
        <span className="font-mono-tech text-[9px] text-hud-cyan/50 tracking-widest">
          AR_CV · UBSI
        </span>
      </div>

      {/* ── HUD: top-right status ── */}
      <div className="absolute top-3 right-3 pointer-events-none flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            status === 'error'
              ? 'bg-red-400 animate-pulse'
              : isActive
                ? 'bg-hud-cyan animate-pulse-bright'
                : isProcessing
                  ? 'bg-hud-purple animate-pulse'
                  : isScanArmed
                    ? 'bg-hud-cyan animate-pulse-bright'
                    : 'bg-hud-cyan/40'
          }`}
        />

        <span className="font-mono-tech text-[9px] text-hud-cyan/50 tracking-widest">
          {isScanArmed ? 'AR_ACTIVE' : STATUS_LABEL[status]}
        </span>
      </div>

      {/* ── AR Session active indicator ── */}
      {isScanArmed && (
        <div className="absolute bottom-3 left-3 pointer-events-none animate-slide-up">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-hud-cyan/20 border border-hud-cyan/30">
            <span className="w-1.5 h-1.5 bg-hud-cyan rounded-full animate-pulse" />
            <span className="font-mono-tech text-[9px] text-hud-cyan tracking-widest">
              AR SESSION
            </span>
          </div>
        </div>
      )}

      {/* ── Category badge shown when done ── */}
      {status === 'done' && (
        <div className="absolute bottom-3 left-3 pointer-events-none animate-slide-up">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-hud-cyan/20 border border-hud-cyan/30">
            <span className="w-1.5 h-1.5 bg-hud-cyan rounded-full animate-pulse" />
            <span className="font-mono-tech text-[9px] text-hud-cyan tracking-widest">
              SCAN_COMPLETE
            </span>
          </div>
        </div>
      )}
    </div>
  )
}