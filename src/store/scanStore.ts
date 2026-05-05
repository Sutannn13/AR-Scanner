import { create } from 'zustand'
import type { ScanResult, ScanStatus, AROverlay } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// AR Session State - Controls the realtime AR scanning flow
// ─────────────────────────────────────────────────────────────────────────────

interface ARSessionState {
  // Session control
  isScanArmed: boolean           // User has pressed START AR SCAN, waiting for stable object
  hasAnalyzedCurrentTarget: boolean // AI already called for this session
  isARActive: boolean            // AR mode is active (armed or has result)

  // Cooldown to prevent rapid re-analysis of same object
  lastAnalyzedTargetKey: string | null  // "label+bbox" hash of last analyzed
  lastAnalysisAt: number                  // timestamp ms

  // Current AR result (not added to history automatically)
  arResult: ScanResult | null

  // Actions
  startARScanSession: () => void
  finishARScanSession: () => void
  resetARScanSession: () => void
  markTargetAnalyzed: (targetKey: string) => void
  setARResult: (result: ScanResult | null) => void
  clearARResult: () => void
}

const AR_SESSION_COOLDOWN_MS = 15_000 // 15 seconds cooldown before same object can be re-analyzed

export const useARSessionStore = create<ARSessionState>((set, get) => ({
  isScanArmed: false,
  hasAnalyzedCurrentTarget: false,
  isARActive: false,
  lastAnalyzedTargetKey: null,
  lastAnalysisAt: 0,
  arResult: null,

  startARScanSession: () => {
    console.log('[AR Session] 🔵 Armed - user started AR scan session')
    set({
      isScanArmed: true,
      hasAnalyzedCurrentTarget: false,
      isARActive: true,
      arResult: null,
    })
  },

  finishARScanSession: () => {
    console.log('[AR Session] 🟢 Result displayed - session finished')
    set({ isScanArmed: false })
  },

  resetARScanSession: () => {
    console.log('[AR Session] ⚪ Reset - user can start new session')
    set({
      isScanArmed: false,
      hasAnalyzedCurrentTarget: false,
      isARActive: false,
    })
  },

  markTargetAnalyzed: (targetKey: string) => {
    set({
      hasAnalyzedCurrentTarget: true,
      lastAnalyzedTargetKey: targetKey,
      lastAnalysisAt: Date.now(),
    })
  },

  setARResult: (result) => {
    set({ arResult: result })
  },

  clearARResult: () => {
    set({ arResult: null })
  },
}))

// Helper to check if object is in cooldown
export function isTargetInCooldown(targetKey: string): boolean {
  const state = useARSessionStore.getState()
  if (state.lastAnalyzedTargetKey !== targetKey) return false
  return Date.now() - state.lastAnalysisAt < AR_SESSION_COOLDOWN_MS
}

// Helper to get remaining cooldown seconds
export function getCooldownRemaining(targetKey: string): number {
  const state = useARSessionStore.getState()
  if (state.lastAnalyzedTargetKey !== targetKey) return 0
  const elapsed = Date.now() - state.lastAnalysisAt
  return Math.max(0, Math.ceil((AR_SESSION_COOLDOWN_MS - elapsed) / 1000))
}

// ─────────────────────────────────────────────────────────────────────────────
// AR Overlay State (existing) - Floating label & detection overlay
// ─────────────────────────────────────────────────────────────────────────────

interface AROverlayState {
  arOverlay: AROverlay | null
  isAIAnalyzing: boolean
  trackedLabel: string | null

  setAROverlay: (overlay: AROverlay | null) => void
  setIsAIAnalyzing: (analyzing: boolean) => void
  setTrackedLabel: (label: string | null) => void
  clearAROverlay: () => void
}

export const useARStore = create<AROverlayState>((set) => ({
  arOverlay: null,
  isAIAnalyzing: false,
  trackedLabel: null,

  setAROverlay: (overlay) => set({ arOverlay: overlay }),
  setIsAIAnalyzing: (analyzing) => set({ isAIAnalyzing: analyzing }),
  setTrackedLabel: (label) => set({ trackedLabel: label }),
  clearAROverlay: () => set({ arOverlay: null, isAIAnalyzing: false, trackedLabel: null }),
}))

// ─────────────────────────────────────────────────────────────────────────────
// Manual Scan Store - Only for manual snapshot scans, NOT AR results
// ─────────────────────────────────────────────────────────────────────────────

interface ScanStore {
  status: ScanStatus
  history: ScanResult[]          // Only manual scan history
  current: ScanResult | null
  error: string | null
  cooldownSeconds: number

  setStatus:  (s: ScanStatus)       => void
  setError:   (e: string | null)    => void
  addResult:  (r: ScanResult)       => void  // Manual scan only
  setCurrent: (r: ScanResult | null)=> void
  clearHistory: ()                  => void
  setCooldown: (seconds: number)    => void
}

export const useScanStore = create<ScanStore>((set) => ({
  status:  'idle',
  history: [],
  current: null,
  error:   null,
  cooldownSeconds: 0,

  setStatus:  (status)  => set({ status }),
  setError:   (error)   => set({ error }),
  setCurrent: (current) => set({ current }),
  setCooldown: (cooldownSeconds) => set({ cooldownSeconds }),

  // Manual scan result - adds to history
  addResult: (result) =>
    set((s) => ({
      history: [result, ...s.history].slice(0, 20),
      current: result,
      status:  'done',
    })),

  clearHistory: () => set({ history: [], current: null }),
}))