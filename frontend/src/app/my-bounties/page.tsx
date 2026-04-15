'use client'
import { useEffect, useState } from 'react'
import { useWallet } from '@/context/WalletContext'
import { fetchPosterBounties, type PosterBounty, type Submission } from '@/lib/api'
import { explorerTxUrl, truncateAddress } from '@/lib/algorand'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-green-500/10 text-green-400 border-green-500/20',
  won: 'bg-algo-teal/10 text-algo-teal border-algo-teal/20',
  expired: 'bg-white/5 text-text-muted border-white/10',
  refunded: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
}
const SUB_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  approved: 'bg-algo-teal/10 text-algo-teal border-algo-teal/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  closed: 'bg-white/5 text-text-muted border-white/10',
}

function SubmissionRow({ sub, isWinner }: { sub: Submission; isWinner: boolean }) {
  const [open, setOpen] = useState(isWinner)
  return (
    <div className={`border-b border-border-glass last:border-0 ${isWinner ? 'bg-algo-teal/[0.03]' : ''}`}>
      <div className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-white/[0.02]" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-3 min-w-0">
          {isWinner && <span className="text-algo-teal text-xs font-bold shrink-0">⬡ WINNER</span>}
          <span className="font-mono text-text-secondary text-xs">{truncateAddress(sub.solverAddress, 8, 6)}</span>
          <p className="text-text-muted text-xs hidden sm:block truncate max-w-xs">{sub.text.slice(0, 60)}{sub.text.length > 60 ? '…' : ''}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${SUB_STATUS_COLORS[sub.status] ?? SUB_STATUS_COLORS.pending}`}>
            {sub.status === 'pending' && <span className="inline-block w-2 h-2 rounded-full border-2 border-current border-t-transparent animate-spin mr-1" />}
            {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
          </span>
          <span className="text-text-muted text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </div>
      {open && (
        <div className="px-5 pb-4 space-y-3">
          <div>
            <p className="text-text-muted text-xs mb-1 font-medium uppercase tracking-wider">Solution</p>
            <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">{sub.text}</p>
          </div>
          {sub.url && (
            <a href={sub.url} target="_blank" rel="noopener noreferrer" className="text-algo-teal text-xs hover:underline inline-block">{sub.url} ↗</a>
          )}
          {sub.aiScore !== null && sub.aiScore !== undefined && (
            <div>
              <p className="text-text-muted text-xs mb-1.5 font-medium uppercase tracking-wider">AI Score</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white/5 rounded-full h-1.5">
                  <div className="bg-algo-teal h-1.5 rounded-full" style={{ width: `${Math.round(sub.aiScore * 100)}%` }} />
                </div>
                <span className="text-algo-teal text-xs font-mono">{Math.round(sub.aiScore * 100)}%</span>
              </div>
              {sub.aiRationale && <p className="text-text-secondary text-sm leading-relaxed mt-2">{sub.aiRationale}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BountyRow({ bounty }: { bounty: PosterBounty }) {
  const [expanded, setExpanded] = useState(false)
  const submissionCount = bounty.submissions.length
  const deadlineDate = new Date(bounty.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-start justify-between px-5 py-4 cursor-pointer hover:bg-white/[0.02]" onClick={() => setExpanded(e => !e)}>
        <div className="flex-1 min-w-0 mr-4">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[bounty.status] ?? STATUS_COLORS.open}`}>{bounty.status}</span>
            <span className="text-text-muted text-xs">⏱ {deadlineDate}</span>
          </div>
          <Link href={`/bounty/${bounty._id}`} onClick={e => e.stopPropagation()}
            className="text-text-primary font-semibold text-base hover:text-algo-teal transition-colors line-clamp-1 block">
            {bounty.title}
          </Link>
          {bounty.payoutTxId && (
            <a href={explorerTxUrl(bounty.payoutTxId)} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-algo-teal text-xs hover:underline mt-0.5 inline-block">
              Tx: {bounty.payoutTxId.slice(0, 12)}… ↗
            </a>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-algo-teal font-bold text-sm">⬡ {bounty.rewardAlgo.toFixed(1)}</span>
          <span className="text-text-muted text-xs">{submissionCount} submission{submissionCount !== 1 ? 's' : ''}</span>
          <span className="text-text-muted text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border-glass">
          {submissionCount === 0 ? (
            <p className="text-text-muted text-sm px-5 py-4">No submissions yet.</p>
          ) : (
            bounty.submissions.map(s => (
              <SubmissionRow key={s._id} sub={s} isWinner={s._id === bounty.winnerSubmissionId} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function MyBountiesPage() {
  const { address, isConnected, connect } = useWallet()
  const [bounties, setBounties] = useState<PosterBounty[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!address) return
    setIsLoading(true)
    fetchPosterBounties(address)
      .then(r => setBounties(r.data))
      .catch(() => setError('Failed to load your bounties'))
      .finally(() => setIsLoading(false))
  }, [address])

  if (!isConnected) return (
    <div className="max-w-7xl mx-auto px-6 py-20 text-center">
      <div className="text-4xl mb-4">⬡</div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">My Bounties</h1>
      <p className="text-text-secondary text-sm mb-8">Connect your wallet to view your posted bounties.</p>
      <button onClick={connect} className="px-6 py-3 bg-algo-teal text-bg-base font-semibold rounded-btn hover:bg-algo-teal/90 transition-colors">Connect Wallet</button>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">My Bounties</h1>
          <p className="text-text-secondary text-sm mt-1">Bounties you&apos;ve posted — expand to review submissions.</p>
        </div>
        <Link href="/create" className="px-4 py-2 bg-algo-teal text-bg-base font-semibold rounded-btn text-sm hover:bg-algo-teal/90 transition-colors">+ Post New</Link>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card p-5">
              <div className="skeleton h-4 w-16 mb-2" /><div className="skeleton h-5 w-64 mb-1" /><div className="skeleton h-3 w-32" />
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-color-error text-sm">{error}</p>}

      {!isLoading && !error && bounties.length === 0 && (
        <div className="text-center py-16">
          <p className="text-text-secondary mb-6">You haven&apos;t posted any bounties yet.</p>
          <Link href="/create" className="px-5 py-2.5 bg-algo-teal text-bg-base font-semibold rounded-btn text-sm hover:bg-algo-teal/90 transition-colors">Post Your First Bounty</Link>
        </div>
      )}

      {!isLoading && bounties.length > 0 && (
        <div className="space-y-4">
          {bounties.map(b => <BountyRow key={b._id} bounty={b} />)}
        </div>
      )}
    </div>
  )
}
