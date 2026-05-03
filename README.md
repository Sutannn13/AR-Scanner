# 🔭 AR Scanner — Tugas VAR UBSI

**AI-powered Augmented Reality Object Scanner** menggunakan Claude AI (Vision) + React + TypeScript.

Arahkan kamera ke objek apapun → tap Scan → Claude AI mengenali dan mendeskripsikannya dengan overlay AR.

---

## 🛠️ Tech Stack

| Layer       | Teknologi                            |
|-------------|--------------------------------------|
| Framework   | React 18 + TypeScript + Vite         |
| Styling     | Tailwind CSS v3 (HUD/Cyberpunk theme)|
| State       | Zustand                              |
| Kamera      | WebRTC (browser-native)              |
| AI Engine   | Claude Sonnet via Anthropic API      |
| Icons       | Lucide React                         |

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

Edit file `.env`, isi API key kamu:
```
VITE_ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
```

> **Dapat API key di:** https://console.anthropic.com/

### 3. Jalankan dev server
```bash
npm run dev
```

Buka di browser: `http://localhost:5173`

> ⚠️ **Penting:** Kamera hanya bisa diakses via **HTTPS** atau **localhost**.

---

## 📱 Cara Pakai

1. Izinkan akses kamera saat browser meminta
2. Arahkan kamera ke objek apapun
3. Tap tombol **SCAN** (lingkaran tengah)
4. Tunggu animasi scanning selesai
5. Claude AI akan menampilkan:
   - Nama objek
   - Kategori
   - Deskripsi
   - 3 Fun Facts dalam Bahasa Indonesia
   - Confidence score
6. History scan tersimpan di bawah — tap thumbnail untuk melihat lagi

---

## 🏗️ Struktur Folder

```
ar-scanner/
├── src/
│   ├── components/
│   │   ├── CameraView.tsx    # Live camera + AR overlay
│   │   ├── InfoCard.tsx      # Hasil scan AI
│   │   ├── ScanButton.tsx    # Tombol scan
│   │   └── ScanHistory.tsx   # Riwayat scan
│   ├── hooks/
│   │   └── useCamera.ts      # WebRTC hook
│   ├── services/
│   │   └── claudeService.ts  # Anthropic API integration
│   ├── store/
│   │   └── scanStore.ts      # Zustand state
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
├── package.json
└── README.md
```

---

## 🎓 Relevansi dengan Materi VAR Pertemuan 4

| Konsep VAR              | Implementasi dalam Project           |
|-------------------------|--------------------------------------|
| 3D Models & Processing  | Camera frame processing + AR overlay |
| Augmented Reality SDKs  | Browser WebRTC + Canvas API          |
| Real-time overlay       | Scanning animation + info card       |
| Object Recognition      | Claude Vision AI                     |
| AR User Interface       | HUD-style cyberpunk UI               |
