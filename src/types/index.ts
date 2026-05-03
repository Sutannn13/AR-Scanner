export interface ScanResult {
  id: string
  timestamp: Date
  imageDataUrl: string        // full data URL for display
  objectName: string
  category: string
  description: string
  funFacts: string[]
  confidence: number          // 0–1
  modelUsed?: string          // which model was used (e.g. gemini-2.0-flash-lite)
  providerUsed?: 'Gemini' | 'OpenRouter' | 'Together' | 'HuggingFace'
}

export type ScanStatus = 'idle' | 'scanning' | 'processing' | 'done' | 'error' | 'cooldown'
