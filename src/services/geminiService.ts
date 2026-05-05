import type { ScanResult } from '../types'

// ── MULTI-PROVIDER AI SERVICE WITH USAGE TRACKING ─────────────────────────────
// Fallback chain:
//   1. Gemini  gemini-2.0-flash-lite         (PRIMARY)
//   2. Gemini  gemini-2.0-flash             (FALLBACK 1)
//   3. OpenRouter qwen/qwen3-vl-8b-instruct (FALLBACK 2)
//   4. OpenRouter google/gemma-3-12b-it:free(FALLBACK 3)
//   5. Together meta-llama/Llama-Vision-Free (FALLBACK 4)
//   6. HuggingFace blip-image-captioning-large(FALLBACK 5)
//
// COOLDOWN IS PER-PROVIDER:
//   - One provider's 429 does NOT block any other provider
//   - Scan button is NEVER blocked by cooldown
//
// DAILY USAGE LIMIT:
//   - Default 25 requests per day, tracked in localStorage
//   - Real external provider requests only (no Mock AI)
//
// PROVIDER MODE:
//   - auto: fallback chain capped by max attempts
//   - gemini-only/openrouter-only/together-only/hf-only

// ── Provider types ───────────────────────────────────────────────────────────
type ProviderName = 'Gemini' | 'OpenRouter' | 'Together' | 'HuggingFace'

interface ModelSlot {
  provider: ProviderName
  model: string
  call: (base64Jpeg: string) => Promise<ScanResult>
}

// ── Environment config ───────────────────────────────────────────────────────
const DAILY_LIMIT = Number(import.meta.env.VITE_DAILY_SCAN_LIMIT) || 25
const PROVIDER_MODE = (import.meta.env.VITE_AI_PROVIDER_MODE as string) || 'auto'
const MAX_PROVIDER_ATTEMPTS = Number(import.meta.env.VITE_MAX_PROVIDER_ATTEMPTS) || 2

// ── Image compression utility ───────────────────────────────────────────────
function compressImage(base64: string, maxDim = 768, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Decode base64 to binary
      const binaryString = atob(base64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: 'image/jpeg' })
      const url = URL.createObjectURL(blob)

      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(url)

        // Calculate target dimensions maintaining aspect ratio
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height / width) * maxDim)
            width = maxDim
          } else {
            width = Math.round((width / height) * maxDim)
            height = maxDim
          }
        }

        // Draw compressed version to canvas
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Cannot get canvas 2D context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality).split(',')[1])
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image for compression'))
      }
      img.src = url
    } catch (err) {
      reject(err)
    }
  })
}

// ── Daily API usage tracking ───────────────────────────────────────────────────
function getTodayKey(): string {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  return `ar_scanner_real_api_usage_${today}`
}

export function getTodayApiUsage(): number {
  try {
    const raw = localStorage.getItem(getTodayKey())
    return raw ? parseInt(raw, 10) : 0
  } catch {
    return 0
  }
}

export function getDailyApiLimit(): number {
  return DAILY_LIMIT
}

export function getProviderMode(): string {
  return PROVIDER_MODE
}

function incrementTodayUsage(): void {
  try {
    const key = getTodayKey()
    const current = getTodayApiUsage()
    localStorage.setItem(key, String(current + 1))
  } catch {
    // localStorage may be unavailable (private browsing, quota exceeded)
    console.warn('[AR Scanner] Cannot write to localStorage for usage tracking')
  }
}

function checkDailyLimit(): void {
  const usage = getTodayApiUsage()
  if (usage >= DAILY_LIMIT) {
    throw new Error(
      `Batas penggunaan AI harian tercapai (${DAILY_LIMIT} request). Coba lagi besok atau gunakan API key baru.`
    )
  }
}

// ── Usage change listeners ───────────────────────────────────────────────────
const usageListeners: Array<(usage: number) => void> = []

export function onApiUsageChange(cb: (usage: number) => void): () => void {
  usageListeners.push(cb)
  return () => {
    const idx = usageListeners.indexOf(cb)
    if (idx >= 0) usageListeners.splice(idx, 1)
  }
}

function notifyUsageChange(): void {
  const usage = getTodayApiUsage()
  usageListeners.forEach((cb) => cb(usage))
}

// ── Shared prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Kamu adalah AR Object Recognition AI yang canggih.

Saat diberikan gambar, analisa dengan teliti dan kembalikan HANYA JSON murni (tanpa markdown, tanpa code block, tanpa penjelasan tambahan).

