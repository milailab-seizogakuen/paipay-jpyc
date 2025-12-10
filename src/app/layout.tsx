import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PaiPay P2P - パインアメ送金システム',
  description: 'PainAmeトークンのP2P送金アプリ',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  manifest: '/manifest.json',
  themeColor: '#ef4444',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PaiPay P2P',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;700;900&display=swap" rel="stylesheet" />
      </head>
      <body style={{backgroundColor: 'var(--primary-yellow)'}}>
        {children}
      </body>
    </html>
  )
}
