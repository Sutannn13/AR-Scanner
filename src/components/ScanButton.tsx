import { Scan, Loader2, Zap, Target, RotateCcw } from 'lucide-react'
import type { ARButtonStatus } from '../App'

interface Props {
  arButtonStatus: ARButtonStatus
  onClick: () => void
  disabled?: boolean
}

const BUTTON_CONFIG: Record<ARButtonStatus, {
  icon: React.ReactNode
  label: string
  helper: string | null
}> = {
  idle: {
    icon: <Target size={26} className="text-hud-cyan" />,
    label: 'START AR SCAN',
    helper: 'Tekan untuk mulai AR scan',
  },
  armed: {
    icon: <Target size={26} className="text-hud-cyan animate-pulse" />,
    label: 'AR MEDIUM ACTIVE',
    helper: 'Mendeteksi objek...',
  },
  waiting: {
    icon: (
      <div className="flex flex-col items-center gap-1.5">
        <Zap size={20} className="text-hud-cyan animate-pulse" />
        <div className="flex gap-0.5">
          <div className="w-1 h-1 bg-hud-cyan rounded-full animate-bounce-dot-1" />
          <div className="w-1 h-1 bg-hud-cyan rounded-full animate-bounce-dot-2" />
          <div className="w-1 h-1 bg-hud-cyan rounded-full animate-bounce-dot-3" />
        </div>
      </div>
    ),
    label: 'HOLD OBJECT...',
    helper: 'Tahan kamera pada objek 3 detik',
  },
  analyzing: {
    icon: <Loader2 size={28} className="text-hud-purple animate-spin" />,
    label: 'ANALYZING...',
    helper: 'AI sedang menganalisis...',
  },
  done: {
    icon: <RotateCcw size={26} className="text-hud-cyan" />,
    label: 'SCAN AGAIN',
    helper: 'Tekan untuk scan objek lain',
  },
  error: {
    icon: <Scan size={26} className="text-red-400" />,
    label: 'RETRY',
    helper: null,
  },
}

export function ScanButton({ arButtonStatus, onClick, disabled }: Props) {
  const config = BUTTON_CONFIG[arButtonStatus]
  const busy = arButtonStatus === 'analyzing' || arButtonStatus === 'armed'
  const isDisabled = disabled || busy

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Animated ring decoration */}
      <div className="relative">
        {/* Outer glow ring */}
        <div
          className={`absolute inset-[-8px] rounded-full border transition-opacity duration-500 ${isDisabled ? 'opacity-0' : 'opacity-100'}`}
          style={{ border: '1px solid rgba(0,255,213,0.15)' }}
        />

        {/* Pulsing ring - only when armed/waiting */}
        {(arButtonStatus === 'armed' || arButtonStatus === 'waiting') && (
          <div
            className="absolute inset-[-4px] rounded-full border animate-pulse-ring"
            style={{ border: '1px solid rgba(0,255,213,0.4)' }}
          />
        )}

        <button
          onClick={onClick}
          disabled={isDisabled}
          type="button"
          id="scan-button"
          aria-label={config.label}
          className={`
            scan-btn relative rounded-full flex items-center justify-center
            transition-all duration-300 outline-none
            ${isDisabled
              ? 'bg-hud-dim/20 cursor-not-allowed'
              : 'bg-gradient-to-br from-hud-cyan/10 to-hud-purple/10 hover:from-hud-cyan/20 hover:to-hud-purple/20 cursor-pointer active:scale-95'
            }
          `}
          style={isDisabled
            ? { border: '2px solid rgba(0,184,160,0.3)' }
            : {
                border: '2px solid #00ffd5',
                boxShadow: '0 0 20px rgba(0,255,213,0.3), 0 0 40px rgba(0,255,213,0.1), inset 0 0 20px rgba(0,255,213,0.05)',
              }
          }
        >
          {/* Inner glow effect */}
          {!isDisabled && (
            <div
              className="absolute inset-2 rounded-full animate-glow-pulse"
              style={{ background: 'radial-gradient(circle, rgba(0,255,213,0.15) 0%, transparent 70%)' }}
            />
          )}

          {/* Icon container */}
          <div className="relative z-10 flex items-center justify-center min-w-[36px] min-h-[36px]">
            {config.icon}
          </div>
        </button>
      </div>

      {/* Status label */}
      <div className="text-center">
        <span className={`font-mono-tech text-[11px] sm:text-xs tracking-widest transition-colors duration-300 ${
          busy ? 'text-hud-cyan/60 animate-pulse' : arButtonStatus === 'error' ? 'text-red-400/70' : 'text-hud-cyan/50'
        }`}>
          {config.label}
        </span>
      </div>

      {/* Helper text */}
      {isDisabled ? (
        disabled && (
          <p className="font-hud text-[10px] text-yellow-400/50 -mt-1">
            Izinkan akses kamera terlebih dahulu
          </p>
        )
      ) : (
        config.helper && (
          <p className="font-hud text-[10px] text-hud-cyan/30 -mt-1">
            {config.helper}
          </p>
        )
      )}
    </div>
  )
}