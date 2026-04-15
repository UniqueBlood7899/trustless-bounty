import Link from 'next/link'
import type { Bounty } from '@/lib/api'

const CAT_COLORS: Record<string, string> = {
  Frontend: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Backend: 'bg-green-500/10 text-green-400 border-green-500/20',
  'Smart Contracts': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Data Tasks': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  General: 'bg-algo-teal/10 text-algo-teal border-algo-teal/20',
}

function countdown(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000)
  return d > 0 ? `${d}d ${h}h remaining` : `${h}h remaining`
}

export function BountyCard({ bounty }: { bounty: Bounty }) {
  return (
    <Link href={`/bounty/${bounty._id}`}
      className="block glass-card p-5 cursor-pointer hover:-translate-y-0.5 hover:border-algo-teal/30 transition-all duration-200 group">
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${CAT_COLORS[bounty.category] ?? CAT_COLORS.General}`}>
          {bounty.category}
        </span>
        <span className="text-algo-teal font-bold text-sm">⬡ {bounty.rewardAlgo.toFixed(1)} ALGO</span>
      </div>
      <h3 className="text-text-primary font-semibold text-base leading-snug mb-2 line-clamp-2 group-hover:text-algo-teal transition-colors">
        {bounty.title}
      </h3>
      <p className="text-text-secondary text-sm leading-relaxed mb-4 line-clamp-1">{bounty.description}</p>
      <div className="flex items-center gap-1.5 text-text-muted text-xs">
        <span>⏱</span><span>{countdown(bounty.deadline)}</span>
      </div>
    </Link>
  )
}
