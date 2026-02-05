import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/lib/providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: {
    default: 'Travel Photos',
    template: '%s | Travel Photos',
  },
  description:
    'A photography portfolio showcasing travel adventures and beautiful moments captured around the world.',
  keywords: ['photography', 'travel', 'portfolio', 'photos', 'adventure'],
  authors: [{ name: 'Travel Photos' }],
  creator: 'Travel Photos',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Travel Photos',
    title: 'Travel Photos',
    description:
      'A photography portfolio showcasing travel adventures and beautiful moments captured around the world.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Travel Photos',
    description:
      'A photography portfolio showcasing travel adventures and beautiful moments captured around the world.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
