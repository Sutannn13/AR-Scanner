// ─────────────────────────────────────────────────────────────────────────────
// HOOK useStableObject
// Track stabilitas objek yang terdeteksi.
//
// Alur:
// 1. Terima detection results dari useObjectDetector
// 2. Tracking apakah objek yang sama masih dalam frame
// 3. Kalau objek bertahan > threshold detik (default 3 detik),
//    trigger callback onStable dengan hasil scan
// 4. Kalau objek hilang, reset tracking
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, useCallback } from 'react'
import type { DetectionResult, BoundingBox, DetectedObject, StabilityCallback } from '../types'

// Threshold stabilitas: 3 detik (bisa diubah lewat parameter)
const DEFAULT_STABILITY_THRESHOLD_MS = 3000

// Minimum IoU untuk dianggap objek sama
const IOU_THRESHOLD = 0.4

// Timeout untuk reset tracking kalau objek hilang
const TRACKING_TIMEOUT_MS = 2000

interface TrackedObject {
  label: string
  confidence: number
  bbox: BoundingBox
  lastSeen: number      // timestamp ms
  stableStart: number   // timestamp ms saat mulai stabil
  triggeredStable: boolean // apakah onStable sudah dipanggil untuk objek ini
}

interface UseStableObjectProps {
  // Threshold stabilitas dalam ms
  stabilityThresholdMs?: number
  // Callback saat objek stabil
  onStable?: StabilityCallback
  // Callback saat objek hilang dari frame
  onLost?: (label: string) => void
}

/**
 * Hitung IoU (Intersection over Union) antara dua bbox.
 * IoU = area intersect / area union
 * IoU > 0.4 berarti bbox cukup overlapping untuk dianggap objek sama.
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

  return intersectArea / unionArea
}

/**
 * Temukan bbox yang paling cocok dengan tracking yang ada.
 * Return index di trackedObjects atau -1 kalau tidak ada yang cocok.
 */
function findMatchingTrack(
  detection: DetectionResult,
  trackedObjects: TrackedObject[]
): number {
  let bestIdx = -1
  let bestIoU = 0

  for (let i = 0; i < trackedObjects.length; i++) {
    const current = trackedObjects[i]
    // Label harus sama (case-insensitive)
    if (current.label.toLowerCase() !== detection.label.toLowerCase()) continue

    const iou = calculateIoU(current.bbox, detection.boundingBox)
    if (iou > IOU_THRESHOLD && iou > bestIoU) {
      bestIoU = iou
      bestIdx = i
    }
  }

  return bestIdx
}

export function useStableObject({
  stabilityThresholdMs = DEFAULT_STABILITY_THRESHOLD_MS,
  onStable,
  onLost,
}: UseStableObjectProps = {}) {
  const [stableObject, setStableObject] = useState<DetectedObject | null>(null)
  const [currentDetections, setCurrentDetections] = useState<DetectionResult[]>([])

  // Refs untuk tracking (tidak trigger re-render)
  const trackedObjectsRef = useRef<TrackedObject[]>([])
  const lastUpdateRef = useRef<number>(0)

  // ── Update detections dan tracking logic ────────────────────────────────
  const updateDetections = useCallback((detections: DetectionResult[]) => {
    setCurrentDetections(detections)

    const now = performance.now()
    const tracked = trackedObjectsRef.current

    // ── 1. Update existing tracks atau tambah baru ─────────────────────
    for (const detection of detections) {
      const matchIdx = findMatchingTrack(detection, tracked)

      if (matchIdx >= 0) {
        // Update existing track
        tracked[matchIdx] = {
          ...tracked[matchIdx],
          confidence: detection.confidence,
          bbox: detection.boundingBox,
          lastSeen: now,
        }
      } else {
        // Tambah track baru
        tracked.push({
          label: detection.label,
          confidence: detection.confidence,
          bbox: detection.boundingBox,
          lastSeen: now,
          stableStart: now, // mulai stability timer
          triggeredStable: false,
        })
      }
    }

    // ── 2. Check untuk objek yang hilang ────────────────────────────────
    const toRemove: number[] = []
    for (let i = 0; i < tracked.length; i++) {
      if (now - tracked[i].lastSeen > TRACKING_TIMEOUT_MS) {
        console.log(`[useStableObject] 🔴 Objek hilang dari tracking: ${tracked[i].label}`)
        toRemove.push(i)
        // Trigger onLost callback
        if (onLost) {
          onLost(tracked[i].label)
        }
      }
    }

    // Hapus dari belakang supaya index tidak shift
    for (let i = toRemove.length - 1; i >= 0; i--) {
      tracked.splice(toRemove[i], 1)
    }

    // ── 3. Check stabilitas ────────────────────────────────────────────
    let newlyStable: DetectedObject | null = null

    for (const obj of tracked) {
      // Skip jika onStable sudah pernah dipanggil untuk objek ini
      if (obj.triggeredStable) continue

      const stableDuration = now - obj.stableStart

      // Hitung progress 0-1
      const progress = Math.min(stableDuration / stabilityThresholdMs, 1)

      // Check apakah sudah stabil
      if (stableDuration >= stabilityThresholdMs) {
        // Mark sebagai triggered agar tidak dipanggil lagi
        obj.triggeredStable = true

        console.log(`[useStableObject] 🟢 Objek stabil: ${obj.label} (${Math.round(progress * 100)}%)`)

        // Return objek dengan confidence tertinggi
        if (!newlyStable || obj.confidence > newlyStable.confidence) {
          newlyStable = {
            label: obj.label,
            confidence: obj.confidence,
            bbox: obj.bbox,
            stableStartTime: obj.stableStart,
            stableDuration,
            progress: 1,
          }
        }
      }
    }

    if (newlyStable) {
      setStableObject(newlyStable)
      if (onStable) {
        onStable(newlyStable)
      }
    }

    lastUpdateRef.current = now
  }, [stabilityThresholdMs, onStable, onLost])

  // ── Reset state saat objek hilang ───────────────────────────────────────
  const resetStability = useCallback(() => {
    setStableObject(null)
    trackedObjectsRef.current = []
  }, [])

  // Cleanup timeout
  useEffect(() => {
    return () => {
      trackedObjectsRef.current = []
    }
  }, [])

  return {
    // Detections yang sedang terlihat
    detections: currentDetections,
    // Objek yang sudah stabil (hold > threshold)
    stableObject,
    // Method untuk update detections
    updateDetections,
    // Method untuk reset tracking
    resetStability,
  }
}