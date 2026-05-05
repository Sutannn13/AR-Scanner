import { Trash2, Clock, ChevronRight } from 'lucide-react'
import type { ScanResult } from '../types'
import { useScanStore } from '../store/scanStore'

interface Props {
  history: ScanResult[]
  hidden?: boolean // Hide during active AR session
}

export function ScanHistory({ history, hidden = false }: Props) {
  const { clearHistory, setCurrent, current } = useScanStore()

  // Don't render during active AR session
  if (hidden || history.length === 0) return null

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,255,213,0.1)' }}>
            <Clock size={11} className="text-hud-cyan" />
          </div>
          <span className="font-mono-tech text-[10px] tracking-widest text-hud-cyan/50">
            SCAN_HISTORY
          </span>
          <span
            className="font-mono-tech text-[9px] px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(0,255,213,0.1)', color: 'rgba(0,255,213,0.6)' }}
          >
            {history.length}
          </span>
        </div>
        <button
          onClick={clearHistory}
          className="flex items-center gap-1 font-mono-tech text-[9px] tracking-widest text-red-400/40 hover:text-red-400/80 hover:bg-red-400/10 px-2 py-1 rounded transition-all duration-200"
        >
          <Trash2 size={9} />
          CLEAR
        </button>
      </div>

      {/* History Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {history.map((item, index) => (
          <button
            key={item.id}
            onClick={() => setCurrent(item)}
            className={`
              group relative rounded-xl overflow-hidden text-left
              transition-all duration-300 transform hover:scale-[1.02]
              ${current?.id === item.id
                ? 'ring-2 ring-hud-cyan shadow-card-glow'
                : 'hover:ring-1 hover:ring-hud-cyan/30'
              }
            `}
            style={{
              background: 'rgba(13,17,23,0.9)',
              border: current?.id === item.id
                ? '1px solid rgba(0,255,213,0.3)'
                : '1px solid rgba(0,255,213,0.08)',
            }}
          >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={item.imageDataUrl}
                alt={item.objectName}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

              {/* Object name */}
              <div className="absolute inset-x-0 bottom-0 p-2">
                <span className="font-hud font-semibold text-xs text-white leading-tight line-clamp-2">
                  {item.objectName}
                </span>
              </div>

              {/* Confidence badge */}
              <div
                className="absolute top-2 right-2 px-1 py-0.5 rounded text-[8px] font-mono-tech font-bold"
                style={{
                  background: item.confidence >= 0.9
                    ? 'rgba(0,255,213,0.2)'
                    : item.confidence >= 0.7
                    ? 'rgba(123,47,255,0.2)'
                    : 'rgba(255,100,100,0.2)',
                  color: item.confidence >= 0.9
                    ? '#00ffd5'
                    : item.confidence >= 0.7
                    ? '#a855f7'
                    : '#ff6464',
                }}
              >
                {Math.round(item.confidence * 100)}%
              </div>

              {/* Active indicator */}
              {current?.id === item.id && (
                <div className="absolute inset-0 border-2 border-hud-cyan/50 rounded-xl animate-pulse" />
              )}
            </div>

            {/* Footer */}
            <div
              className="px-2 py-1.5 flex items-center justify-between"
              style={{ borderTop: '1px solid rgba(0,255,213,0.05)' }}
            >
              <span className="font-mono-tech text-[8px] text-hud-cyan/30">
                {item.timestamp.toLocaleTimeString('en-US', { hour12: false })}
              </span>
              <ChevronRight size={10} className="text-hud-cyan/30 group-hover:text-hud-cyan/60 transition-colors" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}