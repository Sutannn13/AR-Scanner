/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"Share Tech Mono"', 'monospace'],
        hud: ['Rajdhani', 'sans-serif'],
      },
      colors: {
        hud: {
          cyan:   '#00ffd5',
          purple: '#7b2fff',
          bg:     '#0a0a0f',
          card:   '#0d1117',
          border: '#1a2030',
          dim:    '#00b8a0',
        },
      },
      keyframes: {
        scanline: {
          '0%':   { top: '0%' },
          '100%': { top: '100%' },
        },
        pulseCyan: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.3' },
        },
        slideUp: {
          from: { transform: 'translateY(16px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        ping2: {
          '75%, 100%': { transform: 'scale(1.15)', opacity: '0' },
        },
        pulseBright: {
          '0%, 100%': {
            opacity: '1',
            boxShadow: '0 0 8px #00ffd5, 0 0 16px rgba(0,255,213,0.5)',
          },
          '50%': {
            opacity: '0.6',
            boxShadow: '0 0 4px #00ffd5, 0 0 8px rgba(0,255,213,0.3)',
          },
        },
        glowPulse: {
          '0%, 100%': {
            boxShadow: '0 0 10px rgba(0,255,213,0.3), 0 0 20px rgba(0,255,213,0.1)',
          },
          '50%': {
            boxShadow: '0 0 20px rgba(0,255,213,0.5), 0 0 40px rgba(0,255,213,0.2)',
          },
        },
        pulseRing: {
          '0%':   { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(1.3)', opacity: '0' },
        },
        spinSlow: {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        spinReverse: {
          from: { transform: 'rotate(360deg)' },
          to:   { transform: 'rotate(0deg)' },
        },
        radar: {
          '0%':   { transform: 'scale(0.5)', opacity: '1' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        successFlash: {
          '0%':   { opacity: '0.3' },
          '50%':  { opacity: '0.6' },
          '100%': { opacity: '0' },
        },
        bracketPulse: {
          '0%, 100%': { opacity: '0.8' },
          '50%':      { opacity: '1' },
        },
        cornerGlow: {
          '0%, 100%': { opacity: '0.5' },
          '50%':      { opacity: '1' },
        },
        scanComplete: {
          '0%':   { opacity: '0' },
          '50%':  { opacity: '1' },
          '100%': { opacity: '0' },
        },
        pulseBar: {
          '0%, 100%': { opacity: '0.3', transform: 'scaleY(1)' },
          '50%':      { opacity: '1', transform: 'scaleY(1.5)' },
        },
      },
      animation: {
        'scanline':      'scanline 2s linear infinite',
        'pulse-hud':     'pulseCyan 1.5s ease-in-out infinite',
        'slide-up':      'slideUp 0.4s ease-out forwards',
        'fade-in':       'fadeIn 0.4s ease-out forwards',
        'ping2':         'ping2 1.2s cubic-bezier(0,0,0.2,1) infinite',
        'pulse-bright':  'pulseBright 1s ease-in-out infinite',
        'glow-pulse':    'glowPulse 2s ease-in-out infinite',
        'pulse-ring':    'pulseRing 1.5s ease-out infinite',
        'spin-slow':     'spinSlow 2s linear infinite',
        'spin-reverse':  'spinReverse 1.5s linear infinite',
        'radar':         'radar 2s ease-out infinite',
        'success-flash': 'successFlash 0.8s ease-out forwards',
        'bracket-pulse': 'bracketPulse 0.5s ease-in-out infinite',
        'corner-glow':   'cornerGlow 0.8s ease-in-out infinite',
        'scan-complete': 'scanComplete 0.6s ease-out forwards',
        'pulse-bar':     'pulseBar 0.8s ease-in-out infinite',
      },
      transitionDuration: {
        '400': '400ms',
      },
    },
  },
  plugins: [],
}