Struktur JSON yang harus dikembalikan:
{
  "objectName": "Nama objek utama (2-3 kata dalam Bahasa Indonesia, spesifik dan akurat)",
  "category": "Kategori objek (pilih satu): Elektronik, Makanan, Alam, Hewan, Kendaraan, Furnitur, Peralatan, Buku, Lainnya",
  "description": "Deskripsi 2 kalimat tentang objek. Jelas, informatif, tidak berlebihan.",
  "funFacts": ["Fakta menarik 1 (satu kalimat)", "Fakta menarik 2 (satu kalimat)"],
  "confidence": 0.92
}

Aturan penting:
- Semua teks HARUS dalam Bahasa Indonesia yang baik dan benar
- Jika objek tidak jelas: objectName = "Objek Tidak Jelas", description = "Objek tidak cukup jelas. Arahkan kamera lebih dekat dengan pencahayaan yang lebih baik."
- confidence harus realistis (0.5-1.0), bukan selalu 0.95
- funFacts maks 2 fakta singkat, tidak perlu 3
- JANGAN tambahkan apapun selain JSON valid`

// ── Startup log ──────────────────────────────────────────────────────────────
;(() => {
  const gk = import.meta.env.VITE_GEMINI_API_KEY
  const ok = import.meta.env.VITE_OPENROUTER_API_KEY
  const tk = import.meta.env.VITE_TOGETHER_API_KEY
  const hk = import.meta.env.VITE_HF_API_KEY
  const usage = getTodayApiUsage()
  console.log('[AR Scanner] ═══ Multi-Provider AI Service ═══')
  console.log('[AR Scanner]  Provider mode:', PROVIDER_MODE, '| Max attempts:', MAX_PROVIDER_ATTEMPTS)
  console.log('[AR Scanner]  Daily limit:', DAILY_LIMIT, '| Today used:', usage)
  console.log('[AR Scanner]  1. Gemini gemini-2.0-flash-lite   ', gk ? '✅' : '❌ no key')
  console.log('[AR Scanner]  2. Gemini gemini-2.0-flash        ', gk ? '✅' : '❌ no key')
  console.log('[AR Scanner]  3. OpenRouter qwen3-vl-8b          ', ok ? '✅' : '❌ no key')
  console.log('[AR Scanner]  4. OpenRouter gemma-3-12b-it:free ', ok ? '✅' : '❌ no key')
  console.log('[AR Scanner]  5. Together Llama-Vision-Free      ', tk ? '✅' : '❌ no key')
  console.log('[AR Scanner]  6. HuggingFace blip-caption-large ', hk ? '✅' : '❌ no key')
  console.log('[AR Scanner] ═════════════════════════════════')
})()

// ── PER-PROVIDER cooldown tracking ───────────────────────────────────────────
const providerCooldownUntil: Record<ProviderName, number> = {
  Gemini: 0,
  OpenRouter: 0,
  Together: 0,
  HuggingFace: 0,
}

function setProviderCooldown(provider: ProviderName, seconds: number) {
  providerCooldownUntil[provider] = Date.now() + seconds * 1000
  console.log(`[AR Scanner] ⏳ ${provider} cooldown: ${seconds}s`)
}

function isProviderInCooldown(provider: ProviderName): boolean {
  return Date.now() < providerCooldownUntil[provider]
}

// ── Cooldown UI state (informational only, NEVER blocks scan) ────────────────
const cooldownListeners: Array<(remaining: number) => void> = []

export function onCooldownTick(cb: (remaining: number) => void) {
  cooldownListeners.push(cb)
  return () => {
    const idx = cooldownListeners.indexOf(cb)
    if (idx >= 0) cooldownListeners.splice(idx, 1)
  }
}

function notifyCooldownUI(seconds: number) {
  const endTime = Date.now() + seconds * 1000
  const tick = () => {
    const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
    cooldownListeners.forEach((cb) => cb(remaining))
    if (remaining > 0) requestAnimationFrame(tick)
  }
  tick()
}

export function getCooldownRemaining(): number { return 0 }
export function isCoolingDown(): boolean { return false }

// ── Rate limiter: max 1 request per 2 seconds ────────────────────────────────
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 2000

async function waitForRateLimit(): Promise<void> {
  const now = Date.now()
  const elapsed = now - lastRequestTime
  if (elapsed < MIN_REQUEST_INTERVAL) {
    await new Promise((r) => setTimeout(r, MIN_REQUEST_INTERVAL - elapsed))
  }
  lastRequestTime = Date.now()
}

// ── Parse raw AI text into JSON ──────────────────────────────────────────────
function parseAIResponse(raw: string): Record<string, unknown> {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
  return JSON.parse(cleaned)
}

// ── Build ScanResult from parsed JSON ────────────────────────────────────────
function buildResult(
  parsed: Record<string, unknown>,
  base64Jpeg: string,
  provider: ProviderName,
  model: string,
): ScanResult {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    imageDataUrl: `data:image/jpeg;base64,${base64Jpeg}`,
    objectName: String((parsed.objectName as string) ?? 'Objek Tidak Dikenal'),
    category: String((parsed.category as string) ?? 'Lainnya'),
    description: String((parsed.description as string) ?? ''),
    funFacts: Array.isArray(parsed.funFacts) ? parsed.funFacts.map(String) : [],
    confidence: Number((parsed.confidence as number) ?? 0.8),
    modelUsed: model,
    providerUsed: provider,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PROVIDER 1 & 2: GEMINI
// ═══════════════════════════════════════════════════════════════════════════════
async function callGemini(base64Jpeg: string, model: string): Promise<ScanResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string
  if (!apiKey?.trim()) {
    throw new Error('Gemini API key not configured')
  }

  await waitForRateLimit()

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: SYSTEM_PROMPT },
          { inlineData: { mimeType: 'image/jpeg', data: base64Jpeg } },
          { text: 'Analisa gambar ini dan kembalikan JSON sesuai format.' },
        ],
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    }),
  })

  if (response.status === 429) {
    const errText = await response.text()
    const retryMatch = errText.match(/"retryDelay":\s*"(\d+)s"/)
    const retrySeconds = retryMatch ? parseInt(retryMatch[1], 10) : 30
    setProviderCooldown('Gemini', retrySeconds)
    notifyCooldownUI(retrySeconds)
    throw new Error(`Gemini ${model} rate limited (429)`)
  }

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Gemini ${model} error ${response.status}: ${errText.slice(0, 200)}`)
  }

  const data = await response.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error(`Gemini ${model}: respons kosong`)

  const parsed = parseAIResponse(text.trim())
  return buildResult(parsed, base64Jpeg, 'Gemini', model)
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PROVIDER 3: OPENROUTER qwen3-vl-8b-instruct (OpenAI-compatible)
// ═══════════════════════════════════════════════════════════════════════════════
async function callOpenRouterQwen(base64Jpeg: string): Promise<ScanResult> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY as string
  if (!apiKey) throw new Error('OpenRouter API key not configured')

  await waitForRateLimit()

  const model = 'qwen/qwen3-vl-8b-instruct'
  const url = 'https://openrouter.ai/api/v1/chat/completions'

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'AR Scanner - VAR UBSI',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64Jpeg}` },
            },
            {
              type: 'text',
              text: 'Analisa gambar ini dan kembalikan JSON sesuai format.',
            },
          ],
        },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  })

  if (response.status === 429) {
    setProviderCooldown('OpenRouter', 60)
    throw new Error('OpenRouter qwen3-vl rate limited (429)')
  }

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`OpenRouter qwen3-vl error ${response.status}: ${errText.slice(0, 200)}`)
  }

  const data = await response.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text) throw new Error('OpenRouter qwen3-vl: respons kosong')

  const parsed = parseAIResponse(text.trim())
  return buildResult(parsed, base64Jpeg, 'OpenRouter', model)
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PROVIDER 4: OPENROUTER google/gemma-3-12b-it:free (OpenAI-compatible)
// ═══════════════════════════════════════════════════════════════════════════════
async function callOpenRouterGemma(base64Jpeg: string): Promise<ScanResult> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY as string
  if (!apiKey) throw new Error('OpenRouter API key not configured')

  await waitForRateLimit()

  const model = 'google/gemma-3-12b-it:free'
  const url = 'https://openrouter.ai/api/v1/chat/completions'

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'AR Scanner - VAR UBSI',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64Jpeg}` },
            },
            {
              type: 'text',
              text: 'Analisa gambar ini dan kembalikan JSON sesuai format.',
            },
          ],
        },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  })

  if (response.status === 429) {
    setProviderCooldown('OpenRouter', 60)
    throw new Error('OpenRouter gemma rate limited (429)')
  }

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`OpenRouter gemma error ${response.status}: ${errText.slice(0, 200)}`)
  }

  const data = await response.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text) throw new Error('OpenRouter gemma: respons kosong')

  const parsed = parseAIResponse(text.trim())
  return buildResult(parsed, base64Jpeg, 'OpenRouter', model)
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PROVIDER 5: TOGETHER AI (OpenAI-compatible)
// ═══════════════════════════════════════════════════════════════════════════════
async function callTogether(base64Jpeg: string): Promise<ScanResult> {
  const apiKey = import.meta.env.VITE_TOGETHER_API_KEY
  if (!apiKey) throw new Error('Together API key not configured')

  await waitForRateLimit()

  const model = 'meta-llama/Llama-Vision-Free'
  const url = 'https://api.together.xyz/v1/chat/completions'

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64Jpeg}` },
            },
            {
              type: 'text',
              text: 'Analisa gambar ini dan kembalikan JSON sesuai format.',
            },
          ],
        },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  })

  if (response.status === 429) {
    setProviderCooldown('Together', 60)
    throw new Error('Together Llama-Vision rate limited (429)')
  }

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Together error ${response.status}: ${errText.slice(0, 200)}`)
  }

  const data = await response.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text) throw new Error('Together: respons kosong')

  const parsed = parseAIResponse(text.trim())
  return buildResult(parsed, base64Jpeg, 'Together', model)
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PROVIDER 6: HUGGING FACE — BLIP image captioning
//  Returns plain description text, not JSON.
//  We use the caption to build a structured ScanResult.
// ═══════════════════════════════════════════════════════════════════════════════
async function callHuggingFace(base64Jpeg: string): Promise<ScanResult> {
  const apiKey = import.meta.env.VITE_HF_API_KEY
  if (!apiKey) throw new Error('HuggingFace API key not configured')

  await waitForRateLimit()

  const binaryString = atob(base64Jpeg)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  const imageBlob = new Blob([bytes], { type: 'image/jpeg' })

  const formData = new FormData()
  formData.append('inputs', imageBlob, 'image.jpg')

  const response = await fetch(
    'https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    },
  )

  if (response.status === 429) {
    setProviderCooldown('HuggingFace', 60)
    throw new Error('HuggingFace rate limited (429)')
  }

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`HuggingFace error ${response.status}: ${errText.slice(0, 200)}`)
  }

  const caption: string = await response.json()

  const parsed = buildResultFromCaption(caption)
  return buildResult(parsed, base64Jpeg, 'HuggingFace', 'Salesforce/blip-image-captioning-large')
}

