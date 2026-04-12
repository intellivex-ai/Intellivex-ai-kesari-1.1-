import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import './index.css'
import App from './App.tsx'
import AuthGuard from './components/AuthGuard.tsx'
import { ChatProvider } from './context/ChatContext.tsx'
import { setTokenGetter } from './lib/api.ts'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string

if (!PUBLISHABLE_KEY) {
  console.warn('[Clerk] VITE_CLERK_PUBLISHABLE_KEY is not set. Auth will not work.')
}

// Bridge Clerk's getToken into the API client
function TokenBridge() {
  const { getToken } = useAuth()
  setTokenGetter(() => getToken())
  return null
}

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
