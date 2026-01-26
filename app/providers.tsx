'use client' // <--- THIS IS THE MISSING PIECE. IT MUST BE HERE.

import { NextUIProvider } from '@nextui-org/react'
import { AuthProvider } from '@/context/AuthContext'

export function Providers({children}: { children: React.ReactNode }) {
  return (
    <NextUIProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </NextUIProvider>
  )
}