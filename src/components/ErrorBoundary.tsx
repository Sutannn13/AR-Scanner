// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT ErrorBoundary
// Menangkap error runtime dan menampilkan pesan error yang aman.
// Mencegah blank page saat terjadi crash.
// ─────────────────────────────────────────────────────────────────────────────

import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] ❌ Runtime error:', error)
    console.error('[ErrorBoundary] 📍 Stack:', errorInfo.componentStack)
  }

  handleReload = () => {
    console.log('[ErrorBoundary] 🔄 Reloading app...')
    window.location.reload()
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(10, 10, 20, 0.95)',
            zIndex: 9999,
            padding: '20px',
            fontFamily: 'monospace',
          }}
        >
          <div
            style={{
              maxWidth: '500px',
              padding: '24px',
              background: 'rgba(255, 50, 50, 0.1)',
              border: '1px solid rgba(255, 100, 100, 0.3)',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '32px',
                marginBottom: '16px',
              }}
            >
              ⚠️
            </div>
            <h2
              style={{
                color: '#ff6b6b',
                fontSize: '18px',
                marginBottom: '12px',
                fontFamily: 'monospace',
              }}
            >
              TERJADI ERROR RUNTIME
            </h2>
            <p
              style={{
                color: 'rgba(255, 150, 150, 0.8)',
                fontSize: '13px',
                marginBottom: '16px',
                fontFamily: 'monospace',
                wordBreak: 'break-word',
                background: 'rgba(0,0,0,0.3)',
                padding: '12px',
                borderRadius: '6px',
                maxHeight: '150px',
                overflow: 'auto',
              }}
            >
              {this.state.error.message}
            </p>
            <p
              style={{
                color: 'rgba(255, 200, 200, 0.5)',
                fontSize: '11px',
                marginBottom: '20px',
                fontFamily: 'monospace',
              }}
            >
              Cek console browser untuk detail error.
            </p>
            <button
              onClick={this.handleReload}
              style={{
                padding: '10px 24px',
                background: 'rgba(0, 255, 213, 0.1)',
                border: '1px solid rgba(0, 255, 213, 0.4)',
                borderRadius: '6px',
                color: '#00ffd5',
                fontFamily: 'monospace',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(0, 255, 213, 0.2)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(0, 255, 213, 0.1)'
              }}
            >
              🔄 RELOAD APLIKASI
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}