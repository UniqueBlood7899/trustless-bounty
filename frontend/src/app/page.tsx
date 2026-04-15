'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { fetchBounties } from '@/lib/api'
import { BountyCard } from '@/components/BountyCard'
import { BountyCardSkeleton } from '@/components/BountyCardSkeleton'
import { FilterBar } from '@/components/FilterBar'
import { EmptyState } from '@/components/EmptyState'
import Link from 'next/link'

export default function BoardPage() {
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('newest')
  const { data, error, isLoading } = useSWR(['bounties', category, sort], () => fetchBounties({ category, sort }))

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-1">Bounty Board</h1>
          <p className="text-text-secondary text-sm">Discover tasks. Earn ALGO.</p>
        </div>
        <Link href="/create" className="px-5 py-2.5 bg-algo-teal text-bg-base font-semibold rounded-btn text-sm hover:bg-algo-teal/90 transition-colors duration-200 whitespace-nowrap">
          + Post Bounty
        </Link>
      </div>
      <FilterBar activeCategory={category} activeSort={sort} onCategoryChange={setCategory} onSortChange={setSort} />
      {error && <div className="text-center py-12 text-color-error">Failed to load bounties. Is the backend running?</div>}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <BountyCardSkeleton key={i} />)}
        </div>
      )}
      {!isLoading && !error && data?.data?.length === 0 && <EmptyState />}
      {!isLoading && !error && data?.data && data.data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.data.map(b => <BountyCard key={b._id} bounty={b} />)}
        </div>
      )}
    </div>
  )
}
