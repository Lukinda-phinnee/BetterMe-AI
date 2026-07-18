import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.scss'
import { ConfirmProvider } from '../components/confirm-provider'
import { ToastProvider } from '../components/toast-provider'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
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
      <body className={plusJakartaSans.className}>
        <ConfirmProvider>
          <ToastProvider>{children}</ToastProvider>
        </ConfirmProvider>
      </body>
    </html>
  )
}
