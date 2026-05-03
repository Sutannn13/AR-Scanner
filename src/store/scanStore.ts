import { create } from 'zustand'
import type { ScanResult, ScanStatus } from '../types'

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
