import type { Metadata } from 'next'
import './globals.css'
import { WalletProvider } from '@/context/WalletContext'
import { ToastProvider } from '@/context/ToastContext'
import { Navbar } from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'BountyChain — Decentralized Task Bounties on Algorand',
  description: 'AI-verified micro-bounties on Algorand. Post tasks, earn ALGO.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg-base text-text-primary">
        <WalletProvider>
          <ToastProvider>
            <Navbar />
            <main className="pt-16 min-h-screen">{children}</main>
          </ToastProvider>
        </WalletProvider>
      </body>
    </html>
  )
}
