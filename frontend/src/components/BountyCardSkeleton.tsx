export function BountyCardSkeleton() {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="skeleton h-5 w-24" /><div className="skeleton h-5 w-20" />
      </div>
      <div className="skeleton h-5 w-full mb-1" />
      <div className="skeleton h-5 w-3/4 mb-4" />
      <div className="skeleton h-4 w-2/3 mb-4" />
      <div className="skeleton h-3 w-28" />
    </div>
  )
}
