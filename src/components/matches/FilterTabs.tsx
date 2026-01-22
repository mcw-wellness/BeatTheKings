'use client'

type FilterType = 'all' | 'pending' | 'verified' | 'disputed'

interface FilterTabsProps {
  filter: FilterType
  setFilter: (filter: FilterType) => void
  pendingCount: number
  disputedCount: number
}

export function FilterTabs({
  filter,
  setFilter,
  pendingCount,
  disputedCount,
}: FilterTabsProps): JSX.Element {
  const baseClass =
    'px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1'
  const activeClass = 'bg-[#1e2a4a] text-white border border-white/30'
  const inactiveClass = 'bg-transparent text-white/60 border border-transparent'

  return (
    <div className="flex justify-center gap-2">
      <button
        onClick={() => setFilter('all')}
        className={`${baseClass} ${filter === 'all' ? activeClass : inactiveClass}`}
      >
        All
      </button>
      <button
        onClick={() => setFilter('pending')}
        className={`${baseClass} ${filter === 'pending' ? activeClass : inactiveClass}`}
      >
        Pending
        {pendingCount > 0 && (
          <span className="bg-yellow-500 text-black text-xs px-1.5 py-0.5 rounded-full font-bold">
            {pendingCount}
          </span>
        )}
      </button>
      <button
        onClick={() => setFilter('verified')}
        className={`${baseClass} ${filter === 'verified' ? activeClass : inactiveClass}`}
      >
        Verified
        <span className="text-green-400">✓</span>
      </button>
      <button
        onClick={() => setFilter('disputed')}
        className={`${baseClass} ${filter === 'disputed' ? activeClass : inactiveClass}`}
      >
        Disputed
        {disputedCount > 0 && (
          <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
            {disputedCount}
          </span>
        )}
      </button>
    </div>
  )
}
