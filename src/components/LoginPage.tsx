import { SignIn, SignUp } from '@clerk/clerk-react'
import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { IntellivexLogo } from './Logo'

export default function LoginPage() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')

  return (
    <div className="auth-page">
      {/* Animated background gradient orbs */}
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      <div className="auth-container">
        {/* Logo + branding */}
        <div className="auth-brand">
          <div className="auth-logo">
            <IntellivexLogo size={120} />
          </div>
          <div>
            <h1 className="auth-brand-name">Intellivex AI</h1>
            <p className="auth-brand-tag">Powered by Kesari 1.1</p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="auth-toggle">
          <button
            className={`auth-toggle-btn ${mode === 'sign-in' ? 'active' : ''}`}
            onClick={() => setMode('sign-in')}
          >
            Sign In
          </button>
          <button
            className={`auth-toggle-btn ${mode === 'sign-up' ? 'active' : ''}`}
            onClick={() => setMode('sign-up')}
          >
            Sign Up
          </button>
        </div>

        {/* Clerk sign-in or sign-up form */}
        <div className="auth-clerk-wrap">
          {mode === 'sign-in' ? (
            <SignIn
              appearance={{
                variables: {
                  colorPrimary: '#10b981',
                  colorBackground: '#161618',
                  colorInputBackground: '#1e1e22',
                  colorText: '#f0f0f3',
                  colorInputText: '#f0f0f3',
                  colorTextSecondary: '#a0a0b0',
                  borderRadius: '10px',
                  fontFamily: "'Sora', system-ui, sans-serif",
                },
                elements: {
                  card: 'auth-clerk-card',
                  headerTitle: 'none',
                  headerSubtitle: 'none',
                  socialButtonsBlockButton: 'auth-social-btn',
                  formButtonPrimary: 'auth-submit-btn',
                  footerActionLink: 'auth-link',
                  identityPreview: 'auth-identity',
                },
              }}
              routing="hash"
            />
          ) : (
            <SignUp
              appearance={{
                variables: {
                  colorPrimary: '#10b981',
                  colorBackground: '#161618',
                  colorInputBackground: '#1e1e22',
                  colorText: '#f0f0f3',
                  colorInputText: '#f0f0f3',
                  colorTextSecondary: '#a0a0b0',
                  borderRadius: '10px',
                  fontFamily: "'Sora', system-ui, sans-serif",
                },
                elements: {
                  card: 'auth-clerk-card',
                  headerTitle: 'none',
                  headerSubtitle: 'none',
                  socialButtonsBlockButton: 'auth-social-btn',
                  formButtonPrimary: 'auth-submit-btn',
                  footerActionLink: 'auth-link',
                },
              }}
              routing="hash"
            />
          )}
        </div>

        {/* Footer */}
        <p className="auth-footer">
          By continuing, you agree to Intellivex AI's{' '}
          <span className="auth-link">Terms of Service</span> and{' '}
          <span className="auth-link">Privacy Policy</span>.
        </p>
      </div>
    </div>
  )
}