// ── Build structured result from a plain caption (no JSON available) ────────
function buildResultFromCaption(caption: string): Record<string, unknown> {
  const name = caption.split(/[,.]/)[0].trim()
  const nameMap: Record<string, { objectName: string; category: string }> = {
    'a red apple': { objectName: 'Apel Merah', category: 'Makanan' },
    'a green apple': { objectName: 'Apel Hijau', category: 'Makanan' },
    'a banana': { objectName: 'Pisang', category: 'Makanan' },
    'a cat': { objectName: 'Kucing', category: 'Hewan' },
    'a dog': { objectName: 'Anjing', category: 'Hewan' },
    'a book': { objectName: 'Buku', category: 'Buku' },
    'a phone': { objectName: 'Telepon', category: 'Elektronik' },
    'a laptop': { objectName: 'Laptop', category: 'Elektronik' },
    'a car': { objectName: 'Mobil', category: 'Kendaraan' },
    'a bicycle': { objectName: 'Sepeda', category: 'Kendaraan' },
  }

  const lower = caption.toLowerCase()
  let match = nameMap['a ' + lower.split(' ').slice(0, 2).join(' ')]
    ?? nameMap[lower.split(/[,.]/)[0].trim()]
    ?? null

  if (!match) {
    match = {
      objectName: name.split(' ').slice(0, 3).map((w: string) =>
        w.charAt(0).toUpperCase() + w.slice(1),
      ).join(' ') || caption.slice(0, 30),
      category: 'Lainnya',
    }
  }

  return {
    objectName: match.objectName,
    category: match.category,
    description: `Objek yang diidentifikasi: ${caption}. ${caption.charAt(0).toUpperCase() + caption.slice(1)}.`,
    funFacts: [
      `Deskripsi dari AI HuggingFace BLIP: "${caption}"`,
      'Model BLIP (Bootstrapped Language-Image Pretraining) dari Salesforce.',
      'Tidak bisa mengenali lebih detail tanpa API berbayar.',
    ],
    confidence: 0.75,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN: analyzeImage with compression, usage tracking, and provider mode
// ═══════════════════════════════════════════════════════════════════════════════
export async function analyzeImage(rawBase64: string): Promise<ScanResult> {
  // ── Step 1: Check daily limit ───────────────────────────────────────────
  checkDailyLimit()

  // ── Step 2: Compress image (768x768, 0.72 JPEG quality) ─────────────────
  let base64: string
  try {
    base64 = await compressImage(rawBase64, 768, 0.72)
  } catch {
    // Fallback: use raw image if compression fails
    console.warn('[AR Scanner] Image compression failed, using original')
    base64 = rawBase64
  }

  // ── Step 3: Build slot list based on provider mode ───────────────────────
  const mode = PROVIDER_MODE

  function checkKey(name: string, key: string | undefined): void {
    if (mode !== 'auto' && !key?.trim()) {
      throw new Error(`Provider AI belum dikonfigurasi. Periksa environment variable API key.`)
    }
  }

  const allSlots: ModelSlot[] = []

  if (mode === 'auto' || mode === 'gemini-only') {
    if (import.meta.env.VITE_GEMINI_API_KEY) {
      allSlots.push({
        provider: 'Gemini',
        model: 'gemini-2.0-flash-lite',
        call: (img) => callGemini(img, 'gemini-2.0-flash-lite'),
      })
      allSlots.push({
        provider: 'Gemini',
        model: 'gemini-2.0-flash',
        call: (img) => callGemini(img, 'gemini-2.0-flash'),
      })
    } else {
      checkKey('Gemini', import.meta.env.VITE_GEMINI_API_KEY)
    }
  }

  if (mode === 'auto' || mode === 'openrouter-only') {
    if (import.meta.env.VITE_OPENROUTER_API_KEY) {
      allSlots.push({
        provider: 'OpenRouter',
        model: 'qwen/qwen3-vl-8b-instruct',
        call: callOpenRouterQwen,
      })
      allSlots.push({
        provider: 'OpenRouter',
        model: 'google/gemma-3-12b-it:free',
        call: callOpenRouterGemma,
      })
    } else {
      checkKey('OpenRouter', import.meta.env.VITE_OPENROUTER_API_KEY)
    }
  }

  if (mode === 'auto' || mode === 'together-only') {
    if (import.meta.env.VITE_TOGETHER_API_KEY) {
      allSlots.push({
        provider: 'Together',
        model: 'meta-llama/Llama-Vision-Free',
        call: callTogether,
      })
    } else {
      checkKey('Together', import.meta.env.VITE_TOGETHER_API_KEY)
    }
  }

  if (mode === 'auto' || mode === 'hf-only') {
    if (import.meta.env.VITE_HF_API_KEY) {
      allSlots.push({
        provider: 'HuggingFace',
        model: 'Salesforce/blip-image-captioning-large',
        call: callHuggingFace,
      })
    } else {
      checkKey('HuggingFace', import.meta.env.VITE_HF_API_KEY)
    }
  }

  if (allSlots.length === 0) {
    throw new Error('❌ Tidak ada API key yang dikonfigurasi.\nTambahkan minimal VITE_GEMINI_API_KEY di file .env')
  }

  // ── Step 4: Filter out cooldown providers ────────────────────────────────
  const activeSlots = allSlots.filter((slot) => {
    if (isProviderInCooldown(slot.provider)) {
      console.log(`[AR Scanner] ⏭️ Skipping ${slot.provider} (${slot.model}) — in cooldown`)
      return false
    }
    return true
  })

  const slots = activeSlots.length > 0 ? activeSlots : allSlots

  // ── Step 5: Apply max attempts cap ─────────────────────────────────────
  const maxAttempts = Math.min(MAX_PROVIDER_ATTEMPTS, slots.length)
  const attemptSlots = slots.slice(0, maxAttempts)

  // ── Step 6: Try each model in order ───────────────────────────────────
  const errors: string[] = []

  for (let i = 0; i < attemptSlots.length; i++) {
    const slot = attemptSlots[i]
    const isLast = i === attemptSlots.length - 1

    try {
      console.log(`[AR Scanner] 🔄 Trying ${slot.provider} → ${slot.model}...`)

      // Increment usage BEFORE making the request
      incrementTodayUsage()
      notifyUsageChange()
      console.log(`[AR Scanner] 📊 API usage: ${getTodayApiUsage()} / ${DAILY_LIMIT}`)

      const result = await slot.call(base64)
      console.log(`[AR Scanner] ✅ Success via ${slot.provider} (${slot.model})`)
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`[AR Scanner] ❌ ${slot.provider} (${slot.model}) failed: ${msg}`)
      errors.push(`${slot.provider}: ${msg}`)

      if (isLast) {
        throw new Error(
          `❌ Semua model AI gagal.\n\n${errors.map((e, idx) => `${idx + 1}. ${e}`).join('\n')}\n\nCoba lagi dalam beberapa detik.`
        )
      }

      continue
    }
  }

  throw new Error('❌ Semua model AI sedang tidak tersedia.')
}
