import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/context/AppContext'
import { SessionProvider } from '@/components/layout/SessionProvider'
import { LocationProvider } from '@/context/LocationContext'
import { AutoCheckIn } from '@/components/AutoCheckIn'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Beat the Kingz',
  description: 'Location-based sports competition platform',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <LocationProvider>
            <AppProvider>
              <AutoCheckIn />
              {children}
            </AppProvider>
          </LocationProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
