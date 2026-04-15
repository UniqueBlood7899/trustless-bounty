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

export default function MySubmissionsPage() {
  const { address, isConnected, connect } = useWallet()
  const [submissions, setSubmissions] = useState<Submission[]>([])
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
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-glass">
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Bounty</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden sm:table-cell">Submitted</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s, i) => (
                <tr key={s._id} className={`border-b border-border-glass last:border-0 hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                  <td className="px-5 py-4">
                    <Link href={`/bounty/${s.bountyId}`} className="text-text-primary text-sm font-medium hover:text-algo-teal transition-colors line-clamp-1">
                      {s.bountyTitle ?? s.bountyId}
                    </Link>
                    {s.url && <p className="text-text-muted text-xs mt-0.5 truncate max-w-xs">{s.url}</p>}
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="text-text-muted text-sm">{new Date(s.createdAt).toLocaleDateString()}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_COLORS[s.status] ?? STATUS_COLORS.pending}`}>
                      {s.status === 'pending' && <span className="w-2 h-2 rounded-full border-2 border-current border-t-transparent animate-spin" />}
                      {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
