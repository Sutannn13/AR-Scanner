// ─────────────────────────────────────────────────────────────────────────────
// TIPE UNTUK AR SCANNER REALTIME
// ─────────────────────────────────────────────────────────────────────────────

// Status scan untuk state machine
export type ScanStatus = 'idle' | 'scanning' | 'processing' | 'done' | 'error' | 'cooldown'

// ─────────────────────────────────────────────────────────────────────────────
// DETEKSI OBJEK (dari MediaPipe)
// ─────────────────────────────────────────────────────────────────────────────

/** Bounding box dalam koordinat normalisasi (0–1).
 *  Ini adalah range relatif terhadap dimensi video.
 *  CameraView akan mengkonversi ke pixel saat rendering. */
export interface BoundingBox {
  originX: number      // x origin (0–1), normalized
  originY: number      // y origin (0–1), normalized
  width: number        // lebar (0–1), normalized
  height: number       // tinggi (0–1), normalized
}

export interface DetectionResult {
  label: string
  confidence: number   // 0–1
  boundingBox: BoundingBox
}

// ─────────────────────────────────────────────────────────────────────────────
// DETEKSI STABIL (setelah tracking)
// ─────────────────────────────────────────────────────────────────────────────

export interface DetectedObject {
  label: string
  confidence: number
  bbox: BoundingBox                    // bbox normalized 0-1
  stableStartTime: number              // timestamp saat stabil dimulai (ms)
  stableDuration: number              // durasi stabil dalam ms
  progress: number                    // 0–1, progress ke threshold
}

export type StabilityCallback = (obj: DetectedObject) => void

// ─────────────────────────────────────────────────────────────────────────────
// AR OVERLAY STATE
// ─────────────────────────────────────────────────────────────────────────────

export interface AROverlay {
  // Objek yang sedang di-display
  targetLabel: string
  bbox: BoundingBox                    // bbox normalized 0-1
  // Hasil AI (null kalau belum analysis selesai)
  result: ScanResult | null
  isAnalyzing: boolean
  showProgress: boolean                // show progress bar on detected object
}

// ─────────────────────────────────────────────────────────────────────────────
// SCAN RESULT (dari AI service)
// ─────────────────────────────────────────────────────────────────────────────

export interface ScanResult {
  id: string
  timestamp: Date
  imageDataUrl: string                 // full data URL for display
  objectName: string
  category: string
  description: string
  funFacts: string[]
  confidence: number                   // 0–1
  modelUsed?: string                   // which model was used (e.g. gemini-2.0-flash-lite)
  providerUsed?: 'Gemini' | 'OpenRouter' | 'Together' | 'HuggingFace'
}