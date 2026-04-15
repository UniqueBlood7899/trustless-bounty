import Link from 'next/link'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <svg className="w-28 h-28 mb-6 opacity-80" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="56" stroke="rgba(0,212,186,0.2)" strokeWidth="2" strokeDasharray="8 4"/>
        <circle cx="60" cy="60" r="36" stroke="rgba(0,212,186,0.15)" strokeWidth="1.5"/>
        <path d="M44 60h32M60 44v32" stroke="#00D4BA" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
        <circle cx="60" cy="60" r="6" fill="#00D4BA" opacity="0.4"/>
      </svg>
      <h2 className="text-text-primary text-xl font-semibold mb-2">No bounties yet</h2>
      <p className="text-text-secondary text-sm mb-8 max-w-xs">Be the first to post a task and start earning ALGO.</p>
      <Link href="/create" className="px-6 py-3 bg-algo-teal text-bg-base font-semibold rounded-btn hover:bg-algo-teal/90 transition-colors duration-200">
        Create the First Bounty
      </Link>
    </div>
  )
}
