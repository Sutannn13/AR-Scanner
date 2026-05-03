import { X, Tag, Zap, Eye, Clock, Sparkles, Bot } from 'lucide-react'
import type { ScanResult } from '../types'

interface Props {
  result: ScanResult
  onClose: () => void
}

const CATEGORY_COLORS: Record<string, string> = {
  Elektronik: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400',
  Makanan: 'from-orange-500/20 to-red-500/20 border-orange-500/30 text-orange-400',
  Alam: 'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400',
  Hewan: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30 text-yellow-400',
  Kendaraan: 'from-purple-500/20 to-violet-500/20 border-purple-500/30 text-purple-400',
  Furnitur: 'from-rose-500/20 to-pink-500/20 border-rose-500/30 text-rose-400',
  Peralatan: 'from-slate-500/20 to-gray-500/20 border-slate-500/30 text-slate-400',
  Buku: 'from-indigo-500/20 to-blue-500/20 border-indigo-500/30 text-indigo-400',
  Orang: 'from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-400',
  Lainnya: 'from-hud-cyan/20 to-hud-purple/20 border-hud-cyan/30 text-hud-cyan',
}

export function InfoCard({ result, onClose }: Props) {
  const pct = Math.round(result.confidence * 100)
  const categoryStyle = CATEGORY_COLORS[result.category] || CATEGORY_COLORS.Lainnya

  return (
    <div
      className="animate-slide-up rounded-xl sm:rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, rgba(13,17,23,0.98) 0%, rgba(10,10,15,0.98) 100%)',
        border: '1px solid rgba(0,255,213,0.2)',
        boxShadow: '0 0 30px rgba(0,255,213,0.1), 0 0 60px rgba(0,255,213,0.05), inset 0 1px 0 rgba(0,255,213,0.1)',
      }}
    >
      {/* ── Header with gradient ── */}
      <div
        className="px-4 py-3 sm:px-5 sm:py-4"
        style={{
          background: 'linear-gradient(135deg, rgba(0,255,213,0.08) 0%, rgba(123,47,255,0.05) 100%)',
          borderBottom: '1px solid rgba(0,255,213,0.1)',
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Sparkle icon */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center animate-glow-pulse"
              style={{ background: 'rgba(0,255,213,0.1)', border: '1px solid rgba(0,255,213,0.2)' }}
            >
              <Sparkles size={18} className="text-hud-cyan" />
            </div>

            <div className="space-y-1">
              {/* Category badge */}
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r ${categoryStyle}`}>
                <Tag size={9} className="opacity-70" />
                <span className="font-mono-tech text-[9px] tracking-widest uppercase">
                  {result.category}
                </span>
              </div>

              {/* Object name */}
              <h2 className="font-hud font-bold text-xl sm:text-2xl text-white leading-tight glow-cyan">
                {result.objectName}
              </h2>
            </div>
          </div>

          {/* Thumbnail + close */}
          <div className="flex items-start gap-2">
            <img
              src={result.imageDataUrl}
              alt={result.objectName}
              className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-lg border border-hud-border/50"
            />
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-hud-cyan/30 hover:text-hud-cyan hover:bg-hud-cyan/10 transition-all duration-200"
              aria-label="Tutup"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 py-4 sm:px-5 sm:py-5 space-y-5">
        {/* Confidence Bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Eye size={11} className="text-hud-cyan/50" />
              <span className="font-mono-tech text-[10px] tracking-widest text-hud-cyan/50">
                CONFIDENCE
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono-tech text-sm text-hud-cyan font-bold">
                {pct}%
              </span>
              {/* Confidence quality indicator */}
              <span className={`font-mono-tech text-[8px] px-1.5 py-0.5 rounded ${
                pct >= 90 ? 'bg-green-500/20 text-green-400' :
                pct >= 70 ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {pct >= 90 ? 'HIGH' : pct >= 70 ? 'MED' : 'LOW'}
              </span>
            </div>
          </div>
          <div className="h-2 bg-hud-border/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${pct}%`,
                background: pct >= 90
                  ? 'linear-gradient(90deg, #00ffd5, #00ff88)'
                  : pct >= 70
                  ? 'linear-gradient(90deg, #00ffd5, #7b2fff)'
                  : 'linear-gradient(90deg, #ff4444, #ff6b6b)',
                boxShadow: `0 0 10px ${pct >= 90 ? 'rgba(0,255,213,0.6)' : pct >= 70 ? 'rgba(0,255,213,0.4)' : 'rgba(255,68,68,0.6)'}`,
              }}
            />
          </div>
        </div>

        {/* Description */}
        <div className="relative">
          <div
            className="absolute -left-1 top-0 bottom-0 w-1 rounded-full"
            style={{ background: 'linear-gradient(180deg, #00ffd5, #7b2fff)' }}
          />
          <p className="font-hud text-white/70 text-sm sm:text-base leading-relaxed pl-3">
            {result.description}
          </p>
        </div>

        {/* Fun Facts */}
        {result.funFacts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap size={11} className="text-hud-purple" />
              <span className="font-mono-tech text-[10px] tracking-widest text-hud-purple">
                FUN_FACTS
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-hud-purple/30 to-transparent" />
            </div>

            <div className="grid gap-2">
              {result.funFacts.map((fact, i) => (
                <div
                  key={i}
                  className="flex gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-hud-cyan/5 group"
                  style={{
                    background: 'rgba(0,255,213,0.02)',
                    border: '1px solid rgba(0,255,213,0.05)',
                  }}
                >
                  <span
                    className="font-mono-tech flex-shrink-0 text-hud-cyan w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
                    style={{
                      background: 'rgba(0,255,213,0.1)',
                      textShadow: '0 0 8px rgba(0,255,213,0.5)',
                      boxShadow: '0 0 10px rgba(0,255,213,0.2)',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="font-hud text-sm text-white/65 leading-relaxed group-hover:text-white/80 transition-colors">
                    {fact}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          className="flex flex-wrap justify-between items-center gap-2 pt-3"
          style={{ borderTop: '1px solid rgba(0,255,213,0.08)' }}
        >
          <div className="flex items-center gap-2">
            <Clock size={9} className="text-hud-cyan/30" />
            <span className="font-mono-tech text-[9px] text-hud-cyan/25 tracking-widest">
              {result.timestamp.toLocaleString('id-ID', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          </div>

          {/* AI Provider Badge */}
          {result.providerUsed && (
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-mono-tech text-[8px] tracking-wider ${
                result.providerUsed === 'Gemini'
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25'
                  : result.providerUsed === 'OpenRouter'
                  ? 'bg-violet-500/15 text-violet-400 border border-violet-500/25'
                  : result.providerUsed === 'Together'
                  ? 'bg-pink-500/15 text-pink-400 border border-pink-500/25'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
              }`}
            >
              <Bot size={8} />
              <span>{result.providerUsed.toUpperCase()}</span>
            </div>
          )}

          <span className="font-mono-tech text-[9px] text-hud-cyan/25 tracking-widest">
            ID: {result.id.slice(0, 8).toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  )
}
