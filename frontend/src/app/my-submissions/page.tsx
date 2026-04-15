'use client'
import { useEffect, useState } from 'react'
import { useWallet } from '@/context/WalletContext'
import { fetchSolverSubmissions, type Submission } from '@/lib/api'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  approved: 'bg-algo-teal/10 text-algo-teal border-algo-teal/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  closed: 'bg-white/5 text-text-muted border-white/10',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_COLORS[status] ?? STATUS_COLORS.pending}`}>
      {status === 'pending' && <span className="w-2 h-2 rounded-full border-2 border-current border-t-transparent animate-spin" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export default function MySubmissionsPage() {
  const { address, isConnected, connect } = useWallet()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!address) return
    setIsLoading(true)
    fetchSolverSubmissions(address)
      .then(r => setSubmissions(r.data))
      .catch(() => setError('Failed to load submissions'))
      .finally(() => setIsLoading(false))
  }, [address])

  // Poll pending submissions every 5s
  useEffect(() => {
    if (!address || submissions.every(s => s.status !== 'pending')) return
    const interval = setInterval(() => {
      fetchSolverSubmissions(address).then(r => setSubmissions(r.data)).catch(() => {})
    }, 5000)
    return () => clearInterval(interval)
  }, [address, submissions])

  if (!isConnected) return (
    <div className="max-w-7xl mx-auto px-6 py-20 text-center">
      <div className="text-4xl mb-4">⬡</div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">My Submissions</h1>
      <p className="text-text-secondary text-sm mb-8">Connect your wallet to view your submission history.</p>
      <button onClick={connect} className="px-6 py-3 bg-algo-teal text-bg-base font-semibold rounded-btn hover:bg-algo-teal/90 transition-colors">Connect Wallet</button>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-text-primary">My Submissions</h1>
        <Link href="/" className="text-text-muted text-sm hover:text-algo-teal transition-colors">← Board</Link>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card p-4 flex items-center justify-between">
              <div className="space-y-2 flex-1"><div className="skeleton h-4 w-64" /><div className="skeleton h-3 w-32" /></div>
              <div className="skeleton h-6 w-20" />
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-color-error text-sm">{error}</p>}

      {!isLoading && !error && submissions.length === 0 && (
        <div className="text-center py-16">
          <p className="text-text-secondary mb-6">You haven&apos;t submitted any solutions yet.</p>
          <Link href="/" className="px-5 py-2.5 bg-algo-teal text-bg-base font-semibold rounded-btn text-sm hover:bg-algo-teal/90 transition-colors">Browse Bounties</Link>
        </div>
      )}

      {!isLoading && submissions.length > 0 && (
        <div className="space-y-2">
          {submissions.map(s => (
            <div key={s._id} className="glass-card overflow-hidden">
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() => setExpanded(expanded === s._id ? null : s._id)}
              >
                <div className="flex-1 min-w-0 mr-4">
                  <Link href={`/bounty/${s.bountyId}`} onClick={e => e.stopPropagation()}
                    className="text-text-primary text-sm font-medium hover:text-algo-teal transition-colors line-clamp-1 block">
                    {s.bountyTitle ?? s.bountyId}
                  </Link>
                  <p className="text-text-muted text-xs mt-0.5">{new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={s.status} />
                  {(s.aiRationale || s.status !== 'pending') && (
                    <span className="text-text-muted text-xs">{expanded === s._id ? '▲' : '▼'}</span>
                  )}
                </div>
              </div>

              {expanded === s._id && (
                <div className="px-5 pb-4 border-t border-border-glass">
                  {s.aiRationale ? (
                    <div className="pt-3">
                      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">AI Verdict</p>
                      {s.aiScore !== null && s.aiScore !== undefined && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 bg-white/5 rounded-full h-1.5">
                            <div className="bg-algo-teal h-1.5 rounded-full transition-all" style={{ width: `${Math.round(s.aiScore * 100)}%` }} />
                          </div>
                          <span className="text-algo-teal text-xs font-mono">{Math.round(s.aiScore * 100)}%</span>
                        </div>
                      )}
                      <p className="text-text-secondary text-sm leading-relaxed">{s.aiRationale}</p>
                      {s.url && (
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-algo-teal text-xs hover:underline mt-2 inline-block">{s.url} ↗</a>
                      )}
                    </div>
                  ) : (
                    <p className="text-text-muted text-sm pt-3">Waiting for AI verification…</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
