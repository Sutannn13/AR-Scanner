import { Scan, Loader2, Zap } from 'lucide-react'
import type { ScanStatus } from '../types'

interface Props {
  status: ScanStatus
  onClick: () => void
  cooldownSeconds?: number
}

export function ScanButton({ status, onClick }: Props) {
  // Button is ONLY disabled during active scan/processing
  // Cooldown NEVER blocks the button — fallback providers handle it
  const busy = status === 'scanning' || status === 'processing'

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Animated ring decoration */}
      <div className="relative">
        {/* Outer glow ring */}
        <div
          className={`absolute inset-[-8px] rounded-full border transition-opacity duration-500 ${busy ? 'opacity-0' : 'opacity-100'}`}
          style={{ border: '1px solid rgba(0,255,213,0.15)' }}
        />

        {/* Pulsing ring */}
        <div
          className={`absolute inset-[-4px] rounded-full border animate-pulse-ring transition-opacity duration-500 ${busy ? 'opacity-0' : 'opacity-60'}`}
          style={{ border: '1px solid rgba(0,255,213,0.3)' }}
        />

        <button
          onClick={onClick}
          disabled={busy}
          type="button"
          id="scan-button"
          aria-label="Scan objek"
          className={`
            scan-btn relative rounded-full flex items-center justify-center
            transition-all duration-300 outline-none
            ${busy
              ? 'bg-hud-dim/20 cursor-not-allowed'
              : 'bg-gradient-to-br from-hud-cyan/10 to-hud-purple/10 hover:from-hud-cyan/20 hover:to-hud-purple/20 cursor-pointer active:scale-95'
            }
          `}
          style={busy
            ? { border: '2px solid rgba(0,184,160,0.3)' }
            : {
                border: '2px solid #00ffd5',
                boxShadow: '0 0 20px rgba(0,255,213,0.3), 0 0 40px rgba(0,255,213,0.1), inset 0 0 20px rgba(0,255,213,0.05)',
              }
          }
        >
          {/* Inner glow effect */}
          {!busy && (
            <div
              className="absolute inset-2 rounded-full animate-glow-pulse"
              style={{ background: 'radial-gradient(circle, rgba(0,255,213,0.15) 0%, transparent 70%)' }}
            />
          )}

          {/* Icon container */}
          <div className="relative z-10 flex items-center justify-center">
            {status === 'processing' ? (
              <Loader2 size={32} className="text-hud-cyan animate-spin" />
            ) : status === 'scanning' ? (
              <div className="flex flex-col items-center gap-1">
                <Zap size={20} className="text-hud-cyan animate-pulse" />
                <div className="flex gap-0.5">
                  <div className="w-1 h-1 bg-hud-cyan rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
                  <div className="w-1 h-1 bg-hud-cyan rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1 h-1 bg-hud-cyan rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            ) : (
              <Scan size={28} className="text-hud-cyan" />
            )}
          </div>
        </button>
      </div>

      {/* Status label */}
      <div className="text-center">
        <span className={`font-mono-tech text-[11px] sm:text-xs tracking-widest transition-colors duration-300 ${
          busy ? 'text-hud-cyan/60 animate-pulse' : 'text-hud-cyan/50'
        }`}>
          {status === 'scanning' ? (
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-hud-cyan rounded-full animate-pulse" />
              SCANNING...
            </span>
          ) : status === 'processing' ? (
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-hud-purple rounded-full animate-pulse" />
              PROCESSING...
            </span>
          ) : status === 'done' ? (
            'SCAN AGAIN'
          ) : status === 'error' ? (
            <span className="text-red-400/70">RETRY SCAN</span>
          ) : (
            'TAP TO SCAN'
          )}
        </span>
      </div>

      {/* Helper text */}
      {!busy && status === 'idle' && (
        <p className="font-hud text-[10px] text-hud-cyan/30 -mt-1">
          Arahkan kamera ke objek
        </p>
      )}
    </div>
  )
}
