import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.scss'

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
  weight: '400',
})

export const metadata: Metadata = {
  title: 'BetterMe - AI Growth Engine',
  description: 'An AI growth engine for tasks, routines, and habits',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={montserrat.className}>{children}</body>
    </html>
  )
}
