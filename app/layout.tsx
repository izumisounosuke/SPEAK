import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI英会話アプリ',
  description: 'Gemini APIを使用したAI英会話アプリ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}






