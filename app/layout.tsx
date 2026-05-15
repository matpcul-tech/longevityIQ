import type { Metadata } from 'next'
import { Cormorant_Garamond, Jost, Syncopate } from 'next/font/google'
import Footer from '@/components/Footer'
import './globals.css'

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})

const ui = Syncopate({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-ui',
  display: 'swap',
})

const body = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'LongevityIQ',
  description:
    'Luxury big-city longevity healthcare for the sovereign and urban communities.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${ui.variable} ${body.variable}`}>
      <body className="min-h-screen bg-ink text-bone antialiased">
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  )
}
