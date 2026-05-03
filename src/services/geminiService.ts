import type { ScanResult } from '../types'

// ── MULTI-PROVIDER AI SERVICE ────────────────────────────────────────────────
// Fallback chain:
//   1. Gemini  gemini-2.0-flash-lite         (PRIMARY)
//   2. Gemini  gemini-2.0-flash             (FALLBACK 1)
//   3. OpenRouter qwen/qwen3-vl-8b-instruct (FALLBACK 2)
//   4. OpenRouter google/gemma-3-12b-it:free(FALLBACK 3)
//   5. Together meta-llama/Llama-Vision-Free (FALLBACK 4)
//   6. HuggingFace blip-image-captioning-large(FALLBACK 5)
//
// COOLDOWN IS PER-PROVIDER:
///  - One provider's 429 does NOT block any other provider
//   - Scan button is NEVER blocked by cooldown

// ── Provider types ───────────────────────────────────────────────────────────
type ProviderName = 'Gemini' | 'OpenRouter' | 'Together' | 'HuggingFace'

interface ModelSlot {
  provider: ProviderName
  model: string
  call: (base64Jpeg: string) => Promise<ScanResult>
}

// ── Shared prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Kamu adalah AR Object Recognition AI yang canggih, mirip sistem JARVIS Iron Man.

Saat diberikan gambar, analisa dengan teliti dan kembalikan HANYA objek JSON murni (tanpa markdown, tanpa code block, tanpa penjelasan tambahan).

Struktur JSON yang harus dikembalikan:
{
  "objectName": "Nama objek utama dalam gambar (gunakan nama umum dalam Bahasa Indonesia)",
  "category": "Kategori objek (pilih satu: Elektronik, Makanan, Alam, Hewan, Kendaraan, Furnitur, Peralatan, Buku, Orang, Lainnya)",
  "description": "Deskripsi 2-3 kalimat tentang objek tersebut dalam Bahasa Indonesia. Informatif dan menarik.",
  "funFacts": [
    "Fakta menarik pertama tentang objek ini",
    "Fakta menarik kedua tentang objek ini",
    "Fakta menarik ketiga tentang objek ini"
  ],
  "confidence": 0.95
}

Aturan penting:
- Semua teks HARUS dalam Bahasa Indonesia
- Jika tidak bisa mengenali objek, gunakan objectName: "Objek Tidak Dikenal"
- confidence harus antara 0.0 hingga 1.0
- funFacts harus selalu berisi tepat 3 fakta menarik
- JANGAN tambahkan apapun selain JSON yang valid`

// ── Startup log ──────────────────────────────────────────────────────────────
;(() => {
  const gk = import.meta.env.VITE_GEMINI_API_KEY
  const ok = import.meta.env.VITE_OPENROUTER_API_KEY
  const tk = import.meta.env.VITE_TOGETHER_API_KEY
  const hk = import.meta.env.VITE_HF_API_KEY
  console.log('[AR Scanner] ═══ Multi-Provider AI Service ═══')
  console.log('[AR Scanner]  1. Gemini gemini-2.0-flash-lite   ', gk ? '✅' : '❌ no key')
  console.log('[AR Scanner]  2. Gemini gemini-2.0-flash        ', gk ? '✅' : '❌ no key')
  console.log('[AR Scanner]  3. OpenRouter qwen3-vl-8b          ', ok ? '✅' : '❌ no key')
  console.log('[AR Scanner]  4. OpenRouter gemma-3-12b-it:free ', ok ? '✅' : '❌ no key')
  console.log('[AR Scanner]  5. Together Llama-Vision-Free      ', tk ? '✅' : '❌ no key')
  console.log('[AR Scanner]  6. HuggingFace blip-caption-large ', hk ? '✅' : '❌ no key')
  console.log('[AR Scanner] ═════════════════════════════════')
})()

// ── PER-PROVIDER cooldown tracking ───────────────────────────────────────────
// Each provider has its own cooldown — one provider's rate limit does NOT
// block other providers.
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
  // Only notify UI — this is informational, not blocking
  const endTime = Date.now() + seconds * 1000
  const tick = () => {
    const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
    cooldownListeners.forEach((cb) => cb(remaining))
    if (remaining > 0) requestAnimationFrame(tick)
  }
  tick()
}

// These are kept exported for compatibility but DO NOT block scanning
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
  if (!apiKey || apiKey === 'your-gemini-api-key') {
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
    // Per-provider cooldown — does NOT block other providers
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

  // Decode base64 to binary Blob for multipart/form-data
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

  // BLIP returns a plain string caption, not JSON
  const caption: string = await response.json()

  // Build a structured result from the caption text
  const parsed = buildResultFromCaption(caption)
  return buildResult(parsed, base64Jpeg, 'HuggingFace', 'Salesforce/blip-image-captioning-large')
}

// ── Build structured result from a plain caption (no JSON available) ────────
function buildResultFromCaption(caption: string): Record<string, unknown> {
  // Caption is like "a red apple on a wooden table"
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
//  MAIN: analyzeImage with full fallback chain
//  - Cooldown is PER-PROVIDER: skips cooled-down providers, tries the rest
//  - Scan button is NEVER blocked
//  - Zero delay between fallbacks
// ═══════════════════════════════════════════════════════════════════════════════
export async function analyzeImage(base64Jpeg: string): Promise<ScanResult> {
  // Build fallback chain — only include providers with API keys
  const allSlots: ModelSlot[] = []

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
  }

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
  }

  if (import.meta.env.VITE_TOGETHER_API_KEY) {
    allSlots.push({
      provider: 'Together',
      model: 'meta-llama/Llama-Vision-Free',
      call: callTogether,
    })
  }

  if (import.meta.env.VITE_HF_API_KEY) {
    allSlots.push({
      provider: 'HuggingFace',
      model: 'Salesforce/blip-image-captioning-large',
      call: callHuggingFace,
    })
  }

  if (allSlots.length === 0) {
    throw new Error('❌ Tidak ada API key yang dikonfigurasi.\nTambahkan minimal VITE_GEMINI_API_KEY di file .env')
  }

  // FILTER OUT providers that are currently in cooldown
  // Key: one provider's 429 → skip only that provider, try others instantly
  const activeSlots = allSlots.filter((slot) => {
    if (isProviderInCooldown(slot.provider)) {
      console.log(`[AR Scanner] ⏭️ Skipping ${slot.provider} (${slot.model}) — in cooldown`)
      return false
    }
    return true
  })

  // If ALL providers are in cooldown, try them anyway (cooldown might have expired)
  const slots = activeSlots.length > 0 ? activeSlots : allSlots

  // Try each model in order — zero delay between fallbacks
  const errors: string[] = []

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]
    const isLast = i === slots.length - 1

    try {
      console.log(`[AR Scanner] 🔄 Trying ${slot.provider} → ${slot.model}...`)
      const result = await slot.call(base64Jpeg)
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

      // Instantly try next — zero delay
      continue
    }
  }

  throw new Error('❌ Semua model AI sedang tidak tersedia.')
}
