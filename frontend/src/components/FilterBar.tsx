'use client'
const CATS = ['All', 'Frontend', 'Backend', 'Smart Contracts', 'Data Tasks', 'General']
const SORTS = [{ value: 'newest', label: 'Newest' }, { value: 'highest_reward', label: 'Highest Reward' }, { value: 'ending_soon', label: 'Ending Soon' }]

export function FilterBar({ activeCategory, activeSort, onCategoryChange, onSortChange }: {
  activeCategory: string; activeSort: string; onCategoryChange: (c: string) => void; onSortChange: (s: string) => void
}) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
      <div className="flex items-center gap-1 flex-wrap">
        {CATS.map(cat => (
          <button key={cat} onClick={() => onCategoryChange(cat === 'All' ? '' : cat)}
            className={`px-4 py-1.5 rounded-btn text-sm font-medium transition-colors duration-200 ${(cat === 'All' && !activeCategory) || cat === activeCategory ? 'text-algo-teal border-b-2 border-algo-teal bg-algo-teal-dim' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`}>
            {cat}
          </button>
        ))}
      </div>
      <select value={activeSort} onChange={e => onSortChange(e.target.value)}
        className="bg-surface border border-border-glass text-text-primary text-sm rounded-btn px-3 py-1.5 focus:outline-none focus:border-algo-teal/50 cursor-pointer">
        {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
    </div>
  )
}
