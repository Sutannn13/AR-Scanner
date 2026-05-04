import { create } from 'zustand'
import type { ScanResult, ScanStatus, AROverlay } from '../types'

interface ARState {
  // Overlay AR yang sedang aktif
  arOverlay: AROverlay | null
  // Apakah AI sedang menganalisis objek stabil
  isAIAnalyzing: boolean
  // Objek yang sedang di-track
  trackedLabel: string | null

  // Actions
  setAROverlay: (overlay: AROverlay | null) => void
  setIsAIAnalyzing: (analyzing: boolean) => void
  setTrackedLabel: (label: string | null) => void
  clearAROverlay: () => void
}

// Store untuk AR state
export const useARStore = create<ARState>((set) => ({
  arOverlay: null,
  isAIAnalyzing: false,
  trackedLabel: null,

  setAROverlay: (overlay) => set({ arOverlay: overlay }),
  setIsAIAnalyzing: (analyzing) => set({ isAIAnalyzing: analyzing }),
  setTrackedLabel: (label) => set({ trackedLabel: label }),
  clearAROverlay: () => set({ arOverlay: null, isAIAnalyzing: false, trackedLabel: null }),
}))

// Store asli tetap ada untuk backward compatibility
interface ScanStore {
  status: ScanStatus
  history: ScanResult[]
  current: ScanResult | null
  error: string | null
  cooldownSeconds: number

  setStatus:  (s: ScanStatus)       => void
  setError:   (e: string | null)    => void
  addResult:  (r: ScanResult)       => void
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

  addResult: (result) =>
    set((s) => ({
      history: [result, ...s.history].slice(0, 20), // keep last 20
      current: result,
      status:  'done',
    })),

  clearHistory: () => set({ history: [], current: null }),
}))
