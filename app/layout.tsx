import type { Metadata } from 'next'
import { Noto_Serif_KR, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const notoSerif = Noto_Serif_KR({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-noto-serif',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-jetbrains',
})

export const metadata: Metadata = {
  title: '주식 기초 — 매일 한 레슨',
  description: '매일 아침 6시, 전문가급 주식 지식이 업데이트됩니다',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${notoSerif.variable} ${jetbrains.variable}`}>
        {children}
      </body>
    </html>
  )
}
