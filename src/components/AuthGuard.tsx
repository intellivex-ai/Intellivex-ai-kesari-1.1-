import { SignedIn, SignedOut } from '@clerk/clerk-react'
import LoginPage from './LoginPage'
import type { ReactNode } from 'react'

export default function AuthGuard({ children }: { children: ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><LoginPage /></SignedOut>
    </>
  )
}
