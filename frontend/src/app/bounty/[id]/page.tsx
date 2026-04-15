'use client'
import useSWR from 'swr'
import { fetchBounty, type Bounty } from '@/lib/api'
import { explorerTxUrl, truncateAddress } from '@/lib/algorand'
import { useWallet } from '@/context/WalletContext'
import Link from 'next/link'

const CAT_COLORS: Record<string, string> = { Frontend: 'bg-blue-500/10 text-blue-400 border-blue-500/20', Backend: 'bg-green-500/10 text-green-400 border-green-500/20', 'Smart Contracts': 'bg-purple-500/10 text-purple-400 border-purple-500/20', 'Data Tasks': 'bg-orange-500/10 text-orange-400 border-orange-500/20', General: 'bg-algo-teal/10 text-algo-teal border-algo-teal/20' }
const STATUS_COLORS: Record<string, string> = { open: 'bg-green-500/10 text-green-400 border-green-500/20', won: 'bg-algo-teal/10 text-algo-teal border-algo-teal/20', expired: 'bg-white/5 text-text-muted border-white/10', refunded: 'bg-orange-500/10 text-orange-400 border-orange-500/20' }

function countdown(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000), m = Math.floor((diff % 3600000) / 60000)
  return d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function BountyDetailPage({ params }: { params: { id: string } }) {
  const { isConnected, connect } = useWallet()
  const { data, error, isLoading } = useSWR(params.id ? `bounty-${params.id}` : null, () => fetchBounty(params.id))

  if (isLoading) return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="skeleton h-8 w-32" /><div className="skeleton h-10 w-3/4" /><div className="skeleton h-40 w-full" />
        </div>
        <div className="glass-card p-6 h-48"><div className="skeleton h-12 w-full mb-4" /><div className="skeleton h-6 w-2/3" /></div>
      </div>
    </div>
  )

  if (error || !data?.data) return (
    <div className="max-w-7xl mx-auto px-6 py-10 text-center">
      <p className="text-color-error mb-4">Bounty not found.</p>
      <Link href="/" className="text-algo-teal text-sm hover:underline">← Back to Board</Link>
    </div>
  )

  const b: Bounty = data.data
  const isOpen = b.status === 'open'
  const deadlineDate = new Date(b.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <Link href="/" className="text-text-muted text-sm hover:text-algo-teal transition-colors mb-6 inline-flex items-center gap-1">← Back to Board</Link>
      <div className="grid lg:grid-cols-3 gap-8 mt-4">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${CAT_COLORS[b.category] ?? CAT_COLORS.General}`}>{b.category}</span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${STATUS_COLORS[b.status] ?? STATUS_COLORS.open}`}>{b.status}</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-4">{b.title}</h1>
          <div className="glass-card p-6 mb-6">
            <h2 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">Description</h2>
            <p className="text-text-primary text-sm leading-relaxed whitespace-pre-wrap">{b.description}</p>
          </div>
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wider">Details</h2>
            <div className="space-y-3">
              {[['Posted by', <span className="font-mono text-sm">{truncateAddress(b.posterAddress, 8, 6)}</span>], ['Deadline', deadlineDate], ['Contract (App ID)', <span className="text-algo-teal font-mono text-sm">{b.appId}</span>], ['Creation Tx', <a href={explorerTxUrl(b.creationTxId)} target="_blank" rel="noopener noreferrer" className="text-algo-teal font-mono text-xs hover:underline">{b.creationTxId !== 'pending' ? `${b.creationTxId.slice(0, 16)}... ↗` : 'pending'}</a>]].map(([label, value], i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-border-glass last:border-0">
                  <span className="text-text-muted text-sm">{label as string}</span>
                  <span className="text-text-primary">{value as React.ReactNode}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div className="glass-card p-6 sticky top-24">
            <div className="text-center mb-6 pb-6 border-b border-border-glass">
              <p className="text-text-muted text-xs uppercase tracking-wider mb-2">Reward</p>
              <p className="text-algo-teal text-4xl font-bold">⬡ {b.rewardAlgo.toFixed(1)}</p>
              <p className="text-text-muted text-sm mt-1">ALGO</p>
            </div>
            <div className="text-center mb-6">
              <p className="text-text-muted text-xs uppercase tracking-wider mb-2">{isOpen ? 'Time Remaining' : 'Status'}</p>
              <p className={`text-lg font-semibold ${isOpen ? 'text-text-primary' : 'text-text-muted'}`}>{isOpen ? `⏱ ${countdown(b.deadline)}` : b.status}</p>
            </div>
            {isOpen ? (
              isConnected ? (
                <button disabled className="w-full py-3 bg-algo-teal/20 text-algo-teal font-semibold rounded-btn border border-algo-teal/30 text-sm cursor-not-allowed">
                  Submit Solution<span className="block text-xs font-normal opacity-60 mt-0.5">(Phase 3 — coming soon)</span>
                </button>
              ) : (
                <button onClick={connect} className="w-full py-3 bg-algo-teal text-bg-base font-semibold rounded-btn hover:bg-algo-teal/90 transition-colors text-sm">
                  Connect Wallet to Submit
                </button>
              )
            ) : (
              <div className="w-full py-3 text-center text-text-muted text-sm capitalize">Bounty {b.status}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
