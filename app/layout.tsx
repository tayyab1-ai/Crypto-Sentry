// app/layout.tsx

import type { Metadata } from 'next'
import './globals.css'
import { SessionProvider } from './providers'

export const metadata: Metadata = {
  title: 'Bitbash Crypto Sentry',
  description: 'Real-time crypto surveillance terminal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}