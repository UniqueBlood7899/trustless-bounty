'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { WalletPill } from './WalletPill'

export function Navbar() {
  const pathname = usePathname()
  const links = [{ href: '/', label: 'Board' }, { href: '/create', label: 'Post Bounty' }, { href: '/my-bounties', label: 'My Bounties' }, { href: '/my-submissions', label: 'My Submissions' }]
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 h-16 bg-bg-base/80 backdrop-blur-nav border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-algo-teal text-2xl">⬡</span>
          <span className="text-text-primary">BountyChain</span>
        </Link>
        <div className="flex items-center gap-1">
          {links.map(l => (
            <Link key={l.href} href={l.href}
              className={`px-4 py-2 rounded-btn text-sm font-medium transition-colors ${pathname === l.href ? 'text-algo-teal bg-algo-teal-dim' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`}>
              {l.label}
            </Link>
          ))}
        </div>
        <WalletPill />
      </div>
    </nav>
  )
}
