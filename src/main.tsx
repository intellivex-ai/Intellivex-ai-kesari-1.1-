import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import './index.css'
import App from './App.tsx'
import AuthGuard from './components/AuthGuard.tsx'
import NotFound from './components/NotFound.tsx'
import { ChatProvider } from './context/ChatContext.tsx'
import { setTokenGetter } from './lib/api.ts'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string

if (!PUBLISHABLE_KEY) {
  console.warn('[Clerk] VITE_CLERK_PUBLISHABLE_KEY is not set. Auth will not work.')
}

// Simple path-based 404 detection (no react-router needed)
// Vercel's rewrite redirects all unknown paths to index.html,
// so we detect them here and render the 404 page.
function is404(): boolean {
  const path = window.location.pathname
  // Allow root and any hash-based navigation (Clerk uses hash routing)
  return path !== '/' && !path.startsWith('/#') && path !== ''
}

// Bridge Clerk's getToken into the API client
function TokenBridge() {
  const { getToken } = useAuth()
  setTokenGetter(() => getToken())
  return null
}

// If the path is not recognized, render the 404 page standalone
if (is404()) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <NotFound />
    </StrictMode>,
  )
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY ?? 'pk_test_placeholder'}>
        <TokenBridge />
        <ChatProvider>
          <AuthGuard>
            <App />
          </AuthGuard>
        </ChatProvider>
      </ClerkProvider>
    </StrictMode>,
  )
}
