import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface Props { children: ReactNode }
interface EState { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, EState> {
  state: EState = { hasError: false, message: '' }

  static getDerivedStateFromError(err: Error): EState {
    return { hasError: true, message: err.message }
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', err, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-page">
          <div className="error-icon">⚡</div>
          <h2 className="error-title">Something went wrong</h2>
          <p className="error-text">
            {this.state.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="error-btn"
          >
            Reload app
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
