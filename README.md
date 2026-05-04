# 🔭 AR Scanner — Tugas VAR UBSI

**AI-powered Augmented Reality Object Scanner** dengan deteksi objek realtime menggunakan MediaPipe + Multi-Provider AI (Gemini, OpenRouter, Together, HuggingFace).

Arahkan kamera ke objek → tunggu 3 detik stabil → AI otomatis mengenali dan menampilkan overlay AR dengan deskripsi objek.

---

## 🛠️ Tech Stack

| Layer              | Teknologi                                           |
|--------------------|-----------------------------------------------------|
| Framework          | React 18 + TypeScript + Vite                        |
| Styling            | Tailwind CSS v3 (HUD/Cyberpunk theme)               |
| State Management   | Zustand                                             |
| Kamera             | WebRTC (browser-native)                             |
| Object Detection   | MediaPipe Tasks Vision (EfficientDet-Lite0)         |
| AI Engine          | Multi-Provider: Gemini, OpenRouter, Together, HF    |
| Icons              | Lucide React                                        |

### Multi-Provider AI Fallback
1. **Gemini** `gemini-2.0-flash-lite` (Primary)
2. **Gemini** `gemini-2.0-flash` (Fallback 1)
3. **OpenRouter** `qwen/qwen3-vl-8b-instruct` (Fallback 2)
4. **OpenRouter** `google/gemma-3-12b-it:free` (Fallback 3)
5. **Together AI** `meta-llama/Llama-Vision-Free` (Fallback 4)
6. **HuggingFace** `Salesforce/blip-image-captioning-large` (Fallback 5)

---

## ⚡ Setup & Jalankan

### 1. Install dependencies
```bash
npm install
```

### 2. Buat file .env
```bash
cp .env.example .env
```

Edit file `.env`, isi API key yang tersedia:
```env
# Minimal satu API key diperlukan
VITE_GEMINI_API_KEY=your_gemini_key_here
# VITE_OPENROUTER_API_KEY=your_openrouter_key_here
# VITE_TOGETHER_API_KEY=your_together_key_here
# VITE_HF_API_KEY=your_huggingface_key_here
```

### 3. Jalankan dev server
```bash
npm run dev
```

Buka di browser: `http://localhost:5173`

> ⚠️ **Penting:** Kamera hanya bisa diakses via **HTTPS** atau **localhost**.

---

## 📱 Cara Pakai

### Mode Realtime AR (Default)
1. Izinkan akses kamera saat browser meminta
2. Arahkan kamera ke objek apapun
3. Tahan objek di depan kamera selama **3 detik**
4. MediaPipe mendeteksi objek → tracking stabilitas
5. Setelah stabil, AI otomatis mengenali objek
6. Floating AR label menampilkan hasil analisis
7. Objek hilang dari frame → overlay otomatis hilang

### Mode Manual (Fallback)
1. Tap tombol **SCAN** (lingkaran tengah)
2. Tunggu animasi scanning selesai
3. AI akan menampilkan hasil:
   - Nama objek
   - Kategori
   - Deskripsi
   - 3 Fun Facts dalam Bahasa Indonesia
   - Confidence score & provider yang digunakan
4. History scan tersimpan di bawah

---

## 🔄 Alur AR Realtime

```
Kamera Live → MediaPipe Detection (setiap 300ms)
    ↓
Object Tracking → Hitung IoU dengan frame sebelumnya
    ↓
Stabilitas Check → Objek harus bertahan 3 detik
    ↓
Trigger AI Analysis → Capture frame + panggil AI
    ↓
AR Overlay Update → Floating label + bounding box
    ↓
Object Lost → Reset tracking + hide overlay
```

---

## 🏗️ Struktur Folder

```
ar-scanner/
├── src/
│   ├── components/
│   │   ├── CameraView.tsx       # Live camera + AR overlay
│   │   ├── DetectionBox.tsx     # Bounding box overlay
│   │   ├── FloatingARLabel.tsx  # Floating label untuk hasil AI
│   │   ├── InfoCard.tsx         # Hasil scan AI
│   │   ├── ScanButton.tsx       # Tombol scan manual
│   │   └── ScanHistory.tsx      # Riwayat scan
│   ├── hooks/
│   │   ├── useCamera.ts         # WebRTC hook
│   │   ├── useObjectDetector.ts # MediaPipe ObjectDetector
│   │   └── useStableObject.ts   # Object stability tracking
│   ├── services/
│   │   └── geminiService.ts     # Multi-provider AI service
│   ├── store/
│   │   └── scanStore.ts         # Zustand state (scan + AR)
│   ├── types/
│   │   └── index.ts             # TypeScript types
│   ├── App.tsx                  # Main app component
│   ├── main.tsx
│   └── index.css                # Global styles + AR animations
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🎯 Fitur Utama

### Realtime Object Detection
- MediaPipe EfficientDet-Lite0 berjalan setiap 300ms
- Tidak setiap frame (hemat CPU/browser)
- IoU tracking untuk identifikasi objek yang sama

### Stability Tracking
- Objek harus terlihat selama 3 detik sebelum analisis
- Progress bar menunjukkan waktu stabilisasi
- Reset tracking saat objek hilang

### AR Overlay System
- **DetectionBox**: Bounding box dengan corner markers
- **FloatingARLabel**: Label dengan animasi fade-in
- Corner brackets dengan pulse animation

### Multi-Provider AI
- 6 AI provider dengan fallback otomatis
- Cooldown per-provider (bukan global)
- Scan button tidak pernah diblokir
- Provider info dalam hasil scan

---

## 🎓 Relevansi dengan Materi VAR

| Konsep VAR                  | Implementasi dalam Project                 |
|-----------------------------|--------------------------------------------|
| 3D Models & Processing      | Camera frame processing + AR overlay      |
| Augmented Reality SDKs      | MediaPipe Tasks Vision + Browser APIs      |
| Real-time overlay           | DetectionBox + FloatingARLabel animations |
| Object Recognition          | MediaPipe ObjectDetector + AI Integration  |
| AR User Interface           | HUD-style cyberpunk UI dengan scanline     |
| Hold-to-Detect Pattern      | useStableObject dengan 3 detik threshold   |
| Multi-Provider Fallback     | 6 AI providers dengan auto-switching       |